import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/humanix/ContentPage";
import { Building2 } from "lucide-react";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/sobre")({
  head: () =>
    buildSeo({
      title: "Sobre Humanix · Plataforma de Salud en Colombia",
      path: "/sobre",
      description:
        "Conoce Humanix, la plataforma que conecta profesionales de salud verificados con familias y clínicas en Colombia.",
    }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <ContentPage
      icon={Building2}
      badge="Nosotros"
      title={
        <>
          Sobre <span className="text-gradient-bio">Humanix</span>
        </>
      }
      description="Humanix es la plataforma tecnológica que conecta profesionales de salud verificados con familias y clínicas en Colombia, transformando el acceso a la atención médica de calidad."
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Nuestra Misión</h2>
          <p className="text-muted-foreground leading-relaxed">
            Democratizar el acceso a profesionales de salud verificados y de confianza, permitiendo que familias colombianas reciban atención médica de calidad desde cualquier lugar, en el momento en que la necesitan.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Nuestra Visión</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ser la red de salud más confiable y eficiente de Latinoamérica, donde profesionales médicos pueden dedicarse a lo que aman mientras que familias y clínicas acceden a cuidado integral con confianza.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Nuestros Valores</h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-biosensor font-bold">✓</span>
              <div>
                <strong>Confianza</strong>
                <p className="text-muted-foreground text-sm">Verificamos a cada profesional y protegemos los datos de nuestros usuarios.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-biosensor font-bold">✓</span>
              <div>
                <strong>Accesibilidad</strong>
                <p className="text-muted-foreground text-sm">Hacemos la salud de calidad accesible a todos los colombianos.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-biosensor font-bold">✓</span>
              <div>
                <strong>Innovación</strong>
                <p className="text-muted-foreground text-sm">Usamos tecnología para mejorar continuamente la experiencia de salud.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-biosensor font-bold">✓</span>
              <div>
                <strong>Impacto Social</strong>
                <p className="text-muted-foreground text-sm">Generamos empleo digno para profesionales y mejor bienestar para familias.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-biosensor/5 border border-biosensor/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">¿Por Qué Humanix?</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <li className="flex gap-2">
              <span className="text-biosensor">→</span>
              <span>Verificación rigurosa de todos los profesionales</span>
            </li>
            <li className="flex gap-2">
              <span className="text-biosensor">→</span>
              <span>Disponibilidad 24/7 para emergencias</span>
            </li>
            <li className="flex gap-2">
              <span className="text-biosensor">→</span>
              <span>Protección de datos con estándares internacionales</span>
            </li>
            <li className="flex gap-2">
              <span className="text-biosensor">→</span>
              <span>Precios justos y transparentes</span>
            </li>
            <li className="flex gap-2">
              <span className="text-biosensor">→</span>
              <span>Seguimiento integral del paciente</span>
            </li>
            <li className="flex gap-2">
              <span className="text-biosensor">→</span>
              <span>Integración con sistemas médicos</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Nuestro Equipo</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Humanix está conformado por expertos en medicina, tecnología, y emprendimiento social con la misión común de transformar el acceso a la salud en Colombia.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Contamos con profesionales certificados, mentores de universidades líderes, y el respaldo de inversionistas que creen en nuestro impacto social.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-muted-foreground text-center">
            ¿Quieres ser parte de nuestra misión? <a href="/carreras" className="text-biosensor font-medium hover:underline">Únete a nuestro equipo</a> o <a href="/contacto" className="text-biosensor font-medium hover:underline">contáctanos</a>.
          </p>
        </div>
      </div>
    </ContentPage>
  );
}
