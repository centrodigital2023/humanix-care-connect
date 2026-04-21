import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileCheck, Award, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/cumplimiento")({
  head: () => ({
    meta: [
      { title: "Cumplimiento Ministerio de Salud · Humanix Colombia" },
      {
        name: "description",
        content:
          "Cumplimiento normativo de Humanix con el Ministerio de Salud y Protección Social de Colombia: RETHUS, Ley 1164 de 2007, Resolución 3100 de 2019 y demás normativa aplicable.",
      },
      { property: "og:title", content: "Cumplimiento Min. Salud · Humanix Colombia" },
    ],
  }),
  component: CumplimientoPage,
});

const frameworks = [
  {
    icon: ShieldCheck,
    title: "RETHUS",
    subtitle: "Registro del Talento Humano en Salud",
    desc: "Humanix integra verificación automática con el Sistema de Información del Registro del Talento Humano en Salud (RETHUS) del Ministerio de Salud. Ningún profesional puede prestar servicios a través de la plataforma sin verificación exitosa de su registro.",
  },
  {
    icon: FileCheck,
    title: "Ley 1164 de 2007",
    subtitle: "Talento Humano en Salud",
    desc: "Cumplimos con las disposiciones de la Ley 1164 sobre habilitación del talento humano en salud: verificación de títulos académicos, tarjetas profesionales y certificados de aptitud cuando aplica.",
  },
  {
    icon: Award,
    title: "Resolución 3100 de 2019",
    subtitle: "Procedimientos y condiciones de inscripción de prestadores",
    desc: "Para el módulo institucional (IPS), Humanix requiere que las instituciones acrediten su inscripción ante el Registro Especial de Prestadores de Servicios de Salud (REPS) antes de publicar convocatorias.",
  },
  {
    icon: AlertCircle,
    title: "Ley 1581 de 2012",
    subtitle: "Protección de Datos Personales",
    desc: "El manejo de datos sensibles de salud cumple con los principios de finalidad, necesidad y proporcionalidad. El consentimiento informado (Habeas Data) se obtiene de forma explícita antes de cualquier tratamiento de datos.",
  },
];

const controls = [
  "Verificación automática de RETHUS en el momento del registro.",
  "Validación biométrica de identidad con cruce de cédula colombiana.",
  "Detección de inconsistencias en CV y credenciales con IA (Gemini).",
  "Auditoría continua de cambios en el estado del registro RETHUS.",
  "Alertas automáticas al superadmin ante anomalías de cumplimiento.",
  "Registro inmutable de consentimientos de Habeas Data por usuario.",
  "Reportes de cumplimiento disponibles para auditoría interna y externa.",
];

function CumplimientoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-3xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-biosensor/30 bg-biosensor/10 px-3.5 py-1.5 text-xs font-medium text-biosensor">
            <ShieldCheck className="h-3.5 w-3.5" />
            Marco regulatorio colombiano
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05]">
            Cumplimiento <span className="text-gradient-bio">Ministerio de Salud</span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Humanix fue diseñado desde su origen para operar dentro del marco regulatorio del sector
            salud colombiano. Nuestra arquitectura tecnológica refleja los requisitos del Ministerio
            de Salud y Protección Social.
          </p>

          <div className="mt-12 space-y-4">
            {frameworks.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-biosensor/20 bg-biosensor/10 text-biosensor">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold">{f.title}</h2>
                    <p className="text-xs text-muted-foreground">{f.subtitle}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-biosensor/20 bg-biosensor/5 p-8">
            <h2 className="font-display text-2xl font-bold">Controles implementados</h2>
            <ul className="mt-6 space-y-3">
              {controls.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-biosensor mt-0.5" />
                  <p className="text-sm leading-relaxed">{c}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 rounded-3xl border border-border bg-card p-8">
            <h2 className="font-display text-xl font-bold">¿Eres una IPS o ente de control?</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Si representas una institución de salud, una entidad regulatoria o requieres
              documentación de cumplimiento para auditorías, escribe a{" "}
              <a href="mailto:cumplimiento@humanix.co" className="text-biosensor underline">
                cumplimiento@humanix.co
              </a>
              . Respondemos en menos de 48 horas hábiles.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4 text-sm">
            <Link to="/terminos" className="text-biosensor hover:underline">
              Términos y Condiciones
            </Link>
            <Link to="/privacidad" className="text-biosensor hover:underline">
              Política de Privacidad
            </Link>
            <Link to="/habeas-data" className="text-biosensor hover:underline">
              Habeas Data
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <HabeasDataConsent />
    </div>
  );
}
