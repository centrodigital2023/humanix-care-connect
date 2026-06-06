/**
 * WearableConnections — Vinculación de wearables y dispositivos de salud
 * Genera un código de emparejamiento por proveedor.
 * Al hacer click en "Vincular" se muestra un QR que la app móvil de Humanix
 * escanea para autenticar el envío de datos a la función wearable-ingest,
 * que normaliza e inserta en vital_signs.
 */
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";
import {
  Watch,
  Smartphone,
  Link2,
  Unlink,
  Copy,
  Loader2,
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
import type { SupabaseClient } from "@supabase/supabase-js";

const sb = supabase as unknown as SupabaseClient;

type Provider =
  | "apple_healthkit"
  | "google_health_connect"
  | "garmin"
  | "fitbit"
  | "oura"
  | "whoop"
  | "polar"
  | "samsung_health";

interface Connection {
  id: string;
  provider: Provider;
  external_user_id: string;
  device_name: string | null;
  status: "active" | "disconnected" | "error";
  last_synced_at: string | null;
}

const PROVIDERS: Array<{ id: Provider; label: string; emoji: string; platform: "ios" | "android" | "both" }> = [
  { id: "apple_healthkit",      label: "Apple Health",          emoji: "🍎", platform: "ios" },
  { id: "google_health_connect", label: "Google Health Connect", emoji: "🤖", platform: "android" },
  { id: "garmin",               label: "Garmin",                emoji: "⌚", platform: "both" },
  { id: "fitbit",               label: "Fitbit",                emoji: "💚", platform: "both" },
  { id: "oura",                 label: "Oura Ring",             emoji: "💍", platform: "both" },
  { id: "whoop",                label: "Whoop",                 emoji: "🏃", platform: "both" },
  { id: "polar",                label: "Polar",                 emoji: "🎯", platform: "both" },
  { id: "samsung_health",       label: "Samsung Health",        emoji: "🌐", platform: "android" },
];

/** Genera el deep-link que el QR codifica */
function buildPairingLink(provider: Provider, code: string): string {
  const params = new URLSearchParams({ provider, code });
  return `humanix://pair?${params.toString()}`;
}

// ─── Subcomponent: QR modal overlay ──────────────────────────────────────────

interface QrModalProps {
  provider: Provider;
  label: string;
  emoji: string;
  code: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

function QrModal({ provider, label, emoji, code, onClose, onRefresh }: QrModalProps) {
  const link = buildPairingLink(provider, code);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    toast.success("Código renovado");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success("Enlace de emparejamiento copiado");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <div>
              <h3 className="font-bold text-sm">{label}</h3>
              <p className="text-[11px] text-muted-foreground">Escanea con la app Humanix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pasos */}
        <ol className="space-y-2">
          {[
            "Abre la app Humanix en tu celular o reloj",
            `Ve a Ajustes → Dispositivos → ${label}`,
            "Pulsa \"Escanear QR\" y apunta la cámara aquí",
            "¡Listo! Tus signos vitales se sincronizarán en tiempo real",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span className="flex-shrink-0 h-4 w-4 rounded-full bg-violet-500/20 text-violet-600 text-[9px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border-4 border-violet-500/20 bg-white p-3 shadow-inner">
            <QRCode
              value={link}
              size={180}
              bgColor="#ffffff"
              fgColor="#1e1b4b"
              level="H"
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ScanLine className="h-3 w-3 text-violet-500" />
            <span>Código válido · renuévalo si expira</span>
          </div>
        </div>

        {/* Código textual */}
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
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
                title="Renovar código"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Alt: enlace */}
        <button
          onClick={copyLink}
          className="w-full text-[10px] text-violet-600 hover:underline"
        >
          No tienes la app? Copia el enlace de emparejamiento
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WearableConnections({ patientId }: { patientId: string }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);
  const [qrOpen, setQrOpen] = useState<Provider | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = async () => {
    const { data } = await sb
      .from("wearable_connections")
      .select("id, provider, external_user_id, device_name, status, last_synced_at")
      .eq("patient_id", patientId)
      .order("connected_at", { ascending: true });
    setConnections((data as Connection[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();

    const channel = sb
      .channel(`wearable-connections-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wearable_connections",
          filter: `patient_id=eq.${patientId}`,
        },
        () => load(),
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const connectionFor = (provider: Provider) => connections.find((c) => c.provider === provider);

  /** Crea o reactiva la conexión y abre el modal QR */
  const connect = async (provider: Provider) => {
    setBusyProvider(provider);
    try {
      const { error } = await sb
        .from("wearable_connections")
        .upsert(
          { patient_id: patientId, provider, status: "active" },
          { onConflict: "patient_id,provider" },
        );
      if (error) throw error;
      await load();
      setQrOpen(provider);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo vincular el dispositivo");
    } finally {
      setBusyProvider(null);
    }
  };

  const disconnect = async (id: string, provider: Provider) => {
    setBusyProvider(provider);
    try {
      const { error } = await sb
        .from("wearable_connections")
        .update({ status: "disconnected" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Dispositivo desvinculado");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desvincular");
    } finally {
      setBusyProvider(null);
    }
  };

  /** Renueva el código regenerando el upsert (external_user_id es generado por DB trigger) */
  const renewCode = async (provider: Provider) => {
    await sb
      .from("wearable_connections")
      .update({ status: "active" })
      .eq("patient_id", patientId)
      .eq("provider", provider);
    await load();
  };

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const qrProvider = PROVIDERS.find((p) => p.id === qrOpen);
  const qrConn = qrOpen ? connectionFor(qrOpen) : undefined;

  return (
    <>
      {/* QR Modal */}
      {qrOpen && qrProvider && qrConn && (
        <QrModal
          provider={qrOpen}
          label={qrProvider.label}
          emoji={qrProvider.emoji}
          code={qrConn.external_user_id}
          onClose={() => setQrOpen(null)}
          onRefresh={() => renewCode(qrOpen)}
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
            Humanix en tu celular o reloj para sincronizar tus signos vitales en tiempo real.
          </p>
        </div>

        <div className="space-y-2">
          {PROVIDERS.map((p) => {
            const conn = connectionFor(p.id);
            const isActive = conn?.status === "active";
            const isBusy = busyProvider === p.id;

            return (
              <div
                key={p.id}
                className="rounded-xl border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-base">
                    {p.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{p.label}</p>
                    {isActive ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" /> Vinculado
                        </Badge>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {conn?.last_synced_at
                            ? `Sync ${formatDistanceToNow(new Date(conn.last_synced_at), { addSuffix: true, locale: es })}`
                            : "Esperando primera sincronización"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">No vinculado</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && conn && (
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
                  {isActive && conn ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={isBusy}
                      onClick={() => disconnect(conn.id, p.id)}
                    >
                      {isBusy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Unlink className="h-3 w-3" />
                      )}
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={isBusy}
                      onClick={() => connect(p.id)}
                    >
                      {isBusy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <QrCode className="h-3 w-3" />
                      )}
                      {isBusy ? "Generando..." : "Vincular"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border pt-2">
          <Smartphone className="h-3 w-3" />
          <span>
            Compatible con iOS, Android y dispositivos Bluetooth vía Humanix Connect SDK
          </span>
        </div>
      </Card>
    </>
  );
}
