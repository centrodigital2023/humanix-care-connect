import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Shield,
  Users,
  Briefcase,
  FileCheck,
  Mail,
  Plus,
  Copy,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { useAppUser } from "@/hooks/use-app-user";

export const Route = createFileRoute("/superadmin")({
  head: () => ({ meta: [{ title: "Superadmin · Humanix" }] }),
  component: SuperadminPage,
});

type AppRole =
  | "professional"
  | "family"
  | "institution"
  | "superadmin"
  | "hr_staff"
  | "evaluator";

const NAV: NavItem[] = [
  { label: "Overview", to: "/superadmin", icon: LayoutDashboard },
  { label: "Talento Humano", to: "/talento-humano", icon: Users },
  { label: "Evaluador", to: "/evaluador", icon: FileCheck },
  { label: "Marketplace", to: "/buscar", icon: Briefcase },
];

type Invitation = {
  id: string;
  email: string;
  role: AppRole;
  token: string;
  used_at: string | null;
  created_at: string;
};

function SuperadminPage() {
  const { user, loading, logout } = useAppUser({ allow: ["superadmin"] });
  const [stats, setStats] = useState({ users: 0, professionals: 0, offers: 0, docs: 0 });
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("hr_staff");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [{ count: users }, { count: professionals }, { count: offers }, { count: docs }, { data: inv }] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("professional_profiles").select("*", { count: "exact", head: true }),
        supabase.from("job_offers").select("*", { count: "exact", head: true }),
        supabase
          .from("professional_documents")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("staff_invitations")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
    setStats({
      users: users ?? 0,
      professionals: professionals ?? 0,
      offers: offers ?? 0,
      docs: docs ?? 0,
    });
    setInvitations((inv ?? []) as Invitation[]);
  };

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setCreating(true);
    const { error } = await supabase.from("staff_invitations").insert({
      email,
      role,
      created_by: user?.id,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Invitación creada para ${email}`);
    setEmail("");
    await loadData();
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado");
  };

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
      title="Centro de control"
      subtitle="Métricas globales, gobernanza de roles y salud operativa de la plataforma."
      crumbs={[{ label: "Inicio", to: "/" }, { label: "Superadmin" }]}
      badge={{ label: "Superadmin", tone: "fuchsia" }}
    >
      <div className="space-y-8">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Users} label="Usuarios" value={stats.users} tone="bio" />
          <Stat icon={Briefcase} label="Profesionales" value={stats.professionals} tone="copper" />
          <Stat icon={FileCheck} label="Ofertas" value={stats.offers} tone="bio" />
          <Stat icon={Mail} label="Docs pendientes" value={stats.docs} tone="fuchsia" />
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-biosensor" /> Invitar staff
            </h2>
            <form onSubmit={createInvitation} className="space-y-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@humanix.co"
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr_staff">RRHH (Talento humano)</SelectItem>
                    <SelectItem value="evaluator">Evaluador</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={creating} variant="hero" className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear invitación"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Invitaciones recientes</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {invitations.length === 0 && (
                <p className="text-sm text-muted-foreground">Aún no hay invitaciones.</p>
              )}
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">{inv.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.used_at ? (
                      <Badge variant="secondary">Usada</Badge>
                    ) : (
                      <Badge>Activa</Badge>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => copyToken(inv.token)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid sm:grid-cols-3 gap-3">
          <ShortcutCard
            icon={Users}
            title="Talento Humano"
            desc="Verifica profesionales y gestiona el roster activo."
            to="/talento-humano"
          />
          <ShortcutCard
            icon={FileCheck}
            title="Evaluador"
            desc="Revisa documentos pendientes y aprueba RETHUS."
            to="/evaluador"
          />
          <ShortcutCard
            icon={TrendingUp}
            title="Marketplace"
            desc="Inspecciona ofertas en vivo y métricas de match."
            to="/buscar"
          />
        </section>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "bio" | "copper" | "fuchsia";
}) {
  const colors = {
    bio: "text-biosensor bg-biosensor/10",
    copper: "text-copper bg-copper/10",
    fuchsia: "text-fuchsia-neural bg-fuchsia-neural/10",
  }[tone];
  return (
    <Card className="p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${colors}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-bold font-display">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </Card>
  );
}

function ShortcutCard({
  icon: Icon,
  title,
  desc,
  to,
}: {
  icon: typeof Users;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-border bg-card p-5 hover:border-biosensor/40 hover:-translate-y-0.5 transition-all shadow-[var(--shadow-card)]"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-biosensor/10 text-biosensor">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      <p className="mt-3 text-xs text-biosensor font-medium">Abrir →</p>
    </Link>
  );
}
