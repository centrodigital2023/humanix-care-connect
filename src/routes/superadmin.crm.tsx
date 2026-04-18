import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Mail,
  ArrowLeft,
  LayoutDashboard,
  ShieldAlert,
  ScrollText,
  Megaphone,
  Users,
  FileCheck,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { useAppUser } from "@/hooks/use-app-user";

export const Route = createFileRoute("/superadmin/crm")({
  head: () => ({ meta: [{ title: "CRM · Superadmin · Humanix" }] }),
  component: CRMPage,
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

function CRMPage() {
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
      title="CRM"
      subtitle="Contactos, segmentación IA, campañas Resend, interacciones y reportes."
      crumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "CRM" }]}
      badge={{ label: "Próximamente", tone: "fuchsia" }}
    >
      <Card className="p-12 text-center">
        <Mail className="h-12 w-12 text-fuchsia-neural mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Módulo en construcción</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          El CRM completo (contactos, segmentación con IA, campañas masivas con Resend,
          interacciones, tareas y reportes) llega en la próxima entrega. Las tablas ya
          están creadas y listas en el backend.
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
