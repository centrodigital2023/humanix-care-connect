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
import { AdBanner } from "@/components/humanix/AdBanner";
import { useActiveUsersCount } from "@/hooks/use-active-users-count";

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
  const { professionals, families, institutions, loading: countsLoading } = useActiveUsersCount();
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
        <section className="relative overflow-hidden border-y border-foreground/5 bg-gradient-to-b from-card/70 via-background to-background py-8 sm:py-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-biosensor/50 to-transparent" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-biosensor/25 bg-biosensor/10 px-3 py-1 text-[11px] font-semibold uppercase text-biosensor">
                  <span className="h-1.5 w-1.5 rounded-full bg-biosensor animate-pulse" />
                  Sincronizado en tiempo real
                </div>
                <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold leading-tight text-gradient-cyber">
                  Mapa en vivo · Talento humano en salud
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
                  Profesionales activos, familias e instituciones conectados ahora mismo. Toca un
                  punto para ver perfil, distancia, calificación y canales de contacto.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 font-medium">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    Profesionales
                    {!countsLoading && professionals > 0 && (
                      <span className="font-bold text-blue-600">{professionals}</span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-copper/25 bg-copper/10 px-2.5 py-1 font-medium">
                    <span className="h-2 w-2 rounded-full bg-copper animate-pulse" />
                    Familias
                    {!countsLoading && families > 0 && (
                      <span className="font-bold text-copper">{families}</span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-neural/25 bg-fuchsia-neural/10 px-2.5 py-1 font-medium">
                    <span className="h-2 w-2 rounded-sm bg-fuchsia-neural animate-pulse" />
                    Instituciones
                    {!countsLoading && institutions > 0 && (
                      <span className="font-bold text-fuchsia-neural">{institutions}</span>
                    )}
                  </span>
                </div>
                <a
                  href="/auth"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-biosensor px-4 text-sm font-semibold text-biosensor-foreground shadow-[var(--shadow-glow-bio)] transition hover:-translate-y-0.5 hover:bg-biosensor/90"
                >
                  Crear cuenta gratis →
                </a>
              </div>
            </div>
            <LiveMarketplaceMap preview height={360} />
          </div>
        </section>
        {/* Ad slot between map and audience sections */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <AdBanner slot="homepage-mid" adsenseSlot="1234567890" size="leaderboard" dismissible />
        </section>
        <AudienceSection />
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
