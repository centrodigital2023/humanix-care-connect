import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-cyber p-10 sm:p-16 text-center">
          <div className="absolute inset-0 bg-aurora opacity-80" />
          <div className="absolute inset-0 grid-pattern opacity-30" />

          <div className="relative max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-cyber-foreground leading-tight">
              El cuidado humano,{" "}
              <span className="text-gradient-bio">amplificado por IA</span>.
            </h2>
            <p className="mt-5 text-lg text-cyber-foreground/70">
              Únete a Humanix y sé parte de la red de salud más conectada de
              Colombia.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" size="xl">
                Empezar gratis <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="glass" size="xl" className="text-cyber-foreground border-cyber-foreground/20 hover:bg-cyber-foreground/10">
                Agendar demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
