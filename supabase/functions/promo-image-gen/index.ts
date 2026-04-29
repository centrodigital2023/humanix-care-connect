// promo-image-gen — genera una imagen base de fondo para tarjetas promocionales
// usando Lovable AI (google/gemini-3-flash-image-preview / nano-banana-2).
import { corsHeaders, requireUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const { prompt, aspect } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aspectHint =
      aspect === "9:16"
        ? "vertical 9:16, optimizada para Stories y Reels"
        : aspect === "16:9"
          ? "horizontal 16:9, optimizada para Facebook y LinkedIn"
          : "cuadrada 1:1, optimizada para Instagram feed";

    const fullPrompt = `Imagen profesional de marketing para Humanix (plataforma colombiana de cuidadores de salud a domicilio). ${aspectHint}. Estilo: minimalista, moderno, cálido, colores acordes a salud (azul biosensor, cobre, fucsia neuronal). Sin texto sobreimpreso (el texto se añadirá después). ${prompt}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429 || status === 402) {
        return new Response(
          JSON.stringify({
            error: status === 429 ? "Demasiadas solicitudes, intenta en un momento" : "Créditos IA agotados",
          }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI error");
    }

    const data = await aiResp.json();
    const imageUrl: string | undefined =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      console.error("No image in response", JSON.stringify(data).slice(0, 500));
      throw new Error("Sin imagen generada");
    }

    return new Response(JSON.stringify({ image: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("promo-image-gen error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
