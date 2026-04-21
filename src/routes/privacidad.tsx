import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad · Humanix Colombia" },
      {
        name: "description",
        content:
          "Política de privacidad y tratamiento de datos personales de Humanix. Cumplimiento Ley 1581 de 2012 y Decreto 1377 de 2013.",
      },
      { property: "og:title", content: "Política de Privacidad · Humanix Colombia" },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <section className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="font-display text-4xl font-bold">Política de Privacidad</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última actualización: 1 de enero de 2025
          </p>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Humanix Colombia S.A.S. (en adelante "Humanix"), en cumplimiento de la Ley 1581 de 2012
            de Protección de Datos Personales y el Decreto 1377 de 2013, informa a sus usuarios
            sobre la política de tratamiento de sus datos personales.
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                1. Responsable del tratamiento
              </h2>
              <p className="text-muted-foreground">
                <strong>Humanix Colombia S.A.S.</strong>
                <br />
                NIT: En trámite de constitución
                <br />
                Dirección: Bogotá, D.C., Colombia
                <br />
                Correo:{" "}
                <a href="mailto:datos@humanix.co" className="text-biosensor underline">
                  datos@humanix.co
                </a>
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                2. Datos personales recopilados
              </h2>
              <p className="text-muted-foreground mb-2">
                Humanix puede recopilar los siguientes datos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Datos de identificación: nombre, cédula de ciudadanía, fecha de nacimiento.</li>
                <li>Datos de contacto: correo electrónico, número de teléfono, dirección.</li>
                <li>
                  Datos profesionales: número RETHUS, especialidad, certificaciones y experiencia
                  laboral.
                </li>
                <li>
                  Datos de geolocalización: ubicación en tiempo real durante la prestación de
                  servicios.
                </li>
                <li>Datos biométricos: fotografía facial para verificación de identidad.</li>
                <li>
                  Datos financieros: información de cuentas bancarias para procesamiento de pagos.
                </li>
                <li>Datos de uso: actividad en la plataforma, preferencias y calificaciones.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">
                3. Finalidades del tratamiento
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Verificar la identidad y credenciales de los usuarios.</li>
                <li>
                  Facilitar la conexión entre profesionales de salud, familias e instituciones.
                </li>
                <li>Procesar pagos y gestionar suscripciones.</li>
                <li>Enviar notificaciones relacionadas con el servicio.</li>
                <li>Mejorar los algoritmos de matching y los modelos de IA.</li>
                <li>Cumplir con obligaciones legales y regulatorias.</li>
                <li>Prevenir el fraude y garantizar la seguridad de la plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">4. Derechos del titular</h2>
              <p className="text-muted-foreground mb-2">
                De conformidad con la Ley 1581 de 2012, el titular de los datos tiene los siguientes
                derechos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>
                  <strong>Conocer</strong> los datos personales almacenados.
                </li>
                <li>
                  <strong>Actualizar y rectificar</strong> datos inexactos o incompletos.
                </li>
                <li>
                  <strong>Solicitar la supresión</strong> cuando el tratamiento no respete los
                  principios legales.
                </li>
                <li>
                  <strong>Revocar la autorización</strong> otorgada para el tratamiento.
                </li>
                <li>
                  <strong>Acceder gratuitamente</strong> a los datos tratados.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Para ejercer estos derechos, escribe a{" "}
                <a href="mailto:datos@humanix.co" className="text-biosensor underline">
                  datos@humanix.co
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">5. Transferencia de datos</h2>
              <p className="text-muted-foreground">
                Humanix puede compartir datos con proveedores de servicios tecnológicos
                (procesadores de pago, servicios de nube, verificación de identidad) bajo estrictos
                acuerdos de confidencialidad. No vendemos datos personales a terceros. Podemos
                compartir información con autoridades competentes cuando sea requerido por ley.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">6. Seguridad de los datos</h2>
              <p className="text-muted-foreground">
                Implementamos medidas técnicas y administrativas para proteger los datos personales,
                incluyendo cifrado en tránsito y en reposo, controles de acceso basados en roles y
                auditorías periódicas de seguridad.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold mb-3">7. Vigencia</h2>
              <p className="text-muted-foreground">
                Los datos serán tratados durante la vigencia de la relación contractual y por el
                tiempo adicional requerido por obligaciones legales. Una vez cumplido el propósito
                del tratamiento, los datos serán eliminados de forma segura.
              </p>
            </section>
          </div>

          <div className="mt-12 flex flex-wrap gap-4 text-sm">
            <Link to="/terminos" className="text-biosensor hover:underline">
              Términos y Condiciones
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
