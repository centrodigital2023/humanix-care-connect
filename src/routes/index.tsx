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
import { FAQ, faqs } from "@/components/humanix/FAQ";
import { CTA } from "@/components/humanix/CTA";
import { Footer } from "@/components/humanix/Footer";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";
import { QuickCareWizard } from "@/components/humanix/QuickCareWizard";
import { LaunchBar } from "@/components/humanix/LaunchBar";
import * as seo from "@/lib/seo";
const { buildSeo, faqLd, SITE_NAME } = seo;

const HumanixAssistant = lazy(() =>
  import("@/components/humanix/HumanixAssistant").then((module) => ({
    default: module.HumanixAssistant,
  })),
);
const StickyCTA = lazy(() =>
  import("@/components/humanix/StickyCTA").then((module) => ({ default: module.StickyCTA })),
);

export const Route = createFileRoute("/")({
  head: () =>
    buildSeo({
      title: `${SITE_NAME} · Talento humano en salud para Colombia`,
      path: "/",
      appendSiteName: false,
    }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: seo.jsonLdString(faqLd(faqs)) }}
      />
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
