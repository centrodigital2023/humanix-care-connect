/**
 * WearableConnections — Vinculación de wearables y dispositivos de salud
 * Pairing sin tabla BD: estado en localStorage con fallback in-memory.
 * QR fullscreen al hacer clic. Auto-detección de conexión vía Supabase
 * Realtime cuando llega el primer vital_signs_reading del dispositivo.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";
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
  Wifi,
  ZoomIn,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  syncing?: boolean;
}

type PairingStore = Partial<Record<Provider, PairedDevice>>;

// ─── Providers config ─────────────────────────────────────────────────────────

const PROVIDERS: Array<{
  id: Provider;
  label: string;
  emoji: string;
  color: string;
  steps: string[];
}> = [
  {
    id: "apple_healthkit",
    label: "Apple Health",
    emoji: "🍎",
    color: "from-red-500/10 to-pink-500/10 border-red-500/20",
    steps: [
      "Abre la app Humanix en tu iPhone",
      "Ve a Ajustes → Salud → Apple Health",
      "Activa la sincronización automática",
      "Escanea el QR o ingresa el código",
    ],
  },
  {
    id: "google_health_connect",
    label: "Google Health Connect",
    emoji: "🤖",
    color: "from-green-500/10 to-teal-500/10 border-green-500/20",
    steps: [
      "Abre Health Connect en tu Android",
      "Selecciona Humanix → Concede permisos",
      "En la app Humanix ve a Dispositivos",
      "Escanea el QR — sincronización cada 5 min",
    ],
  },
  {
    id: "garmin",
    label: "Garmin",
    emoji: "⌚",
    color: "from-blue-500/10 to-sky-500/10 border-blue-500/20",
    steps: [
      "Abre Garmin Connect en tu teléfono",
      "Más → Aplicaciones conectadas → Humanix",
      "Pulsa Conectar y escanea el QR",
      "Los datos fluirán automáticamente",
    ],
  },
  {
    id: "fitbit",
    label: "Fitbit",
    emoji: "💚",
    color: "from-teal-500/10 to-cyan-500/10 border-teal-500/20",
    steps: [
      "Abre la app Fitbit",
      "Cuenta → Aplicaciones → Humanix",
      "Escanea el QR para autorizar",
      "Actividad y sueño se sincronizarán",
    ],
  },
  {
    id: "oura",
    label: "Oura Ring",
    emoji: "💍",
    color: "from-amber-500/10 to-yellow-500/10 border-amber-500/20",
    steps: [
      "Abre la app Oura",
      "Perfil → Integraciones → Humanix",
      "Escanea el QR para conectar",
      "Sueño y actividad se sincronizarán",
    ],
  },
  {
    id: "whoop",
    label: "Whoop",
    emoji: "🏃",
    color: "from-red-500/10 to-orange-500/10 border-red-500/20",
    steps: [
      "Abre la app WHOOP",
      "Perfil → Integraciones → Humanix",
      "Escanea el QR para autorizar",
      "Strain y recuperación se sincronizarán",
    ],
  },
  {
    id: "polar",
    label: "Polar",
    emoji: "🎯",
    color: "from-orange-500/10 to-red-500/10 border-orange-500/20",
    steps: [
      "Abre Polar Flow",
      "Ajustes → Servicios de terceros → Humanix",
      "Escanea el QR para conectar",
      "FC y entrenamientos se sincronizarán",
    ],
  },
  {
    id: "samsung_health",
    label: "Samsung Health",
    emoji: "🌐",
    color: "from-blue-500/10 to-violet-500/10 border-blue-500/20",
    steps: [
      "Abre Samsung Health",
      "Inicio → Administrar → Humanix",
      "Escanea el QR para vincular",
      "Tus métricas diarias se sincronizarán",
    ],
  },
];

// ─── localStorage with in-memory fallback ─────────────────────────────────────

const STORE_KEY = (id: string) => `hwx_wearables_${id}`;
let memoryFallback: PairingStore = {};

function loadStore(patientId: string): PairingStore {
  try {
    const raw = localStorage.getItem(STORE_KEY(patientId));
    return raw ? (JSON.parse(raw) as PairingStore) : {};
  } catch {
    return { ...memoryFallback };
  }
}

function persistStore(patientId: string, store: PairingStore) {
  memoryFallback = store;
  try {
    localStorage.setItem(STORE_KEY(patientId), JSON.stringify(store));
  } catch {
    // Private mode / quota exceeded — in-memory fallback already set above
  }
}

// ─── Code generation ──────────────────────────────────────────────────────────

function genCode(patientId: string, provider: Provider): string {
  const seed = `${patientId}:${provider}:${Date.now()}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
    h >>>= 0;
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let n = h;
  for (let i = 0; i < 8; i++) {
    code += chars[n % chars.length];
    n = (n >>> 5) || ((h >> i) & 0xff);
  }
  return code;
}

/** Build a web-compatible pairing URL (HTTPS) so any QR scanner can open it */
function buildPairingUrl(code: string, provider: Provider, patientId: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://app.humanix.co";
  const params = new URLSearchParams({ c: code, pv: provider, u: patientId });
  return `${base}/pair?${params.toString()}`;
}

// ─── QR Fullscreen View ────────────────────────────────────────────────────────

function QrFullscreen({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <QRCode value={url} size={280} bgColor="#ffffff" fgColor="#0f0a2e" level="H" />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <p className="absolute bottom-6 text-white/60 text-xs">Toca fuera del QR para cerrar</p>
    </div>
  );
}

// ─── QR Modal ────────────────────────────────────────────────────────────────

interface QrModalProps {
  patientId: string;
  provider: Provider;
  label: string;
  emoji: string;
  steps: string[];
  code: string;
  syncing: boolean;
  onClose: () => void;
  onRenew: () => void;
}

function QrModal({
  patientId, provider, label, emoji, steps, code, syncing, onClose, onRenew,
}: QrModalProps) {
  const url = buildPairingUrl(code, provider, patientId);
  const [fullscreen, setFullscreen] = useState(false);

  const copyCode = () => { navigator.clipboard.writeText(code); toast.success("Código copiado"); };
  const copyLink = () => { navigator.clipboard.writeText(url); toast.success("Enlace copiado"); };

  return (
    <>
      {fullscreen && <QrFullscreen url={url} onClose={() => setFullscreen(false)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full overflow-y-auto max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
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
          <ol className="px-5 space-y-2 pb-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[11px] text-muted-foreground">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-violet-500/15 text-violet-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {/* QR — click to fullscreen */}
          <div className="px-5 pb-3">
            <div className="relative group">
              <button
                onClick={() => setFullscreen(true)}
                className="w-full rounded-2xl border-4 border-violet-500/20 bg-white p-4 shadow-inner flex items-center justify-center transition hover:border-violet-500/50 focus:outline-none"
                title="Toca para agrandar el QR"
              >
                <QRCode value={url} size={200} bgColor="#ffffff" fgColor="#0f0a2e" level="H" />
              </button>
              {/* Zoom hint */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg">
                  <ZoomIn className="h-3 w-3" /> Toca para agrandar
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
              <ScanLine className="h-3 w-3 text-violet-500" />
              <span>Apunta la cámara al código</span>
              <span className="text-violet-500 font-medium">· Toca para agrandar</span>
            </div>
          </div>

          {/* Syncing indicator */}
          {syncing ? (
            <div className="mx-5 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  ¡Dispositivo conectado!
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
                  Sincronizando signos vitales en tiempo real…
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
            </div>
          ) : (
            <div className="mx-5 mb-3 rounded-xl bg-amber-500/5 border border-amber-500/20 p-2.5 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Esperando conexión — escanea el QR con tu dispositivo
              </p>
            </div>
          )}

          {/* Code row */}
          <div className="mx-5 mb-3 rounded-xl bg-muted/60 p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">Código de emparejamiento</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base font-bold tracking-[0.25em] select-all">{code}</span>
              <div className="flex items-center gap-1">
                <button onClick={copyCode} className="rounded-md p-1.5 hover:bg-muted transition-colors" title="Copiar código">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={onRenew} className="rounded-md p-1.5 hover:bg-muted transition-colors" title="Renovar código">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 space-y-1.5">
            <button onClick={copyLink} className="w-full text-[10px] text-violet-600 hover:underline">
              ¿Sin app? Copia el enlace de emparejamiento
            </button>
            <p className="text-center text-[10px] text-muted-foreground">
              Compatible con iOS · Android · Bluetooth
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WearableConnections({ patientId }: { patientId: string }) {
  const [store, setStore] = useState<PairingStore>({});
  const [qrOpen, setQrOpen] = useState<Provider | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    if (!patientId) return;
    setStore(loadStore(patientId));
  }, [patientId]);

  const persist = useCallback(
    (next: PairingStore) => {
      persistStore(patientId, next);
      setStore(next);
    },
    [patientId],
  );

  // ── Auto-detect sync: listen for new vital readings from a device ─────────
  // When QR modal is open, subscribe to vital_signs_readings for this patient.
  // First INSERT from a non-manual source → mark device as synced.
  useEffect(() => {
    if (!qrOpen || !patientId) return;

    const channel = supabase
      .channel(`pair-detect-${patientId}-${qrOpen}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vital_signs_readings",
          filter: `family_user_id=eq.${patientId}`,
        },
        (payload) => {
          const row = payload.new as { source?: string; family_user_id: string };
          if (row.source && row.source !== "manual") {
            // Device sent its first reading — mark synced
            setStore((prev) => {
              const device = prev[qrOpen];
              if (!device) return prev;
              const next = {
                ...prev,
                [qrOpen]: { ...device, lastSyncAt: new Date().toISOString(), syncing: true },
              };
              persistStore(patientId, next);
              return next;
            });
            toast.success("¡Dispositivo conectado! Signos vitales sincronizando…", {
              description: `${PROVIDERS.find((p) => p.id === qrOpen)?.label} está enviando datos en tiempo real`,
              duration: 6000,
            });
            // Auto-close modal after 3 s
            setTimeout(() => setQrOpen(null), 3000);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [qrOpen, patientId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const connect = (provider: Provider) => {
    try {
      const code = genCode(patientId, provider);
      const device: PairedDevice = {
        provider,
        code,
        pairedAt: new Date().toISOString(),
        lastSyncAt: null,
        syncing: false,
      };
      persist({ ...store, [provider]: device });
      setQrOpen(provider);
    } catch (err) {
      console.error("[WearableConnections] connect:", err);
      toast.error("No se pudo generar el código de emparejamiento. Intenta de nuevo.");
    }
  };

  const disconnect = (provider: Provider) => {
    try {
      const next = { ...store };
      delete next[provider];
      persist(next);
      if (qrOpen === provider) setQrOpen(null);
      toast.success("Dispositivo desvinculado");
    } catch (err) {
      console.error("[WearableConnections] disconnect:", err);
    }
  };

  const renewCode = (provider: Provider) => {
    try {
      const existing = store[provider];
      if (!existing) return;
      const code = genCode(patientId, provider);
      persist({ ...store, [provider]: { ...existing, code, syncing: false } });
      toast.success("Código renovado — escanea el nuevo QR");
    } catch (err) {
      console.error("[WearableConnections] renewCode:", err);
    }
  };

  const qrProvider = PROVIDERS.find((p) => p.id === qrOpen);
  const qrDevice = qrOpen ? store[qrOpen] : undefined;

  return (
    <>
      {/* QR Modal */}
      {qrOpen && qrProvider && qrDevice && (
        <QrModal
          patientId={patientId}
          provider={qrOpen}
          label={qrProvider.label}
          emoji={qrProvider.emoji}
          steps={qrProvider.steps}
          code={qrDevice.code}
          syncing={!!qrDevice.syncing}
          onClose={() => setQrOpen(null)}
          onRenew={() => renewCode(qrOpen)}
        />
      )}

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Watch className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-sm">Wearables y dispositivos de salud</h3>
          </div>
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> SDK Activo
          </span>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-sky-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-sky-700 dark:text-sky-300">
            Toca <strong>Vincular</strong> para generar un código QR.{" "}
            <strong>Escanéalo con tu celular o reloj</strong> para sincronizar tus signos
            vitales en tiempo real — se conecta automáticamente al escanear.
          </p>
        </div>

        <div className="space-y-2">
          {PROVIDERS.map((p) => {
            const device = store[p.id];
            const isActive = !!device;
            const isSyncing = device?.syncing;

            return (
              <div
                key={p.id}
                className={`rounded-xl border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                  isSyncing
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : isActive
                    ? "border-violet-500/20 bg-violet-500/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg leading-none ${
                    isSyncing ? "bg-emerald-500/10" : isActive ? "bg-violet-500/10" : "bg-muted/50"
                  }`}>
                    {p.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{p.label}</p>
                    {isSyncing ? (
                      <div className="flex items-center gap-1">
                        <Wifi className="h-2.5 w-2.5 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 font-medium">Sincronizando en vivo</span>
                      </div>
                    ) : isActive && device ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] gap-1 border-violet-500/30 text-violet-600 dark:text-violet-400">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Vinculado
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {device.lastSyncAt
                            ? `Sync ${formatDistanceToNow(new Date(device.lastSyncAt), { addSuffix: true, locale: es })}`
                            : "Esperando escaneo QR"}
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
                      {isSyncing ? "Ver QR" : "Escanear"}
                    </Button>
                  )}
                  {isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                      onClick={() => disconnect(p.id)}
                    >
                      <Unlink className="h-3 w-3" />
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={() => connect(p.id)}
                    >
                      <Zap className="h-3 w-3" />
                      Vincular
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground border-t border-border pt-2">
          <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> iOS</span>
          <span className="text-border">·</span>
          <span>Android</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Bluetooth</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> Humanix SDK</span>
        </div>
      </Card>
    </>
  );
}
