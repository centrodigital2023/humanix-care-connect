/**
 * WearableConnections — Vinculación de wearables y dispositivos de salud
 * Usa localStorage para persistir el estado de emparejamiento (no requiere
 * tabla externa). Genera un QR con deep-link humanix://pair que la app móvil
 * o el SDK de wearables escanea para empezar a enviar vital_signs_readings.
 */
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Watch,
  Smartphone,
  Unlink,
  Copy,
  CheckCircle2,
  Info,
  QrCode,
  X,
  ScanLine,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

type Provider =
  | "apple_healthkit"
  | "google_health_connect"
  | "garmin"
  | "fitbit"
  | "oura"
  | "whoop"
  | "polar"
  | "samsung_health";

interface PairedDevice {
  provider: Provider;
  code: string;
  pairedAt: string;
  lastSyncAt: string | null;
}

type PairingStore = Partial<Record<Provider, PairedDevice>>;

// ─── Providers config ─────────────────────────────────────────────────────────

const PROVIDERS: Array<{ id: Provider; label: string; emoji: string; steps: string[] }> = [
  {
    id: "apple_healthkit",
    label: "Apple Health",
    emoji: "🍎",
    steps: [
      "Abre la app Humanix en tu iPhone",
      "Ve a Ajustes → Salud → Apple Health",
      "Activa sincronización automática",
      "Ingresa el código o escanea este QR",
    ],
  },
  {
    id: "google_health_connect",
    label: "Google Health Connect",
    emoji: "🤖",
    steps: [
      "Abre Health Connect en tu Android",
      "Selecciona Humanix y concede permisos",
      "En la app Humanix escanea este QR",
      "Los datos se sincronizarán cada 5 min",
    ],
  },
  {
    id: "garmin",
    label: "Garmin",
    emoji: "⌚",
    steps: [
      "Abre Garmin Connect en tu teléfono",
      "Ve a Más → Aplicaciones conectadas → Humanix",
      "Escanea este QR para vincular",
      "Los datos se enviarán automáticamente",
    ],
  },
  {
    id: "fitbit",
    label: "Fitbit",
    emoji: "💚",
    steps: [
      "Abre la app Fitbit en tu teléfono",
      "Ve a Cuenta → Aplicaciones y dispositivos → Humanix",
      "Escanea este QR para autorizar",
      "Los datos fluirán en tiempo real",
    ],
  },
  {
    id: "oura",
    label: "Oura Ring",
    emoji: "💍",
    steps: [
      "Abre la app Oura en tu teléfono",
      "Ve a Perfil → Integraciones → Humanix",
      "Escanea el QR para conectar",
      "Tus métricas de sueño y actividad se sincronizarán",
    ],
  },
  {
    id: "whoop",
    label: "Whoop",
    emoji: "🏃",
    steps: [
      "Abre la app WHOOP en tu teléfono",
      "Ve a Perfil → Integraciones → Agregar → Humanix",
      "Escanea el QR para autorizar acceso",
      "La recuperación y el strain se sincronizarán",
    ],
  },
  {
    id: "polar",
    label: "Polar",
    emoji: "🎯",
    steps: [
      "Abre Polar Flow en tu teléfono",
      "Ve a Ajustes → Servicios de terceros → Humanix",
      "Escanea el QR para conectar",
      "FC y entrenamiento se sincronizarán",
    ],
  },
  {
    id: "samsung_health",
    label: "Samsung Health",
    emoji: "🌐",
    steps: [
      "Abre Samsung Health en tu Galaxy",
      "Ve a Inicio → Administrar → Servicios → Humanix",
      "Escanea el QR para vincular",
      "Tus métricas diarias se sincronizarán",
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORE_KEY = (patientId: string) => `hwx_wearables_${patientId}`;

function loadStore(patientId: string): PairingStore {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY(patientId)) ?? "{}");
  } catch {
    return {};
  }
}

function saveStore(patientId: string, store: PairingStore) {
  localStorage.setItem(STORE_KEY(patientId), JSON.stringify(store));
}

function genCode(patientId: string, provider: Provider): string {
  // Deterministic short code — 8 uppercase alphanumeric chars
  const raw = `${patientId}:${provider}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let n = Math.abs(hash);
  // Pad with timestamp bits for uniqueness
  const ts = Date.now();
  n = n ^ (ts & 0xffffff);
  for (let i = 0; i < 8; i++) {
    code += chars[n % chars.length];
    n = Math.floor(n / chars.length) || (ts >> i);
  }
  return code;
}

function buildPairingLink(patientId: string, provider: Provider, code: string): string {
  const params = new URLSearchParams({ patient: patientId, provider, code });
  return `humanix://pair?${params.toString()}`;
}

// ─── QR Modal ────────────────────────────────────────────────────────────────

interface QrModalProps {
  patientId: string;
  provider: Provider;
  label: string;
  emoji: string;
  steps: string[];
  code: string;
  onClose: () => void;
  onRenew: () => void;
}

function QrModal({ patientId, provider, label, emoji, steps, code, onClose, onRenew }: QrModalProps) {
  const link = buildPairingLink(patientId, provider, code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <div>
              <h3 className="font-bold text-sm">{label}</h3>
              <p className="text-[11px] text-muted-foreground">Escanea con tu celular o reloj</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps */}
        <ol className="space-y-1.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span className="flex-shrink-0 h-4 w-4 rounded-full bg-violet-500/20 text-violet-600 text-[9px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        {/* QR */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-2xl border-4 border-violet-500/20 bg-white p-3 shadow-inner">
            <QRCode value={link} size={172} bgColor="#ffffff" fgColor="#1e1b4b" level="H" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ScanLine className="h-3 w-3 text-violet-500" />
            <span>Apunta la cámara del celular aquí</span>
          </div>
        </div>

        {/* Code */}
        <div className="rounded-xl bg-muted/60 p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">Código de emparejamiento</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-bold tracking-widest select-all">{code}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { navigator.clipboard.writeText(code); toast.success("Código copiado"); }}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
                title="Copiar código"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onRenew}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
                title="Renovar código"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => { navigator.clipboard.writeText(link); toast.success("Enlace copiado"); }}
          className="w-full text-[10px] text-violet-600 hover:underline"
        >
          ¿Sin app? Copia el enlace de emparejamiento
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WearableConnections({ patientId }: { patientId: string }) {
  const [store, setStore] = useState<PairingStore>({});
  const [qrOpen, setQrOpen] = useState<Provider | null>(null);

  useEffect(() => {
    setStore(loadStore(patientId));
  }, [patientId]);

  const persist = (next: PairingStore) => {
    saveStore(patientId, next);
    setStore(next);
  };

  const connect = (provider: Provider) => {
    const code = genCode(patientId, provider);
    const device: PairedDevice = { provider, code, pairedAt: new Date().toISOString(), lastSyncAt: null };
    persist({ ...store, [provider]: device });
    setQrOpen(provider);
    toast.success(`${PROVIDERS.find((p) => p.id === provider)?.label} vinculado — escanea el QR`);
  };

  const disconnect = (provider: Provider) => {
    const next = { ...store };
    delete next[provider];
    persist(next);
    toast.success("Dispositivo desvinculado");
  };

  const renewCode = (provider: Provider) => {
    const existing = store[provider];
    if (!existing) return;
    const code = genCode(patientId, provider);
    persist({ ...store, [provider]: { ...existing, code } });
    toast.success("Código renovado");
  };

  const qrProvider = PROVIDERS.find((p) => p.id === qrOpen);
  const qrDevice = qrOpen ? store[qrOpen] : undefined;

  return (
    <>
      {qrOpen && qrProvider && qrDevice && (
        <QrModal
          patientId={patientId}
          provider={qrOpen}
          label={qrProvider.label}
          emoji={qrProvider.emoji}
          steps={qrProvider.steps}
          code={qrDevice.code}
          onClose={() => setQrOpen(null)}
          onRenew={() => renewCode(qrOpen)}
        />
      )}

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Watch className="h-4 w-4 text-violet-600" />
          <h3 className="font-semibold text-sm">Wearables y dispositivos de salud</h3>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-sky-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-sky-700 dark:text-sky-300">
            Pulsa <strong>Vincular</strong> para generar un QR de emparejamiento. Escanéalo con la app
            Humanix en tu celular o reloj inteligente para sincronizar tus signos vitales en tiempo real.
          </p>
        </div>

        <div className="space-y-2">
          {PROVIDERS.map((p) => {
            const device = store[p.id];
            const isActive = !!device;

            return (
              <div
                key={p.id}
                className="rounded-xl border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-base leading-none">
                    {p.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{p.label}</p>
                    {isActive && device ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" /> Vinculado
                        </Badge>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {device.lastSyncAt
                            ? `Sync ${formatDistanceToNow(new Date(device.lastSyncAt), { addSuffix: true, locale: es })}`
                            : "Esperando primera sincronización"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">No vinculado</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                      onClick={() => setQrOpen(p.id)}
                    >
                      <QrCode className="h-3 w-3" />
                      Ver QR
                    </Button>
                  )}
                  {isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => disconnect(p.id)}
                    >
                      <Unlink className="h-3 w-3" />
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => connect(p.id)}
                    >
                      <QrCode className="h-3 w-3" />
                      Vincular
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border pt-2">
          <Smartphone className="h-3 w-3" />
          <span>Compatible con iOS, Android y dispositivos Bluetooth vía Humanix Connect SDK</span>
        </div>
      </Card>
    </>
  );
}
