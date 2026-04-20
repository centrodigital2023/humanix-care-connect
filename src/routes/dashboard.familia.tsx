import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Heart,
  Search,
  LayoutDashboard,
  FileText,
  Users,
  Sparkles,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Crown,
  Phone,
  MapPin,
  Star,
  Inbox,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { HiringCopilot } from "@/components/humanix/HiringCopilot";
import { OffersMap, type MapPoint } from "@/components/humanix/OffersMap";
import { LocationPicker } from "@/components/humanix/LocationPicker";
import { distanceKm, formatKm } from "@/lib/geo";
import { toast } from "sonner";
import { useAppUser } from "@/hooks/use-app-user";

export const Route = createFileRoute("/dashboard/familia")({
  head: () => ({ meta: [{ title: "Familia · Humanix" }] }),
  component: FamilyDashboard,
});

const getNav = (): NavItem[] => [
  { label: "Inicio", to: "/dashboard/familia", icon: LayoutDashboard },
  { label: "Buscar", to: "/buscar", icon: Search },
  { label: "Mensajes", to: "/mensajes", icon: MessageSquare },
  { label: "Mis solicitudes", to: "/dashboard/familia", icon: FileText },
  { label: "Profesionales", to: "/buscar", icon: Users },
  { label: "Planes", to: "/planes", icon: Crown },
];

type Offer = {
  id: string;
  title: string;
  city: string;
  modality: string;
  amount: number;
  status: string;
  created_at: string;
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

type NearbyOffer = {
  id: string;
  title: string;
  city: string;
  amount: number;
  modality: string;
  posted_by: string;
  created_at: string;
};

type NearbyPro = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  specialty: string | null;
  avg_rating: number | null;
  hourly_rate: number | null;
  lat: number | null;
  lng: number | null;
  km: number | null;
};

function waLink(phone: string | null | undefined, text: string) {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, "");
  const normalized = clean.startsWith("57") ? clean : `57${clean}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

function FamilyDashboard() {
  const { user, loading, logout } = useAppUser({ allow: ["family", "superadmin"] });
  const [dataLoading, setDataLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [proMap, setProMap] = useState<Record<string, ProSummary>>({});
  const [nearby, setNearby] = useState<NearbyOffer[]>([]);
  const [familyCity, setFamilyCity] = useState<string>("Bogotá");
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [familyCoords, setFamilyCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [familyAddress, setFamilyAddress] = useState<string>("");
  const [nearbyPros, setNearbyPros] = useState<NearbyPro[]>([]);
  const [savingLoc, setSavingLoc] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [offersRes, famRes, profRes] = await Promise.all([
          supabase
            .from("job_offers")
            .select("id, title, city, modality, amount, status, created_at, lat, lng, reserved_until")
            .eq("posted_by", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("family_profiles")
            .select("id_number, default_address, default_lat, default_lng, emergency_contact_phone, habeas_data_accepted")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("city")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);
        if (!active) return;

        const offerList = (offersRes.data ?? []) as Offer[];
        setOffers(offerList);

        const fam = famRes.data;
        setOnboardingComplete(
          !!(fam?.id_number && fam?.default_address && fam?.emergency_contact_phone && fam?.habeas_data_accepted),
        );
        setFamilyCoords({
          lat: fam?.default_lat ?? null,
          lng: fam?.default_lng ?? null,
        });
        setFamilyAddress(fam?.default_address ?? "");

        const myCity = profRes.data?.city ?? offerList[0]?.city ?? "Bogotá";
        setFamilyCity(myCity);

        // Buzón de postulaciones a MIS ofertas
        const offerIds = offerList.map((o) => o.id);
        if (offerIds.length > 0) {
          const { data: appsData } = await supabase
            .from("applications")
            .select("id, status, created_at, proposed_amount, message, professional_id, job_offer_id")
            .in("job_offer_id", offerIds)
            .order("created_at", { ascending: false })
            .limit(50);
          const apps = (appsData ?? []) as ApplicationRow[];
          setApplications(apps);

          // Cargar info de profesionales que se postularon
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

        // Ofertas cercanas (mismo city) que NO son mías y están open
        const { data: nearbyData } = await supabase
          .from("job_offers")
          .select("id, title, city, amount, modality, posted_by, created_at")
          .eq("status", "open")
          .ilike("city", `%${myCity}%`)
          .neq("posted_by", user.id)
          .order("created_at", { ascending: false })
          .limit(6);
        setNearby((nearbyData ?? []) as NearbyOffer[]);

        // Profesionales cercanos (con lat/lng) — calcula distancia si la familia tiene coords
        const { data: prosData } = await supabase
          .from("professional_profiles")
          .select("user_id, specialty, avg_rating, hourly_rate, lat, lng, home_city, active, published")
          .eq("active", true)
          .eq("published", true)
          .not("lat", "is", null)
          .not("lng", "is", null)
          .limit(60);
        const proIds2 = (prosData ?? []).map((p) => p.user_id);
        let nameMap = new Map<string, { full_name: string | null; avatar_url: string | null; city: string | null }>();
        if (proIds2.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url, city")
            .in("user_id", proIds2);
          nameMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
        }
        const fLat = fam?.default_lat ?? null;
        const fLng = fam?.default_lng ?? null;
        const computed: NearbyPro[] = (prosData ?? []).map((p) => {
          const info = nameMap.get(p.user_id);
          const km =
            fLat != null && fLng != null && p.lat != null && p.lng != null
              ? distanceKm({ lat: fLat, lng: fLng }, { lat: p.lat, lng: p.lng })
              : null;
          return {
            user_id: p.user_id,
            full_name: info?.full_name ?? null,
            avatar_url: info?.avatar_url ?? null,
            city: info?.city ?? p.home_city ?? null,
            specialty: p.specialty,
            avg_rating: p.avg_rating,
            hourly_rate: p.hourly_rate,
            lat: p.lat,
            lng: p.lng,
            km,
          };
        });
        computed.sort((a, b) => {
          if (a.km == null && b.km == null) return 0;
          if (a.km == null) return 1;
          if (b.km == null) return -1;
          return a.km - b.km;
        });
        setNearbyPros(computed.slice(0, 8));
      } catch (err) {
        console.error("[familia dashboard] load failed:", err);
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

  const saveLocation = async (lat: number, lng: number, address?: string) => {
    if (!user) return;
    setSavingLoc(true);
    try {
      const updates: Record<string, unknown> = { default_lat: lat, default_lng: lng };
      if (address && !familyAddress) {
        updates.default_address = address;
        setFamilyAddress(address);
      }
      const { error } = await supabase
        .from("family_profiles")
        .upsert({ user_id: user.id, ...updates } as never, { onConflict: "user_id" });
      if (error) throw error;
      setFamilyCoords({ lat, lng });
      // Recalcular distancias con la nueva ubicación
      setNearbyPros((prev) =>
        [...prev]
          .map((p) => ({
            ...p,
            km:
              p.lat != null && p.lng != null
                ? distanceKm({ lat, lng }, { lat: p.lat, lng: p.lng })
                : null,
          }))
          .sort((a, b) => {
            if (a.km == null && b.km == null) return 0;
            if (a.km == null) return 1;
            if (b.km == null) return -1;
            return a.km - b.km;
          }),
      );
      toast.success("📍 Ubicación guardada — distancias actualizadas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la ubicación");
    } finally {
      setSavingLoc(false);
    }
  };

  return (
    <AppShell
      user={user}
      onLogout={logout}
      nav={getNav()}
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
          <HiringCopilot />
        </>
      }
    >
      <div className="space-y-8">
        {/* Banner perfil — siempre visible (completar o editar) */}
        {!dataLoading && (
          <Card
            className={`p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
              onboardingComplete
                ? "border-biosensor/40 bg-gradient-to-br from-biosensor/10 to-transparent"
                : "border-copper/40 bg-gradient-to-br from-copper/10 to-transparent"
            }`}
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                onboardingComplete ? "bg-biosensor/15 text-biosensor" : "bg-copper/15 text-copper"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base sm:text-lg font-semibold">
                {onboardingComplete
                  ? "Tu perfil familiar está completo"
                  : "Completa tu perfil para contratar de forma segura"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {onboardingComplete
                  ? "Puedes actualizar tus datos, contacto de emergencia o foto cuando quieras."
                  : "Te tomará menos de 2 minutos: foto, cédula, dirección y contacto de emergencia."}
              </p>
            </div>
            <Button variant={onboardingComplete ? "outline" : "copper"} asChild>
              <Link to="/dashboard/familia/onboarding">
                {onboardingComplete ? "Editar perfil" : "Completar ahora"}
              </Link>
            </Button>
          </Card>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi icon={FileText} label="Solicitudes" value={offers.length} tone="bio" />
          <Kpi icon={Calendar} label="Abiertas" value={open} tone="copper" />
          <Kpi icon={Inbox} label="Postulaciones" value={pendingApps} tone="fuchsia" />
          <Kpi icon={ShieldCheck} label="Cubiertas" value={filled} tone="bio" />
        </section>

        {/* Buzón de postulaciones */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5 text-fuchsia-neural" />
              Buzón de postulaciones
            </h2>
            <span className="text-xs text-muted-foreground">
              {applications.length} en total
            </span>
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
                Publica una solicitud o usa el buscador para encontrar profesionales.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {Array.from(new Map(applications.map((a) => [a.id, a])).values()).map((a) => {
                const pro = proMap[a.professional_id];
                const offer = offers.find((o) => o.id === a.job_offer_id);
                const wa = waLink(
                  pro?.phone,
                  `Hola ${pro?.full_name ?? ""}, te escribo desde Humanix por tu postulación a "${offer?.title ?? "mi solicitud"}".`,
                );
                const stars = pro?.avg_rating ?? 0;
                return (
                  <Card key={`app-${a.id}`} className="p-4 flex flex-col sm:flex-row gap-4">
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
                          Para: <span className="font-medium text-foreground">{offer?.title ?? "Solicitud"}</span>
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
                        <Link
                          to="/profesional/$proId"
                          params={{ proId: a.professional_id }}
                        >
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

        {/* Ofertas cercanas en mi ciudad (otras familias / instituciones publicaron) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-biosensor" />
              Cuidadores activos cerca de ti
            </h2>
            <Link to="/buscar" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todos →
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Otras solicitudes en {familyCity}. Útil para ver tarifas referenciales del mercado.
          </p>
          {nearby.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Sin ofertas cercanas activas en {familyCity} por ahora.
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(new Map(nearby.map((n) => [n.id, n])).values()).map((n) => (
                <Card key={`nearby-${n.id}`} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-tight">{n.title}</p>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-biosensor/10 text-biosensor border border-biosensor/30 shrink-0">
                      Activa
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {n.city}
                  </p>
                  <p className="mt-2 font-display text-lg font-semibold text-copper">
                    ${n.amount.toLocaleString("es-CO")}{" "}
                    <span className="text-xs font-normal text-muted-foreground">COP / {n.modality}</span>
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Mis solicitudes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Mis solicitudes</h2>
            <Link to="/buscar" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todas →
            </Link>
          </div>
          {offers.length === 0 ? (
            <Card className="p-10 text-center">
              <Heart className="h-8 w-8 text-copper mx-auto mb-3" />
              <p className="font-semibold">Aún no has publicado solicitudes</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Empieza con una búsqueda directa o usa el copiloto IA para publicar.
              </p>
              <Button variant="hero" className="mt-4" asChild>
                <Link to="/buscar">Buscar ahora</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3">
              {Array.from(new Map(offers.map((o) => [o.id, o])).values()).map((o) => (
                <Card key={`my-offer-${o.id}`} className="p-4 flex items-center justify-between gap-3 flex-wrap">
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

        {/* Mapa de mis solicitudes */}
        {offers.some((o) => o.lat != null && o.lng != null) && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-3">Tus solicitudes en el mapa</h2>
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
