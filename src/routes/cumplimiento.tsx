import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/humanix/LegalPage";

export const Route = createFileRoute("/cumplimiento")({
  head: () => ({
    meta: [
      { title: "Cumplimiento Min. Salud · Humanix Colombia" },
      {
        name: "description",
        content:
          "Cómo Humanix cumple con la normatividad del Ministerio de Salud y Protección Social de Colombia: RETHUS, Resolución 3100, habilitación y más.",
      },
      { property: "og:title", content: "Cumplimiento Min. Salud · Humanix" },
      {
        property: "og:description",
        content:
          "Marco normativo, RETHUS, Ley 911, Resolución 3100 y estándares de calidad aplicados en Humanix.",
      },
    ],
  }),
  component: CumplimientoPage,
});

function CumplimientoPage() {
  return (
    <LegalPage
      badge="Min. Salud"
      title={<>Cumplimiento <span className="text-gradient-bio">Min. Salud</span></>}
      updatedAt="21 de abril de 2026"
      intro="Humanix opera bajo el marco normativo del Sistema General de Seguridad Social en Salud (SGSSS) de Colombia y promueve la práctica segura del talento humano en salud."
    >
      <LegalSection title="1. RETHUS — Resolución 3030 de 2014">
        <p>
          Todo profesional de la salud que ofrece servicios en Humanix debe estar inscrito y vigente
          en el <strong>Registro Único Nacional del Talento Humano en Salud (RETHUS)</strong>. La
          plataforma cruza automáticamente el número RETHUS con la base oficial del Ministerio de
          Salud y Protección Social.
        </p>
      </LegalSection>
      <LegalSection title="2. Ley 911 de 2004 — Ética en Enfermería">
        <p>
          Los profesionales de enfermería que usan Humanix se obligan a cumplir la Ley 911 de 2004
          (Código Deontológico) y son responsables disciplinariamente ante el Tribunal Nacional
          Ético de Enfermería.
        </p>
      </LegalSection>
      <LegalSection title="3. Resolución 3100 de 2019 — Habilitación">
        <p>
          Cuando Humanix opere con clínicas o IPS, exige verificación del Registro Especial de
          Prestadores de Servicios de Salud (REPS) y el cumplimiento de los estándares de
          habilitación de la Resolución 3100 de 2019.
        </p>
      </LegalSection>
      <LegalSection title="4. Resolución 2003 de 2014 y atención domiciliaria">
        <p>
          Para servicios de atención en casa, los profesionales se ajustan a las recomendaciones de
          atención domiciliaria del Ministerio y a los protocolos de bioseguridad vigentes.
        </p>
      </LegalSection>
      <LegalSection title="5. Seguridad del paciente">
        <p>
          Adoptamos los lineamientos de la <strong>Política de Seguridad del Paciente</strong> y
          mantenemos un canal de reporte de eventos adversos accesible 24/7 desde la app.
        </p>
      </LegalSection>
      <LegalSection title="6. Facturación electrónica">
        <p>
          Todos los pagos generan factura electrónica conforme a la <strong>Resolución 000042 de
          2020</strong> de la DIAN. Los profesionales independientes pueden delegar en Humanix la
          emisión de documento equivalente.
        </p>
      </LegalSection>
      <LegalSection title="7. SST y aportes">
        <p>
          Humanix promueve la afiliación al Sistema de Seguridad Social Integral. Los profesionales
          independientes son responsables del pago de salud, pensión y ARL conforme a la Ley 100 de
          1993 y el Decreto 1273 de 2018.
        </p>
      </LegalSection>
      <LegalSection title="8. Reporte y auditoría">
        <p>
          Mantenemos trazabilidad auditable de cada servicio, valoración y pago, disponible para
          requerimientos de la Superintendencia Nacional de Salud y demás autoridades competentes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}