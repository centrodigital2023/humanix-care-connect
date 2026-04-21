import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones · Humanix Colombia" },
      {
        name: "description",
        content:
          "Términos y condiciones de uso de la plataforma Humanix. Conoce tus derechos y obligaciones como usuario, profesional de salud o institución.",
      },
      { property: "og:title", content: "Términos y Condiciones · Humanix Colombia" },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="font-display text-4xl font-bold">Términos y Condiciones</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última actualización: 1 de enero de 2025
          </p>

          <div className="mt-10 prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                1. Aceptación de los términos
              </h2>
              <p className="text-muted-foreground">
                Al acceder y utilizar la plataforma Humanix (en adelante "la Plataforma"), el
                usuario acepta quedar vinculado por los presentes Términos y Condiciones, la
                Política de Privacidad y el aviso de Habeas Data. Si no está de acuerdo con alguno
                de estos términos, debe abstenerse de usar la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                2. Descripción del servicio
              </h2>
              <p className="text-muted-foreground">
                Humanix es una plataforma digital colombiana que facilita la conexión entre
                profesionales de la salud (enfermeros, auxiliares, cuidadores) y familias o
                instituciones de salud (IPS, clínicas, hospitales). Humanix actúa como intermediario
                tecnológico y no es empleador de los profesionales registrados en la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                3. Registro y cuenta de usuario
              </h2>
              <p className="text-muted-foreground">
                Para utilizar las funcionalidades completas de la Plataforma, el usuario debe crear
                una cuenta proporcionando información verídica y actualizada. El usuario es
                responsable de mantener la confidencialidad de sus credenciales de acceso. Humanix
                se reserva el derecho de suspender o cancelar cuentas que incumplan estos Términos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                4. Verificación de credenciales
              </h2>
              <p className="text-muted-foreground">
                Los profesionales de salud registrados deben proporcionar cédula colombiana válida y
                número de registro en el Sistema de Información del Registro del Talento Humano en
                Salud (RETHUS). Humanix realiza verificaciones automatizadas pero no garantiza la
                exactitud de la información oficial de terceros. La falsificación de credenciales
                conlleva la suspensión inmediata de la cuenta y puede ser reportada a las
                autoridades competentes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">5. Pagos y comisiones</h2>
              <p className="text-muted-foreground">
                Los pagos entre familias/instituciones y profesionales se procesan a través de
                pasarelas de pago habilitadas (Mercado Pago, PSE, Nequi). Humanix cobra una comisión
                de plataforma según el plan activo del usuario. Los precios están expresados en
                Pesos Colombianos (COP) e incluyen IVA cuando aplica.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">6. Responsabilidad</h2>
              <p className="text-muted-foreground">
                Humanix no es responsable por los servicios médicos o de cuidado prestados por los
                profesionales registrados. La Plataforma facilita la conexión pero no supervisa la
                prestación del servicio. El usuario contrata directamente con el profesional o
                institución. Humanix no responde por daños directos, indirectos o perjuicios
                derivados del uso de los servicios de terceros.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">7. Propiedad intelectual</h2>
              <p className="text-muted-foreground">
                Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo código
                fuente, diseño, logotipos y contenido, son propiedad exclusiva de Humanix Colombia
                S.A.S. Queda prohibida la reproducción, distribución o modificación sin autorización
                expresa y escrita.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">8. Modificaciones</h2>
              <p className="text-muted-foreground">
                Humanix puede modificar estos Términos en cualquier momento. Los cambios entrarán en
                vigencia a partir de su publicación en la Plataforma. El uso continuado de la
                Plataforma tras la publicación de los cambios implica la aceptación de los nuevos
                Términos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                9. Ley aplicable y jurisdicción
              </h2>
              <p className="text-muted-foreground">
                Estos Términos se rigen por las leyes de la República de Colombia. Cualquier
                controversia será sometida a la jurisdicción de los jueces y tribunales de la ciudad
                de Bogotá, D.C.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">10. Contacto</h2>
              <p className="text-muted-foreground">
                Para consultas sobre estos Términos, escribe a{" "}
                <a href="mailto:legal@humanix.co" className="text-biosensor underline">
                  legal@humanix.co
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-12 flex flex-wrap gap-4 text-sm">
            <Link to="/privacidad" className="text-biosensor hover:underline">
              Política de Privacidad
            </Link>
            <Link to="/habeas-data" className="text-biosensor hover:underline">
              Habeas Data
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
