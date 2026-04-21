import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Lightbulb, Target, Users, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { Button } from "@/components/ui/button";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Humanix · Talento humano en salud para Colombia" },
      {
        name: "description",
        content:
          "Conoce la misión, visión y el equipo detrás de Humanix: la plataforma colombiana que conecta profesionales de salud con familias y clínicas usando IA en tiempo real.",
      },
      { property: "og:title", content: "Sobre Humanix · Talento humano en salud para Colombia" },
      {
        property: "og:description",
        content:
          "Somos un equipo colombiano comprometido con dignificar el trabajo en salud y garantizar cuidado de calidad para todas las familias.",
      },
    ],
  }),
  component: SobrePage,
});

const values = [
  {
    icon: Heart,
    title: "Cuidado humano primero",
    desc: "Cada decisión de diseño parte de la dignidad del profesional de salud y la seguridad de las familias.",
  },
  {
    icon: Lightbulb,
    title: "Tecnología con propósito",
    desc: "La IA es una herramienta para ampliar el acceso a cuidado de calidad, no para reemplazar el toque humano.",
  },
  {
    icon: Target,
    title: "Transparencia total",
    desc: "Precios claros, comisiones visibles y datos protegidos por Habeas Data Ley 1581/2012.",
  },
  {
    icon: Users,
    title: "Comunidad colombiana",
    desc: "Construido en Colombia, para Colombia. Cumplimos con RETHUS, Ministerio de Salud y Superintendencia de Salud.",
  },
];

function SobrePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05]">
              Sobre <span className="text-gradient-bio">Humanix</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Humanix nació en Colombia con una convicción simple: el talento humano en salud merece
              una plataforma a la altura de su vocación. Conectamos enfermeros, auxiliares y
              cuidadores con familias y clínicas usando inteligencia artificial en tiempo real,
              verificación oficial RETHUS y pagos inmediatos.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-border bg-card p-8">
              <h2 className="font-display text-2xl font-bold">Nuestra misión</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Democratizar el acceso a talento humano calificado en salud para todas las familias
                y clínicas de Colombia, eliminando la fricción, el fraude y la desigualdad en el
                sector.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-8">
              <h2 className="font-display text-2xl font-bold">Nuestra visión</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Ser la plataforma líder de talento en salud de América Latina, reconocida por la
                confianza de sus comunidades, el rigor de su tecnología y el impacto real en la
                calidad de vida de millones de personas.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Nuestros valores</h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-biosensor/20 bg-biosensor/10 text-biosensor">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl border border-biosensor/20 bg-biosensor/5 p-8 sm:p-12 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Únete a la comunidad Humanix
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Más de 847 profesionales de salud y cientos de familias ya confían en Humanix. Sé
              parte del cambio en la atención sanitaria colombiana.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth">
                  Empezar gratis <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/contacto">Contactar al equipo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HabeasDataConsent />
    </div>
  );
}
