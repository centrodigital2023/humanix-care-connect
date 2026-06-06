/**
 * WearableConnections — Vinculación de wearables y dispositivos de salud
 * Genera un código de emparejamiento por proveedor que la app móvil de
 * Humanix (o el agregador de wearables) usa para autenticar el envío de
 * datos a la función wearable-ingest, que normaliza e inserta en vital_signs.
 * Módulo 4: Monitoreo clínico — wearables
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Watch, Smartphone, Link2, Unlink, Copy, Loader2, CheckCircle2, Info } from "lucide-react";
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

const PROVIDERS: Array<{ id: Provider; label: string }> = [
  { id: "apple_healthkit", label: "Apple Health" },
  { id: "google_health_connect", label: "Google Health Connect" },
  { id: "garmin", label: "Garmin" },
  { id: "fitbit", label: "Fitbit" },
  { id: "oura", label: "Oura Ring" },
  { id: "whoop", label: "Whoop" },
  { id: "polar", label: "Polar" },
  { id: "samsung_health", label: "Samsung Health" },
];

export function WearableConnections({ patientId }: { patientId: string }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);

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

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const connectionFor = (provider: Provider) => connections.find((c) => c.provider === provider);

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
      toast.success("Dispositivo vinculado — copia el código y úsalo en la app móvil");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo vincular el dispositivo");
    } finally {
      setBusyProvider(null);
    }
  };

  const disconnect = async (id: string) => {
    setBusyProvider(connections.find((c) => c.id === id)?.provider ?? null);
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

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado");
  };

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Watch className="h-4 w-4 text-violet-600" />
        <h3 className="font-semibold text-sm">Wearables y dispositivos de salud</h3>
      </div>

      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-sky-700 dark:text-sky-300">
          Vincula tu proveedor para obtener un código de emparejamiento. Ingresa ese código en la
          app móvil de Humanix (o en el dispositivo) para que tus signos vitales empiecen a
          sincronizarse aquí en tiempo real.
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
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-4 w-4 text-violet-600" />
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
                          ? `Última sync: ${formatDistanceToNow(new Date(conn.last_synced_at), { addSuffix: true, locale: es })}`
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
                  <button
                    onClick={() => copyCode(conn.external_user_id)}
                    className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md bg-muted hover:bg-muted/70 transition-colors"
                    title="Copiar código de emparejamiento"
                  >
                    {conn.external_user_id}
                    <Copy className="h-3 w-3" />
                  </button>
                )}
                {isActive && conn ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={isBusy}
                    onClick={() => disconnect(conn.id)}
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
                      <Link2 className="h-3 w-3" />
                    )}
                    Vincular
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
