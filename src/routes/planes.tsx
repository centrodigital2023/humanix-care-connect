import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Stethoscope, Building2, Crown, Loader2, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { buildSeo } from "@/lib/seo";
import { toast } from "sonner";

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

type PlanKey = "free" | "esencial" | "pro" | "institucion";

const PLANS: {
  key: PlanKey;
  name: string;
  priceLabel: string;
  priceNote: string;
  audience: string;
  icon: typeof Stethoscope;
  tone: "bio" | "fuchsia" | "copper" | "muted";
  highlight?: boolean;
  features: string[];
  cta: string;
  amount: number;
  dbPlan?: string; // para mapear con mp_subscriptions.plan / subscriptions.plan
}[] = [
  {
    key: "free",
    name: "Free",
    priceLabel: "COP 0",
    priceNote: "siempre",
    audience: "Para conocer Humanix sin compromiso.",
    icon: Heart,
    tone: "muted",
    amount: 0,
    features: [
      "Crear perfil profesional o familiar",
      "Buscar y aplicar a ofertas abiertas",
      "Asistente IA básico (preguntas generales)",
      "Mensajería 1:1 cuando se acepta una aplicación",
    ],
    cta: "Empezar gratis",
  },
  {
    key: "esencial",
    name: "Esencial",
    priceLabel: "COP 9.000",
    priceNote: "/mes",
    audience: "Familias y profesionales que quieren todo activo.",
    icon: Sparkles,
    tone: "copper",
    highlight: true,
    amount: 9000,
    dbPlan: "essential_monthly",
    features: [
      "Match IA en menos de 150 ms",
      "Buzón de postulaciones ilimitado",
      "Contacto directo por WhatsApp con la otra parte",
      "Geolocalización en vivo y ETA",
      "Verificación RETHUS y anti-fraude IA incluida",
      "Sin comisión: el profesional cobra directo al cliente",
    ],
    cta: "Suscribirme por $9.000",
  },
  {
    key: "pro",
    name: "Pro Profesional",
    priceLabel: "COP 29.000",
    priceNote: "/mes",
    audience: "Profesionales que quieren visibilidad máxima.",
    icon: Stethoscope,
    tone: "bio",
    amount: 29000,
    dbPlan: "pro_monthly",
    features: [
      "Todo lo del Esencial",
      "Boost de visibilidad en búsquedas",
      "Coach de carrera 24/7 (mejorar perfil y Trust Score)",
      "Sugerencias IA en cada mensaje",
      "Validación anti-fraude IA prioritaria",
    ],
    cta: "Activar Pro",
  },
  {
    key: "institucion",
    name: "Institución (IPS)",
    priceLabel: "Desde COP 99.000",
    priceNote: "/mes",
    audience: "Clínicas, hospitales y agencias de cuidado.",
    icon: Building2,
    tone: "fuchsia",
    amount: 99000,
    dbPlan: "institution_monthly",
    features: [
      "Bolsa de créditos IA mensual",
      "Multi-usuario con roles (HR, evaluador, admin)",
      "Pipeline de candidatos con scoring IA",
      "Detección de inconsistencias en CVs y RETHUS",
      "Soporte prioritario y onboarding asistido",
    ],
    cta: "Hablar con ventas",
  },
];

const TONE: Record<string, string> = {
  bio: "border-biosensor/30 bg-biosensor/5 text-biosensor",
  fuchsia: "border-fuchsia-neural/40 bg-fuchsia-neural/5 text-fuchsia-neural",
  copper: "border-copper/30 bg-copper/5 text-copper",
  muted: "border-border bg-muted/40 text-muted-foreground",
};

function PlansPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<PlanKey | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setLoading(false);
        return;
      }
      setHasSession(true);
      const [subRes, mpRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", sess.session.user.id)
          .maybeSingle(),
        supabase
          .from("mp_subscriptions")
          .select("plan,status")
          .eq("user_id", sess.session.user.id)
          .maybeSingle(),
      ]);
      if (mpRes.data?.status === "active" || mpRes.data?.status === "approved") {
        setCurrentPlan(mpRes.data.plan);
      } else if (subRes.data?.plan) {
        setCurrentPlan(subRes.data.plan);
      }
      setLoading(false);
    })();
  }, []);

  const isCurrent = (p: (typeof PLANS)[number]) => {
    if (p.key === "free") return hasSession && !currentPlan;
    return currentPlan === p.dbPlan;
  };

  const choose = async (plan: PlanKey, amount: number, dbPlan?: string) => {
    if (plan === "free") {
      window.location.href = "/auth";
      return;
    }
    if (plan === "institucion") {
      window.location.href =
        "mailto:hola@humanix.co?subject=Plan Institución Humanix (IPS)";
      return;
    }
    // esencial | pro → checkout Mercado Pago
    setActing(plan);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast("Inicia sesión para activar tu plan", { description: "Te llevamos al login." });
        window.location.href = `/auth?redirect=${encodeURIComponent("/planes")}`;
        return;
      }
      const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
        body: {
          plan: dbPlan ?? "pro_monthly",
          amount,
          email: sess.session.user.email,
        },
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
            <span className="font-semibold text-foreground">Sin permanencia.</span>{" "}
            Cancela cuando quieras.
          </p>
        </header>

        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const current = isCurrent(p);
            return (
              <Card
                key={p.key}
                className={`p-6 flex flex-col relative ${
                  p.highlight
                    ? "border-copper/50 shadow-[var(--shadow-elegant)] ring-1 ring-copper/20"
                    : ""
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full bg-copper text-white border border-copper/30 font-semibold whitespace-nowrap">
                    Más elegido
                  </span>
                )}
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${TONE[p.tone]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold">{p.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{p.audience}</p>
                <div className="mt-4">
                  <span className="text-3xl sm:text-4xl font-bold font-display">
                    {p.priceLabel}
                  </span>
                  {p.priceNote && (
                    <p className="text-sm text-muted-foreground mt-0.5">{p.priceNote}</p>
                  )}
                </div>
                <ul className="mt-5 space-y-2 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-biosensor mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={
                    p.highlight
                      ? "copper"
                      : p.tone === "fuchsia"
                        ? "hero"
                        : p.tone === "muted"
                          ? "outline"
                          : "outline"
                  }
                  disabled={loading || acting === p.key || current}
                  onClick={() => choose(p.key, p.amount, p.dbPlan)}
                >
                  {acting === p.key && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {current ? "Tu plan actual" : p.cta}
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

