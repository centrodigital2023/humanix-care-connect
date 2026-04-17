import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Building2,
  Plus,
  LayoutDashboard,
  Briefcase,
  Users,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  MessageSquare,
  Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { OffersMap, type MapPoint } from "@/components/humanix/OffersMap";
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

function InstitutionDashboard() {
  const { user, loading, logout } = useAppUser({ allow: ["institution", "superadmin"] });
  const [dataLoading, setDataLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);

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
        if (error) {
          // eslint-disable-next-line no-console
          console.warn("[institucion dashboard] offers error:", error.message);
        }
        setOffers((data ?? []) as Offer[]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[institucion dashboard] load failed:", err);
      } finally {
        if (active) setDataLoading(false);
      }
    })();
    const safety = setTimeout(() => {
      if (active) setDataLoading(false);
    }, 6000);
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
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-1.5" /> Nueva oferta
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi icon={Briefcase} label="Ofertas" value={offers.length} tone="bio" />
          <Kpi icon={Clock} label="Abiertas" value={open} tone="copper" />
          <Kpi icon={CheckCircle2} label="Cubiertas" value={filled} tone="bio" />
          <Kpi icon={TrendingUp} label="Match rate" value={"94%"} tone="fuchsia" />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Ofertas publicadas</h2>
            <Link to="/buscar" className="text-xs text-muted-foreground hover:text-foreground">
              Ver marketplace →
            </Link>
          </div>
          {dataLoading ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando…
            </Card>
          ) : offers.length === 0 ? (
            <Card className="p-10 text-center">
              <Building2 className="h-8 w-8 text-fuchsia-neural mx-auto mb-3" />
              <p className="font-semibold">Sin ofertas activas</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Publica tu primera oferta y la IA distribuirá a los profesionales que mejor encajan.
              </p>
              <Button variant="hero" className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" /> Crear oferta
              </Button>
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
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border bg-biosensor/10 text-biosensor border-biosensor/30">
                    {o.status}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Mapa de ofertas geolocalizadas */}
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
      </div>
    </AppShell>
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
