import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, Shield, Users, Briefcase, FileCheck, Mail, Plus, Copy } from "lucide-react";
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
import { Navbar } from "@/components/humanix/Navbar";

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

function SuperadminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, professionals: 0, offers: 0, docs: 0 });
  const [invitations, setInvitations] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("hr_staff");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id);
      const isAdmin = roles?.some((r) => r.role === "superadmin");
      if (!isAdmin) {
        toast.error("Acceso restringido. Solo superadministradores.");
        navigate({ to: "/dashboard" });
        return;
      }
      if (!active) return;
      await loadData();
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

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
    setInvitations(inv ?? []);
  };

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setCreating(true);
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await supabase.from("staff_invitations").insert({
      email,
      role,
      created_by: sess.session?.user.id,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel Superadmin</h1>
            <p className="text-sm text-muted-foreground">Control total de la plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Usuarios" value={stats.users} />
          <StatCard icon={Briefcase} label="Profesionales" value={stats.professionals} />
          <StatCard icon={FileCheck} label="Ofertas" value={stats.offers} />
          <StatCard icon={Mail} label="Docs pendientes" value={stats.docs} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Invitar staff
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
            <h2 className="font-semibold mb-4">Invitaciones recientes</h2>
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
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/talento-humano">Ir a Talento Humano</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/evaluador">Ir a Evaluador</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/buscar">Ver marketplace</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}
