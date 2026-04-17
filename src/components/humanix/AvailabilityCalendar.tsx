import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
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
  const day = (x.getDay() + 6) % 7; // lunes = 0
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

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

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
    return () => {
      active = false;
    };
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
      // ciclo: free → busy → eliminar
      if (existing.status === "free") {
        const { error } = await supabase
          .from("availability_slots")
          .update({ status: "busy" })
          .eq("id", existing.id);
        if (error) toast.error(error.message);
        else
          setSlots((s) =>
            s.map((x) => (x.id === existing.id ? { ...x, status: "busy" } : x))
          );
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

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
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
            {editable
              ? "Toca para marcar disponible · vuelve a tocar para ocupado · una vez más para borrar"
              : "Solo lectura"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
                    d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth();
                  return (
                    <th
                      key={d.toISOString()}
                      className={`p-2 text-center font-medium ${
                        isToday ? "text-biosensor" : "text-muted-foreground"
                      }`}
                    >
                      <div>{DAY_LABEL[(d.getDay() + 6) % 7]}</div>
                      <div className="text-[10px]">{d.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => (
                <tr key={h} className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground text-[10px]">{h}:00</td>
                  {days.map((d) => {
                    const slot = slotAt(d, h);
                    const cls = slot
                      ? slot.status === "free"
                        ? "bg-biosensor/20 hover:bg-biosensor/30 border-biosensor/40"
                        : slot.status === "reserved"
                        ? "bg-cyber/20 border-cyber/40 cursor-not-allowed"
                        : "bg-muted hover:bg-muted/70 border-border"
                      : "hover:bg-foreground/5 border-transparent";
                    return (
                      <td key={d.toISOString() + h} className="p-0.5">
                        <button
                          type="button"
                          disabled={!editable || slot?.status === "reserved"}
                          onClick={() => toggleSlot(d, h)}
                          className={`w-full h-8 rounded border ${cls} transition-colors`}
                          title={
                            slot
                              ? slot.status === "free"
                                ? "Disponible"
                                : slot.status === "reserved"
                                ? "Reservado"
                                : "Ocupado"
                              : "Vacío"
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
        <Legend color="bg-cyber/40 border-cyber/60" label="Reservado" />
        <Legend color="bg-muted border-border" label="Ocupado" />
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
