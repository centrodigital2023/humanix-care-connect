import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Megaphone, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { useAppUser } from "@/hooks/use-app-user";
import {
  LayoutDashboard,
  ShieldAlert,
  ScrollText,
  Mail,
  Users,
  FileCheck,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/superadmin/publicidad")({
  head: () => ({ meta: [{ title: "Publicidad · Superadmin · Humanix" }] }),
  component: PublicidadPage,
});

const NAV: NavItem[] = [
  { label: "Overview", to: "/superadmin", icon: LayoutDashboard },
  { label: "Anti-fraude", to: "/superadmin/fraude", icon: ShieldAlert },
  { label: "Auditoría", to: "/superadmin/auditoria", icon: ScrollText },
  { label: "Publicidad", to: "/superadmin/publicidad", icon: Megaphone },
  { label: "CRM", to: "/superadmin/crm", icon: Mail },
  { label: "Talento Humano", to: "/talento-humano", icon: Users },
  { label: "Evaluador", to: "/evaluador", icon: FileCheck },
  { label: "Marketplace", to: "/buscar", icon: Briefcase },
];

function PublicidadPage() {
  const { user, loading, logout } = useAppUser({ allow: ["superadmin"] });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      onLogout={logout}
      nav={NAV}
      title="Publicidad"
      subtitle="CRUD de banners + IA de recomendación + publicación a redes."
      crumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Publicidad" }]}
      badge={{ label: "Próximamente", tone: "copper" }}
    >
      <Card className="p-12 text-center">
        <Megaphone className="h-12 w-12 text-copper mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Módulo en construcción</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          El módulo de publicidad (CRUD banners, carrusel, vista previa, publicación a
          LinkedIn/Facebook/Twitter/WhatsApp y recomendación IA) llega en la próxima entrega.
        </p>
        <Link to="/superadmin">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Volver al Centro de Control
          </Button>
        </Link>
      </Card>
    </AppShell>
  );
}
