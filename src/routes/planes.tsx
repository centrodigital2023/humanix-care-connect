import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Stethoscope, Building2, Crown, Loader2, Heart } from "lucide-react";
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
          "Un plan para cada historia humana. Desde gratis para profesionales hasta $99.000 COP/mes para empresas. Sin permanencia. Cancela cuando quieras.",
      },
      { property: "og:title", content: "Planes y precios · Humanix" },
      {
        property: "og:description",
        content:
          "Profesional gratis o $29.000/mes Pro. Familia: 5% por turno. Empresa desde $99.000 COP/mes. Pagos en pesos colombianos.",
      },
    ],
  }),
  component: PlansPage,
});

type PlanKey = "profesional" | "familia" | "empresa";

const PLANS: {
  key: PlanKey;
  name: string;
  priceLabel: string;
  priceNote: string;
  audience: string;
  icon: typeof Stethoscope;
  tone: "bio" | "fuchsia" | "copper";
  highlight?: boolean;
  features: string[];
  cta: string;
  amount: number;
}[] = [
  {
    key: "profesional",
    name: "Profesional",
    priceLabel: "Gratis",
    priceNote: "o $29.000 COP/mes Pro",
    audience: "Para enfermeros, auxiliares y cuidadores independientes.",
    icon: Stethoscope,
    tone: "bio",
    amount: 29000,
    features: [
      "Perfil verificado RETHUS",
      "Postulación a turnos ilimitados",
      "Calendario y notificaciones",
      "Pagos en Nequi y PSE",
    ],
    cta: "Crear perfil",
  },
  {
    key: "familia",
    name: "Familia",
    priceLabel: "5%",
    priceNote: "por turno contratado",
    audience: "Encuentra cuidador certificado para tu ser querido.",
    icon: Heart,
    tone: "copper",
    highlight: true,
    amount: 0,
    features: [
      "Búsqueda y match en minutos",
      "Geolocalización en vivo",
      "Botón de emergencia 24/7",
      "Seguro Sura incluido",
    ],
    cta: "Contratar ahora",
  },
  {
    key: "empresa",
    name: "Empresa",
    priceLabel: "Desde $99.000",
    priceNote: "COP/mes",
    audience: "Para IPS, clínicas y agencias con +10 profesionales.",
    icon: Building2,
    tone: "fuchsia",
    amount: 99000,
    features: [
      "Panel de superadministrador con IA",
      "Predicción de ausentismo",
      "API y webhooks",
      "Auditoría Min. Salud",
    ],
    cta: "Hablar con ventas",
  },
];

const TONE: Record<string, string> = {
  bio: "border-biosensor/30 bg-biosensor/5 text-biosensor",
  fuchsia: "border-fuchsia-neural/40 bg-fuchsia-neural/5 text-fuchsia-neural",
  copper: "border-copper/30 bg-copper/5 text-copper",
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
    if (plan === "familia") {
      window.location.href = "/auth?redirect=" + encodeURIComponent("/buscar");
      return;
    }
    if (plan === "empresa") {
      window.location.href = "mailto:hola@humanix.co?subject=Plan Empresa Humanix";
      return;
    }
    // plan === "profesional" → checkout Pro
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
          plan: "pro_monthly",
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
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
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

        <section className="mt-10 grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const isCurrent = currentPlan === p.key;
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
                  <span className="text-4xl font-bold font-display">{p.priceLabel}</span>
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
                  variant={p.highlight ? "copper" : p.tone === "fuchsia" ? "hero" : "outline"}
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

