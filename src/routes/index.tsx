import { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/humanix/Navbar";
import { Hero } from "@/components/humanix/Hero";
import { LiveSocialProof } from "@/components/humanix/LiveSocialProof";
import { TrustBar } from "@/components/humanix/TrustBar";
import { LiveMarketplaceMap } from "@/components/humanix/LiveMarketplaceMap";
import { AudienceSection } from "@/components/humanix/AudienceSection";
import { Footer } from "@/components/humanix/Footer";
import { HabeasDataConsent } from "@/components/humanix/HabeasDataConsent";
import { QuickCareWizard } from "@/components/humanix/QuickCareWizard";
import { LaunchBar } from "@/components/humanix/LaunchBar";

import { faqs } from "@/components/humanix/FAQ";
import * as seo from "@/lib/seo";
const { buildSeo, faqLd, SITE_NAME } = seo;
import heroImage from "@/assets/hero-humanix.webp";

// Below-the-fold: lazy to mejorar FCP/LCP
const TechSection = lazy(() =>
  import("@/components/humanix/TechSection").then((m) => ({ default: m.TechSection })),
);
const Testimonials = lazy(() =>
  import("@/components/humanix/Testimonials").then((m) => ({ default: m.Testimonials })),
);
const Pricing = lazy(() =>
  import("@/components/humanix/Pricing").then((m) => ({ default: m.Pricing })),
);
const FAQ = lazy(() => import("@/components/humanix/FAQ").then((m) => ({ default: m.FAQ })));
const CTA = lazy(() => import("@/components/humanix/CTA").then((m) => ({ default: m.CTA })));

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
      description:
        "Humanix conecta enfermeros, auxiliares y cuidadores con familias y clínicas de Colombia. Uber de salud con IA en tiempo real, verificación RETHUS y pagos inmediatos en Nequi y PSE.",
      extraLinks: [
        { rel: "preload", href: heroImage, as: "image", type: "image/webp", fetchPriority: "high" },
      ],
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
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Mapa en vivo · Talento humano en salud
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Profesionales (azul), familias (amarillo) e instituciones (fucsia) conectados ahora mismo.
                Toca un punto para ver el perfil. Regístrate para contactar.
              </p>
            </div>
            <a
              href="/auth"
              className="text-sm font-semibold text-biosensor hover:underline"
            >
              Crear cuenta gratis →
            </a>
          </div>
          <LiveMarketplaceMap preview height={360} />
        </section>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <TechSection />
          <Testimonials />
          <Pricing />
          <FAQ />
          <CTA />
        </Suspense>
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
