import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/humanix/LegalPage";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones · Humanix Colombia" },
      {
        name: "description",
        content:
          "Términos y condiciones de uso de la plataforma Humanix para profesionales de la salud, familias y clínicas en Colombia.",
      },
      { property: "og:title", content: "Términos y Condiciones · Humanix" },
      {
        property: "og:description",
        content:
          "Reglas de uso, responsabilidades, pagos y resolución de disputas en Humanix Colombia.",
      },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  return (
    <LegalPage
      badge="Legal"
      title={<>Términos y <span className="text-gradient-bio">Condiciones</span></>}
      updatedAt="21 de abril de 2026"
      intro="Estos Términos regulan el acceso y uso de la plataforma Humanix Colombia S.A.S. por parte de profesionales de la salud, familias y entidades de salud."
    >
      <LegalSection title="1. Aceptación">
        <p>
          Al registrarte en Humanix aceptas estos Términos, nuestra Política de Privacidad y la
          Autorización de Tratamiento de Datos (Habeas Data) bajo la <strong>Ley 1581 de 2012</strong> y
          el Decreto 1377 de 2013.
        </p>
      </LegalSection>
      <LegalSection title="2. Naturaleza del servicio">
        <p>
          Humanix es una plataforma tecnológica que conecta profesionales de salud verificados con
          familias y clínicas. <strong>No prestamos servicios médicos directamente</strong>; actuamos
          como intermediarios tecnológicos.
        </p>
      </LegalSection>
      <LegalSection title="3. Verificación RETHUS">
        <p>
          Todo profesional debe acreditar su inscripción vigente en el{" "}
          <strong>Registro Único Nacional del Talento Humano en Salud (RETHUS)</strong> del Ministerio
          de Salud y Protección Social, salvo excepciones válidas (cuidadores no regulados).
        </p>
      </LegalSection>
      <LegalSection title="4. Pagos y comisiones">
        <p>
          Los pagos se procesan mediante PSE, Nequi y otras pasarelas habilitadas. Humanix retiene
          una comisión informada al momento de aceptar cada servicio. Los profesionales son
          responsables de sus obligaciones tributarias y de seguridad social.
        </p>
      </LegalSection>
      <LegalSection title="5. Cancelaciones y reembolsos">
        <p>
          Las cancelaciones con más de 12 horas de antelación no generan cobro. Cancelaciones
          tardías o inasistencias pueden generar penalidades según las políticas vigentes en el
          dashboard.
        </p>
      </LegalSection>
      <LegalSection title="6. Conducta y suspensión">
        <p>
          Humanix puede suspender o cancelar cuentas que incurran en fraude documental,
          discriminación, suplantación o incumplimientos graves. La detección anti-fraude usa IA
          auditable.
        </p>
      </LegalSection>
      <LegalSection title="7. Limitación de responsabilidad">
        <p>
          Humanix no responde por la calidad clínica del servicio prestado por terceros. Cada
          profesional es responsable de su práctica conforme a la Ley 911 de 2004 y demás normas
          aplicables.
        </p>
      </LegalSection>
      <LegalSection title="8. Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia
          se someterá a los jueces de Bogotá D.C., salvo disposición legal en contrario.
        </p>
      </LegalSection>
      <LegalSection title="9. Contacto">
        <p>
          Humanix Colombia S.A.S. · NIT pendiente · Bogotá D.C. ·{" "}
          <a href="mailto:legal@humanix.co" className="text-foreground underline underline-offset-4">
            legal@humanix.co
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}