import { Star, Quote } from "lucide-react";
import t1 from "@/assets/testimonial-1.jpg";
import t2 from "@/assets/testimonial-2.jpg";
import t3 from "@/assets/testimonial-3.jpg";
import t4 from "@/assets/testimonial-4.jpg";

type Testimonial = {
  name: string;
  role: string;
  city: string;
  avatar: string;
  rating: number;
  quote: string;
  badge?: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Laura Mendoza",
    role: "Enfermera Jefe · 7 años de experiencia",
    city: "Bogotá",
    avatar: t1,
    rating: 5,
    badge: "Top Rated",
    quote:
      "Antes pasaba semanas buscando turnos. Con Humanix recibo ofertas a 2 km de mi casa y me pagan en Nequi al terminar. Mi ingreso mensual subió 38%.",
  },
  {
    name: "Carlos Restrepo",
    role: "Hijo de paciente · cuida a su mamá",
    city: "Medellín",
    avatar: t2,
    rating: 5,
    badge: "Familia verificada",
    quote:
      "Mi mamá necesitaba cuidado nocturno urgente. En 14 minutos llegó Diana, una auxiliar verificada por RETHUS. La tranquilidad de ver su Trust Score de 96 no tiene precio.",
  },
  {
    name: "Andrés Quintero",
    role: "Auxiliar de enfermería · UCI",
    city: "Cali",
    avatar: t3,
    rating: 5,
    badge: "Verificado RETHUS",
    quote:
      "El asistente de IA me ayudó a estructurar mi hoja de vida y a prepararme para entrevistas. Conseguí un contrato fijo en una clínica top en menos de un mes.",
  },
  {
    name: "Marta Herrera",
    role: "Cuidadora de adulto mayor",
    city: "Barranquilla",
    avatar: t4,
    rating: 5,
    badge: "120 turnos",
    quote:
      "Soy mamá soltera y necesito horarios flexibles. Acepto turnos desde WhatsApp y cobro inmediato por PSE. Humanix cambió la economía de mi familia.",
  },
];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < value ? "fill-copper text-copper" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="testimonios" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-fuchsia-neural font-semibold">
            Casos reales
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold leading-tight">
            Historias que pasan en Colombia,{" "}
            <span className="text-gradient-bio">todos los días</span>.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Profesionales y familias que ya transformaron su forma de cuidar y
            de trabajar con Humanix.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="group relative rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1 transition-all duration-300"
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-biosensor/20" />

              <div className="flex items-start gap-4">
                <img
                  src={t.avatar}
                  alt={`Foto de ${t.name}`}
                  loading="lazy"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-2xl object-cover border border-border"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-lg leading-tight">
                      {t.name}
                    </h3>
                    {t.badge && (
                      <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-biosensor/15 text-biosensor border border-biosensor/30">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Stars value={t.rating} />
                    <span className="text-xs text-muted-foreground">
                      · {t.city}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm sm:text-[15px] leading-relaxed text-foreground/90">
                "{t.quote}"
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-copper text-copper" />
            <strong className="text-foreground">4.9/5</strong> promedio en 1.2k reseñas
          </div>
          <div>
            <strong className="text-foreground">94%</strong> de turnos completados
          </div>
          <div>
            <strong className="text-foreground">38 min</strong> tiempo medio de match
          </div>
        </div>
      </div>
    </section>
  );
}
