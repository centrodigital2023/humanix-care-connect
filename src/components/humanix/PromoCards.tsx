import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Zap,
  Heart,
  Shield,
  TrendingUp,
  Users,
  Brain,
  Rocket,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  MessageCircle,
  Link2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "./ShareButtons";
import { cn } from "@/lib/utils";

export type PromoTemplate = {
  id: string;
  headline: string;
  subline: string;
  hashtags: string;
  variant: "bio" | "copper" | "fuchsia" | "cyber";
  icon: typeof Sparkles;
  emoji: string;
};

const TEMPLATES: PromoTemplate[] = [
  {
    id: "ia-match",
    headline: "Encuentra al cuidador perfecto en menos de 150 ms",
    subline:
      "Humanix usa IA para conectar familias con profesionales verificados RETHUS en toda Colombia.",
    hashtags: "#HumanixCo #SaludDigital #Cuidadores #IAenSalud",
    variant: "bio",
    icon: Brain,
    emoji: "🧠💙",
  },
  {
    id: "verificado",
    headline: "100% verificados. 0% improvisación.",
    subline: "Cédula, RETHUS, antecedentes y biometría facial. Tu familia merece confianza real.",
    hashtags: "#CuidadoSeguro #Humanix #SaludEnCasa",
    variant: "copper",
    icon: Shield,
    emoji: "🛡️✅",
  },
  {
    id: "trabajo-pro",
    headline: "¿Eres enfermero o auxiliar? Tu próximo turno te espera.",
    subline: "Trabaja cuando quieras, cobra al instante en Nequi o PSE. Sin intermediarios.",
    hashtags: "#EnfermeríaCo #TrabajoSalud #Humanix #FreelanceSalud",
    variant: "fuchsia",
    icon: Rocket,
    emoji: "🚀💼",
  },
  {
    id: "monitoreo",
    headline: "Monitoreo en vivo del cuidado de tus seres queridos",
    subline: "ETA del cuidador, signos vitales y botón de emergencia 24/7. Tranquilidad real.",
    hashtags: "#TecnologíaQueCuida #Humanix #FamiliaSegura",
    variant: "cyber",
    icon: Heart,
    emoji: "❤️📍",
  },
  {
    id: "instituciones",
    headline: "Clínicas e IPS: cubre turnos críticos en minutos",
    subline:
      "Pool de talento certificado, contratos digitales y facturación electrónica integrada.",
    hashtags: "#IPSColombia #SaludB2B #Humanix #TalentoSalud",
    variant: "bio",
    icon: Users,
    emoji: "🏥⚡",
  },
  {
    id: "ia-bio",
    headline: "El cuidado humano, amplificado por IA",
    subline:
      "Match semántico, validación holística y trust score en tiempo real. Bienvenido al futuro.",
    hashtags: "#IAenSalud #HealthTech #Humanix #InnovaciónCo",
    variant: "fuchsia",
    icon: Sparkles,
    emoji: "✨🤖",
  },
  {
    id: "rapido",
    headline: "Cuidador a domicilio en 30 minutos",
    subline: "Bogotá, Medellín, Cali, Barranquilla y +20 ciudades. Reserva por WhatsApp o web.",
    hashtags: "#CuidadoExpress #Humanix #SaludADomicilio",
    variant: "copper",
    icon: Zap,
    emoji: "⚡🏠",
  },
  {
    id: "trust",
    headline: "Trust Score: la nueva reputación del cuidado en salud",
    subline: "Cada profesional Humanix tiene historial verificable, reseñas reales y respaldo IA.",
    hashtags: "#TrustScore #Humanix #SaludTransparente",
    variant: "bio",
    icon: TrendingUp,
    emoji: "📈⭐",
  },
];

type Aspect = "1:1" | "16:9" | "9:16";
const ASPECTS: { label: Aspect; desc: string; cls: string }[] = [
  { label: "1:1", desc: "Instagram · Feed", cls: "aspect-square" },
  { label: "16:9", desc: "Facebook · LinkedIn", cls: "aspect-video" },
  { label: "9:16", desc: "Stories · Reels", cls: "aspect-[9/16]" },
];

const NETWORKS: {
  id: "whatsapp" | "facebook" | "twitter" | "linkedin" | "copy";
  label: string;
  color: string;
  Icon: typeof Share2;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "bg-[#25D366] hover:bg-[#1da851] text-white border-transparent",
    Icon: MessageCircle,
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "bg-[#1877F2] hover:bg-[#1464cc] text-white border-transparent",
    Icon: Share2,
  },
  {
    id: "twitter",
    label: "X / Twitter",
    color: "bg-black hover:bg-zinc-800 text-white border-transparent",
    Icon: Share2,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "bg-[#0A66C2] hover:bg-[#0852a3] text-white border-transparent",
    Icon: Share2,
  },
  {
    id: "copy",
    label: "Copiar",
    color: "bg-muted hover:bg-muted/80 text-foreground border-border",
    Icon: Link2,
  },
];

const VARIANT_STYLES: Record<
  PromoTemplate["variant"],
  { bg: string; text: string; chip: string; glow: string }
> = {
  bio: {
    bg: "bg-gradient-to-br from-biosensor via-biosensor/85 to-biosensor/60",
    text: "text-biosensor-foreground",
    chip: "bg-white/15 text-white border-white/20",
    glow: "shadow-[0_0_40px_-8px_var(--color-biosensor)]",
  },
  copper: {
    bg: "bg-gradient-to-br from-copper via-copper/85 to-copper/60",
    text: "text-copper-foreground",
    chip: "bg-white/15 text-white border-white/20",
    glow: "shadow-[0_0_40px_-8px_var(--color-copper)]",
  },
  fuchsia: {
    bg: "bg-gradient-to-br from-fuchsia-neural via-fuchsia-neural/85 to-fuchsia-neural/60",
    text: "text-fuchsia-neural-foreground",
    chip: "bg-white/15 text-white border-white/20",
    glow: "shadow-[0_0_40px_-8px_var(--color-fuchsia-neural)]",
  },
  cyber: {
    bg: "bg-cyber",
    text: "text-cyber-foreground",
    chip: "bg-white/10 text-white border-white/20",
    glow: "shadow-[0_0_40px_-8px_#a78bfa]",
  },
};

function buildShareUrl(target: string, url: string, title: string, desc?: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const d = encodeURIComponent(desc || title);
  switch (target) {
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "whatsapp":
      return `https://wa.me/?text=${t}%20${u}`;
    default:
      return url;
  }
}

export function PromoCards({ origin }: { origin: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const utm = "?utm_source=social&utm_medium=share&utm_campaign=promo";
  const baseUrl = useMemo(() => `${origin}/${utm}`, [origin]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setActiveIdx((i) => (i + 1) % TEMPLATES.length);
      if (e.key === "ArrowLeft") setActiveIdx((i) => (i - 1 + TEMPLATES.length) % TEMPLATES.length);
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  const handleShare = useCallback(
    async (tpl: PromoTemplate, networkId: string) => {
      const shareText = `${tpl.emoji} ${tpl.headline}\n\n${tpl.subline}\n\n${tpl.hashtags}`;
      if (networkId === "copy") {
        await navigator.clipboard.writeText(`${shareText}\n${baseUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        window.open(
          buildShareUrl(networkId, baseUrl, `${tpl.emoji} ${tpl.headline}`, shareText),
          "_blank",
          "noopener,noreferrer,width=640,height=560",
        );
      }
      setShareCounts((p) => ({ ...p, [tpl.id]: (p[tpl.id] ?? 0) + 1 }));
    },
    [baseUrl],
  );

  const downloadCard = async (tpl: PromoTemplate) => {
    const node = cardRefs.current[tpl.id];
    if (!node) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: null, useCORS: true });
      const link = document.createElement("a");
      link.download = `humanix-${tpl.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      const text = `${tpl.emoji} ${tpl.headline}\n\n${tpl.subline}\n\n${tpl.hashtags}\n${baseUrl}`;
      await navigator.clipboard.writeText(text);
    }
  };

  const active = TEMPLATES[activeIdx];
  const activeStyles = VARIANT_STYLES[active.variant];
  const ActiveIcon = active.icon;
  const aspectConfig = ASPECTS.find((a) => a.label === aspect)!;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-fuchsia-neural" /> Tarjetas para redes sociales
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {TEMPLATES.length} plantillas con copy IA, hashtags y UTM. Un clic para compartir.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-border p-1 bg-muted/30">
          {ASPECTS.map((a) => (
            <button
              key={a.label}
              onClick={() => setAspect(a.label)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                aspect === a.label
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={a.desc}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tarjeta destacada central ──────────────────────────── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Preview principal */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "w-full max-w-sm mx-auto rounded-2xl overflow-hidden cursor-zoom-in select-none transition-transform hover:scale-[1.01]",
              aspectConfig.cls,
              activeStyles.bg,
              activeStyles.text,
              activeStyles.glow,
            )}
            ref={(el) => {
              cardRefs.current[active.id] = el;
            }}
            onClick={() => setLightbox(true)}
          >
            <CardContent tpl={active} styles={activeStyles} />
          </div>

          {/* Dots navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveIdx((i) => (i - 1 + TEMPLATES.length) % TEMPLATES.length)}
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-1.5">
              {TEMPLATES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "rounded-full transition-all",
                    i === activeIdx
                      ? "w-5 h-2 bg-biosensor"
                      : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveIdx((i) => (i + 1) % TEMPLATES.length)}
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {activeIdx + 1} / {TEMPLATES.length} · Clic para ampliar · ← → navegar
          </p>
        </div>

        {/* Panel de acciones */}
        <div className="space-y-4">
          <div className={cn("rounded-xl p-0.5", activeStyles.bg)}>
            <div className="rounded-[10px] bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    activeStyles.bg,
                    activeStyles.text,
                  )}
                >
                  <ActiveIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{active.headline}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {active.emoji} · {active.variant}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{active.subline}</p>
              <div className="flex flex-wrap gap-1">
                {active.hashtags.split(" ").map((h) => (
                  <span
                    key={h}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                <span>{shareCounts[active.id] ?? 0} veces compartida</span>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                  {aspectConfig.desc}
                </Badge>
              </div>
            </div>
          </div>

          {/* Botones de red */}
          <div className="space-y-1.5">
            {NETWORKS.map(({ id, label, color, Icon }) => (
              <button
                key={id}
                onClick={() => void handleShare(active, id)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold border transition-all hover:-translate-y-0.5 hover:shadow-sm",
                  color,
                )}
              >
                {id === "copy" && copied ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0" />
                )}
                {id === "copy" && copied ? "¡Copiado!" : label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => void downloadCard(active)}
          >
            <Download className="h-3.5 w-3.5" /> Descargar PNG
          </Button>
        </div>
      </div>

      {/* ── Miniaturas horizontales ───────────────────────────── */}
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div className="flex gap-3 w-max px-1">
          {TEMPLATES.map((tpl, i) => {
            const s = VARIANT_STYLES[tpl.variant];
            const Ico = tpl.icon;
            return (
              <button
                key={tpl.id}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "relative w-24 aspect-square rounded-xl overflow-hidden shrink-0 transition-all hover:scale-105",
                  s.bg,
                  s.text,
                  i === activeIdx
                    ? "ring-2 ring-biosensor ring-offset-2 ring-offset-background scale-105"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <div className="relative h-full flex flex-col items-center justify-center gap-1 p-2 text-center">
                  <Ico className="h-5 w-5" />
                  <p className="text-[9px] font-semibold leading-tight line-clamp-2">
                    {tpl.headline.split(" ").slice(0, 4).join(" ")}…
                  </p>
                  {(shareCounts[tpl.id] ?? 0) > 0 && (
                    <span className="absolute top-1 right-1 text-[8px] bg-black/30 rounded-full px-1">
                      {shareCounts[tpl.id]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <X className="h-4 w-4" /> Cerrar
            </button>
            <button
              onClick={() => setActiveIdx((i) => (i - 1 + TEMPLATES.length) % TEMPLATES.length)}
              className="absolute left-[-48px] top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveIdx((i) => (i + 1) % TEMPLATES.length)}
              className="absolute right-[-48px] top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div
              className={cn(
                "w-full aspect-square rounded-2xl overflow-hidden",
                activeStyles.bg,
                activeStyles.text,
                activeStyles.glow,
              )}
            >
              <CardContent tpl={active} styles={activeStyles} large />
            </div>
            <div className="mt-3 flex gap-2 justify-center flex-wrap">
              {NETWORKS.slice(0, 4).map(({ id, label, color, Icon }) => (
                <button
                  key={id}
                  onClick={() => void handleShare(active, id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-colors",
                    color,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardContent({
  tpl,
  styles,
  large = false,
}: {
  tpl: PromoTemplate;
  styles: (typeof VARIANT_STYLES)[keyof typeof VARIANT_STYLES];
  large?: boolean;
}) {
  const Icon = tpl.icon;
  return (
    <div className={cn("relative h-full flex flex-col justify-between", large ? "p-8" : "p-5")}>
      <div className="absolute inset-0 grid-pattern opacity-20" />
      {/* Top row */}
      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "flex items-center justify-center rounded-xl border",
            large ? "h-12 w-12" : "h-9 w-9",
            styles.chip,
          )}
        >
          <Icon className={large ? "h-6 w-6" : "h-4 w-4"} />
        </div>
        <div className={cn("font-mono px-2 py-1 rounded-full border text-[10px]", styles.chip)}>
          humanix.lat
        </div>
      </div>
      {/* Content */}
      <div className="relative space-y-2">
        <p className={cn("font-display font-bold leading-tight", large ? "text-2xl" : "text-lg")}>
          {tpl.headline}
        </p>
        <p className={cn("opacity-85 leading-relaxed line-clamp-3", large ? "text-sm" : "text-xs")}>
          {tpl.subline}
        </p>
        <div
          className={cn(
            "font-mono px-2 py-1 rounded border inline-block",
            large ? "text-[11px]" : "text-[9px]",
            styles.chip,
          )}
        >
          {tpl.hashtags.split(" ").slice(0, 2).join(" ")}
        </div>
      </div>
    </div>
  );
}
