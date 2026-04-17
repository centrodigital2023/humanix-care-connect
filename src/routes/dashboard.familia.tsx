import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Heart,
  Search,
  Plus,
  LayoutDashboard,
  FileText,
  Users,
  Sparkles,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { useAppUser } from "@/hooks/use-app-user";

export const Route = createFileRoute("/dashboard/familia")({
  head: () => ({ meta: [{ title: "Familia · Humanix" }] }),
  component: FamilyDashboard,
});

const NAV: NavItem[] = [
  { label: "Inicio", to: "/dashboard/familia", icon: LayoutDashboard },
  { label: "Buscar", to: "/buscar", icon: Search },
  { label: "Mis solicitudes", to: "/dashboard/familia", icon: FileText },
  { label: "Profesionales", to: "/buscar", icon: Users },
];

type Offer = {
  id: string;
  title: string;
  city: string;
  modality: string;
  amount: number;
  status: string;
  created_at: string;
};

function FamilyDashboard() {
  const { user, loading, logout } = useAppUser({ allow: ["family", "superadmin"] });
  const [dataLoading, setDataLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("job_offers")
        .select("id, title, city, modality, amount, status, created_at")
        .eq("posted_by", user.id)
        .order("created_at", { ascending: false });
      setOffers((data ?? []) as Offer[]);
      setDataLoading(false);
    })();
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
      nav={NAV}
      title={`Hola, ${user.fullName.split(" ")[0]}`}
      subtitle="Encuentra cuidado humano y verificado para tu familia, cuando lo necesites."
      crumbs={[{ label: "Inicio", to: "/" }, { label: "Familia" }]}
      badge={{ label: "Familia", tone: "copper" }}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/buscar">
              <Search className="h-4 w-4 mr-1.5" /> Buscar
            </Link>
          </Button>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-1.5" /> Publicar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        {/* KPIs */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi icon={FileText} label="Solicitudes" value={offers.length} tone="bio" />
          <Kpi icon={Calendar} label="Abiertas" value={open} tone="copper" />
          <Kpi icon={ShieldCheck} label="Cubiertas" value={filled} tone="bio" />
          <Kpi icon={Sparkles} label="Match IA" value={"24/7"} tone="fuchsia" />
        </section>

        {/* Acciones */}
        <section className="grid sm:grid-cols-2 gap-4">
          <ActionCard
            icon={Search}
            title="Encuentra un cuidador"
            desc="Filtra por especialidad, ciudad y disponibilidad. Match en menos de 150 ms."
            cta={
              <Button variant="hero" asChild>
                <Link to="/buscar">Ir al buscador</Link>
              </Button>
            }
          />
          <ActionCard
            icon={Plus}
            title="Publica una solicitud"
            desc="Cuéntanos qué necesitas y la IA te recomienda 5 perfiles ideales en segundos."
            cta={
              <Button variant="copper" disabled>
                Próximamente
              </Button>
            }
          />
        </section>

        {/* Solicitudes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Mis solicitudes</h2>
            <Link to="/buscar" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todas →
            </Link>
          </div>
          {dataLoading ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Cargando…
            </Card>
          ) : offers.length === 0 ? (
            <Card className="p-10 text-center">
              <Heart className="h-8 w-8 text-copper mx-auto mb-3" />
              <p className="font-semibold">Aún no has publicado solicitudes</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Empieza con una búsqueda directa o publica una solicitud para que los profesionales se postulen.
              </p>
              <Button variant="hero" className="mt-4" asChild>
                <Link to="/buscar">Buscar ahora</Link>
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
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border ${
                      o.status === "open"
                        ? "bg-biosensor/10 text-biosensor border-biosensor/30"
                        : o.status === "filled"
                          ? "bg-fuchsia-neural/10 text-fuchsia-neural border-fuchsia-neural/30"
                          : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {o.status}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </section>
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
  icon: typeof FileText;
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

function ActionCard({
  icon: Icon,
  title,
  desc,
  cta,
}: {
  icon: typeof Search;
  title: string;
  desc: string;
  cta: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-biosensor/10 text-biosensor">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4">{cta}</div>
    </Card>
  );
}
