import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  Loader2,
  Star,
  MapPin,
  Phone,
  CheckCircle2,
  X,
  BadgeCheck,
  ShieldCheck,
  Briefcase,
  SlidersHorizontal,
  LayoutGrid,
  LayoutList,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Send,
  Filter,
  RefreshCw,
  Clock,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { LiveMarketplaceMap } from "@/components/humanix/LiveMarketplaceMap";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type ProSummary = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  specialty: string | null;
  sub_specialties: string[] | null;
  avg_rating: number | null;
  trust_score: number | null;
  hourly_rate: number | null;
  shift_rate: number | null;
  monthly_rate: number | null;
  phone: string | null;
  verified: boolean | null;
  rethus_verified: boolean | null;
  ai_preapproved: boolean | null;
  available: boolean;
  years_experience: number | null;
  bio: string | null;
  total_jobs: number | null;
  certifications: string[] | null;
};

type AppStatus = "pending" | "accepted" | "rejected" | "withdrawn";

type ApplicationRow = {
  id: string;
  status: AppStatus;
  created_at: string;
  proposed_amount: number | null;
  message: string | null;
  professional_id: string;
  job_offer_id: string;
};

type Offer = { id: string; title: string };

type SortKey = "trust" | "rating" | "rate" | "jobs" | "date";
type ViewMode = "cards" | "table";

interface TalentTabProps {
  userId: string;
  applications: ApplicationRow[];
  proMap: Record<string, ProSummary>;
  offers: Offer[];
  instCity?: string;
  updatingApp: string | null;
  onUpdateApp: (appId: string, status: AppStatus) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const COP = (n: number | null | undefined) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

function waLink(phone: string | null | undefined, name: string, offerTitle = "una oportunidad") {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, "");
  const num = clean.startsWith("57") ? clean : `57${clean}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(
    `Hola ${name}, te contacto desde Humanix porque tu perfil encaja con ${offerTitle}. ¿Tienes disponibilidad para hablar?`,
  )}`;
}

const SPECIALTIES = [
  "Enfermería",
  "Medicina general",
  "Cuidado adulto mayor",
  "Fisioterapia",
  "Fonoaudiología",
  "Terapia ocupacional",
  "Auxiliar enfermería",
  "Psicología",
  "Nutrición",
  "Trabajo social",
  "Odontología",
  "Optometría",
];

// ── Main component ─────────────────────────────────────────────────────────

export function TalentTab({
  userId,
  applications,
  proMap,
  offers,
  instCity = "",
  updatingApp,
  onUpdateApp,
}: TalentTabProps) {
  // Filter / search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterCity, setFilterCity] = useState(instCity);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterMinTrust, setFilterMinTrust] = useState(0);
  const [filterRethus, setFilterRethus] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("trust");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // AI search
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<ProSummary[]>([]);
  const [aiMode, setAiMode] = useState(false);

  // Marketplace search
  const [searching, setSearching] = useState(false);
  const [extraPros, setExtraPros] = useState<ProSummary[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount, show applicants immediately (proMap from parent)
  // ------ Derived: application info per professional ------
  const appByPro = useMemo(() => {
    const m: Record<string, ApplicationRow[]> = {};
    applications.forEach((a) => {
      if (!m[a.professional_id]) m[a.professional_id] = [];
      m[a.professional_id].push(a);
    });
    return m;
  }, [applications]);

  const latestAppByPro = useMemo(() => {
    const m: Record<string, ApplicationRow> = {};
    Object.entries(appByPro).forEach(([pid, apps]) => {
      m[pid] = apps.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
    });
    return m;
  }, [appByPro]);

  // ------ Merged pool ------
  const rawPool = useMemo(() => {
    const applicantIds = new Set(Object.keys(proMap));
    return [
      ...Object.values(proMap),
      ...extraPros.filter((p) => !applicantIds.has(p.user_id)),
    ];
  }, [proMap, extraPros]);

  const filteredPool = useMemo(() => {
    const base = aiMode && aiResults.length > 0 ? aiResults : rawPool;
    return base
      .filter((p) => {
        if (
          searchQuery &&
          !p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !p.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        if (
          filterSpecialty &&
          !p.specialty?.toLowerCase().includes(filterSpecialty.toLowerCase())
        )
          return false;
        if (filterCity && !p.city?.toLowerCase().includes(filterCity.toLowerCase()))
          return false;
        if (filterAvailable && !p.available) return false;
        if (filterMinTrust > 0 && (p.trust_score ?? 0) < filterMinTrust) return false;
        if (filterRethus && !p.rethus_verified) return false;
        if (filterVerified && !p.verified) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "trust") return (b.trust_score ?? 0) - (a.trust_score ?? 0);
        if (sortBy === "rating") return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
        if (sortBy === "rate") return (b.shift_rate ?? b.hourly_rate ?? 0) - (a.shift_rate ?? a.hourly_rate ?? 0);
        if (sortBy === "jobs") return (b.total_jobs ?? 0) - (a.total_jobs ?? 0);
        return 0;
      });
  }, [rawPool, aiMode, aiResults, searchQuery, filterSpecialty, filterCity, filterAvailable, filterMinTrust, filterRethus, filterVerified, sortBy]);

  // ------ KPIs ------
  const kpis = useMemo(() => {
    const pool = Object.values(proMap);
    const available = pool.filter((p) => p.available).length;
    const accepted = applications.filter((a) => a.status === "accepted").length;
    const ratings = pool.map((p) => p.avg_rating ?? 0).filter((r) => r > 0);
    const avgRating = ratings.length
      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
      : "—";
    return {
      total: pool.length,
      available,
      accepted,
      avgRating,
    };
  }, [proMap, applications]);

  // ------ Marketplace search ------
  const searchMarketplace = async () => {
    setSearching(true);
    setHasSearched(true);
    setAiMode(false);
    try {
      let q = supabase
        .from("professional_profiles")
        .select(
          "user_id, specialty, sub_specialties, avg_rating, trust_score, hourly_rate, shift_rate, monthly_rate, verified, rethus_verified, ai_preapproved, available, years_experience, bio, total_jobs, certifications",
        )
        .eq("published", true)
        .order("trust_score", { ascending: false, nullsFirst: false })
        .limit(40);

      if (filterSpecialty) q = q.ilike("specialty", `%${filterSpecialty}%`);
      if (filterAvailable) q = q.eq("available", true);
      if (filterMinTrust > 0) q = q.gte("trust_score", filterMinTrust);
      if (filterRethus) q = q.eq("rethus_verified", true);

      const { data: proData } = await q;
      if (!proData?.length) {
        toast.info("No se encontraron profesionales con esos filtros.");
        return;
      }

      const ids = proData.map((r) => r.user_id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, city, phone")
        .in("user_id", ids);

      type ProfileRow = { user_id: string; full_name: string | null; avatar_url: string | null; city: string | null; phone: string | null };
      const profileByUid: Record<string, ProfileRow> = {};
      (profileData ?? []).forEach((p) => { profileByUid[p.user_id] = p as ProfileRow; });

      const merged: ProSummary[] = proData
        .filter((r) => {
          if (!filterCity) return true;
          const profile = profileByUid[r.user_id];
          return profile?.city?.toLowerCase().includes(filterCity.toLowerCase());
        })
        .map((r) => {
          const prof = profileByUid[r.user_id];
          return {
            user_id: r.user_id,
            full_name: prof?.full_name ?? null,
            avatar_url: prof?.avatar_url ?? null,
            city: prof?.city ?? null,
            phone: prof?.phone ?? null,
            specialty: r.specialty,
            sub_specialties: Array.isArray(r.sub_specialties) ? r.sub_specialties as string[] : null,
            avg_rating: r.avg_rating,
            trust_score: r.trust_score,
            hourly_rate: r.hourly_rate,
            shift_rate: r.shift_rate,
            monthly_rate: r.monthly_rate,
            verified: r.verified,
            rethus_verified: r.rethus_verified,
            ai_preapproved: r.ai_preapproved,
            available: r.available,
            years_experience: r.years_experience,
            bio: r.bio,
            total_jobs: r.total_jobs,
            certifications: Array.isArray(r.certifications) ? r.certifications as string[] : null,
          };
        });

      setExtraPros(merged);
      toast.success(`${merged.length} profesionales del marketplace encontrados.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en búsqueda");
    } finally {
      setSearching(false);
    }
  };

  // ------ AI natural language search ------
  const runAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiSearching(true);
    setAiMode(true);
    try {
      const { data, error } = await supabase.functions.invoke("hiring-copilot", {
        body: { brief: aiQuery, city: filterCity || instCity, findCandidates: true },
      });
      if (error) throw error;
      const candidates = (data?.candidates ?? []) as Array<{
        user_id: string;
        full_name?: string;
        city?: string;
        avatar_url?: string;
        specialty?: string;
        years_experience?: number;
        trust_score?: number;
        avg_rating?: number;
        rethus_verified?: boolean;
        hourly_rate?: number;
        shift_rate?: number;
        monthly_rate?: number;
        phone?: string;
        verified?: boolean;
        score?: number;
      }>;

      if (!candidates.length) {
        toast.info("La IA no encontró candidatos. Intenta con otros criterios.");
        setAiMode(false);
        return;
      }

      const mapped: ProSummary[] = candidates.map((c) => ({
        user_id: c.user_id,
        full_name: c.full_name ?? null,
        avatar_url: c.avatar_url ?? null,
        city: c.city ?? null,
        specialty: c.specialty ?? null,
        sub_specialties: null,
        avg_rating: c.avg_rating ?? null,
        trust_score: c.trust_score ?? null,
        hourly_rate: c.hourly_rate ?? null,
        shift_rate: c.shift_rate ?? null,
        monthly_rate: c.monthly_rate ?? null,
        phone: c.phone ?? null,
        verified: c.verified ?? null,
        rethus_verified: c.rethus_verified ?? null,
        ai_preapproved: null,
        available: true,
        years_experience: c.years_experience ?? null,
        bio: null,
        total_jobs: null,
        certifications: null,
      }));

      setAiResults(mapped);
      toast.success(`✨ IA encontró ${mapped.length} candidatos.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en búsqueda IA");
      setAiMode(false);
    } finally {
      setAiSearching(false);
    }
  };

  const clearAiMode = () => {
    setAiMode(false);
    setAiResults([]);
    setAiQuery("");
  };

  const activeFiltersCount = [
    filterSpecialty,
    filterCity,
    filterAvailable,
    filterMinTrust > 0,
    filterRethus,
    filterVerified,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TalentKpi
          icon={<Users className="h-4 w-4" />}
          label="En tu pool"
          value={kpis.total}
          tone="fuchsia"
        />
        <TalentKpi
          icon={<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          label="Disponibles ahora"
          value={kpis.available}
          tone="bio"
        />
        <TalentKpi
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Aceptados"
          value={kpis.accepted}
          tone="fuchsia"
        />
        <TalentKpi
          icon={<Star className="h-4 w-4" />}
          label="Rating promedio"
          value={kpis.avgRating}
          tone="amber"
        />
      </div>

      {/* ── AI Smart Search ── */}
      <div className="rounded-2xl border border-fuchsia-neural/25 bg-fuchsia-neural/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-fuchsia-neural" />
          <p className="text-sm font-semibold text-fuchsia-neural">Búsqueda IA por lenguaje natural</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Describe el perfil que necesitas y la IA busca los mejores candidatos.
        </p>
        <div className="flex gap-2">
          <Textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            rows={2}
            placeholder='Ej: "Enfermera con RETHUS para UCI en Bogotá, disponible turno nocturno"'
            className="flex-1 text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void runAiSearch();
              }
            }}
          />
          <Button
            onClick={runAiSearch}
            disabled={aiSearching || !aiQuery.trim()}
            variant="hero"
            className="shrink-0"
          >
            {aiSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {aiMode && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-fuchsia-neural font-medium">
              Modo IA activo · {aiResults.length} resultados
            </span>
            <button
              onClick={clearAiMode}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpiar
            </button>
          </div>
        )}
      </div>

      {/* ── Search bar + controls ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Text search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o especialidad…"
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="trust">↓ Trust Score</option>
          <option value="rating">↓ Rating</option>
          <option value="rate">↓ Tarifa</option>
          <option value="jobs">↓ Turnos</option>
          <option value="date">Por fecha</option>
        </select>

        {/* Filters toggle */}
        <Button
          variant={showFilters ? "glass" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-1.5 h-4 w-4 rounded-full bg-fuchsia-neural text-white text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* View toggle */}
        <div className="flex rounded-md border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              viewMode === "cards"
                ? "bg-fuchsia-neural/10 text-fuchsia-neural"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "px-2.5 py-1.5 border-l border-border transition-colors",
              viewMode === "table"
                ? "bg-fuchsia-neural/10 text-fuchsia-neural"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Specialty */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Especialidad</label>
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none"
              >
                <option value="">Todas</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ciudad</label>
              <Input
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                placeholder="Bogotá, Cali…"
                className="h-9"
              />
            </div>

            {/* Min trust */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Trust Score mínimo:{" "}
                <span className="text-fuchsia-neural font-semibold">
                  {filterMinTrust > 0 ? `≥${filterMinTrust}` : "cualquiera"}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={filterMinTrust}
                onChange={(e) => setFilterMinTrust(Number(e.target.value))}
                className="w-full h-1.5 accent-fuchsia-neural"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span><span>50</span><span>100</span>
              </div>
            </div>
          </div>

          {/* Toggle filters */}
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="Disponible ahora"
              active={filterAvailable}
              icon="🟢"
              onClick={() => setFilterAvailable((v) => !v)}
            />
            <FilterChip
              label="RETHUS verificado"
              active={filterRethus}
              icon="🛡️"
              onClick={() => setFilterRethus((v) => !v)}
            />
            <FilterChip
              label="Perfil verificado"
              active={filterVerified}
              icon="✅"
              onClick={() => setFilterVerified((v) => !v)}
            />
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setFilterSpecialty("");
                  setFilterCity(instCity);
                  setFilterAvailable(false);
                  setFilterMinTrust(0);
                  setFilterRethus(false);
                  setFilterVerified(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded-full border border-border"
              >
                <X className="h-3 w-3" /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Search marketplace button */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {hasSearched
                ? `${extraPros.length} profesionales del marketplace`
                : "Expande la búsqueda al marketplace completo de Humanix"}
            </p>
            <Button
              size="sm"
              variant="glass"
              onClick={searchMarketplace}
              disabled={searching}
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              {hasSearched ? "Actualizar" : "Buscar en marketplace"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Results header ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {aiMode ? (
            <span>
              <Sparkles className="inline h-3.5 w-3.5 text-fuchsia-neural mr-1" />
              Resultados IA · {filteredPool.length} candidatos
            </span>
          ) : (
            <span>
              {filteredPool.length} profesional{filteredPool.length !== 1 ? "es" : ""} en tu pool
            </span>
          )}
        </p>
        {filteredPool.length !== rawPool.length && (
          <span className="text-xs text-muted-foreground">
            (filtrado de {rawPool.length} total)
          </span>
        )}
      </div>

      {/* ── Pool grid / table ── */}
      {filteredPool.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/95 p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Sin resultados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ajusta los filtros o busca en el marketplace.
          </p>
          <Button
            className="mt-4"
            variant="glass"
            size="sm"
            onClick={() => { setShowFilters(true); void searchMarketplace(); }}
          >
            <Search className="h-3.5 w-3.5 mr-1.5" /> Buscar más talento
          </Button>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPool.map((pro) => (
            <ProCard
              key={pro.user_id}
              pro={pro}
              appHistory={appByPro[pro.user_id] ?? []}
              latestApp={latestAppByPro[pro.user_id]}
              offers={offers}
              updatingApp={updatingApp}
              onUpdateApp={onUpdateApp}
            />
          ))}
        </div>
      ) : (
        <TalentTable
          pool={filteredPool}
          appByPro={appByPro}
          latestAppByPro={latestAppByPro}
          offers={offers}
          updatingApp={updatingApp}
          onUpdateApp={onUpdateApp}
        />
      )}

      {/* ── Live map (collapsible) ── */}
      <div className="rounded-2xl border border-border bg-card/95 overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
          onClick={() => setShowMap((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-fuchsia-neural" />
            <p className="text-sm font-semibold">Mapa en vivo · Profesionales disponibles</p>
          </div>
          {showMap ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showMap && <LiveMarketplaceMap role="institution" userId={userId} height={480} />}
      </div>
    </div>
  );
}

// ── ProCard ────────────────────────────────────────────────────────────────

function ProCard({
  pro,
  appHistory,
  latestApp,
  offers,
  updatingApp,
  onUpdateApp,
}: {
  pro: ProSummary;
  appHistory: ApplicationRow[];
  latestApp: ApplicationRow | undefined;
  offers: Offer[];
  updatingApp: string | null;
  onUpdateApp: (appId: string, status: AppStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const trust = pro.trust_score ?? 0;
  const wa = waLink(
    pro.phone,
    pro.full_name ?? "profesional",
    offers.find((o) => o.id === latestApp?.job_offer_id)?.title ?? "una oportunidad",
  );

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/95 overflow-hidden transition-all",
        latestApp?.status === "pending"
          ? "border-amber-500/30 shadow-sm shadow-amber-500/5"
          : latestApp?.status === "accepted"
            ? "border-biosensor/30"
            : "border-border",
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar + availability dot */}
          <div className="relative shrink-0">
            {pro.avatar_url ? (
              <img
                src={pro.avatar_url}
                alt={pro.full_name ?? ""}
                className="h-12 w-12 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-fuchsia-neural/10 border-2 border-fuchsia-neural/20 flex items-center justify-center text-base font-bold text-fuchsia-neural">
                {(pro.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            {pro.available && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
            )}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-sm truncate">{pro.full_name ?? "—"}</p>
              {pro.verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-biosensor shrink-0" />
              )}
              {pro.rethus_verified && (
                <ShieldCheck className="h-3.5 w-3.5 text-fuchsia-neural shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {pro.specialty ?? "—"}
              {pro.years_experience != null && ` · ${pro.years_experience} años`}
            </p>
            {pro.city && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" /> {pro.city}
              </p>
            )}
          </div>

          {/* Trust ring */}
          <div className="shrink-0 text-center">
            <div className="relative h-12 w-12">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/30" />
                <circle
                  cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3.5"
                  strokeDasharray={`${2 * Math.PI * 18 * trust / 100} ${2 * Math.PI * 18 * (1 - trust / 100)}`}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all",
                    trust >= 70 ? "text-biosensor" : trust >= 50 ? "text-amber-500" : "text-muted-foreground",
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold leading-none">{trust}</span>
                <span className="text-[8px] text-muted-foreground">Trust</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chips row */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pro.avg_rating != null && (
            <Chip icon={<Star className="h-3 w-3 fill-amber-400 text-amber-400" />} label={pro.avg_rating.toFixed(1)} />
          )}
          {pro.total_jobs != null && (
            <Chip icon={<Briefcase className="h-3 w-3 text-muted-foreground" />} label={`${pro.total_jobs} turnos`} />
          )}
          {pro.shift_rate && (
            <Chip icon={<DollarSign className="h-3 w-3 text-muted-foreground" />} label={`${COP(pro.shift_rate)}/turno`} />
          )}
          {pro.hourly_rate && !pro.shift_rate && (
            <Chip icon={<DollarSign className="h-3 w-3 text-muted-foreground" />} label={`${COP(pro.hourly_rate)}/h`} />
          )}
          {pro.rethus_verified && (
            <Chip icon={<ShieldCheck className="h-3 w-3 text-fuchsia-neural" />} label="RETHUS" accent />
          )}
          {pro.available ? (
            <Chip icon={<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />} label="Disponible" bio />
          ) : (
            <Chip icon={<Clock className="h-3 w-3 text-muted-foreground" />} label="No disponible" muted />
          )}
        </div>

        {/* Application status strip */}
        {latestApp && (
          <div className={cn(
            "mt-3 rounded-lg px-3 py-2 text-xs",
            latestApp.status === "pending" ? "bg-amber-500/10" :
            latestApp.status === "accepted" ? "bg-biosensor/10" :
            latestApp.status === "rejected" ? "bg-rose-500/10" : "bg-muted/30",
          )}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {latestApp.status === "pending" ? "⏳ Postulación pendiente" :
                 latestApp.status === "accepted" ? "✅ Aceptado por ti" :
                 latestApp.status === "rejected" ? "❌ Rechazado" : "Retirado"}
              </span>
              <AppStatusBadge status={latestApp.status} />
            </div>
            {latestApp.message && (
              <p className="mt-1 italic text-muted-foreground line-clamp-1">
                "{latestApp.message}"
              </p>
            )}
            {appHistory.length > 1 && (
              <p className="mt-1 text-muted-foreground">
                {appHistory.length} postulaciones en total con tu institución
              </p>
            )}
          </div>
        )}
      </div>

      {/* Expanded: bio + sub-specialties + certs */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
          {pro.bio && (
            <p className="text-xs text-muted-foreground">{pro.bio}</p>
          )}
          {pro.sub_specialties && pro.sub_specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pro.sub_specialties.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
              ))}
            </div>
          )}
          {pro.certifications && pro.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pro.certifications.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-neural/10 text-fuchsia-neural">{c}</span>
              ))}
            </div>
          )}
          {pro.monthly_rate && (
            <p className="text-xs text-muted-foreground">
              Mensual: <span className="font-semibold text-foreground">{COP(pro.monthly_rate)}</span>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button size="sm" variant="glass" className="flex-1" asChild>
            <Link to="/profesional/$proId" params={{ proId: pro.user_id }}>
              Ver perfil
            </Link>
          </Button>
          {wa && (
            <Button
              size="sm"
              variant="outline"
              className="border-biosensor/30 text-biosensor hover:bg-biosensor/5"
              asChild
            >
              <a href={wa} target="_blank" rel="noopener noreferrer">
                <Phone className="h-3.5 w-3.5 mr-1" /> WA
              </a>
            </Button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-2 text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? "Ocultar detalles" : "Ver más"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Accept / reject if pending */}
        {latestApp?.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-biosensor hover:bg-biosensor/90 text-biosensor-foreground"
              onClick={() => onUpdateApp(latestApp.id, "accepted")}
              disabled={updatingApp === latestApp.id}
            >
              {updatingApp === latestApp.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/5"
              onClick={() => onUpdateApp(latestApp.id, "rejected")}
              disabled={updatingApp === latestApp.id}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Rechazar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TalentTable ────────────────────────────────────────────────────────────

function TalentTable({
  pool,
  appByPro,
  latestAppByPro,
  offers,
  updatingApp,
  onUpdateApp,
}: {
  pool: ProSummary[];
  appByPro: Record<string, ApplicationRow[]>;
  latestAppByPro: Record<string, ApplicationRow>;
  offers: Offer[];
  updatingApp: string | null;
  onUpdateApp: (appId: string, status: AppStatus) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/95 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
        <span className="w-8" />
        <span>Profesional</span>
        <span className="text-center hidden sm:block">Trust</span>
        <span className="text-center hidden md:block">Rating</span>
        <span className="text-center hidden lg:block">Tarifa/turno</span>
        <span>Acción</span>
      </div>

      <div className="divide-y divide-border">
        {pool.map((pro) => {
          const latestApp = latestAppByPro[pro.user_id];
          const wa = waLink(
            pro.phone,
            pro.full_name ?? "profesional",
            offers.find((o) => o.id === latestApp?.job_offer_id)?.title,
          );
          return (
            <div
              key={pro.user_id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              {/* Avatar */}
              <div className="relative w-8">
                {pro.avatar_url ? (
                  <img src={pro.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-border" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-fuchsia-neural/10 flex items-center justify-center text-xs font-bold">
                    {(pro.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                {pro.available && (
                  <span className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>

              {/* Name */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{pro.full_name ?? "—"}</p>
                  {pro.verified && <BadgeCheck className="h-3.5 w-3.5 text-biosensor shrink-0" />}
                  {pro.rethus_verified && <ShieldCheck className="h-3.5 w-3.5 text-fuchsia-neural shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {pro.specialty}
                  {pro.city && ` · ${pro.city}`}
                </p>
                {latestApp && <AppStatusBadge status={latestApp.status} />}
              </div>

              {/* Trust */}
              <div className="hidden sm:block text-center">
                <span className={cn(
                  "text-sm font-bold",
                  (pro.trust_score ?? 0) >= 70 ? "text-biosensor" :
                  (pro.trust_score ?? 0) >= 50 ? "text-amber-500" : "text-muted-foreground",
                )}>
                  {pro.trust_score ?? "—"}
                </span>
              </div>

              {/* Rating */}
              <div className="hidden md:flex items-center gap-1 justify-center">
                {pro.avg_rating ? (
                  <>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{pro.avg_rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Rate */}
              <div className="hidden lg:block text-center text-sm text-muted-foreground">
                {COP(pro.shift_rate ?? pro.hourly_rate)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="glass" className="h-7 px-2 text-xs" asChild>
                  <Link to="/profesional/$proId" params={{ proId: pro.user_id }}>
                    Perfil
                  </Link>
                </Button>
                {wa && (
                  <Button size="sm" variant="outline" className="h-7 px-2 border-biosensor/30 text-biosensor" asChild>
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
                {latestApp?.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      className="h-7 px-2 bg-biosensor hover:bg-biosensor/90 text-biosensor-foreground"
                      onClick={() => onUpdateApp(latestApp.id, "accepted")}
                      disabled={updatingApp === latestApp.id}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-muted-foreground hover:text-rose-600"
                      onClick={() => onUpdateApp(latestApp.id, "rejected")}
                      disabled={updatingApp === latestApp.id}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Micro-components ───────────────────────────────────────────────────────

function TalentKpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "fuchsia" | "bio" | "amber";
}) {
  const colors = {
    fuchsia: "text-fuchsia-neural bg-fuchsia-neural/10",
    bio: "text-biosensor bg-biosensor/10",
    amber: "text-amber-500 bg-amber-500/10",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card/95 p-3.5">
      <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl mb-2", colors)}>
        {icon}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({
  icon,
  label,
  accent,
  bio,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  bio?: boolean;
  muted?: boolean;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
      accent ? "bg-fuchsia-neural/10 text-fuchsia-neural" :
      bio ? "bg-biosensor/10 text-biosensor" :
      muted ? "bg-muted text-muted-foreground" :
      "bg-muted/50 text-muted-foreground",
    )}>
      {icon} {label}
    </span>
  );
}

function FilterChip({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
        active
          ? "bg-fuchsia-neural/10 border-fuchsia-neural/30 text-fuchsia-neural"
          : "bg-background border-border text-muted-foreground hover:border-fuchsia-neural/30",
      )}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

function AppStatusBadge({ status }: { status: AppStatus }) {
  const map: Record<AppStatus, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-amber-500/10 text-amber-600" },
    accepted: { label: "Aceptado", cls: "bg-biosensor/10 text-biosensor" },
    rejected: { label: "Rechazado", cls: "bg-rose-500/10 text-rose-600" },
    withdrawn: { label: "Retirado", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status];
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap", s.cls)}>
      {s.label}
    </span>
  );
}
