import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin, Phone } from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto · Humanix Colombia" },
      {
        name: "description",
        content:
          "Comunícate con el equipo Humanix. Soporte para profesionales, familias, clínicas e instituciones en Colombia.",
      },
      { property: "og:title", content: "Contacto · Humanix Colombia" },
      {
        property: "og:description",
        content:
          "¿Tienes preguntas? El equipo Humanix está disponible por WhatsApp, correo electrónico y en nuestras ciudades principales.",
      },
    ],
  }),
  component: ContactoPage,
});

const channels = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    desc: "Soporte inmediato para profesionales y familias.",
    action: "Abrir chat",
    href: "https://wa.me/573001234567?text=Hola%20Humanix",
    color: "text-biosensor border-biosensor/20 bg-biosensor/10",
  },
  {
    icon: Mail,
    title: "Correo electrónico",
    desc: "Para consultas generales, prensa y alianzas.",
    action: "hola@humanix.co",
    href: "mailto:hola@humanix.co",
    color: "text-copper border-copper/20 bg-copper/10",
  },
  {
    icon: Phone,
    title: "Línea IPS",
    desc: "Ventas y soporte dedicado para clínicas e instituciones.",
    action: "ventas@humanix.co",
    href: "mailto:ventas@humanix.co",
    color: "text-fuchsia-neural border-fuchsia-neural/20 bg-fuchsia-neural/10",
  },
  {
    icon: MapPin,
    title: "Presencia física",
    desc: "Bogotá · Medellín · Cali · Barranquilla",
    action: "Agenda una visita",
    href: "mailto:hola@humanix.co?subject=Agenda visita presencial",
    color: "text-biosensor border-biosensor/20 bg-biosensor/10",
  },
];

function ContactoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05]">Hablemos</h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Estamos aquí para ayudarte. Sea que seas un profesional de salud, una familia buscando
              cuidado o una institución que quiere escalar su gestión de talento, tenemos un canal
              para ti.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {channels.map((c) => (
              <a
                key={c.title}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="rounded-2xl border border-border bg-card p-6 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${c.color}`}
                >
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                <p className="mt-3 text-sm font-medium text-foreground group-hover:underline">
                  {c.action}
                </p>
              </a>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-border bg-card p-8 sm:p-12">
            <h2 className="font-display text-2xl font-bold">Preguntas frecuentes</h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  q: "¿Cómo registro mi institución de salud?",
                  a: "Escribe a ventas@humanix.co con el nombre y NIT de tu institución. Un ejecutivo te contactará en menos de 24 horas hábiles.",
                },
                {
                  q: "¿El soporte es disponible en fines de semana?",
                  a: "Sí, el asistente IA responde 24/7. Para casos complejos, el equipo humano responde los lunes en la mañana.",
                },
                {
                  q: "¿Cómo puedo reportar un problema con un servicio?",
                  a: "Usa el botón de emergencia en la app o escribe directamente a soporte@humanix.co con el número de tu servicio.",
                },
              ].map((faq) => (
                <div key={faq.q} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <p className="font-semibold">{faq.q}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HabeasDataConsent />
    </div>
  );
}
