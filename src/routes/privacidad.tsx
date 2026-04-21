import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/humanix/LegalPage";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad · Humanix Colombia" },
      {
        name: "description",
        content:
          "Cómo recopilamos, usamos y protegemos tus datos personales en Humanix, según la Ley 1581 de 2012 de Colombia.",
      },
      { property: "og:title", content: "Política de Privacidad · Humanix" },
      {
        property: "og:description",
        content:
          "Tratamiento de datos personales, finalidades, derechos del titular y medidas de seguridad en Humanix.",
      },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  return (
    <LegalPage
      badge="Privacidad"
      title={<>Política de <span className="text-gradient-bio">Privacidad</span></>}
      updatedAt="21 de abril de 2026"
      intro="Humanix Colombia S.A.S. respeta tu privacidad y trata tus datos personales conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y la Circular 002 de 2015 de la SIC."
    >
      <LegalSection title="1. Responsable del tratamiento">
        <p>
          Humanix Colombia S.A.S., con domicilio en Bogotá D.C., es el responsable del tratamiento
          de los datos personales recolectados a través de sus plataformas web y móvil.
        </p>
      </LegalSection>
      <LegalSection title="2. Datos que recolectamos">
        <p>
          Datos de identificación (nombre, cédula), contacto (correo, teléfono), datos profesionales
          (RETHUS, especialidad, certificaciones), geolocalización durante servicios activos, datos
          de pago tokenizados y métricas de uso de la plataforma.
        </p>
      </LegalSection>
      <LegalSection title="3. Finalidades">
        <p>
          (i) Conectar profesionales con familias y clínicas; (ii) verificar identidad y
          credenciales; (iii) procesar pagos; (iv) prevenir fraude mediante IA; (v) mejorar el
          servicio; (vi) cumplir obligaciones legales y regulatorias.
        </p>
      </LegalSection>
      <LegalSection title="4. Datos sensibles">
        <p>
          Algunos datos (salud, biometría facial para verificación) son sensibles. Su tratamiento
          requiere autorización expresa, libre e informada del titular y se realiza con cifrado en
          tránsito y en reposo.
        </p>
      </LegalSection>
      <LegalSection title="5. Transferencias y encargados">
        <p>
          Trabajamos con encargados internacionales (Lovable Cloud / Supabase, pasarelas de pago,
          proveedores de IA) que cumplen estándares equivalentes o superiores a los exigidos en
          Colombia. No vendemos tus datos.
        </p>
      </LegalSection>
      <LegalSection title="6. Derechos del titular">
        <p>
          Puedes ejercer tus derechos de <strong>acceso, rectificación, actualización, supresión y
          revocatoria</strong> escribiendo a{" "}
          <a href="mailto:datos@humanix.co" className="text-foreground underline underline-offset-4">
            datos@humanix.co
          </a>
          . Responderemos en los términos del artículo 14 de la Ley 1581.
        </p>
      </LegalSection>
      <LegalSection title="7. Conservación">
        <p>
          Conservamos los datos mientras exista una relación contractual y por los términos legales
          posteriores (obligaciones tributarias, contables y de salud pública).
        </p>
      </LegalSection>
      <LegalSection title="8. Seguridad">
        <p>
          Aplicamos cifrado TLS 1.3, controles de acceso por roles (RLS), auditoría de eventos y
          pruebas periódicas de seguridad. Reportamos incidentes a la SIC dentro de los plazos
          legales.
        </p>
      </LegalSection>
    </LegalPage>
  );
}