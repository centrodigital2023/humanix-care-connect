import {
  Calendar,
  Wallet,
  Award,
  Bot,
  Search,
  ShieldCheck,
  Heart,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const pro = [
  { icon: Calendar, title: "Turnos a tu medida", desc: "Por hora, jornada o paquetes prepago. Acepta desde WhatsApp." },
  { icon: Wallet, title: "Pago inmediato", desc: "Cobra en Nequi, PSE o RappiPay al terminar el turno." },
  { icon: Award, title: "Reputación digital", desc: "Insignias, Trust Score y verificación RETHUS visibles." },
  { icon: Bot, title: "Humanix Assistant", desc: "IA que prepara tu entrevista y resume historiales clínicos." },
];

const fam = [
  { icon: Search, title: "Encuentra en minutos", desc: "Selecciona fecha, hora y zona. Te mostramos los mejores match." },
  { icon: ShieldCheck, title: "100% verificados", desc: "Cédula, RETHUS y biometría facial validados con IA." },
  { icon: Heart, title: "Monitoreo en vivo", desc: "ETA del cuidador, signos vitales y botón de emergencia." },
  { icon: PhoneCall, title: "Soporte 24/7", desc: "WhatsApp directo y respaldo de pólizas Sura y Colsanitas." },
];

function Card({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: typeof Calendar;
  title: string;
  desc: string;
  accent: "bio" | "copper";
}) {
  const colors =
    accent === "bio"
      ? "bg-biosensor/10 text-biosensor border-biosensor/20"
      : "bg-copper/10 text-copper border-copper/20";
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 hover:border-foreground/20 hover:-translate-y-1 transition-all duration-300 shadow-[var(--shadow-card)]">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${colors}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

export function AudienceSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-24">
        {/* Profesionales */}
        <div id="profesionales" className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4">
            <span className="text-xs uppercase tracking-[0.2em] text-biosensor font-semibold">
              Para profesionales
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold leading-tight">
              Tu carrera en salud,{" "}
              <span className="text-gradient-bio">sin fricción</span>.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Trabaja cuando quieras, donde quieras. Construye reputación
              verificable y cobra al instante por cada turno completado.
            </p>
            <Button variant="hero" size="lg" className="mt-6">
              Crear perfil profesional
            </Button>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
            {pro.map((c) => (
              <Card key={c.title} {...c} accent="bio" />
            ))}
          </div>
        </div>

        {/* Familias */}
        <div id="familias" className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 lg:order-2">
            <span className="text-xs uppercase tracking-[0.2em] text-copper font-semibold">
              Para familias
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold leading-tight">
              Cuidado de confianza,{" "}
              <span className="text-copper">a un toque</span>.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Contrata cuidadores certificados en minutos, con monitoreo en
              tiempo real y respaldo de pólizas médicas reconocidas.
            </p>
            <Button variant="copper" size="lg" className="mt-6">
              Buscar cuidador ahora
            </Button>
          </div>
          <div className="lg:col-span-8 lg:order-1 grid sm:grid-cols-2 gap-4">
            {fam.map((c) => (
              <Card key={c.title} {...c} accent="copper" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
