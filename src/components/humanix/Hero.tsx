import { useState } from "react";
import { ArrowRight, Sparkles, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-humanix.jpg";
import { RoleGate } from "./RoleGate";

export function Hero() {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-biosensor/30 bg-biosensor/10 px-3.5 py-1.5 text-xs font-medium text-biosensor">
              <Sparkles className="h-3.5 w-3.5" />
              IA en tiempo real · Hecho en Colombia
            </div>

            <h1 className="mt-6 font-display text-[clamp(2rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-tight">
              Talento humano en salud,{" "}
              <span className="text-gradient-bio">conectado al instante</span>.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
              centrodigital2023@gmail.com
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="xl" className="w-full sm:w-auto" onClick={() => setGateOpen(true)}>
                Buscar cuidador <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="glass" size="xl" className="w-full sm:w-auto" asChild>
                <a href="/profesionales">Soy profesional de salud</a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-biosensor animate-pulse-ring" />
                847 profesionales verificados
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-biosensor" />
                Match en &lt;150 ms
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-copper" />
                Bogotá · Medellín · Cali
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-elegant)] animate-float">
              <img
                src={heroImage}
                alt="Profesional de la salud usando Humanix con interfaz de IA en tiempo real"
                width={1536}
                height={1024}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cyber/40 via-transparent to-transparent" />
            </div>

            <div className="hidden sm:flex absolute -left-4 bottom-10 items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-3.5 pr-5 shadow-[var(--shadow-card)]">
              <div className="h-10 w-10 rounded-xl bg-biosensor/15 flex items-center justify-center">
                <Activity className="h-5 w-5 text-biosensor" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Match urgente</p>
                <p className="text-sm font-semibold">Engativá · 2h · $45.000</p>
              </div>
              <span className="ml-2 h-2.5 w-2.5 rounded-full bg-biosensor animate-pulse-ring" />
            </div>

            <div className="hidden sm:flex absolute -right-2 top-8 items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-3.5 pr-5 shadow-[var(--shadow-card)]">
              <div className="h-10 w-10 rounded-xl bg-copper/15 flex items-center justify-center text-copper font-bold">
                98
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Social Trust Score</p>
                <p className="text-sm font-semibold">Verificado RETHUS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RoleGate open={gateOpen} onOpenChange={setGateOpen} redirectTo="/buscar" />
    </section>
  );
}
