import { Suspense, lazy } from "react";
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
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";
import { QuickCareWizard } from "@/components/humanix/QuickCareWizard";
import { LaunchBar } from "@/components/humanix/LaunchBar";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const HumanixAssistant = lazy(() =>
  import("@/components/humanix/HumanixAssistant").then((module) => ({ default: module.HumanixAssistant })),
);
const StickyCTA = lazy(() =>
  import("@/components/humanix/StickyCTA").then((module) => ({ default: module.StickyCTA })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE_NAME} · Talento humano en salud para Colombia` },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: `${SITE_NAME} · Talento humano en salud para Colombia` },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
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
        <AudienceSection />
        <TechSection />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <HumanixAssistant persona="default" />
      </Suspense>
      <Suspense fallback={null}>
        <StickyCTA />
      </Suspense>
      <HabeasDataConsent />
    </div>
  );
}
