import { useRef, useState } from "react";
import {
  Sparkles,
  Upload,
  Loader2,
  Trash2,
  Share2,
  ArrowLeftRight,
  ArrowUpDown,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "@/components/humanix/ShareButtons";
import { supabase as _sb } from "@/integrations/supabase/client";
import { toast } from "sonner";

const supabase: any = _sb;

type Slide = {
  id: string;
  url: string;
  caption?: string;
  source: "ai" | "upload";
};

type Props = {
  /** Texto sugerido para compartir junto a las imágenes. */
  shareTitle?: string;
  /** URL pública a compartir (ej. de la oferta o landing). */
  shareUrl?: string;
};

export function PromoCarousel({ shareTitle = "Conoce Humanix", shareUrl }: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error("Describe la imagen publicitaria");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("promo-image-gen", {
        body: { prompt, aspect },
      });
      if (error) throw error;
      const url: string | undefined = data?.image;
      if (!url) throw new Error("Sin imagen");
      setSlides((s) => [
        ...s,
        { id: crypto.randomUUID(), url, caption: prompt, source: "ai" },
      ]);
      toast.success("Imagen generada");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo generar la imagen");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next: Slide[] = await Promise.all(
      files.map(
        (f) =>
          new Promise<Slide>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                url: String(reader.result),
                caption: f.name,
                source: "upload",
              });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(f);
          }),
      ),
    );
    setSlides((s) => [...s, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = (id: string) => setSlides((s) => s.filter((x) => x.id !== id));

  const isVertical = orientation === "vertical";

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Carrusel promocional
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Genera imágenes con IA o sube tus propias piezas y compártelas en redes sociales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))
            }
            title="Cambiar orientación"
          >
            {isVertical ? (
              <ArrowUpDown className="h-4 w-4 mr-1.5" />
            ) : (
              <ArrowLeftRight className="h-4 w-4 mr-1.5" />
            )}
            {isVertical ? "Vertical" : "Horizontal"}
          </Button>
        </div>
      </div>

      {/* Generador IA + upload */}
      <div className="grid md:grid-cols-3 gap-2">
        <Textarea
          className="md:col-span-2 min-h-[64px]"
          placeholder="Describe la pieza: ej. 'Promoción cuidadores 24/7 en Bogotá, estilo cálido y profesional'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {(["1:1", "16:9", "9:16"] as const).map((a) => (
              <Button
                key={a}
                type="button"
                size="sm"
                variant={aspect === a ? "default" : "outline"}
                onClick={() => setAspect(a)}
                className="flex-1"
              >
                {a}
              </Button>
            ))}
          </div>
          <Button onClick={generate} disabled={busy} variant="hero">
            {busy ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            Generar con IA
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Subir imagen
          </Button>
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Carrusel */}
      {slides.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
          Aún no hay piezas. Genera con IA o sube una imagen para empezar.
        </div>
      ) : (
        <div
          className={
            isVertical
              ? "max-h-[520px] overflow-y-auto flex flex-col gap-3 pr-1 snap-y snap-mandatory"
              : "overflow-x-auto flex gap-3 pb-2 snap-x snap-mandatory"
          }
        >
          {slides.map((s) => (
            <div
              key={s.id}
              className={
                isVertical
                  ? "snap-start w-full rounded-lg border bg-card overflow-hidden flex flex-col"
                  : "snap-start shrink-0 w-64 sm:w-72 rounded-lg border bg-card overflow-hidden flex flex-col"
              }
            >
              <div className="relative bg-muted">
                <img
                  src={s.url}
                  alt={s.caption || "Promo"}
                  className={
                    isVertical
                      ? "w-full max-h-[360px] object-cover"
                      : "w-full h-44 object-cover"
                  }
                  loading="lazy"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 text-[10px]"
                >
                  {s.source === "ai" ? "IA" : "Subida"}
                </Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 h-7 w-7 bg-background/80 hover:bg-background"
                  onClick={() => remove(s.id)}
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="p-2 space-y-2">
                {s.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {s.caption}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Share2 className="h-3 w-3" /> Compartir
                  </span>
                  <ShareButtons
                    url={shareUrl || s.url}
                    title={s.caption || shareTitle}
                    description={shareTitle}
                    targets={["whatsapp", "facebook", "twitter", "copy"]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default PromoCarousel;