// Webhook de Mercado Pago: recibe notificaciones de pago y actualiza la suscripción.
// MP envía POST con { type, data: { id } }. Sin verify_jwt (es público).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MP_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!MP_TOKEN) return new Response("config", { status: 500 });

    const url = new URL(req.url);
    const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
    let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      paymentId = paymentId ?? body?.data?.id ?? body?.resource;
    }
    if (!paymentId || !(topic === "payment" || topic === "merchant_order" || !topic)) {
      return new Response("ok", { status: 200 });
    }

    // Buscar el pago real
    const pr = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    if (!pr.ok) {
      console.warn("MP fetch payment error", pr.status);
      return new Response("ok", { status: 200 });
    }
    const payment = await pr.json();
    const userId = payment.external_reference || payment.metadata?.user_id;
    const status = String(payment.status ?? "pending");

    // Insertar pago
    await fetch(`${SUPABASE_URL}/rest/v1/mp_payments`, {
      method: "POST",
      headers: {
        apikey: SRK, Authorization: `Bearer ${SRK}`,
        "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_id: userId,
        mp_payment_id: String(payment.id),
        amount: Math.round(Number(payment.transaction_amount ?? 0)),
        currency: payment.currency_id ?? "COP",
        status,
        description: payment.description ?? null,
        raw_payload: payment,
        paid_at: status === "approved" ? new Date().toISOString() : null,
      }),
    });

    // Actualizar suscripción si fue aprobado
    if (status === "approved" && userId) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      await fetch(`${SUPABASE_URL}/rest/v1/mp_subscriptions?user_id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "active",
          current_period_end: periodEnd.toISOString(),
          next_payment_at: periodEnd.toISOString(),
        }),
      });

      // Notificación in-app
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId, type: "payment_approved",
          title: "✅ Suscripción Humanix Pro activa",
          body: "Tu suscripción mensual fue aprobada. ¡Ya puedes recibir ofertas premium!",
          link: "/dashboard/profesional",
        }),
      });
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("mp-webhook:", e);
    return new Response("ok", { status: 200 });
  }
});
