import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Stethoscope,
  Building2,
  Crown,
  Loader2,
  Heart,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { buildSeo } from "@/lib/seo";
import { toast } from "sonner";
import { PLAN_CATALOG, type PlanKey } from "@/lib/plans";
import { usePlan } from "@/hooks/use-plan";
import { useAppUser } from "@/hooks/use-app-user";

export const Route = createFileRoute("/planes")({
  head: () =>
    buildSeo({
      title: "Planes y precios",
      path: "/planes",
      description:
        "Un plan para cada historia humana. Desde gratis, Esencial $9.000, Pro $29.000 e Institución desde $99.000 COP/mes. Sin permanencia. Cancela cuando quieras.",
    }),
  component: PlansPage,
});

type DisplayPlan = {
  key: PlanKey;
  icon: typeof Stethoscope;
  tone: "bio" | "fuchsia" | "copper" | "muted";
  cta: string;
};

const DISPLAY: DisplayPlan[] = [
  { key: "free", icon: Heart, tone: "muted", cta: "Empezar gratis" },
  { key: "essential_monthly", icon: Sparkles, tone: "copper", cta: "Suscribirme por $9.000" },
  { key: "pro_monthly", icon: Stethoscope, tone: "bio", cta: "Activar Pro" },
  { key: "institution_monthly", icon: Building2, tone: "fuchsia", cta: "Hablar con ventas" },
];

const TONE: Record<string, string> = {
  bio: "border-biosensor/30 bg-biosensor/5 text-biosensor",
  fuchsia: "border-fuchsia-neural/40 bg-fuchsia-neural/5 text-fuchsia-neural",
  copper: "border-copper/30 bg-copper/5 text-copper",
  muted: "border-border bg-muted/40 text-muted-foreground",
};

function PlansPage() {
  const { user, loading: userLoading } = useAppUser({ requireAuth: false });
  const { plan: currentPlan, loading: planLoading } = usePlan(user?.id ?? null);
  const loading = userLoading || planLoading;
  const [acting, setActing] = useState<PlanKey | null>(null);

  const isCurrent = (key: PlanKey) => {
    if (!user) return false;
    if (key === "free") return currentPlan === "free";
    return currentPlan === key;
  };

  const choose = async (key: PlanKey) => {
    if (key === "free") {
      window.location.href = user ? "/dashboard" : "/auth";
      return;
    }
    if (key === "institution_monthly") {
      window.location.href =
        "mailto:hola@humanix.co?subject=Plan Institución Humanix (IPS)";
      return;
    }
    if (!user) {
      toast("Inicia sesión para activar tu plan", { description: "Te llevamos al login." });
      window.location.href = `/auth?redirect=${encodeURIComponent("/planes")}`;
      return;
    }
    setActing(key);
    try {
      const def = PLAN_CATALOG[key];
      const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
        body: { plan: key, amount: def.amountCOP, email: user.email },
      });
      if (error) throw error;
      const url =
        (data as { init_point?: string; sandbox_init_point?: string })?.init_point ??
        (data as { sandbox_init_point?: string })?.sandbox_init_point;
      if (!url) throw new Error("No se pudo iniciar el checkout.");
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al iniciar el pago");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <header className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-fuchsia-neural/10 text-fuchsia-neural border border-fuchsia-neural/30">
            <Crown className="h-3 w-3" /> Planes Humanix
          </span>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold">
            Un plan para cada historia humana.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pagos en pesos colombianos.{" "}
            <span className="font-semibold text-foreground">Sin permanencia.</span> Cancela cuando
            quieras.
          </p>
        </header>

        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISPLAY.map((d) => {
            const def = PLAN_CATALOG[d.key];
            const Icon = d.icon;
            const current = isCurrent(d.key);
            return (
              <Card
                key={d.key}
                className={`p-6 flex flex-col relative ${
                  def.highlight
                    ? "border-copper/50 shadow-[var(--shadow-elegant)] ring-1 ring-copper/20"
                    : ""
                }`}
              >
                {def.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full bg-copper text-white border border-copper/30 font-semibold whitespace-nowrap">
                    Más elegido
                  </span>
                )}
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${TONE[d.tone]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold">{def.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{def.audience}</p>
                <div className="mt-4">
                  <span className="text-3xl sm:text-4xl font-bold font-display">
                    {def.priceLabel}
                  </span>
                  {def.priceNote && (
                    <p className="text-sm text-muted-foreground mt-0.5">{def.priceNote}</p>
                  )}
                </div>
                <ul className="mt-5 space-y-2 text-sm flex-1">
                  {def.featuresLabel.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-biosensor mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={
                    def.highlight
                      ? "copper"
                      : d.tone === "fuchsia"
                        ? "hero"
                        : "outline"
                  }
                  disabled={loading || acting === d.key || current}
                  onClick={() => choose(d.key)}
                >
                  {acting === d.key && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {current ? "Tu plan actual" : d.cta}
                </Button>
              </Card>
            );
          })}
        </section>

        <section className="mt-14 rounded-2xl border border-border bg-card/95 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas algo a medida? Escríbenos a{" "}
            <a href="mailto:hola@humanix.co" className="text-biosensor underline">
              hola@humanix.co
            </a>{" "}
            y armamos un plan para tu IPS o clínica.
          </p>
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground mt-2 inline-block"
          >
            ← Volver al inicio
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
