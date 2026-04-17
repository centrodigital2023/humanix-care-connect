import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Stethoscope, Heart, Building2, Crown, Loader2 } from "lucide-react";
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
          "Planes Humanix: gratis, Pro Profesional, Familia e Institución. Matching IA, copiloto y créditos para escalar tu cuidado humano.",
      },
      { property: "og:title", content: "Planes y precios · Humanix" },
      {
        property: "og:description",
        content: "Elige el plan que activa la IA de Humanix: matching, copiloto y créditos.",
      },
    ],
  }),
  component: PlansPage,
});

type PlanKey = "free" | "pro" | "family" | "institution";

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
}[] = [
  {
    key: "free",
    name: "Free",
    price: "COP 0",
    cycle: "siempre",
    audience: "Para empezar y conocer Humanix.",
    icon: Sparkles,
    tone: "bio",
    features: [
      "Crear perfil profesional o familiar",
      "Buscar y aplicar a ofertas abiertas",
      "Asistente IA básico (preguntas generales)",
      "Mensajería 1:1 cuando se acepta una aplicación",
    ],
    cta: "Empezar gratis",
  },
  {
    key: "pro",
    name: "Pro Profesional",
    price: "COP 29.900",
    cycle: "/mes",
    audience: "Profesionales de salud que quieren más turnos.",
    icon: Stethoscope,
    tone: "fuchsia",
    highlight: true,
    features: [
      "Matching semántico bidireccional con IA (huella vectorial)",
      "Coach de carrera 24/7 (mejorar perfil y Trust Score)",
      "Sugerencias IA en cada mensaje",
      "Boost de visibilidad en búsquedas",
      "Validación anti-fraude IA prioritaria",
    ],
    cta: "Activar Pro",
  },
  {
    key: "family",
    name: "Familia",
    price: "5%",
    cycle: "comisión por contratación",
    audience: "Hogares que contratan cuidado humano.",
    icon: Heart,
    tone: "copper",
    features: [
      "Copiloto IA de contratación (descripción, tarifa COP, candidatos)",
      "Top 5 profesionales recomendados por la IA",
      "Verificación RETHUS y anti-fraude incluida",
      "Pagos protegidos al aceptar la aplicación",
    ],
    cta: "Publicar mi necesidad",
  },
  {
    key: "institution",
    name: "Institución (IPS)",
    price: "Desde COP 299.000",
    cycle: "/mes",
    audience: "Clínicas, hospitales y agencias de cuidado.",
    icon: Building2,
    tone: "cyber",
    features: [
      "Bolsa de créditos IA mensual (publicación, validación, matching)",
      "Multi-usuario con roles (HR, evaluador, admin)",
      "Pipeline de candidatos con scoring IA",
      "Detección automática de inconsistencias en CVs y RETHUS",
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
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<PlanKey | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      if (data?.plan) setCurrentPlan(data.plan as PlanKey);
      setLoading(false);
    })();
  }, []);

  const choose = async (plan: PlanKey) => {
    if (plan === "free") {
      toast.success("Ya tienes acceso gratuito a Humanix.");
      return;
    }
    setActing(plan);
    // Stripe llega después; por ahora dejamos huella de interés
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast("Inicia sesión para activar tu plan", { description: "Te llevamos al login." });
        window.location.href = "/auth";
        return;
      }
      await supabase.from("ai_credits_ledger").insert({
        user_id: sess.session.user.id,
        feature: `plan_intent:${plan}`,
        credits_used: 0,
        meta: { source: "/planes" },
      });
      toast.success("¡Anotado! Activaremos pagos pronto y te avisaremos para confirmar.", {
        description: "Mientras tanto, tu cuenta sigue activa con el plan free.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar interés");
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
            Activa el plan que necesitas. Pagos integrados pronto: por ahora reservas tu lugar y mantenemos tu acceso gratis.
          </p>
        </header>

        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const isCurrent = currentPlan === p.key;
            return (
              <Card
                key={p.key}
                className={`p-6 flex flex-col ${
                  p.highlight ? "border-fuchsia-neural/50 shadow-[var(--shadow-elegant)]" : ""
                }`}
              >
                {p.highlight && (
                  <span className="self-start inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-neural/10 text-fuchsia-neural border border-fuchsia-neural/30 mb-3">
                    Más elegido
                  </span>
                )}
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${TONE[p.tone]}`}>
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
                  variant={p.highlight ? "hero" : "outline"}
                  disabled={loading || acting === p.key || isCurrent}
                  onClick={() => choose(p.key)}
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
            <a href="mailto:hola@humanix.co" className="text-biosensor underline">hola@humanix.co</a> y armamos un plan para tu IPS.
          </p>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground mt-2 inline-block">
            ← Volver al inicio
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
