import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Handshake, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const sb = supabase as unknown as SupabaseClient;

type Slot = {
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  status: "free" | "reserved" | "busy";
};

type Need = {
  id: string;
  family_user_id: string;
  starts_at: string;
  ends_at: string;
  hourly_rate: number;
  status: "open" | "matched" | "cancelled" | "expired";
  service_address: string | null;
  notes: string | null;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABEL = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function AgendaViewer({
  targetUserId,
  targetRole,
  currentUserId,
  currentRole,
  targetHourlyRate,
  onProposalSent,
}: {
  targetUserId: string;
  targetRole: "professional" | "family";
  currentUserId: string | null;
  currentRole: "professional" | "family" | null;
  targetHourlyRate?: number | null;
  onProposalSent?: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [busyCells, setBusyCells] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      if (targetRole === "professional") {
        const { data } = await sb
          .from("availability_slots")
          .select("id, user_id, starts_at, ends_at, status")
          .eq("user_id", targetUserId)
          .gte("starts_at", weekStart.toISOString())
          .lt("starts_at", weekEnd.toISOString());
        if (active) setSlots((data ?? []) as Slot[]);
        setNeeds([]);
      } else {
        const { data } = await sb
          .from("family_needs")
          .select("id, family_user_id, starts_at, ends_at, hourly_rate, status, service_address, notes")
          .eq("family_user_id", targetUserId)
          .gte("starts_at", weekStart.toISOString())
          .lt("starts_at", weekEnd.toISOString());
        if (active) setNeeds((data ?? []) as Need[]);
        setSlots([]);
      }
      // Already proposed by current user on these cells
      if (currentUserId) {
        const { data: props } = await sb
          .from("slot_proposals")
          .select("starts_at, status")
          .or(`family_user_id.eq.${currentUserId},professional_id.eq.${currentUserId}`)
          .gte("starts_at", weekStart.toISOString())
          .lt("starts_at", weekEnd.toISOString())
          .in("status", ["pending", "accepted"]);
        if (active) {
          const cells = new Set<string>();
          (props ?? []).forEach((p) => {
            const d = new Date((p as { starts_at: string }).starts_at);
            cells.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`);
          });
          setBusyCells(cells);
        }
      }
      if (active) setLoading(false);
    })();

    const channel = sb
      .channel(`agenda_viewer_${targetUserId}_${targetRole}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: targetRole === "professional" ? "availability_slots" : "family_needs",
          filter: targetRole === "professional" ? `user_id=eq.${targetUserId}` : `family_user_id=eq.${targetUserId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { id: string; starts_at: string } | undefined;
          if (!row) return;
          const ts = new Date(row.starts_at);
          if (ts < weekStart || ts >= weekEnd) return;
          if (targetRole === "professional") {
            if (payload.eventType === "DELETE") setSlots((p) => p.filter((s) => s.id !== row.id));
            else if (payload.eventType === "INSERT") setSlots((p) => [...p, payload.new as Slot]);
            else setSlots((p) => p.map((s) => (s.id === row.id ? (payload.new as Slot) : s)));
          } else {
            if (payload.eventType === "DELETE") setNeeds((p) => p.filter((n) => n.id !== row.id));
            else if (payload.eventType === "INSERT") setNeeds((p) => [...p, payload.new as Need]);
            else setNeeds((p) => p.map((n) => (n.id === row.id ? (payload.new as Need) : n)));
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, [targetUserId, targetRole, currentUserId, weekStart, weekEnd]);

  const slotAt = (day: Date, hour: number): Slot | undefined =>
    slots.find((s) => {
      const t = new Date(s.starts_at);
      return t.getDate() === day.getDate() && t.getMonth() === day.getMonth() && t.getHours() === hour;
    });
  const needAt = (day: Date, hour: number): Need | undefined =>
    needs.find((n) => {
      const t = new Date(n.starts_at);
      return t.getDate() === day.getDate() && t.getMonth() === day.getMonth() && t.getHours() === hour;
    });
  const wasProposed = (day: Date, hour: number): boolean =>
    busyCells.has(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`);

  async function propose(day: Date, hour: number) {
    if (!currentUserId || !currentRole) {
      toast.error("Inicia sesión para enviar propuestas");
      return;
    }
    if (currentRole === targetRole) {
      toast.info("Solo la otra parte (familia/profesional) puede proponer");
      return;
    }
    const key = `${day.toDateString()}-${hour}`;
    setSending(key);
    try {
      const start = new Date(day);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(hour + 1);

      if (targetRole === "professional") {
        // La familia (actual) contrata al profesional (target)
        const slot = slotAt(day, hour);
        if (!slot || slot.status !== "free") {
          toast.error("Ese horario ya no está disponible");
          return;
        }
        const rate = targetHourlyRate ?? 20000;
        const { error } = await sb.from("slot_proposals").insert({
          family_user_id: currentUserId,
          professional_id: targetUserId,
          availability_slot_id: slot.id,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          hourly_rate: rate,
          proposed_by: "family",
          status: "pending",
        });
        if (error) throw error;
        toast.success("Solicitud enviada. Esperando que el profesional acepte.");
      } else {
        // El profesional (actual) se postula a la necesidad de la familia (target)
        const need = needAt(day, hour);
        if (!need || need.status !== "open") {
          toast.error("Esa necesidad ya no está abierta");
          return;
        }
        const { error } = await sb.from("slot_proposals").insert({
          family_user_id: targetUserId,
          professional_id: currentUserId,
          family_need_id: need.id,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          hourly_rate: need.hourly_rate,
          proposed_by: "professional",
          status: "pending",
        });
        if (error) throw error;
        toast.success("Postulación enviada. Esperando que la familia acepte.");
      }
      setBusyCells((prev) => {
        const s = new Set(prev);
        s.add(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`);
        return s;
      });
      onProposalSent?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error enviando propuesta");
    } finally {
      setSending(null);
    }
  }

  const today = new Date();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border">
        <div>
          <p className="text-sm font-semibold inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-biosensor" />
            {targetRole === "professional" ? "Agenda del profesional" : "Necesidades de la familia"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {targetRole === "professional"
              ? "Toca una hora verde para contratar. El profesional decide aceptar o rechazar."
              : "Toca una hora azul para postularte. La familia decide aceptar o rechazar."}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setWeekStart((w) => addDays(w, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Hoy
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart((w) => addDays(w, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando…
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="p-2 w-12 text-left font-medium text-muted-foreground"></th>
                {days.map((d) => {
                  const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
                  return (
                    <th
                      key={d.toISOString()}
                      className={`p-2 text-center font-medium ${isToday ? "text-biosensor" : "text-muted-foreground"}`}
                    >
                      <div>{DAY_LABEL[(d.getDay() + 6) % 7]}</div>
                      <div className={`text-[10px] ${isToday ? "font-bold" : ""}`}>{d.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => (
                <tr key={h} className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground text-[10px] font-medium">
                    {h.toString().padStart(2, "0")}:00
                  </td>
                  {days.map((d) => {
                    const key = `${d.toDateString()}-${h}`;
                    const isSending = sending === key;
                    const already = wasProposed(d, h);
                    if (targetRole === "professional") {
                      const slot = slotAt(d, h);
                      const state =
                        !slot ? "empty" : slot.status === "free" ? "free" : slot.status === "reserved" ? "reserved" : "busy";
                      const cls =
                        state === "free"
                          ? "bg-green-400/70 hover:bg-green-500 border-green-500 cursor-pointer"
                          : state === "reserved"
                            ? "bg-yellow-400/70 border-yellow-500 cursor-not-allowed"
                            : state === "busy"
                              ? "bg-muted border-border cursor-not-allowed"
                              : "border-transparent cursor-not-allowed";
                      return (
                        <td key={d.toISOString() + h} className="p-0.5">
                          <button
                            type="button"
                            disabled={state !== "free" || isSending || already || !currentUserId}
                            onClick={() => propose(d, h)}
                            className={`w-full h-8 rounded-md border ${cls} transition-colors flex items-center justify-center ${already ? "opacity-70 ring-2 ring-fuchsia-neural" : ""}`}
                            title={
                              already
                                ? "Ya enviaste una solicitud"
                                : state === "free"
                                  ? "Libre — toca para contratar"
                                  : state === "reserved"
                                    ? "Reservado parcialmente"
                                    : state === "busy"
                                      ? "Ocupado"
                                      : "Sin disponibilidad"
                            }
                          >
                            {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            {already ? <Handshake className="h-3 w-3 text-fuchsia-neural" /> : null}
                          </button>
                        </td>
                      );
                    }
                    const need = needAt(d, h);
                    const isOpen = need?.status === "open";
                    const isMatched = need?.status === "matched";
                    const cls = isMatched
                      ? "bg-green-600/80 border-green-700 cursor-not-allowed"
                      : isOpen
                        ? "bg-blue-500/80 hover:bg-blue-600 border-blue-600 cursor-pointer"
                        : "border-transparent cursor-not-allowed";
                    return (
                      <td key={d.toISOString() + h} className="p-0.5">
                        <button
                          type="button"
                          disabled={!isOpen || isSending || already || !currentUserId}
                          onClick={() => propose(d, h)}
                          className={`w-full h-8 rounded-md border ${cls} transition-colors flex items-center justify-center ${already ? "opacity-70 ring-2 ring-fuchsia-neural" : ""}`}
                          title={
                            already
                              ? "Ya te postulaste"
                              : isOpen
                                ? `Necesita ayuda — $${need?.hourly_rate?.toLocaleString("es-CO")}/h`
                                : isMatched
                                  ? "Ya cubierto"
                                  : "Sin necesidad"
                          }
                        >
                          {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          {already ? <Handshake className="h-3 w-3 text-fuchsia-neural" /> : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-3 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        {targetRole === "professional" ? (
          <>
            <Legend color="bg-green-400 border-green-500" label="Libre" />
            <Legend color="bg-yellow-400 border-yellow-500" label="Parcial" />
            <Legend color="bg-muted border-border" label="Ocupado" />
          </>
        ) : (
          <>
            <Legend color="bg-blue-500 border-blue-600" label="Necesidad abierta" />
            <Legend color="bg-green-600 border-green-700" label="Cubierto" />
          </>
        )}
        <Legend color="ring-2 ring-fuchsia-neural bg-transparent" label="Propuesta enviada" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded border ${color}`} />
      {label}
    </span>
  );
}
