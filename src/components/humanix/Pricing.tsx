import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "COP 0",
    sub: "siempre",
    desc: "Para conocer Humanix sin compromiso.",
    features: [
      "Crear perfil profesional o familiar",
      "Buscar y aplicar a ofertas abiertas",
      "Asistente IA básico (preguntas generales)",
      "Mensajería 1:1 cuando se acepta una aplicación",
    ],
    cta: "Tu plan actual",
    variant: "glass" as const,
    highlight: false,
  },
  {
    name: "Esencial",
    price: "COP 9.000",
    sub: "/mes",
    desc: "Familias y profesionales que quieren todo activo.",
    features: [
      "Match IA en menos de 150 ms",
      "Buzón de postulaciones ilimitado",
      "Contacto directo por WhatsApp con la otra parte",
      "Geolocalización en vivo y ETA",
      "Verificación RETHUS y anti-fraude IA incluida",
      "Sin comisión: el profesional cobra directo al cliente",
    ],
    cta: "Suscribirme por $9.000",
    variant: "hero" as const,
    highlight: true,
  },
  {
    name: "Pro Profesional",
    price: "COP 29.900",
    sub: "/mes",
    desc: "Profesionales que quieren visibilidad máxima.",
    features: [
      "Todo lo del Esencial",
      "Boost de visibilidad en búsquedas",
      "Coach de carrera 24/7 (mejorar perfil y Trust Score)",
      "Sugerencias IA en cada mensaje",
      "Validación anti-fraude IA prioritaria",
    ],
    cta: "Activar Pro",
    variant: "glass" as const,
    highlight: false,
  },
  {
    name: "Institución (IPS)",
    price: "Desde COP 99.000",
    sub: "/mes",
    desc: "Clínicas, hospitales y agencias de cuidado.",
    features: [
      "Bolsa de créditos IA mensual",
      "Multi-usuario con roles (HR, evaluador, admin)",
      "Pipeline de candidatos con scoring IA",
      "Detección de inconsistencias en CVs y RETHUS",
      "Soporte prioritario y onboarding asistido",
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

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
