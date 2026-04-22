import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";
import { CONTACT, SOCIAL_LINKS } from "@/lib/social";

type FooterLink = { label: string; to?: string; href?: string };

const cols: { title: string; links: FooterLink[] }[] = [
  {
    title: "Soluciones",
    links: [
      { label: "Profesionales de salud", to: "/profesionales" },
      { label: "Familias", to: "/familias" },
      { label: "Clínicas e IPS", to: "/talento-humano" },
      { label: "Buscar cuidado", to: "/buscar" },
      { label: "Planes y precios", to: "/planes" },
    ],
  },
  {
    title: "Plataforma",
    links: [
      { label: "Tecnología IA", to: "/tecnologia" },
      { label: "Sobre Humanix", to: "/sobre" },
      { label: "Carreras", to: "/carreras" },
      { label: "Prensa y medios", to: "/prensa" },
      { label: "Contacto", to: "/contacto" },
    ],
  },
  {
    title: "Legal y cumplimiento",
    links: [
      { label: "Términos y condiciones", to: "/terminos" },
      { label: "Política de privacidad", to: "/privacidad" },
      { label: "Habeas Data (Ley 1581)", to: "/habeas-data" },
      { label: "Cumplimiento Min. Salud", to: "/cumplimiento" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Plataforma colombiana de talento humano en salud, con IA en tiempo real, verificación
              RETHUS y pagos inmediatos.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Bogotá · Medellín · Cali · Barranquilla
            </p>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>
                <a
                  href={CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  WhatsApp {CONTACT.phoneDisplay}
                </a>
              </p>
              <p>
                <a
                  href={CONTACT.emailUrl}
                  className="hover:text-foreground transition-colors"
                >
                  {CONTACT.email}
                </a>
              </p>
            </div>
            <div className="mt-5">
              <p className="text-xs font-semibold text-foreground mb-2">Síguenos en redes</p>
              <SocialIcons size="sm" />
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
              humanix.lat
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold mb-3">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link
                        to={l.to as never}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href ?? "#"}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label}${s.handle ? ` ${s.handle}` : ""}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/40"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.brandColor }}
                  aria-hidden="true"
                />
                <span className="font-medium text-foreground/80">{s.label}</span>
                {s.handle ? (
                  <span className="hidden sm:inline text-muted-foreground/80">{s.handle}</span>
                ) : null}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Humanix Colombia · humanix.lat · Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              Hecho con <span className="text-fuchsia-neural">♥</span> en Colombia
            </p>
            <span className="text-muted-foreground/40">·</span>
            <Link
              to="/auth"
              search={{ staff: "1" } as never}
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-foreground transition-colors"
              title="Acceso staff"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
