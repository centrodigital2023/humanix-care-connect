import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/humanix/Navbar";
import { Hero } from "@/components/humanix/Hero";
import { LiveSocialProof } from "@/components/humanix/LiveSocialProof";
import { TrustBar } from "@/components/humanix/TrustBar";
import { AudienceSection } from "@/components/humanix/AudienceSection";
import { TechSection } from "@/components/humanix/TechSection";
import { Testimonials } from "@/components/humanix/Testimonials";
import { Pricing } from "@/components/humanix/Pricing";
import { FAQ } from "@/components/humanix/FAQ";
import { CTA } from "@/components/humanix/CTA";
import { Footer } from "@/components/humanix/Footer";
import { HumanixAssistant } from "@/components/humanix/HumanixAssistant";
import { StickyCTA } from "@/components/humanix/StickyCTA";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";
import { QuickCareWizard } from "@/components/humanix/QuickCareWizard";
import { LaunchBar } from "@/components/humanix/LaunchBar";
import { HealthMarketplaceViz } from "@/components/humanix/HealthMarketplaceViz";
import { FourModalitiesShowcase } from "@/components/humanix/FourModalitiesShowcase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Humanix · Talento humano en salud para Colombia" },
      {
        name: "description",
        content:
          "Humanix conecta enfermeros, auxiliares y cuidadores con familias y clínicas de Colombia. Uber de salud con IA en tiempo real, verificación RETHUS y pagos inmediatos en Nequi y PSE.",
      },
      { property: "og:title", content: "Humanix · Talento humano en salud para Colombia" },
      {
        property: "og:description",
        content:
          "Plataforma premium de salud: Uber-like marketplace de talento humano. Match en menos de 150 ms, geolocalización en vivo y pagos inmediatos.",
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
      <LaunchBar />
      <Navbar />
      <main>
        <Hero />
        <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-10 sm:-mt-16 relative z-10">
          <QuickCareWizard />
        </section>
        <LiveSocialProof />
        <TrustBar />
        <HealthMarketplaceViz />
        <FourModalitiesShowcase />
        <AudienceSection />
        <TechSection />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <HumanixAssistant persona="default" />
      <StickyCTA />
      <HabeasDataConsent />
    </div>
  );
}
