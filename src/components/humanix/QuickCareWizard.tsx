// Buscador rápido para familias:
//   "Necesito cuidado para ___" → fecha → hora → duración → "Buscar profesional".
// Guarda los criterios en URL y navega a /buscar?tab=profesionales con preselección.
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Stethoscope, Calendar as CalendarIcon, Clock, Hourglass, Search, Heart, Baby, Activity, Bandage } from "lucide-react";
import { Button } from "@/components/ui/button";

type CareType = {
  key: string;
  label: string;
  icon: typeof Heart;
  specialty: string;
};

const TYPES: CareType[] = [
  { key: "elder", label: "Adulto mayor", icon: Heart, specialty: "Cuidado adulto mayor" },
  { key: "kids", label: "Niños / Pediatría", icon: Baby, specialty: "Cuidado pediátrico" },
  { key: "post-op", label: "Postoperatorio", icon: Bandage, specialty: "Heridas y curaciones" },
  { key: "chronic", label: "Enfermedad crónica", icon: Activity, specialty: "Enfermería general" },
];

const DURATIONS = [
  { value: 2, label: "2 horas" },
  { value: 4, label: "4 horas" },
  { value: 8, label: "Jornada (8h)" },
  { value: 12, label: "Turno noche (12h)" },
  { value: 24, label: "24h continuas" },
];

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function QuickCareWizard() {
  const navigate = useNavigate();
  const [careKey, setCareKey] = useState<string>(TYPES[0].key);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("08:00");
  const [duration, setDuration] = useState<number>(4);
  const [city, setCity] = useState("Bogotá");

  const selected = useMemo(() => TYPES.find((t) => t.key === careKey) ?? TYPES[0], [careKey]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/buscar",
      search: {
        tab: "profesionales",
        specialty: selected.specialty,
        city,
      },
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-4 sm:p-6 shadow-[var(--shadow-elegant)]"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-biosensor font-semibold">
        Buscador rápido
      </p>
      <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight">
        Necesito cuidado para…
      </h3>

      {/* Tipo de cuidado */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const active = t.key === careKey;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setCareKey(t.key)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
                active
                  ? "border-biosensor bg-biosensor/10 text-biosensor"
                  : "border-border bg-background hover:border-foreground/20"
              }`}
            >
              <Icon className="h-5 w-5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Fecha + hora + duración + ciudad */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <label className="flex items-center gap-2 px-3 rounded-xl border border-border bg-background">
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-sm py-2.5"
          />
        </label>
        <label className="flex items-center gap-2 px-3 rounded-xl border border-border bg-background">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-sm py-2.5"
          />
        </label>
        <label className="flex items-center gap-2 px-3 rounded-xl border border-border bg-background">
          <Hourglass className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-transparent border-0 outline-none text-sm py-2.5"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 px-3 rounded-xl border border-border bg-background">
          <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad"
            className="w-full bg-transparent border-0 outline-none text-sm py-2.5"
          />
        </label>
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full mt-4">
        <Search className="h-5 w-5" />
        Buscar profesional
      </Button>

      <p className="mt-3 text-[11px] text-muted-foreground text-center">
        Resultados en menos de 150 ms · Profesionales verificados con RETHUS · Pago protegido
      </p>
    </form>
  );
}
