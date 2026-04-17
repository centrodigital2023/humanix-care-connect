// CV Extractor — extrae perfil profesional desde un PDF/imagen de hoja de vida
// usando un modelo multimodal con tool calling.

import { corsHeaders, requireUser } from "../_shared/auth.ts";

const ALLOWED_MIME_PREFIXES = ["application/pdf", "image/"];
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const FETCH_TIMEOUT_MS = 15_000;

const TOOL = {
  type: "function",
  function: {
    name: "save_cv_profile",
    description:
      "Extrae datos estructurados de una hoja de vida de un profesional de la salud en Colombia.",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        specialty: { type: "string" },
        sub_specialties: { type: "array", items: { type: "string" } },
        years_experience: { type: "number" },
        rethus_number: { type: "string" },
        certifications: { type: "array", items: { type: "string" } },
        languages: { type: "array", items: { type: "string" } },
        service_cities: { type: "array", items: { type: "string" } },
        bio: {
          type: "string",
          description: "Bio profesional 2-3 frases en primera persona, en español, cálida y precisa.",
        },
        work_experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              employer: { type: "string" },
              city: { type: "string" },
              start: { type: "string", description: "YYYY o YYYY-MM" },
              end: { type: "string", description: "YYYY, YYYY-MM o 'Actual'" },
              description: { type: "string" },
            },
            required: ["role", "employer"],
            additionalProperties: false,
          },
        },
      },
      required: ["specialty"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { file_url, mime_type } = await req.json();
    if (!file_url || typeof file_url !== "string") {
      return new Response(JSON.stringify({ error: "file_url requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    // Descargar el archivo y convertirlo a base64 data URL para el modelo multimodal
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) throw new Error("No se pudo descargar el archivo");
    const buf = new Uint8Array(await fileResp.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    const mt = mime_type || fileResp.headers.get("content-type") || "application/pdf";
    const dataUrl = `data:${mt};base64,${b64}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Eres un extractor de hojas de vida del sector salud en Colombia. " +
              "Lee el documento y completa la herramienta. NO inventes datos: si un campo no aparece, omítelo. " +
              "Para tarifas, no las inventes. Para bio, redacta 2-3 frases en español neutro y profesional.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrae el perfil profesional de esta hoja de vida." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "save_cv_profile" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429 || resp.status === 402) {
        return new Response(
          JSON.stringify({
            error: resp.status === 429 ? "Demasiadas solicitudes." : "Créditos IA agotados.",
          }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await resp.text();
      console.error("Gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ profile: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const profile = JSON.parse(call.function.arguments || "{}");
    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cv-extractor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
