// Helper cliente para llamar a la edge function nasa-proxy.
// Reutilizable desde PromoCards, Publicidad, /cosmos, etc.

import { supabase } from "@/integrations/supabase/client";

export type NasaApod = {
  kind: "apod";
  title: string;
  title_es: string | null;
  explanation: string;
  explanation_es: string | null;
  date: string;
  media_type: "image" | "video";
  url: string;
  hdurl?: string;
  thumbnail_url?: string;
  copyright?: string | null;
};

export type NasaEpic = {
  kind: "epic";
  caption: string;
  caption_es: string | null;
  date: string;
  url: string | null;
};

export type NasaMars = {
  kind: "mars";
  url: string | null;
  sol?: number;
  earth_date?: string;
  camera?: string;
  rover?: string;
};

export type NasaResource = NasaApod | NasaEpic | NasaMars;

export async function fetchNasa(
  endpoint: "apod" | "epic" | "mars",
  opts: { translate?: boolean; date?: string; sol?: string } = {},
): Promise<NasaResource> {
  const params = new URLSearchParams({ endpoint });
  if (opts.translate) params.set("translate", "true");
  if (opts.date) params.set("date", opts.date);
  if (opts.sol) params.set("sol", opts.sol);

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nasa-proxy?${params}`;
  const res = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!res.ok) throw new Error(`NASA proxy: ${res.status}`);
  return (await res.json()) as NasaResource;
}

/** Devuelve una URL de imagen lista para usar como fondo (skips videos). */
export async function fetchNasaImage(
  endpoint: "apod" | "epic" | "mars" = "apod",
): Promise<{ url: string; credit: string } | null> {
  const data = await fetchNasa(endpoint);
  if (data.kind === "apod") {
    if (data.media_type !== "image") return null;
    return {
      url: data.hdurl || data.url,
      credit: `NASA APOD${data.copyright ? ` © ${data.copyright}` : ""}`,
    };
  }
  if (data.kind === "epic" && data.url) {
    return { url: data.url, credit: "NASA EPIC / DSCOVR" };
  }
  if (data.kind === "mars" && data.url) {
    return { url: data.url, credit: `NASA · ${data.rover} (${data.camera})` };
  }
  return null;
}

// Ensure supabase import is used (for future signed calls).
void supabase;