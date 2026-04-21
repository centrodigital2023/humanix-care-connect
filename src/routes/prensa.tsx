import { createFileRoute } from "@tanstack/react-router";
import { Newspaper, Mail, Download } from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { Button } from "@/components/ui/button";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/prensa")({
  head: () => ({
    meta: [
      { title: "Prensa · Humanix Colombia" },
      {
        name: "description",
        content:
          "Recursos de prensa, notas de medios y kit de marca de Humanix, la plataforma colombiana de talento humano en salud con IA.",
      },
      { property: "og:title", content: "Prensa · Humanix Colombia" },
      {
        property: "og:description",
        content: "Cobertura mediática, comunicados y kit de prensa de Humanix Colombia.",
      },
    ],
  }),
  component: PrensaPage,
});

const coverage = [
  {
    outlet: "El Tiempo",
    date: "Marzo 2025",
    headline: "La startup que quiere resolver la escasez de enfermeros en Colombia con IA",
    url: "#",
  },
  {
    outlet: "Semana",
    date: "Febrero 2025",
    headline: "Humanix: verificación RETHUS y pagos en Nequi para el sector salud",
    url: "#",
  },
  {
    outlet: "La República",
    date: "Enero 2025",
    headline: "Plataforma colombiana de cuidado domiciliario levanta ronda pre-seed",
    url: "#",
  },
];

const stats = [
  { value: "847+", label: "Profesionales activos" },
  { value: "12.000+", label: "Servicios completados" },
  { value: "4.9/5", label: "Calificación promedio" },
  { value: "4 ciudades", label: "Bogotá · Medellín · Cali · Barranquilla" },
];

function PrensaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-3.5 py-1.5 text-xs font-medium text-copper">
              <Newspaper className="h-3.5 w-3.5" />
              Sala de prensa
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-[1.05]">
              Humanix en los <span className="text-copper">medios</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Recursos para periodistas, investigadores y medios de comunicación interesados en la
              transformación del talento humano en salud de Colombia.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <a href="mailto:prensa@humanix.co">
                  <Mail className="mr-2 h-4 w-4" />
                  Contactar al equipo de prensa
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:prensa@humanix.co?subject=Kit de prensa Humanix">
                  <Download className="mr-2 h-4 w-4" />
                  Solicitar kit de prensa
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-border bg-border">
            {stats.map((s) => (
              <div key={s.label} className="bg-card p-6 text-center">
                <div className="font-display text-3xl font-bold text-copper">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <h2 className="font-display text-2xl font-bold">Cobertura destacada</h2>
            <div className="mt-6 space-y-4">
              {coverage.map((c) => (
                <a
                  key={c.headline}
                  href={c.url}
                  className="block rounded-2xl border border-border bg-card p-6 hover:border-copper/40 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-copper">{c.outlet}</span>
                        <span className="text-xs text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="mt-1.5 font-semibold group-hover:text-copper transition-colors">
                        {c.headline}
                      </p>
                    </div>
                    <Newspaper className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl border border-border bg-card p-8">
            <h2 className="font-display text-xl font-bold">Contacto de prensa</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Para entrevistas, datos estadísticos, imágenes o comentarios de voceros escribe a{" "}
              <a href="mailto:prensa@humanix.co" className="text-copper underline">
                prensa@humanix.co
              </a>
              . Respondemos en menos de 24 horas hábiles.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <HabeasDataConsent />
    </div>
  );
}
