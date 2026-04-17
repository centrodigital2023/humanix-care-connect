import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const cols = [
  {
    title: "Producto",
    links: ["Profesionales", "Familias", "Clínicas", "Tecnología IA"],
  },
  {
    title: "Empresa",
    links: ["Sobre Humanix", "Carreras", "Prensa", "Contacto"],
  },
  {
    title: "Legal",
    links: ["Términos", "Privacidad", "Habeas Data", "Cumplimiento Min. Salud"],
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
              Plataforma colombiana de talento humano en salud, con IA en
              tiempo real, verificación RETHUS y pagos inmediatos.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Bogotá · Medellín · Cali · Barranquilla
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold mb-3">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Humanix Colombia · Todos los derechos
            reservados.
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
