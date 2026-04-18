import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  ShieldAlert,
  Users,
  Briefcase,
  FileCheck,
  Mail,
  Plus,
  Copy,
  LayoutDashboard,
  TrendingUp,
  Mic,
  AlertOctagon,
  Star,
  ScrollText,
  Megaphone,
  MessageSquare,
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
  { label: "Anti-fraude", to: "/superadmin/fraude", icon: ShieldAlert },
  { label: "Auditoría", to: "/superadmin/auditoria", icon: ScrollText },
  { label: "Publicidad", to: "/superadmin/publicidad", icon: Megaphone },
  { label: "CRM", to: "/superadmin/crm", icon: Mail },
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

type AiRating = {
  id: string;
  booking_id: string;
  rated_id: string;
  stars: number;
  ai_sentiment: string | null;
  ai_summary: string | null;
  voice_transcript: string | null;
  voice_url: string | null;
  created_at: string;
};

type Emergency = {
  id: string;
  booking_id: string | null;
  triggered_by: string;
  incident_type: string;
  lat: number | null;
  lng: number | null;
  resolved: boolean;
  created_at: string;
};

function SuperadminPage() {
  const { user, loading, logout } = useAppUser({ allow: ["superadmin"] });
  const [stats, setStats] = useState({ users: 0, professionals: 0, offers: 0, docs: 0 });
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [aiAlerts, setAiAlerts] = useState<AiRating[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("hr_staff");
  const [creating, setCreating] = useState(false);

  const [recentAudit, setRecentAudit] = useState<
    { id: string; action: string; actor_email: string | null; severity: string; created_at: string }[]
  >([]);
  const [fraudCount, setFraudCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    void loadData();

    // Realtime: emergencias + alertas IA + auditoría → auto-refresh
    const ch = supabase
      .channel("superadmin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_incidents" },
        () => void loadData(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_ratings" },
        () => void loadData(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        () => void loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fraud_flags" },
        () => void loadData(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user]);

  const loadData = async () => {
    const [
      { count: users },
      { count: professionals },
      { count: offers },
      { count: docs },
      { data: inv },
      { data: alerts },
      { data: emerg },
      { data: audit },
      { count: fraud },
    ] = await Promise.all([
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
      supabase
        .from("service_ratings")
        .select("id, booking_id, rated_id, stars, ai_sentiment, ai_summary, voice_transcript, voice_url, created_at")
        .eq("ai_alert", true)
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("emergency_incidents")
        .select("id, booking_id, triggered_by, incident_type, lat, lng, resolved, created_at")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("audit_log")
        .select("id, action, actor_email, severity, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("fraud_flags")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false),
    ]);
    setStats({
      users: users ?? 0,
      professionals: professionals ?? 0,
      offers: offers ?? 0,
      docs: docs ?? 0,
    });
    setInvitations((inv ?? []) as Invitation[]);
    setAiAlerts((alerts ?? []) as AiRating[]);
    setEmergencies((emerg ?? []) as Emergency[]);
    setRecentAudit((audit ?? []) as typeof recentAudit);
    setFraudCount(fraud ?? 0);
  };

  const resolveEmergency = async (id: string) => {
    await supabase
      .from("emergency_incidents")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id);
    setEmergencies((prev) => prev.filter((e) => e.id !== id));
    toast.success("Emergencia marcada como resuelta");
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
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Realtime activo
          </Badge>
          {fraudCount > 0 && (
            <Link to="/superadmin/fraude">
              <Badge className="bg-fuchsia-neural text-fuchsia-neural-foreground gap-1.5">
                <ShieldAlert className="h-3 w-3" />
                {fraudCount} fraude{fraudCount === 1 ? "" : "s"} sin resolver
              </Badge>
            </Link>
          )}
        </div>
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

        <section className="grid lg:grid-cols-2 gap-4">
          <Card className="p-6 border-fuchsia-neural/30">
            <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-fuchsia-neural" />
              Emergencias activas
              {emergencies.length > 0 && (
                <Badge className="bg-fuchsia-neural text-fuchsia-neural-foreground">
                  {emergencies.length}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Botones de pánico activados. Línea 123 contactada por el usuario.
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {emergencies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin emergencias activas. ✓</p>
              ) : (
                emergencies.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-lg border border-fuchsia-neural/30 bg-fuchsia-neural/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-fuchsia-neural">
                          {e.incident_type === "panic" ? "Botón de pánico" : e.incident_type}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(e.created_at).toLocaleString("es-CO")}
                        </p>
                        {e.lat && e.lng && (
                          <a
                            href={`https://www.google.com/maps?q=${e.lat},${e.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-biosensor hover:underline"
                          >
                            Ver ubicación →
                          </a>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resolveEmergency(e.id)}
                      >
                        Resolver
                      </Button>
                    </div>
                    {e.booking_id && (
                      <Link
                        to="/servicio/$bookingId"
                        params={{ bookingId: e.booking_id }}
                        className="mt-2 inline-block text-[11px] text-foreground/80 hover:underline"
                      >
                        Abrir servicio relacionado →
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 border-copper/30">
            <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-2">
              <Mic className="h-4 w-4 text-copper" />
              Alertas IA · Voz
              {aiAlerts.length > 0 && (
                <Badge className="bg-copper text-copper-foreground">{aiAlerts.length}</Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Valoraciones por voz marcadas por Gemini con sentimiento negativo o riesgo.
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {aiAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin alertas. Las valoraciones recientes están saludables.
                </p>
              ) : (
                aiAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-copper/30 bg-copper/5 p-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Star className="h-3.5 w-3.5 fill-copper text-copper" />
                      {a.stars}/5 · {a.ai_sentiment ?? "—"}
                    </div>
                    {a.ai_summary && (
                      <p className="mt-1 text-xs text-foreground/80">{a.ai_summary}</p>
                    )}
                    {a.voice_transcript && (
                      <p className="mt-1 text-[11px] italic text-muted-foreground">
                        "{a.voice_transcript.slice(0, 200)}
                        {a.voice_transcript.length > 200 ? "…" : ""}"
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      {a.voice_url && (
                        <a
                          href={a.voice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-biosensor hover:underline"
                        >
                          Escuchar audio
                        </a>
                      )}
                      <Link
                        to="/servicio/$bookingId"
                        params={{ bookingId: a.booking_id }}
                        className="text-foreground/80 hover:underline"
                      >
                        Abrir servicio →
                      </Link>
                      <span className="text-muted-foreground ml-auto">
                        {new Date(a.created_at).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-biosensor" />
                Auditoría reciente
              </h2>
              <Link
                to="/superadmin/auditoria"
                className="text-xs text-biosensor hover:underline"
              >
                Ver todo →
              </Link>
            </div>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay eventos registrados.</p>
            ) : (
              <div className="space-y-1">
                {recentAudit.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          e.severity === "critical"
                            ? "bg-red-500"
                            : e.severity === "error"
                              ? "bg-fuchsia-neural"
                              : e.severity === "warn"
                                ? "bg-copper"
                                : "bg-biosensor"
                        }`}
                      />
                      <span className="font-mono truncate">{e.action}</span>
                      {e.actor_email && (
                        <span className="text-muted-foreground truncate hidden sm:inline">
                          · {e.actor_email}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(e.created_at).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ShortcutCard
            icon={ShieldAlert}
            title="Anti-fraude"
            desc="Revisa y resuelve flags de fraude detectadas por IA."
            to="/superadmin/fraude"
          />
          <ShortcutCard
            icon={ScrollText}
            title="Auditoría"
            desc="Registro inmutable de acciones sensibles con realtime."
            to="/superadmin/auditoria"
          />
          <ShortcutCard
            icon={Megaphone}
            title="Publicidad"
            desc="CRUD de banners con recomendación IA y publicación."
            to="/superadmin/publicidad"
          />
          <ShortcutCard
            icon={MessageSquare}
            title="CRM"
            desc="Contactos, segmentación IA y campañas masivas."
            to="/superadmin/crm"
          />
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
