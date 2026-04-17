import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  Stethoscope,
  Star,
  CheckCircle2,
  Briefcase,
  Users as UsersIcon,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  Navigation,
} from "lucide-react";
import { Navbar } from "@/components/humanix/Navbar";
import { Footer } from "@/components/humanix/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, deriveProStatus, deriveOfferStatus } from "@/components/humanix/StatusBadge";
import { OffersMap, type MapPoint } from "@/components/humanix/OffersMap";
import { distanceKm, formatKm, getBrowserLocation, type LatLng } from "@/lib/geo";

type SearchParams = {
  tab: "profesionales" | "ofertas";
  q?: string;
  specialty?: string;
  city?: string;
  modality?: "hour" | "shift" | "month" | "package";
  minRate?: number;
  maxRate?: number;
  rating?: number;
  verified?: boolean;
};

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const tabRaw = search.tab;
    const tab = tabRaw === "ofertas" ? "ofertas" : "profesionales";
    const modalityRaw = search.modality;
    const modality =
      modalityRaw === "hour" ||
      modalityRaw === "shift" ||
      modalityRaw === "month" ||
      modalityRaw === "package"
        ? modalityRaw
        : undefined;
    const num = (v: unknown) => {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };
    const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);
    return {
      tab,
      q: str(search.q),
      specialty: str(search.specialty),
      city: str(search.city),
      modality,
      minRate: num(search.minRate),
      maxRate: num(search.maxRate),
      rating: num(search.rating),
      verified: search.verified === true || search.verified === "true" ? true : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Buscar profesionales y ofertas · Humanix" },
      {
        name: "description",
        content:
          "Marketplace inteligente de talento humano en salud en Colombia. Filtra por especialidad, ciudad, tarifa y rating.",
      },
    ],
  }),
  component: BuscarPage,
});

type Pro = {
  user_id: string;
  specialty: string | null;
  years_experience: number | null;
  hourly_rate: number | null;
  shift_rate: number | null;
  monthly_rate: number | null;
  service_cities: string[] | null;
  trust_score: number | null;
  avg_rating: number | null;
  verified: boolean | null;
  rethus_verified: boolean | null;
  total_jobs: number | null;
  ai_summary: string | null;
  available: boolean | null;
  reserved_until: string | null;
  active: boolean | null;
  lat: number | null;
  lng: number | null;
  profiles: { full_name: string | null; city: string | null; avatar_url: string | null } | null;
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  modality: "hour" | "shift" | "month" | "package";
  amount: number;
  city: string;
  specialty_required: string | null;
  requirements: string[] | null;
  poster_type: "family" | "institution";
  status: "open" | "filled" | "closed";
  reserved_until: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

const COP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.round(value) ? "fill-copper text-copper" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

type SearchT = SearchParams;

function BuscarPage() {
  const search = Route.useSearch();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigate = Route.useNavigate() as any;

  const [pros, setPros] = useState<Pro[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);

  // Pedir ubicación una vez (silencioso si la rechaza)
  useEffect(() => {
    getBrowserLocation().then(setUserLoc);
  }, []);

  // Local filter state synced from URL
  const [q, setQ] = useState(search.q ?? "");
  const [specialty, setSpecialty] = useState(search.specialty ?? "");
  const [city, setCity] = useState(search.city ?? "");

  useEffect(() => {
    setQ(search.q ?? "");
    setSpecialty(search.specialty ?? "");
    setCity(search.city ?? "");
  }, [search.q, search.specialty, search.city]);

  const tab = search.tab;

  // Fetch professionals
  useEffect(() => {
    if (tab !== "profesionales") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("professional_profiles")
        .select(
          "user_id, specialty, years_experience, hourly_rate, shift_rate, monthly_rate, service_cities, trust_score, avg_rating, verified, rethus_verified, total_jobs, ai_summary, available, reserved_until, active, lat, lng"
        )
        .eq("active", true)
        .order("avg_rating", { ascending: false })
        .limit(60);

      if (search.specialty) query = query.ilike("specialty", `%${search.specialty}%`);
      if (search.city) query = query.contains("service_cities", [search.city]);
      if (search.verified) query = query.eq("verified", true);
      if (search.minRate) query = query.gte("hourly_rate", search.minRate);
      if (search.maxRate) query = query.lte("hourly_rate", search.maxRate);
      if (search.rating) query = query.gte("avg_rating", search.rating);

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error(error);
        setPros([]);
        setLoading(false);
        return;
      }
      const baseRows = (data ?? []) as Array<Omit<Pro, "profiles">>;
      const userIds = baseRows.map((p) => p.user_id);
      let profilesMap = new Map<
        string,
        { full_name: string | null; city: string | null; avatar_url: string | null }
      >();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, city, avatar_url")
          .in("user_id", userIds);
        profilesMap = new Map(
          (profs ?? []).map((p) => [
            p.user_id,
            { full_name: p.full_name, city: p.city, avatar_url: p.avatar_url },
          ])
        );
      }
      let rows: Pro[] = baseRows.map((p) => ({
        ...p,
        profiles: profilesMap.get(p.user_id) ?? null,
      }));
      if (search.q) {
        const needle = search.q.toLowerCase();
        rows = rows.filter(
          (p) =>
            p.profiles?.full_name?.toLowerCase().includes(needle) ||
            p.specialty?.toLowerCase().includes(needle) ||
            p.ai_summary?.toLowerCase().includes(needle)
        );
      }
      if (cancelled) return;
      setPros(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, search.q, search.specialty, search.city, search.verified, search.minRate, search.maxRate, search.rating]);

  // Fetch offers
  useEffect(() => {
    if (tab !== "ofertas") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("job_offers")
        .select("id, title, description, modality, amount, city, specialty_required, requirements, poster_type, status, reserved_until, lat, lng, created_at")
        .in("status", ["open", "filled"])
        .order("created_at", { ascending: false })
        .limit(60);

      if (search.city) query = query.ilike("city", `%${search.city}%`);
      if (search.specialty) query = query.ilike("specialty_required", `%${search.specialty}%`);
      if (search.modality) query = query.eq("modality", search.modality);
      if (search.minRate) query = query.gte("amount", search.minRate);
      if (search.maxRate) query = query.lte("amount", search.maxRate);

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error(error);
        setOffers([]);
      } else {
        let rows = (data ?? []) as Offer[];
        // Ocultar 'filled' cuya reserva de 15 días ya expiró
        rows = rows.filter((o) => {
          if (o.status !== "filled") return true;
          if (!o.reserved_until) return false;
          return new Date(o.reserved_until) > new Date();
        });
        if (search.q) {
          const needle = search.q.toLowerCase();
          rows = rows.filter(
            (o) =>
              o.title.toLowerCase().includes(needle) ||
              o.description?.toLowerCase().includes(needle) ||
              o.specialty_required?.toLowerCase().includes(needle)
          );
        }
        setOffers(rows);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, search.q, search.specialty, search.city, search.modality, search.minRate, search.maxRate]);

  const totalActive = useMemo(
    () =>
      Object.entries(search).filter(([k, v]) => k !== "tab" && v !== undefined && v !== "").length,
    [search]
  );

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      search: (prev: SearchT) => ({
        ...prev,
        q: q || undefined,
        specialty: specialty || undefined,
        city: city || undefined,
      }),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Marketplace Humanix
              </h1>
              <p className="mt-2 text-muted-foreground text-sm sm:text-base">
                Encuentra el profesional o la oferta de salud ideal en Colombia.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
              <button
                onClick={() => navigate({ search: (p: SearchT) => ({ ...p, tab: "profesionales" }) })}
                className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition ${
                  tab === "profesionales"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UsersIcon className="h-4 w-4" />
                Profesionales
              </button>
              <button
                onClick={() => navigate({ search: (p: SearchT) => ({ ...p, tab: "ofertas" }) })}
                className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition ${
                  tab === "ofertas"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Ofertas
              </button>
            </div>
          </div>

          {/* Search bar */}
          <form
            onSubmit={applySearch}
            className="mt-6 rounded-2xl border border-border bg-card p-2 sm:p-2.5 shadow-[var(--shadow-card)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2">
              <label className="flex items-center gap-2 px-3.5 rounded-xl hover:bg-muted/40">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar nombre, palabra clave..."
                  className="w-full bg-transparent outline-none text-sm py-3"
                />
              </label>
              <label className="flex items-center gap-2 px-3.5 rounded-xl hover:bg-muted/40">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Especialidad"
                  className="w-full bg-transparent outline-none text-sm py-3"
                />
              </label>
              <label className="flex items-center gap-2 px-3.5 rounded-xl hover:bg-muted/40">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad"
                  className="w-full bg-transparent outline-none text-sm py-3"
                />
              </label>
              <Button type="submit" variant="hero" size="lg">
                Buscar
              </Button>
              <Button
                type="button"
                variant="glass"
                size="lg"
                onClick={() => setShowFilters((s) => !s)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros {totalActive > 0 && <span className="ml-1 text-xs">({totalActive})</span>}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-2 p-4 rounded-xl bg-muted/30 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                  Tarifa mín. (COP)
                  <input
                    type="number"
                    defaultValue={search.minRate ?? ""}
                    onBlur={(e) =>
                      navigate({
                        search: (p: SearchT) => ({
                          ...p,
                          minRate: e.target.value ? Number(e.target.value) : undefined,
                        }),
                      })
                    }
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                  Tarifa máx. (COP)
                  <input
                    type="number"
                    defaultValue={search.maxRate ?? ""}
                    onBlur={(e) =>
                      navigate({
                        search: (p: SearchT) => ({
                          ...p,
                          maxRate: e.target.value ? Number(e.target.value) : undefined,
                        }),
                      })
                    }
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                {tab === "profesionales" ? (
                  <>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                      Rating mínimo
                      <select
                        value={search.rating ?? ""}
                        onChange={(e) =>
                          navigate({
                            search: (p: SearchT) => ({
                              ...p,
                              rating: e.target.value ? Number(e.target.value) : undefined,
                            }),
                          })
                        }
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Cualquier rating</option>
                        <option value="3">3+ estrellas</option>
                        <option value="4">4+ estrellas</option>
                        <option value="4.5">4.5+ estrellas</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2 mt-5 text-sm">
                      <input
                        type="checkbox"
                        checked={!!search.verified}
                        onChange={(e) =>
                          navigate({
                            search: (p: SearchT) => ({
                              ...p,
                              verified: e.target.checked || undefined,
                            }),
                          })
                        }
                        className="h-4 w-4 rounded border-input"
                      />
                      Solo verificados
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">
                    Modalidad
                    <select
                      value={search.modality ?? ""}
                      onChange={(e) =>
                        navigate({
                          search: (p: SearchT) => ({
                            ...p,
                            modality: (e.target.value || undefined) as
                              | "hour"
                              | "shift"
                              | "month"
                              | "package"
                              | undefined,
                          }),
                        })
                      }
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Cualquiera</option>
                      <option value="hour">Por hora</option>
                      <option value="shift">Por jornada</option>
                      <option value="month">Mensual</option>
                      <option value="package">Paquete</option>
                    </select>
                  </label>
                )}
                {totalActive > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate({ search: { tab } })}
                    className="text-xs text-fuchsia-neural hover:underline self-end justify-self-start"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </form>

          {/* Toggle vista */}
          <div className="mt-6 flex items-center justify-end">
            <div className="inline-flex rounded-xl border border-border bg-card p-1">
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                <List className="h-3.5 w-3.5" /> Lista
              </button>
              <button
                onClick={() => setView("map")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${view === "map" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> Mapa
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="mt-4">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : view === "map" ? (
              <OffersMap
                height={520}
                points={
                  tab === "profesionales"
                    ? pros
                        .filter((p) => p.lat && p.lng)
                        .map<MapPoint>((p) => ({
                          id: p.user_id,
                          lat: p.lat!,
                          lng: p.lng!,
                          title: p.profiles?.full_name ?? "Profesional",
                          subtitle: p.specialty ?? undefined,
                          status: deriveProStatus(p) === "reserved" ? "reserved" : "available",
                        }))
                    : offers
                        .filter((o) => o.lat && o.lng)
                        .map<MapPoint>((o) => ({
                          id: o.id,
                          lat: o.lat!,
                          lng: o.lng!,
                          title: o.title,
                          subtitle: `${o.city} · ${COP(o.amount)}`,
                          status: o.status === "filled" ? "reserved" : "available",
                        }))
                }
              />
            ) : tab === "profesionales" ? (
              pros.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon className="h-7 w-7" />}
                  title="Aún no hay profesionales que coincidan"
                  desc="Cuando los profesionales completen su perfil aparecerán aquí. Prueba ampliar tus filtros o invita a tu equipo a registrarse."
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pros.map((p) => (
                    <ProCard key={p.user_id} pro={p} userLoc={userLoc} />
                  ))}
                </div>
              )
            ) : offers.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="h-7 w-7" />}
                title="Aún no hay ofertas abiertas"
                desc="Las familias e IPS publican aquí sus turnos. Crea tu cuenta como familia o institución para publicar la primera."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((o) => (
                  <OfferCard key={o.id} offer={o} userLoc={userLoc} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProCard({ pro, userLoc }: { pro: Pro; userLoc: LatLng | null }) {
  const name = pro.profiles?.full_name ?? "Profesional Humanix";
  const city = pro.profiles?.city ?? pro.service_cities?.[0] ?? "Colombia";
  const rating = Number(pro.avg_rating ?? 0);
  const status = deriveProStatus(pro);
  const km =
    userLoc && pro.lat != null && pro.lng != null
      ? distanceKm(userLoc, { lat: pro.lat, lng: pro.lng })
      : null;
  return (
    <article className="group rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition-all">
      <div className="flex items-start gap-3">
        {pro.profiles?.avatar_url ? (
          <img
            src={pro.profiles.avatar_url}
            alt={name}
            loading="lazy"
            className="h-14 w-14 rounded-xl object-cover border border-border"
          />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-biosensor/10 text-biosensor flex items-center justify-center font-semibold">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{name}</h3>
            {pro.verified && <CheckCircle2 className="h-4 w-4 text-biosensor shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {pro.specialty ?? "Profesional de salud"}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars value={rating} />
            <span className="text-xs text-muted-foreground">
              {rating > 0 ? rating.toFixed(1) : "Nuevo"} · {pro.total_jobs ?? 0} turnos
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {city}
        </span>
        {pro.hourly_rate ? (
          <span className="font-semibold text-foreground">
            {COP(pro.hourly_rate)} <span className="text-xs font-normal text-muted-foreground">/ h</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Tarifa a convenir</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {pro.rethus_verified && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-biosensor/15 text-biosensor border border-biosensor/30">
            RETHUS
          </span>
        )}
        {(pro.trust_score ?? 0) > 80 && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-copper/15 text-copper border border-copper/30">
            Trust {pro.trust_score}
          </span>
        )}
        {(pro.years_experience ?? 0) > 0 && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {pro.years_experience} años exp.
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="hero" size="sm" className="flex-1">
          Contactar
        </Button>
        <Button variant="glass" size="sm">
          Ver perfil
        </Button>
      </div>
    </article>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const modalityLabel =
    offer.modality === "hour"
      ? "Por hora"
      : offer.modality === "shift"
      ? "Por jornada"
      : offer.modality === "month"
      ? "Mensual"
      : "Paquete";
  return (
    <article className="group rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-fuchsia-neural">
            {offer.poster_type === "institution" ? "IPS / Clínica" : "Familia"} · {modalityLabel}
          </span>
          <h3 className="mt-1 font-semibold leading-tight truncate">{offer.title}</h3>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {offer.city}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-lg font-bold text-biosensor">{COP(offer.amount)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {modalityLabel}
          </p>
        </div>
      </div>
      {offer.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{offer.description}</p>
      )}
      {offer.specialty_required && (
        <div className="mt-3">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-biosensor/15 text-biosensor border border-biosensor/30">
            {offer.specialty_required}
          </span>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button variant="hero" size="sm" className="flex-1">
          Aplicar ahora
        </Button>
        <Button variant="glass" size="sm">
          Detalles
        </Button>
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-biosensor/10 text-biosensor flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{desc}</p>
      <div className="mt-6 inline-flex items-center gap-2">
        <Link
          to="/auth"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Crear cuenta
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
