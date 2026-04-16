import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/humanix/Navbar";
import { Hero } from "@/components/humanix/Hero";
import { TrustBar } from "@/components/humanix/TrustBar";
import { AudienceSection } from "@/components/humanix/AudienceSection";
import { TechSection } from "@/components/humanix/TechSection";
import { Pricing } from "@/components/humanix/Pricing";
import { CTA } from "@/components/humanix/CTA";
import { Footer } from "@/components/humanix/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Humanix · Talento humano en salud para Colombia",
      },
      {
        name: "description",
        content:
          "Humanix conecta enfermeros, auxiliares y cuidadores con familias y clínicas de Colombia. IA en tiempo real, verificación RETHUS y pagos inmediatos en Nequi y PSE.",
      },
      { property: "og:title", content: "Humanix · Talento humano en salud para Colombia" },
      {
        property: "og:description",
        content:
          "Plataforma premium de salud con IA en tiempo real. Match en menos de 150 ms, geolocalización en vivo y pagos inmediatos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <AudienceSection />
        <TechSection />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
