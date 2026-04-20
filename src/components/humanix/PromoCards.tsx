import { useMemo, useRef, useState } from "react";
import { Sparkles, Zap, Heart, Shield, TrendingUp, Users, Brain, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "./ShareButtons";
import { HScrollCarousel } from "./HScrollCarousel";

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
    subline: "Humanix usa IA para conectar familias con profesionales verificados RETHUS en toda Colombia.",
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
    subline: "Pool de talento certificado, contratos digitales y facturación electrónica integrada.",
    hashtags: "#IPSColombia #SaludB2B #Humanix #TalentoSalud",
    variant: "bio",
    icon: Users,
    emoji: "🏥⚡",
  },
  {
    id: "ia-bio",
    headline: "El cuidado humano, amplificado por IA",
    subline: "Match semántico, validación holística y trust score en tiempo real. Bienvenido al futuro.",
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

const VARIANT_STYLES: Record<PromoTemplate["variant"], { bg: string; text: string; chip: string }> = {
  bio: {
    bg: "bg-gradient-to-br from-biosensor/90 via-biosensor to-biosensor/70",
    text: "text-biosensor-foreground",
    chip: "bg-biosensor-foreground/15 text-biosensor-foreground border-biosensor-foreground/20",
  },
  copper: {
    bg: "bg-gradient-to-br from-copper/90 via-copper to-copper/70",
    text: "text-copper-foreground",
    chip: "bg-copper-foreground/15 text-copper-foreground border-copper-foreground/20",
  },
  fuchsia: {
    bg: "bg-gradient-to-br from-fuchsia-neural/90 via-fuchsia-neural to-fuchsia-neural/70",
    text: "text-fuchsia-neural-foreground",
    chip: "bg-fuchsia-neural-foreground/15 text-fuchsia-neural-foreground border-fuchsia-neural-foreground/20",
  },
  cyber: {
    bg: "bg-cyber",
    text: "text-cyber-foreground",
    chip: "bg-cyber-foreground/10 text-cyber-foreground border-cyber-foreground/20",
  },
};

export function PromoCards({ origin }: { origin: string }) {
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const utm = "?utm_source=social&utm_medium=share&utm_campaign=promo";
  const baseUrl = useMemo(() => `${origin}/${utm}`, [origin]);

  const handleShare = (id: string) => {
    setShareCounts((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  };

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
      // Fallback: copia el texto para pegar manualmente
      const text = `${tpl.emoji} ${tpl.headline}\n\n${tpl.subline}\n\n${tpl.hashtags}\n${baseUrl}`;
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fuchsia-neural" /> Tarjetas dinámicas para redes
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Plantillas listas con copy, hashtags y UTM. Comparte en 1 click para promocionar Humanix.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">{TEMPLATES.length} plantillas</Badge>
      </div>

      <HScrollCarousel step={340}>
        <div className="flex gap-4 px-1 w-max pb-2">
          {TEMPLATES.map((tpl) => {
            const styles = VARIANT_STYLES[tpl.variant];
            const Icon = tpl.icon;
            const shareText = `${tpl.emoji} ${tpl.headline}\n\n${tpl.subline}\n\n${tpl.hashtags}`;
            return (
              <div key={tpl.id} className="w-[320px] shrink-0 snap-start space-y-2">
                <div
                  ref={(el) => { cardRefs.current[tpl.id] = el; }}
                  className={`relative aspect-square rounded-2xl overflow-hidden ${styles.bg} ${styles.text} p-6 flex flex-col justify-between shadow-xl`}
                >
                  <div className="absolute inset-0 grid-pattern opacity-20" />
                  <div className="relative flex items-start justify-between">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${styles.chip}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={`text-[10px] font-mono px-2 py-1 rounded-full border ${styles.chip}`}>
                      humanix.co
                    </div>
                  </div>
                  <div className="relative space-y-3">
                    <h3 className="font-display text-2xl font-bold leading-tight">{tpl.headline}</h3>
                    <p className="text-sm opacity-90 leading-relaxed line-clamp-3">{tpl.subline}</p>
                    <div className={`text-[10px] font-mono px-2 py-1 rounded inline-block border ${styles.chip}`}>
                      {tpl.hashtags.split(" ").slice(0, 2).join(" ")}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <ShareButtons
                    url={baseUrl}
                    title={`${tpl.emoji} ${tpl.headline}`}
                    description={shareText}
                    onShare={() => handleShare(tpl.id)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => void downloadCard(tpl)}
                    >
                      Descargar PNG
                    </Button>
                    <span className="text-[10px] text-muted-foreground">
                      {shareCounts[tpl.id] ?? 0} compartidas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </HScrollCarousel>
    </div>
  );
}