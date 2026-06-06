// Despacha notificaciones (WhatsApp / push / email) cuando se crea una clinical_alert.
// Se invoca via Supabase Database Webhook en INSERT sobre clinical_alerts.
//
// Reusa las credenciales de WhatsApp Cloud API ya configuradas en el proyecto
// (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID, ver care-alerts y whatsapp-send)
// para mantener un solo proveedor y un solo lugar donde rotar secretos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { buildCorsHeaders } from "../_shared/auth.ts";

const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";

const ALERT_LABELS: Record<string, string> = {
  high_heart_rate: "Frecuencia cardíaca elevada",
  low_heart_rate: "Frecuencia cardíaca baja",
  low_spo2: "Saturación de oxígeno baja",
  high_temperature: "Temperatura elevada (fiebre)",
  low_temperature: "Temperatura baja (hipotermia)",
  high_blood_pressure: "Presión arterial alta",
  low_blood_pressure: "Presión arterial baja",
  fall_detected: "Posible caída detectada",
  inactivity: "Inactividad prolongada",
  high_respiration: "Frecuencia respiratoria anormal",
  abnormal_glucose: "Glucosa fuera de rango",
};

const SEVERITY_EMOJI: Record<string, string> = {
  low: "🔵",
  medium: "🟡",
  high: "🟠",
  critical: "🔴",
};

function normalizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  return clean.startsWith("57") ? clean : `57${clean}`;
}

async function sendWa(phone: string, body: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.warn("[clinical-alert-notify] WhatsApp not configured (missing secrets)");
    return false;
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizePhone(phone),
      type: "text",
      text: { body },
    }),
  });
  if (!res.ok) {
    console.error("[clinical-alert-notify] WA error:", res.status, await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // El payload viene del Database Webhook de Supabase: { type, table, record, ... }
    const payload = await req.json();
    const alert = payload.record ?? payload;

    if (!alert?.id || !alert?.patient_id) {
      return new Response(JSON.stringify({ skipped: true, reason: "invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (alert.status !== "active") {
      return new Response(JSON.stringify({ skipped: true, reason: "not active" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Solo notificar por WhatsApp si el umbral del paciente lo pide (o no hay umbral configurado, por defecto true)
    const { data: threshold } = await supabase
      .from("alert_thresholds")
      .select("notify_whatsapp")
      .eq("patient_id", alert.patient_id)
      .eq("vital_type", alert.alert_type?.replace(/^(high_|low_)/, "") ?? "")
      .maybeSingle();

    const shouldNotifyWhatsapp = threshold?.notify_whatsapp ?? true;

    const [{ data: patient }, { data: booking }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("user_id", alert.patient_id).maybeSingle(),
      alert.booking_id
        ? supabase
            .from("service_bookings")
            .select("client_id, professional_id")
            .eq("id", alert.booking_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const recipientIds = new Set<string>();
    if (booking?.client_id) recipientIds.add(booking.client_id);
    if (booking?.professional_id) recipientIds.add(booking.professional_id);

    let recipients: Array<{ user_id: string; phone: string | null; full_name: string | null }> = [];
    if (recipientIds.size > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, phone, full_name")
        .in("user_id", Array.from(recipientIds));
      recipients = data ?? [];
    }

    const label = ALERT_LABELS[alert.alert_type] ?? alert.alert_type ?? "Alerta clínica";
    const emoji = SEVERITY_EMOJI[alert.severity] ?? "⚠️";
    const valueStr = alert.unit ? `${alert.actual_value} ${alert.unit}` : `${alert.actual_value}`;

    const message =
      `${emoji} HUMANIX · ALERTA CLÍNICA\n\n` +
      `Paciente: ${patient?.full_name ?? "Paciente"}\n` +
      `Evento: ${label}\n` +
      `Valor registrado: ${valueStr}\n` +
      `Severidad: ${alert.severity?.toUpperCase() ?? "MEDIA"}\n\n` +
      `Ver detalle y monitoreo en vivo:\nhttps://humanix.lat/dashboard/monitoreo`;

    let sentAny = false;
    if (shouldNotifyWhatsapp) {
      const phones = new Set<string>();
      if (patient?.phone) phones.add(patient.phone);
      for (const r of recipients) if (r.phone) phones.add(r.phone);

      const results = await Promise.all(Array.from(phones).map((p) => sendWa(p, message)));
      sentAny = results.some(Boolean);
    }

    await supabase
      .from("clinical_alerts")
      .update({
        notified_whatsapp: sentAny || alert.notified_whatsapp,
        notified_at: new Date().toISOString(),
      })
      .eq("id", alert.id);

    return new Response(JSON.stringify({ ok: true, notified_whatsapp: sentAny }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[clinical-alert-notify]", e);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
