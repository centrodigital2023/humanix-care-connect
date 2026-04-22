import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/humanix/LegalPage";
import { BreadcrumbJsonLd } from "@/components/humanix/BreadcrumbJsonLd";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/habeas-data")({
  head: () =>
    buildSeo({
      title: "Habeas Data · Colombia",
      path: "/habeas-data",
      description:
        "Autorización para el tratamiento de datos personales según la Ley 1581 de 2012 y el Decreto 1377 de 2013.",
    }),
  component: HabeasDataPage,
});

function HabeasDataPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", path: "/" },
          { name: "Habeas Data", path: "/habeas-data" },
        ]}
      />
    <LegalPage
      badge="Habeas Data"
      title={
        <>
          Autorización <span className="text-gradient-bio">Habeas Data</span>
        </>
      }
      updatedAt="21 de abril de 2026"
      intro="En cumplimiento de la Ley Estatutaria 1581 de 2012, su Decreto Reglamentario 1377 de 2013 y la Circular 002 de 2015 de la Superintendencia de Industria y Comercio."
    >
      <LegalSection title="1. Autorización">
        <p>
          Al marcar la casilla de aceptación o continuar usando Humanix, autorizas de manera previa,
          expresa, libre e informada a <strong>Humanix Colombia S.A.S.</strong> para recolectar,
          almacenar, usar, circular, suprimir, procesar y transmitir tus datos personales con las
          finalidades aquí descritas.
        </p>
      </LegalSection>
      <LegalSection title="2. Finalidades específicas">
        <p>
          (a) Crear y administrar tu cuenta; (b) verificar tu identidad y credenciales (cruce con
          RETHUS, Registraduría); (c) facilitar la conexión profesional/familia; (d) procesar pagos
          y facturación electrónica DIAN; (e) enviar notificaciones operativas y comerciales (con
          opción de retiro); (f) realizar análisis estadístico y mejora del servicio; (g) prevenir
          fraude mediante modelos de IA auditables.
        </p>
      </LegalSection>
      <LegalSection title="3. Datos sensibles y de menores">
        <p>
          Reconozco que el suministro de datos sensibles (salud, biometría) y de menores es
          facultativo y autorizo su tratamiento únicamente para las finalidades de prestación segura
          del servicio.
        </p>
      </LegalSection>
      <LegalSection title="4. Tus derechos">
        <p>
          Como titular tienes derecho a: (i) <strong>conocer</strong> tus datos; (ii){" "}
          <strong>actualizar y rectificar</strong> datos parciales, inexactos o que induzcan a
          error; (iii) <strong>solicitar prueba</strong> de la autorización; (iv) ser informado del
          uso; (v) presentar quejas ante la <strong>SIC</strong>; (vi) revocar la autorización y/o
          solicitar la supresión cuando no exista deber legal de conservar.
        </p>
      </LegalSection>
      <LegalSection title="5. Canales para ejercer tus derechos">
        <p>
          Correo:{" "}
          <a
            href="mailto:datos@humanix.co"
            className="text-foreground underline underline-offset-4"
          >
            datos@humanix.co
          </a>{" "}
          · WhatsApp Business: +57 300 000 0000 · Tiempo de respuesta: hasta 15 días hábiles
          (consultas) o 15 días hábiles prorrogables 8 días más (reclamos).
        </p>
      </LegalSection>
      <LegalSection title="6. Vigencia">
        <p>
          La autorización tiene vigencia mientras exista vínculo contractual y por el término
          adicional necesario para cumplir obligaciones legales, contables y regulatorias.
        </p>
      </LegalSection>
    </LegalPage>
    </>
  );
}
