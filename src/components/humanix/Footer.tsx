import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";
import { CONTACT } from "@/lib/social";

type FooterLink = { label: string; to?: string; href?: string };

const cols: { title: string; links: FooterLink[] }[] = [
  {
    title: "Producto",
    links: [
      { label: "Profesionales", to: "/profesionales" },
      { label: "Familias", to: "/familias" },
      { label: "Clínicas", to: "/talento-humano" },
      { label: "Tecnología IA", to: "/tecnologia" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Humanix", to: "/sobre" },
      { label: "Carreras", to: "/carreras" },
      { label: "Prensa", to: "/prensa" },
      { label: "Contacto", to: "/contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos", to: "/terminos" },
      { label: "Privacidad", to: "/privacidad" },
      { label: "Habeas Data", to: "/habeas-data" },
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
              <p className="text-xs font-semibold text-foreground mb-2">Síguenos</p>
              <SocialIcons size="sm" />
            </div>
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

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Humanix Colombia · Todos los derechos reservados.
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
