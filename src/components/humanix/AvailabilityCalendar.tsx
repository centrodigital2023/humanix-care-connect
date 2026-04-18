import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Eraser } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Slot = {
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  status: "free" | "reserved" | "busy";
  note: string | null;
};

const HOURS = Array.from({ length: 14 }, (_, i) => 6 + i); // 6:00 a 19:00

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

const DAY_LABEL = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Preset = "morning" | "afternoon" | "evening" | "weekdays" | "all" | "clear";

export function AvailabilityCalendar({
  userId,
  editable = true,
}: {
  userId: string;
  editable?: boolean;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("id, user_id, starts_at, ends_at, status, note")
        .eq("user_id", userId)
        .gte("starts_at", weekStart.toISOString())
        .lt("starts_at", weekEnd.toISOString())
        .order("starts_at");
      if (!active) return;
      if (error) {
        console.warn("[agenda]", error.message);
        setSlots([]);
      } else {
        setSlots((data ?? []) as Slot[]);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [userId, weekStart, weekEnd]);

  const slotAt = (day: Date, hour: number): Slot | undefined =>
    slots.find((s) => {
      const start = new Date(s.starts_at);
      return (
        start.getDate() === day.getDate() &&
        start.getMonth() === day.getMonth() &&
        start.getHours() === hour
      );
    });

  async function toggleSlot(day: Date, hour: number) {
    if (!editable) return;
    const existing = slotAt(day, hour);
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);

    if (existing) {
      if (existing.status === "free") {
        const { error } = await supabase
          .from("availability_slots")
          .update({ status: "busy" })
          .eq("id", existing.id);
        if (error) toast.error(error.message);
        else
          setSlots((s) => s.map((x) => (x.id === existing.id ? { ...x, status: "busy" } : x)));
      } else {
        const { error } = await supabase
          .from("availability_slots")
          .delete()
          .eq("id", existing.id);
        if (error) toast.error(error.message);
        else setSlots((s) => s.filter((x) => x.id !== existing.id));
      }
    } else {
      const { data, error } = await supabase
        .from("availability_slots")
        .insert({
          user_id: userId,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          status: "free",
        })
        .select()
        .single();
      if (error) toast.error(error.message);
      else if (data) setSlots((s) => [...s, data as Slot]);
    }
  }

  async function applyPreset(p: Preset) {
    if (!editable) return;
    setBulkBusy(true);
    try {
      if (p === "clear") {
        const ids = slots.filter((s) => s.status !== "reserved").map((s) => s.id);
        if (ids.length) {
          await supabase.from("availability_slots").delete().in("id", ids);
        }
        setSlots((s) => s.filter((x) => x.status === "reserved"));
        toast.success("Semana limpia");
        return;
      }
      const dayMatcher = (idx: number) => (p === "weekdays" ? idx < 5 : true);
      const hourMatcher = (h: number) => {
        if (p === "morning") return h >= 6 && h <= 11;
        if (p === "afternoon") return h >= 12 && h <= 17;
        if (p === "evening") return h >= 18 && h <= 19;
        return true; // weekdays / all
      };
      const toInsert: { user_id: string; starts_at: string; ends_at: string; status: "free" }[] = [];
      days.forEach((d, i) => {
        if (!dayMatcher(i)) return;
        HOURS.forEach((h) => {
          if (!hourMatcher(h)) return;
          if (slotAt(d, h)) return;
          const start = new Date(d);
          start.setHours(h, 0, 0, 0);
          const end = new Date(start);
          end.setHours(h + 1);
          toInsert.push({
            user_id: userId,
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            status: "free",
          });
        });
      });
      if (toInsert.length) {
        const { data } = await supabase
          .from("availability_slots")
          .insert(toInsert)
          .select();
        if (data) setSlots((s) => [...s, ...((data as Slot[]) ?? [])]);
      }
      toast.success(`${toInsert.length} horas marcadas como disponibles`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error aplicando preset");
    } finally {
      setBulkBusy(false);
    }
  }

  const today = new Date();
  const freeCount = slots.filter((s) => s.status === "free").length;
  const reservedCount = slots.filter((s) => s.status === "reserved").length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border">
        <div>
          <p className="text-sm font-semibold">
            {weekStart.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
            {" – "}
            {addDays(weekStart, 6).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {freeCount} h disponibles · {reservedCount} h reservadas
          </p>
        </div>
        <div className="flex items-center gap-1 self-end sm:self-auto">
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

      {/* Quick presets */}
      {editable && (
        <div className="flex items-center gap-1.5 flex-wrap p-3 border-b border-border bg-muted/20">
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-fuchsia-neural" /> Plantillas:
          </span>
          <PresetBtn label="Mañanas" onClick={() => applyPreset("morning")} disabled={bulkBusy} />
          <PresetBtn label="Tardes" onClick={() => applyPreset("afternoon")} disabled={bulkBusy} />
          <PresetBtn label="Noches" onClick={() => applyPreset("evening")} disabled={bulkBusy} />
          <PresetBtn label="Lun–Vie" onClick={() => applyPreset("weekdays")} disabled={bulkBusy} />
          <PresetBtn label="Toda la semana" onClick={() => applyPreset("all")} disabled={bulkBusy} />
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => applyPreset("clear")}
            className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-500/10 text-rose-600"
          >
            <Eraser className="h-3 w-3" /> Limpiar
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando agenda…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 w-12 text-left font-medium text-muted-foreground"></th>
                {days.map((d) => {
                  const isToday =
                    d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
                  return (
                    <th
                      key={d.toISOString()}
                      className={`p-2 text-center font-medium ${
                        isToday ? "text-biosensor" : "text-muted-foreground"
                      }`}
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
                  <td className="p-2 text-muted-foreground text-[10px] font-medium">{h}:00</td>
                  {days.map((d) => {
                    const slot = slotAt(d, h);
                    const cls = slot
                      ? slot.status === "free"
                        ? "bg-biosensor/30 hover:bg-biosensor/50 border-biosensor/50"
                        : slot.status === "reserved"
                        ? "bg-cyber/30 border-cyber/50 cursor-not-allowed"
                        : "bg-muted hover:bg-muted/70 border-border"
                      : "hover:bg-foreground/5 border-transparent";
                    return (
                      <td key={d.toISOString() + h} className="p-0.5">
                        <button
                          type="button"
                          disabled={!editable || slot?.status === "reserved"}
                          onClick={() => toggleSlot(d, h)}
                          className={`w-full h-9 rounded-md border ${cls} transition-colors`}
                          title={
                            slot
                              ? slot.status === "free"
                                ? "Disponible"
                                : slot.status === "reserved"
                                ? "Reservado"
                                : "Ocupado"
                              : "Vacío — toca para marcar disponible"
                          }
                        />
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
        <Legend color="bg-biosensor/40 border-biosensor/60" label="Disponible" />
        <Legend color="bg-cyber/40 border-cyber/60" label="Reservado (15 días)" />
        <Legend color="bg-muted border-border" label="Ocupado" />
      </div>
    </div>
  );
}

function PresetBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-[11px] px-2 py-1 rounded-md border border-border bg-background hover:bg-biosensor/10 hover:border-biosensor/40 transition-colors disabled:opacity-50"
    >
      {label}
    </button>
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
