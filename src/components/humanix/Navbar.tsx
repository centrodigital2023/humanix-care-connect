import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useTheme } from "@/hooks/use-theme";

const links = [
  { href: "#profesionales", label: "Profesionales" },
  { href: "#familias", label: "Familias" },
  { href: "#tecnologia", label: "Tecnología IA" },
  { href: "#planes", label: "Planes" },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
        <Logo />

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Iniciar sesión
          </Button>
          <Button variant="hero" size="sm" className="hidden sm:inline-flex">
            Empezar gratis
          </Button>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menú"
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-foreground/5"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col px-4 py-3 gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              >
                {l.label}
              </a>
            ))}
            <Button variant="hero" size="sm" className="mt-2 w-full">
              Empezar gratis
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
