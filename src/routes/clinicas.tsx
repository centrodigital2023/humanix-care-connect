import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Users,
  Brain,
  ShieldCheck,
  BarChart3,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { Button } from "@/components/ui/button";
import { HumanixAssistant } from "@/components/humanix/HumanixAssistant";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/clinicas")({
  head: () => ({
    meta: [
      { title: "Clínicas e IPS · Humanix Colombia" },
      {
        name: "description",
        content:
          "Humanix para clínicas, hospitales y agencias IPS. Gestión de talento humano en salud con IA: cobertura de turnos en menos de 2 horas, scoring automático y cumplimiento RETHUS.",
      },
      { property: "og:title", content: "Clínicas e IPS · Humanix Colombia" },
      {
        property: "og:description",
        content:
          "Pipeline de candidatos con IA, cobertura de urgencias en tiempo real y gestión documental para IPS.",
      },
    ],
  }),
  component: ClinicasPage,
});

const benefits = [
  {
    icon: Clock,
    title: "Cobertura en menos de 2 horas",
    desc: "Publica una urgencia de turno y recibe candidatos verificados en minutos. Matching IA según especialidad, zona y disponibilidad.",
  },
  {
    icon: Users,
    title: "Bolsa de talento verificado",
    desc: "Accede a más de 847 profesionales activos con credenciales RETHUS validadas y Social Trust Score calculado.",
  },
  {
    icon: Brain,
    title: "Pipeline con scoring IA",
    desc: "Clasifica candidatos automáticamente por afinidad al rol, detección de inconsistencias en CV y alertas de fraude.",
  },
  {
    icon: ShieldCheck,
    title: "Cumplimiento Ministerio de Salud",
    desc: "Cruce automático con RETHUS, verificación biométrica y auditoría de contratos según regulación colombiana.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de operaciones",
    desc: "Métricas en tiempo real: ocupación de turnos, tiempos de respuesta, calificaciones y alertas de compliance.",
  },
  {
    icon: Building2,
    title: "Multi-usuario con roles",
    desc: "Perfiles diferenciados para Recursos Humanos, evaluador clínico y administrador. Control granular de acceso.",
  },
];

const steps = [
  "Crea la cuenta institucional con NIT y datos de la IPS.",
  "Define los roles de usuario y asigna permisos a tu equipo.",
  "Publica turnos de urgencia o convocatorias abiertas.",
  "Recibe candidatos clasificados por IA con scoring y documentos listos.",
  "Gestiona contratos, pagos y auditoría desde un solo panel.",
];

function ClinicasPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-biosensor/30 bg-biosensor/10 px-3.5 py-1.5 text-xs font-medium text-biosensor">
              <Building2 className="h-3.5 w-3.5" />
              Para clínicas e IPS
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-[1.05]">
              Gestión de talento en salud, <span className="text-gradient-bio">sin fricción</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Humanix conecta a tu institución con profesionales verificados en tiempo real. Cubre
              turnos de urgencia, gestiona el pipeline de candidatos y garantiza cumplimiento RETHUS
              desde un solo panel.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth" search={{ role: "institution" }}>
                  Crear cuenta IPS <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/planes">Ver plan Institución</Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-biosensor/20 bg-biosensor/10 text-biosensor">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Cómo funciona para tu IPS
            </h2>
            <ol className="mt-6 space-y-4">
              {steps.map((s, i) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="h-7 w-7 shrink-0 rounded-full bg-biosensor/15 text-biosensor inline-flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm sm:text-base leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth" search={{ role: "institution" }}>
                  Empezar ahora
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/planes">
                  Ver plan Institución <CheckCircle2 className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HumanixAssistant
        persona="default"
        greeting="¡Hola! Soy Humanix. ¿Necesitas cubrir un turno de urgencia o gestionar tu pipeline de candidatos?"
      />
      <HabeasDataConsent />
    </div>
  );
}
