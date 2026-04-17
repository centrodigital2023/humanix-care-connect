import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

const events = [
  "Laura aceptó un turno en Engativá hace 2 min",
  "Andrés cobró $180.000 COP por Nequi hace 4 min",
  "Clínica Reina Sofía publicó 3 turnos UCI hace 5 min",
  "Marta fue contratada por una familia en Cali hace 7 min",
  "Diana renovó RETHUS · Trust Score 96 hace 9 min",
  "Carlos calificó 5★ a Camila en Medellín hace 12 min",
];

export function LiveSocialProof() {
  const [i, setI] = useState(0);
  const [online, setOnline] = useState(847);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % events.length), 4000);
    const o = setInterval(
      () => setOnline((n) => Math.max(820, Math.min(880, n + (Math.random() > 0.5 ? 1 : -1)))),
      6000,
    );
    return () => {
      clearInterval(t);
      clearInterval(o);
    };
  }, []);

  return (
    <section className="relative -mt-px border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-biosensor">
          <span className="h-1.5 w-1.5 rounded-full bg-biosensor animate-pulse-ring" />
          {online} online
        </span>
        <span className="hidden sm:inline-block h-3 w-px bg-border" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1">
          <Activity className="h-3.5 w-3.5 text-biosensor shrink-0" />
          <span key={i} className="truncate animate-in fade-in slide-in-from-bottom-1 duration-500">
            {events[i]}
          </span>
        </div>
      </div>
    </section>
  );
}
