import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Loader2, ExternalLink, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Sub = {
  status: string;
  plan: string;
  amount: number;
  current_period_end: string | null;
};

const COP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function MercadoPagoSubscription({ userId }: { userId: string }) {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              k: string,
              v: string,
            ) => {
              maybeSingle: () => Promise<{ data: Sub | null }>;
            };
          };
        };
      };
      const { data } = await client
        .from("mp_subscriptions")
        .select("status, plan, amount, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();
      if (active) {
        setSub(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const subscribe = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
        body: { plan: "pro_monthly", amount: 29900 },
      });
      if (error) throw error;
      const url = data?.init_point ?? data?.sandbox_init_point;
      if (!url) throw new Error("No se obtuvo URL de pago");
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error con Mercado Pago");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando plan…
      </div>
    );
  }

  const active = sub?.status === "active";

  return (
    <div className="rounded-2xl border border-border bg-card/95 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="h-5 w-5 text-fuchsia-neural" />
        <h2 className="font-semibold">Plan Humanix Pro</h2>
        {active && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> Activo
          </span>
        )}
      </div>

      {active ? (
        <>
          <p className="text-sm text-muted-foreground">
            Tu suscripción está activa por <strong>{COP(sub?.amount ?? 29900)}/mes</strong>.
          </p>
          {sub?.current_period_end && (
            <p className="text-xs text-muted-foreground mt-1">
              Próxima renovación: {new Date(sub.current_period_end).toLocaleDateString("es-CO")}
            </p>
          )}
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              Perfil destacado en búsquedas
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              Sin comisión por servicio
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              Match semántico con IA
            </li>
          </ul>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Activa Humanix Pro para destacarte ante familias e instituciones y recibir más ofertas.
          </p>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-fuchsia-neural/10 to-biosensor/10 border border-fuchsia-neural/20 p-4">
            <p className="text-2xl font-bold">
              {COP(29900)}
              <span className="text-sm font-normal text-muted-foreground">/mes</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                Perfil destacado en búsquedas
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                Notificaciones WhatsApp inmediatas
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                Sin comisiones por servicio
              </li>
            </ul>
          </div>
          <Button onClick={subscribe} disabled={busy} variant="hero" className="mt-4 w-full">
            {busy ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-1.5" />
            )}
            Pagar con Mercado Pago
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Pago seguro · Tarjeta, PSE, Nequi, Daviplata, Bancolombia
          </p>
        </>
      )}
    </div>
  );
}
