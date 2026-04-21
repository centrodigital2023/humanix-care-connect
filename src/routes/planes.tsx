import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Stethoscope, Heart, Building2, Crown, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { toast } from "sonner";

export const Route = createFileRoute("/planes")({
  head: () => ({
    meta: [
      { title: "Planes y precios · Humanix" },
      {
        name: "description",
        content:
          "Plan Esencial Humanix: $9.000 COP/mes para familias y profesionales. Sin comisiones por servicio: el profesional cobra directo.",
      },
      { property: "og:title", content: "Planes y precios · Humanix" },
      {
        property: "og:description",
        content:
          "Plan Esencial $9.000 COP/mes. Pagos Mercado Pago. El profesional cobra directo al cliente.",
      },
    ],
  }),
  component: PlansPage,
});

type PlanKey = "free" | "essential" | "pro" | "institution";

const PLANS: {
  key: PlanKey;
  name: string;
  price: string;
  cycle: string;
  audience: string;
  icon: typeof Sparkles;
  tone: "bio" | "fuchsia" | "copper" | "cyber";
  highlight?: boolean;
  features: string[];
  cta: string;
  /** Monto en COP para Mercado Pago. 0 si no aplica. */
  amount: number;
}[] = [
  {
    key: "free",
    name: "Free",
    price: "COP 0",
    cycle: "siempre",
    audience: "Para conocer Humanix sin compromiso.",
    icon: Sparkles,
    tone: "bio",
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
    key: "essential",
    name: "Esencial",
    price: "COP 9.000",
    cycle: "/mes",
    audience: "Familias y profesionales que quieren todo activo.",
    icon: Zap,
    tone: "copper",
    highlight: true,
    amount: 9000,
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
    price: "COP 29.900",
    cycle: "/mes",
    audience: "Profesionales que quieren visibilidad máxima.",
    icon: Stethoscope,
    tone: "fuchsia",
    amount: 29900,
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
    key: "institution",
    name: "Institución (IPS)",
    price: "Desde COP 299.000",
    cycle: "/mes",
    audience: "Clínicas, hospitales y agencias de cuidado.",
    icon: Building2,
    tone: "cyber",
    amount: 299000,
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
  cyber: "border-cyber/30 bg-cyber/5 text-cyber dark:text-cyber-foreground",
};

function PlansPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<PlanKey | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setLoading(false);
        return;
      }
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

  const choose = async (plan: PlanKey, amount: number) => {
    if (plan === "free") {
      toast.success("Ya tienes acceso gratuito a Humanix.");
      return;
    }
    if (plan === "institution") {
      window.location.href = "mailto:hola@humanix.co?subject=Plan Institucional Humanix";
      return;
    }
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
          plan: plan === "essential" ? "essential_monthly" : "pro_monthly",
          amount,
          email: sess.session.user.email,
        },
      });
      if (error) throw error;

      const url =
        (data as { init_point?: string; sandbox_init_point?: string })?.init_point ??
        (data as { sandbox_init_point?: string })?.sandbox_init_point;
      if (!url) throw new Error("No se pudo iniciar el checkout de Mercado Pago.");
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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <header className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-fuchsia-neural/10 text-fuchsia-neural border border-fuchsia-neural/30">
            <Crown className="h-3 w-3" /> Planes Humanix
          </span>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold">
            La IA que trabaja para ti.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Plan Esencial desde <span className="font-semibold text-copper">$9.000 COP/mes</span>.
            Sin comisiones por servicio: el profesional cobra directo al cliente en efectivo, Nequi
            o transferencia.
          </p>
        </header>

        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const isCurrent =
              currentPlan === p.key ||
              (p.key === "essential" && currentPlan === "essential_monthly") ||
              (p.key === "pro" && currentPlan === "pro_monthly");
            return (
              <Card
                key={p.key}
                className={`p-6 flex flex-col ${
                  p.highlight
                    ? "border-copper/50 shadow-[var(--shadow-elegant)] ring-1 ring-copper/20"
                    : ""
                }`}
              >
                {p.highlight && (
                  <span className="self-start inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-copper/10 text-copper border border-copper/30 mb-3">
                    Más recomendado
                  </span>
                )}
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${TONE[p.tone]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold">{p.name}</h2>
                <p className="text-xs text-muted-foreground">{p.audience}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-display">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.cycle}</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-biosensor mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={p.highlight ? "copper" : "outline"}
                  disabled={loading || acting === p.key || isCurrent}
                  onClick={() => choose(p.key, p.amount)}
                >
                  {acting === p.key && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isCurrent ? "Tu plan actual" : p.cta}
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
            y armamos un plan para tu IPS.
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
