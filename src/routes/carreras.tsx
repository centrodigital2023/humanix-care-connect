import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Heart, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { Button } from "@/components/ui/button";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/carreras")({
  head: () => ({
    meta: [
      { title: "Carreras · Trabaja en Humanix Colombia" },
      {
        name: "description",
        content:
          "Únete al equipo de Humanix y ayúdanos a transformar el talento humano en salud en Colombia con tecnología, propósito y comunidad.",
      },
      { property: "og:title", content: "Carreras · Trabaja en Humanix Colombia" },
      {
        property: "og:description",
        content:
          "Buscamos personas apasionadas por la salud, la tecnología y el impacto social en Colombia.",
      },
    ],
  }),
  component: CarrerasPage,
});

const perks = [
  {
    icon: Heart,
    title: "Impacto real",
    desc: "Tu trabajo conecta directamente con la salud de miles de familias colombianas.",
  },
  {
    icon: TrendingUp,
    title: "Crecimiento acelerado",
    desc: "Startup en etapa temprana: el trabajo que hagas hoy define el producto de mañana.",
  },
  {
    icon: Users,
    title: "Equipo diverso",
    desc: "Ingenieros, diseñadores, profesionales de salud y estrategas trabajando juntos.",
  },
  {
    icon: Briefcase,
    title: "Trabajo flexible",
    desc: "Remoto desde Colombia. Horarios flexibles orientados a resultados.",
  },
];

const openRoles = [
  {
    title: "Ingeniero(a) Full Stack",
    area: "Tecnología",
    type: "Tiempo completo · Remoto",
    desc: "React, TypeScript, Supabase y IA. Construye las features que usan miles de profesionales de salud.",
  },
  {
    title: "Diseñador(a) de Producto UX/UI",
    area: "Diseño",
    type: "Tiempo completo · Remoto",
    desc: "Define la experiencia de la plataforma: desde el onboarding hasta el dashboard de IPS.",
  },
  {
    title: "Ejecutivo(a) de Cuentas IPS",
    area: "Ventas",
    type: "Tiempo completo · Colombia",
    desc: "Presenta Humanix a clínicas y hospitales. Cierra cuentas institucionales y acompaña el onboarding.",
  },
  {
    title: "Especialista en Marketing de Comunidad",
    area: "Marketing",
    type: "Tiempo completo · Remoto",
    desc: "Construye la comunidad de profesionales de salud en redes sociales y canales de WhatsApp.",
  },
];

function CarrerasPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-neural/30 bg-fuchsia-neural/10 px-3.5 py-1.5 text-xs font-medium text-fuchsia-neural">
              <Briefcase className="h-3.5 w-3.5" />
              Únete al equipo
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-[1.05]">
              Construye el futuro <span className="text-gradient-bio">de la salud en Colombia</span>
              .
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              En Humanix combinamos tecnología de punta con propósito humano. Buscamos personas
              talentosas que quieran transformar cómo Colombia cuida a sus pacientes y valora a sus
              profesionales de salud.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {perks.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-fuchsia-neural/20 bg-fuchsia-neural/10 text-fuchsia-neural">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Posiciones abiertas</h2>
            <div className="mt-6 space-y-4">
              {openRoles.map((r) => (
                <div
                  key={r.title}
                  className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-neural/10 text-fuchsia-neural border border-fuchsia-neural/20">
                        {r.area}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.type}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <a href={`mailto:hola@humanix.co?subject=Postulación: ${r.title}`}>
                      Aplicar <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl border border-border bg-card p-8 text-center">
            <h2 className="font-display text-xl font-bold">¿No ves tu rol?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Envíanos tu hoja de vida y cuéntanos cómo puedes contribuir.
            </p>
            <Button variant="hero" size="lg" className="mt-5" asChild>
              <a href="mailto:hola@humanix.co?subject=Postulación espontánea Humanix">
                Enviar postulación espontánea
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <HabeasDataConsent />
    </div>
  );
}
