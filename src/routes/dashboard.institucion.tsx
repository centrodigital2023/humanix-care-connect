import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Building2,
  LayoutDashboard,
  Briefcase,
  Users,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  MessageSquare,
  Crown,
  Inbox,
  Phone,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { OffersMap, type MapPoint } from "@/components/humanix/OffersMap";
import { HiringCopilot } from "@/components/humanix/HiringCopilot";
import {
  BulkOffersModule,
  PatientsModule,
  AgendaModule,
  ReportsModule,
} from "@/components/humanix/InstitutionModules";
import { useAppUser } from "@/hooks/use-app-user";

export const Route = createFileRoute("/dashboard/institucion")({
  head: () => ({ meta: [{ title: "Institución · Humanix" }] }),
  component: InstitutionDashboard,
});

const getNav = (): NavItem[] => [
  { label: "Inicio", to: "/dashboard/institucion", icon: LayoutDashboard },
  { label: "Ofertas", to: "/dashboard/institucion", icon: Briefcase },
  { label: "Mensajes", to: "/mensajes", icon: MessageSquare },
  { label: "Talento", to: "/buscar", icon: Users },
  { label: "Buscar", to: "/buscar", icon: Search },
  { label: "Planes", to: "/planes", icon: Crown },
];

type Offer = {
  id: string;
  title: string;
  city: string;
  modality: string;
  amount: number;
  status: string;
  lat: number | null;
  lng: number | null;
  reserved_until: string | null;
};

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  proposed_amount: number | null;
  message: string | null;
  professional_id: string;
  job_offer_id: string;
};

type ProSummary = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  specialty: string | null;
  avg_rating: number | null;
  hourly_rate: number | null;
  phone: string | null;
};

function waLink(phone: string | null | undefined, text: string) {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, "");
  const normalized = clean.startsWith("57") ? clean : `57${clean}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

function InstitutionDashboard() {
  const { user, loading, logout } = useAppUser({ allow: ["institution", "superadmin"] });
  const [dataLoading, setDataLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [proMap, setProMap] = useState<Record<string, ProSummary>>({});

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("job_offers")
          .select("id, title, city, modality, amount, status, lat, lng, reserved_until")
          .eq("posted_by", user.id)
          .order("created_at", { ascending: false });
        if (!active) return;
        if (error) console.warn("[institucion dashboard] offers error:", error.message);
        const offerList = (data ?? []) as Offer[];
        setOffers(offerList);

        const offerIds = offerList.map((o) => o.id);
        if (offerIds.length > 0) {
          const { data: appsData } = await supabase
            .from("applications")
            .select(
              "id, status, created_at, proposed_amount, message, professional_id, job_offer_id",
            )
            .in("job_offer_id", offerIds)
            .order("created_at", { ascending: false })
            .limit(80);
          const apps = (appsData ?? []) as ApplicationRow[];
          setApplications(apps);

          const proIds = Array.from(new Set(apps.map((a) => a.professional_id)));
          if (proIds.length > 0) {
            const [proRowsRes, profilesRowsRes] = await Promise.all([
              supabase
                .from("professional_profiles")
                .select("user_id, specialty, avg_rating, hourly_rate")
                .in("user_id", proIds),
              supabase
                .from("profiles")
                .select("user_id, full_name, avatar_url, city, phone")
                .in("user_id", proIds),
            ]);
            const map: Record<string, ProSummary> = {};
            (proRowsRes.data ?? []).forEach((r) => {
              map[r.user_id] = {
                user_id: r.user_id,
                full_name: null,
                avatar_url: null,
                city: null,
                specialty: r.specialty,
                avg_rating: r.avg_rating,
                hourly_rate: r.hourly_rate,
                phone: null,
              };
            });
            (profilesRowsRes.data ?? []).forEach((p) => {
              const existing = map[p.user_id] ?? {
                user_id: p.user_id,
                full_name: null,
                avatar_url: null,
                city: null,
                specialty: null,
                avg_rating: null,
                hourly_rate: null,
                phone: null,
              };
              map[p.user_id] = {
                ...existing,
                full_name: p.full_name,
                avatar_url: p.avatar_url,
                city: p.city,
                phone: p.phone,
              };
            });
            setProMap(map);
          }
        }
      } catch (err) {
        console.error("[institucion dashboard] load failed:", err);
      } finally {
        if (active) setDataLoading(false);
      }
    })();
    const safety = setTimeout(() => {
      if (active) setDataLoading(false);
    }, 8000);
    return () => {
      active = false;
      clearTimeout(safety);
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  const open = offers.filter((o) => o.status === "open").length;
  const filled = offers.filter((o) => o.status === "filled").length;
  const pendingApps = applications.filter((a) => a.status === "pending").length;

  return (
    <AppShell
      user={user}
      onLogout={logout}
      nav={getNav()}
      title="Panel institución"
      subtitle="Gestiona tus ofertas, talento aplicado y métricas operativas en tiempo real."
      crumbs={[{ label: "Inicio", to: "/" }, { label: "Institución" }]}
      badge={{ label: "IPS / Clínica", tone: "fuchsia" }}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/buscar">
              <Search className="h-4 w-4 mr-1.5" /> Buscar talento
            </Link>
          </Button>
          <HiringCopilot />
        </>
      }
    >
      <div className="space-y-8">
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi icon={Briefcase} label="Ofertas" value={offers.length} tone="bio" />
          <Kpi icon={Clock} label="Abiertas" value={open} tone="copper" />
          <Kpi icon={Inbox} label="Postulaciones" value={pendingApps} tone="fuchsia" />
          <Kpi icon={CheckCircle2} label="Cubiertas" value={filled} tone="bio" />
        </section>

        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="bulk">Ofertas masivas + IA</TabsTrigger>
            <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-8 mt-4">
        {/* Buzón */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5 text-fuchsia-neural" />
              Buzón de postulaciones
            </h2>
            <span className="text-xs text-muted-foreground">{applications.length} en total</span>
          </div>
          {dataLoading ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando…
            </Card>
          ) : applications.length === 0 ? (
            <Card className="p-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">Aún no tienes postulaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Publica una oferta o busca talento directamente.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {applications.map((a) => {
                const pro = proMap[a.professional_id];
                const offer = offers.find((o) => o.id === a.job_offer_id);
                const wa = waLink(
                  pro?.phone,
                  `Hola ${pro?.full_name ?? ""}, te escribo desde Humanix por tu postulación a "${offer?.title ?? "nuestra oferta"}".`,
                );
                const stars = pro?.avg_rating ?? 0;
                return (
                  <Card key={a.id} className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {pro?.avatar_url ? (
                        <img
                          src={pro.avatar_url}
                          alt={pro.full_name ?? ""}
                          className="h-12 w-12 rounded-full object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                          {(pro?.full_name ?? "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold truncate">
                            {pro?.full_name ?? "Profesional"}
                          </p>
                          {stars > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-copper">
                              <Star className="h-3 w-3 fill-copper" />
                              {Number(stars).toFixed(1)}
                            </span>
                          )}
                          <StatusPill status={a.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pro?.specialty ?? "Profesional de la salud"} · {pro?.city ?? "—"}
                          {pro?.hourly_rate
                            ? ` · $${pro.hourly_rate.toLocaleString("es-CO")}/h`
                            : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Para:{" "}
                          <span className="font-medium text-foreground">
                            {offer?.title ?? "Oferta"}
                          </span>
                          {a.proposed_amount
                            ? ` · Propone $${a.proposed_amount.toLocaleString("es-CO")} COP`
                            : ""}
                        </p>
                        {a.message && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                            "{a.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 sm:w-40 shrink-0">
                      <Button size="sm" variant="hero" asChild className="flex-1">
                        <Link to="/profesional/$proId" params={{ proId: a.professional_id }}>
                          Ver perfil
                        </Link>
                      </Button>
                      {wa && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex-1 border-biosensor/40 text-biosensor hover:bg-biosensor/5"
                        >
                          <a href={wa} target="_blank" rel="noopener noreferrer">
                            <Phone className="h-3.5 w-3.5 mr-1" /> WhatsApp
                          </a>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Ofertas publicadas</h2>
            <Link to="/buscar" className="text-xs text-muted-foreground hover:text-foreground">
              Ver marketplace →
            </Link>
          </div>
          {offers.length === 0 ? (
            <Card className="p-10 text-center">
              <Building2 className="h-8 w-8 text-fuchsia-neural mx-auto mb-3" />
              <p className="font-semibold">Sin ofertas activas</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Publica tu primera oferta <span className="font-semibold text-emerald-600">gratis</span> y la IA la distribuirá a los profesionales que mejor encajan.
              </p>
              <div className="mt-4 flex justify-center">
                <HiringCopilot />
              </div>
            </Card>
          ) : (
            <div className="grid gap-3">
              {offers.map((o) => (
                <Card key={o.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.city} · {o.modality} · ${o.amount.toLocaleString("es-CO")} COP
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                </Card>
              ))}
            </div>
          )}
        </section>

        {offers.some((o) => o.lat != null && o.lng != null) && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-3">Mapa de tus ofertas</h2>
            <OffersMap
              points={offers
                .filter((o) => o.lat != null && o.lng != null)
                .map<MapPoint>((o) => ({
                  id: o.id,
                  lat: o.lat as number,
                  lng: o.lng as number,
                  title: o.title,
                  subtitle: `${o.city} · ${o.status === "open" ? "Disponible" : o.status === "filled" ? "Tomado" : "Cerrada"}`,
                  status: o.status === "filled" ? "reserved" : "available",
                }))}
              height={360}
            />
          </section>
        )}
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <BulkOffersModule userId={user.id} />
          </TabsContent>
          <TabsContent value="pacientes" className="mt-4">
            <PatientsModule userId={user.id} />
          </TabsContent>
          <TabsContent value="agenda" className="mt-4">
            <AgendaModule userId={user.id} />
          </TabsContent>
          <TabsContent value="reportes" className="mt-4">
            <ReportsModule userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-biosensor/10 text-biosensor border-biosensor/30",
    pending: "bg-copper/10 text-copper border-copper/30",
    accepted: "bg-fuchsia-neural/10 text-fuchsia-neural border-fuchsia-neural/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
    filled: "bg-fuchsia-neural/10 text-fuchsia-neural border-fuchsia-neural/30",
    closed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border ${
        map[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number | string;
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
