import { useState } from "react";
import { ArrowRight, Sparkles, MapPin, Activity, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-humanix.webp";
import { RoleGate } from "./RoleGate";

export function Hero() {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <section className="relative overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-biosensor/30 bg-biosensor/10 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-biosensor max-w-full">
              <Zap className="h-3.5 w-3.5 animate-pulse shrink-0" />
              <span className="truncate">Uber-like marketplace de salud · IA en tiempo real</span>
            </div>

            <h1 className="mt-5 sm:mt-6 font-display text-[clamp(1.875rem,6.5vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-balance">
              <span className="text-gradient-bio">Talento en salud</span>,{" "}
              conectado al instante.
            </h1>

            <p className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed text-pretty">
              Tres actores. Un sistema. Profesionales activan su disponibilidad como en Uber. Familias e IPS buscan y contratan en tiempo real. Matching automático en &lt;10km. Pagos directos.
            </p>

            {/* Key Stats */}
            <div className="mt-7 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 pb-6 sm:pb-8">
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">847+</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">Profesionales verificados RETHUS</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-biosensor">&lt;10km</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">Match automático</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-copper">3</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">Actores en el marketplace</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400">4</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">Modalidades de pago</p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="xl" className="w-full sm:w-auto min-h-12" onClick={() => setGateOpen(true)}>
                Explorar plataforma <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="glass" size="xl" className="w-full sm:w-auto min-h-12" asChild>
                <a href="/profesionales">Soy profesional de salud</a>
              </Button>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 text-xs sm:text-sm text-muted-foreground border-t border-border/40 pt-5 sm:pt-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-biosensor animate-pulse" />
                Geolocalización en vivo
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-biosensor" />
                Oferta y demanda
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-copper" />
                Pago inmediato
              </div>
            </div>
          </div>

          <div className="relative mt-4 lg:mt-0">
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-elegant)] animate-float">
              <img
                src={heroImage}
                alt="Profesional de la salud usando Humanix - Marketplace Uber-like"
                width={1536}
                height={1024}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-auto aspect-[3/2] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cyber/40 via-transparent to-transparent" />
            </div>

            {/* Live Match Animation Card */}
            <div className="hidden md:flex absolute -left-2 lg:-left-4 bottom-6 lg:bottom-10 items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-3 pr-5 shadow-[var(--shadow-card)] animate-in slide-in-from-left max-w-[calc(100%-1rem)]">
              <div className="h-10 w-10 rounded-xl bg-biosensor/15 flex items-center justify-center">
                <Activity className="h-5 w-5 text-biosensor animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Match en vivo</p>
                <p className="text-sm font-semibold">Engativá • 2.4 km • 12 min</p>
              </div>
              <span className="ml-2 h-2.5 w-2.5 rounded-full bg-biosensor animate-pulse" />
            </div>

            {/* Trust Score Card */}
            <div className="hidden md:flex absolute -right-1 lg:-right-2 top-6 lg:top-8 items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-3 pr-5 shadow-[var(--shadow-card)] animate-in slide-in-from-right">
              <div className="h-10 w-10 rounded-xl bg-copper/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-copper" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Social Trust Score</p>
                <p className="text-sm font-semibold">4.9 · RETHUS ✓</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RoleGate open={gateOpen} onOpenChange={setGateOpen} redirectTo="/buscar" />
    </section>
  );
}
