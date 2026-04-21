import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Profesional",
    price: "Gratis",
    sub: "o $9.900 COP/mes Pro",
    desc: "Para enfermeros, auxiliares y cuidadores independientes.",
    features: [
      "Perfil verificado RETHUS",
      "Postulación a turnos ilimitada",
      "Calendario y notificaciones",
      "Pagos en Nequi y PSE",
    ],
    cta: "Crear perfil",
    variant: "glass" as const,
    highlight: false,
  },
  {
    name: "Familia",
    price: "5%",
    sub: "por turno contratado",
    desc: "Encuentra cuidador certificado para tu ser querido.",
    features: [
      "Búsqueda y match en minutos",
      "Geolocalización en vivo",
      "Botón de emergencia 24/7",
      "Seguro Sura incluido",
    ],
    cta: "Contratar ahora",
    variant: "hero" as const,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Desde",
    sub: "$990.000 COP/mes",
    desc: "Para IPS, clínicas y agencias con +10 profesionales.",
    features: [
      "Dashboard superadmin con IA",
      "Predicción de ausentismo",
      "API y webhooks",
      "Auditoría Min. Salud",
    ],
    cta: "Hablar con ventas",
    variant: "copper" as const,
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="planes" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-copper font-semibold">
            Planes
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold leading-tight">
            Un plan para cada <span className="text-gradient-bio">historia humana</span>.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pagos en pesos colombianos. Sin permanencia. Cancela cuando quieras.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl border p-8 flex flex-col ${
                p.highlight
                  ? "border-biosensor/40 bg-card shadow-[var(--shadow-glow-bio)]"
                  : "border-border bg-card shadow-[var(--shadow-card)]"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-biosensor text-biosensor-foreground text-xs font-semibold">
                  Más elegido
                </div>
              )}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.sub}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-biosensor mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button variant={p.variant} size="lg" className="mt-8 w-full">
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
