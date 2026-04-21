import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/habeas-data")({
  head: () => ({
    meta: [
      { title: "Habeas Data · Humanix Colombia" },
      {
        name: "description",
        content:
          "Aviso de Habeas Data de Humanix. Ejercicio de derechos de acceso, rectificación, supresión y revocación de autorización sobre datos personales. Ley 1581 de 2012.",
      },
      { property: "og:title", content: "Habeas Data · Humanix Colombia" },
    ],
  }),
  component: HabeasDataPage,
});

function HabeasDataPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-3xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-biosensor/30 bg-biosensor/10 px-3.5 py-1.5 text-xs font-medium text-biosensor">
            <ShieldCheck className="h-3.5 w-3.5" />
            Ley 1581 de 2012
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold">Habeas Data</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última actualización: 1 de enero de 2025
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="font-display text-xl font-semibold mb-3">¿Qué es el Habeas Data?</h2>
              <p className="text-muted-foreground">
                El Habeas Data es un derecho fundamental consagrado en el artículo 15 de la
                Constitución Política de Colombia y regulado por la Ley 1581 de 2012. Permite a toda
                persona conocer, actualizar y rectificar las informaciones que se hayan recogido
                sobre ella en bases de datos o archivos de entidades públicas y privadas.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">Tus derechos</h2>
              <div className="space-y-4">
                {[
                  {
                    title: "Derecho de acceso",
                    desc: "Puedes solicitar en cualquier momento qué datos personales tuyos tiene Humanix, con qué finalidad y con quién han sido compartidos.",
                  },
                  {
                    title: "Derecho de actualización y rectificación",
                    desc: "Puedes solicitar la corrección de datos inexactos, desactualizados, incompletos o que induzcan a error.",
                  },
                  {
                    title: "Derecho de supresión",
                    desc: "Puedes solicitar la eliminación de tus datos personales cuando no sean necesarios para la finalidad que motivó su recopilación o cuando hayas revocado tu consentimiento.",
                  },
                  {
                    title: "Derecho de revocación",
                    desc: "Puedes revocar en cualquier momento la autorización que otorgaste para el tratamiento de tus datos personales, sin efecto retroactivo.",
                  },
                  {
                    title: "Derecho a presentar quejas",
                    desc: "Puedes presentar quejas ante la Superintendencia de Industria y Comercio (SIC) si consideras que Humanix ha vulnerado tus derechos.",
                  },
                ].map((d) => (
                  <div
                    key={d.title}
                    className="rounded-2xl border border-biosensor/20 bg-biosensor/5 p-5"
                  >
                    <h3 className="font-semibold text-biosensor">{d.title}</h3>
                    <p className="mt-1.5 text-muted-foreground">{d.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">Cómo ejercer tus derechos</h2>
              <p className="text-muted-foreground mb-4">
                Para ejercer cualquiera de los derechos anteriores, sigue estos pasos:
              </p>
              <ol className="space-y-3">
                {[
                  "Envía un correo a datos@humanix.co con el asunto 'Solicitud Habeas Data'.",
                  "Incluye tu nombre completo, número de cédula y una descripción clara de tu solicitud.",
                  "Adjunta una copia de tu documento de identidad para verificar tu identidad.",
                  "Humanix dará respuesta a tu solicitud en un plazo máximo de 15 días hábiles.",
                  "Si la solicitud no puede ser atendida en ese plazo, se te informará sobre los motivos y el tiempo adicional necesario.",
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="h-7 w-7 shrink-0 rounded-full bg-biosensor/15 text-biosensor inline-flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <p className="text-muted-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">Contacto del responsable</h2>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Humanix Colombia S.A.S.</strong>
                  <br />
                  Oficial de Protección de Datos
                  <br />
                  Correo:{" "}
                  <a href="mailto:datos@humanix.co" className="text-biosensor underline">
                    datos@humanix.co
                  </a>
                  <br />
                  Bogotá, D.C., Colombia
                </p>
                <p className="mt-4 text-muted-foreground">
                  También puede presentar reclamaciones ante la{" "}
                  <a
                    href="https://www.sic.gov.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-biosensor underline"
                  >
                    Superintendencia de Industria y Comercio (SIC)
                  </a>
                  .
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 flex flex-wrap gap-4 text-sm">
            <Link to="/terminos" className="text-biosensor hover:underline">
              Términos y Condiciones
            </Link>
            <Link to="/privacidad" className="text-biosensor hover:underline">
              Política de Privacidad
            </Link>
            <Link to="/cumplimiento" className="text-biosensor hover:underline">
              Cumplimiento Min. Salud
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <HabeasDataConsent />
    </div>
  );
}
