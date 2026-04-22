import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const faqs = [
  {
    q: "¿Cómo verifica Humanix a los profesionales?",
    a: "Cruzamos datos con RETHUS, validamos cédula con biometría facial y nuestro motor de IA calcula un Trust Score. Un evaluador humano confirma cada perfil pre-aprobado antes de publicarlo.",
  },
  {
    q: "¿Cuánto tarda en llegar un cuidador a mi casa?",
    a: "El match promedio es de 38 minutos. Para urgencias UCI o nocturnas hemos llegado en menos de 14 minutos en Bogotá, Medellín y Cali.",
  },
  {
    q: "¿Cómo se realizan los pagos a profesionales?",
    a: "Inmediatos vía Nequi, PSE o RappiPay (próximamente). El smart-contract libera el pago al confirmar geolocalización de llegada y firma digital del turno completado.",
  },
  {
    q: "¿Qué cobertura tienen los seguros incluidos?",
    a: "Las familias en plan estándar reciben respaldo Sura por accidentes durante el turno. El plan Enterprise incluye póliza Colsanitas extendida y cobertura para enfermedades preexistentes documentadas.",
  },
  {
    q: "¿Funciona en ciudades intermedias?",
    a: "Hoy operamos al 100% en Bogotá, Medellín, Cali y Barranquilla. Bucaramanga y Pereira están en piloto. Si nos pides cobertura en tu ciudad activamos el corredor en menos de 30 días.",
  },
  {
    q: "¿Cómo cumplen con la ley de Habeas Data?",
    a: "Datos cifrados en AWS São Paulo, consentimiento granular firmado en onboarding, derecho de portabilidad y eliminación 24/7, y auditoría trimestral según resolución 1995 del Min. Salud.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-24 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-biosensor font-semibold">
            Preguntas frecuentes
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold leading-tight">
            Todo lo que necesitas saber <span className="text-gradient-bio">antes de empezar</span>.
          </h2>
        </div>

        <div className="mt-12 divide-y divide-border border border-border rounded-3xl bg-card overflow-hidden">
          {faqs.map((f, i) => {
            const expanded = open === i;
            return (
              <button
                key={f.q}
                onClick={() => setOpen(expanded ? -1 : i)}
                className="w-full text-left px-5 sm:px-6 py-5 hover:bg-foreground/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-display font-semibold text-base sm:text-lg">{f.q}</p>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${
                      expanded ? "rotate-180 text-biosensor" : ""
                    }`}
                  />
                </div>
                {expanded && (
                  <p className="mt-3 text-sm sm:text-[15px] text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {f.a}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
