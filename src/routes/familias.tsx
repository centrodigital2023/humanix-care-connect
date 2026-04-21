import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Search, ShieldCheck, Activity, PhoneCall, Star, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { QuickCareWizard } from "@/components/humanix/QuickCareWizard";
import { Button } from "@/components/ui/button";
import { HumanixAssistant } from "@/components/humanix/HumanixAssistant";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/familias")({
  head: () => ({
    meta: [
      { title: "Familias · Encuentra cuidador en minutos | Humanix" },
      {
        name: "description",
        content:
          "Contrata cuidadores y enfermeros verificados con RETHUS para tu familia en Colombia. Geolocalización en vivo, botón de emergencia 24/7 y pagos protegidos.",
      },
      { property: "og:title", content: "Familias · Encuentra cuidador en minutos | Humanix" },
      {
        property: "og:description",
        content:
          "Cuidado humano de confianza con IA: candidatos verificados, ETA en vivo y respaldo total.",
      },
    ],
  }),
  component: FamiliasPage,
});

const benefits = [
  {
    icon: Search,
    title: "Encuentra en minutos",
    desc: "Selecciona tipo de cuidado, fecha, hora y zona. Te mostramos los mejores match al instante.",
  },
  {
    icon: ShieldCheck,
    title: "100% verificados",
    desc: "Cédula, RETHUS y biometría facial validados con IA. Antifraude permanente.",
  },
  {
    icon: Activity,
    title: "Monitoreo en vivo",
    desc: "Ruta del cuidador, ETA en minutos y botón de emergencia conectado a la línea 123.",
  },
  {
    icon: PhoneCall,
    title: "Soporte 24/7",
    desc: "WhatsApp directo, copiloto IA de contratación y respaldo de pólizas reconocidas.",
  },
];

function FamiliasPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-20">
        {/* Hero + Wizard */}
        <section className="relative overflow-hidden pt-8 pb-12">
          <div className="absolute inset-0 bg-aurora opacity-70 pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-3.5 py-1.5 text-xs font-medium text-copper">
                <Heart className="h-3.5 w-3.5" />
                Para familias
              </span>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-[1.05]">
                Cuidado humano de confianza, <span className="text-copper">a un toque</span>.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                Encuentra enfermeros y cuidadores certificados para adultos mayores, postoperatorios
                o cuidado pediátrico. Verificación RETHUS, ETA en vivo y pago protegido.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-copper text-copper" />
                  ))}
                </div>
                4.9 / 5 · más de 12.000 servicios completados
              </div>
            </div>
            <div className="lg:pl-6">
              <QuickCareWizard />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-copper/20 bg-copper/10 text-copper">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-copper/30 bg-gradient-to-br from-copper/10 to-transparent p-6 sm:p-10 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              ¿Lista para encontrar el cuidador ideal?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Comisión transparente del 5% por contratación. Sin permanencia, sin sorpresas.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="copper" size="xl" asChild>
                <Link to="/buscar" search={{ tab: "profesionales" }}>
                  Buscar cuidador <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/planes">Ver detalles del plan</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HumanixAssistant
        persona="family"
        greeting="¡Hola! Soy Humanix. Cuéntame qué cuidado necesitas y te recomiendo perfiles."
      />
      <HabeasDataConsent />
    </div>
  );
}
