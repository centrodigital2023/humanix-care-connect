// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Power, PowerOff, Loader2, Users, Building2, HeartPulse, MapPin, Crosshair, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { geocodeCity, getBrowserLocation, distanceKm, formatKm } from "@/lib/geo";
import { Star, Phone, MessageCircle, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "@tanstack/react-router";

type Role = "professional" | "family" | "institution" | "guest";

type Point = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  kind: "professional" | "family" | "institution";
  userId?: string;
  avatarUrl?: string | null;
  fullName?: string | null;
  rating?: number | null;
  hourlyRate?: number | null;
  phone?: string | null;
  city?: string | null;
  meta?: string | null;
  specialty?: string | null;
  gender?: string | null;
  yearsExperience?: number | null;
  subSpecialties?: string[] | null;
};

const COLORS = {
  professional: "#3b82f6", // blue
  family: "#eab308", // yellow
  institution: "#d946ef", // fuchsia
};

const ICONS = {
  professional: (color = COLORS.professional) =>
    L.divIcon({
      className: "live-marker",
      html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 0 0 4px ${color}44, 0 4px 14px rgba(0,0,0,.35);animation:livePulse 2s infinite"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    }),
  family: () =>
    L.divIcon({
      className: "live-marker",
      html: `<div style="width:22px;height:22px;border-radius:9999px;background:${COLORS.family};border:3px solid white;box-shadow:0 0 0 4px ${COLORS.family}44, 0 4px 14px rgba(0,0,0,.35)"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    }),
  institution: () =>
    L.divIcon({
      className: "live-marker",
      html: `<div style="width:24px;height:24px;border-radius:6px;background:${COLORS.institution};border:3px solid white;box-shadow:0 0 0 4px ${COLORS.institution}44, 0 4px 14px rgba(0,0,0,.35)"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  me: () =>
    L.divIcon({
      className: "live-marker-me",
      html: `<div style="width:26px;height:26px;border-radius:9999px;background:oklch(0.78 0.18 165);border:4px solid white;box-shadow:0 0 0 5px oklch(0.78 0.18 165 / .35), 0 6px 18px rgba(0,0,0,.4)"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    }),
};

function FitBounds({ points }: { points: Point[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [points, map]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOn({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 13));
    }
  }, [lat, lng]);
  return null;
}

export function LiveMarketplaceMap({
  role,
  userId,
  height = 480,
  pickLocation,
  preview = false,
}: {
  role?: Role;
  userId?: string;
  height?: number;
  preview?: boolean;
  pickLocation?: {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number, address?: string) => void;
    defaultCity?: string;
  };
}) {
  const effectiveRole: Role = role ?? "guest";
  const isGuest = preview || effectiveRole === "guest" || !userId;
  const navigate = useNavigate();
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const requireAuth = (): boolean => {
    if (isGuest) {
      setGuestPromptOpen(true);
      return true;
    }
    return false;
  };
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [available, setAvailable] = useState(true);
  const [pros, setPros] = useState<Point[]>([]);
  const [families, setFamilies] = useState<Point[]>([]);
  const [institutions, setInstitutions] = useState<Point[]>([]);
  const [picking, setPicking] = useState(false);
  const [meCoords, setMeCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: pickLocation?.lat ?? null,
    lng: pickLocation?.lng ?? null,
  });
  // Self location persistence for family/institution roles (no external pickLocation prop)
  const selfPersist = !pickLocation && !isGuest && (effectiveRole === "family" || effectiveRole === "institution");
  // Filters (visible to family/institution/guest looking for professionals)
  const showFilters = effectiveRole !== "professional";
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterGender, setFilterGender] = useState<string>("any");
  const [filterMinYears, setFilterMinYears] = useState<string>("");
  const [filterMinRating, setFilterMinRating] = useState<string>("any");
  const [filterMaxKm, setFilterMaxKm] = useState<string>("");
  const [filterRequirement, setFilterRequirement] = useState("");
  const [filterSortBy, setFilterSortBy] = useState<"distance" | "rating" | "experience">("distance");

  useEffect(() => {
    setMeCoords({ lat: pickLocation?.lat ?? null, lng: pickLocation?.lng ?? null });
  }, [pickLocation?.lat, pickLocation?.lng]);

  // Hydrate self coords from DB for family/institution when no external pickLocation
  useEffect(() => {
    if (!selfPersist || !userId) return;
    (async () => {
      try {
        if (effectiveRole === "institution") {
          const { data } = await supabase
            .from("institution_profiles")
            .select("lat, lng")
            .eq("user_id", userId)
            .maybeSingle();
          if (data?.lat != null && data?.lng != null) {
            setMeCoords({ lat: Number(data.lat), lng: Number(data.lng) });
          }
        } else if (effectiveRole === "family") {
          const { data } = await supabase
            .from("family_profiles")
            .select("default_lat, default_lng")
            .eq("user_id", userId)
            .maybeSingle();
          if (data?.default_lat != null && data?.default_lng != null) {
            setMeCoords({ lat: Number(data.default_lat), lng: Number(data.default_lng) });
          }
        }
      } catch (e) {
        console.warn("[LiveMap] could not hydrate self coords", e);
      }
    })();
  }, [selfPersist, userId, effectiveRole]);

  // Load own availability
  useEffect(() => {
    if (isGuest) return;
    (async () => {
      try {
        if (effectiveRole === "professional") {
          const { data } = await supabase
            .from("professional_profiles")
            .select("available")
            .eq("user_id", userId)
            .maybeSingle();
          setAvailable(data?.available ?? true);
        } else if (effectiveRole === "family") {
          const { data } = await supabase
            .from("family_profiles")
            .select("visible_on_map")
            .eq("user_id", userId)
            .maybeSingle();
          setAvailable(data?.visible_on_map ?? true);
        } else {
          const { data } = await supabase
            .from("institution_profiles")
            .select("visible_on_map")
            .eq("user_id", userId)
            .maybeSingle();
          setAvailable(data?.visible_on_map ?? true);
        }
      } catch (e) {
        console.warn("[LiveMap] could not load availability", e);
      }
    })();
  }, [effectiveRole, userId, isGuest]);

  const loadAll = async () => {
    try {
      const [proRes, famRes, instRes] = await Promise.all([
        supabase
          .from("professional_profiles")
          .select("user_id, lat, lng, specialty, sub_specialties, gender, years_experience, home_city, hourly_rate, avg_rating, available, profiles:user_id(full_name, avatar_url, phone)")
          .eq("available", true)
          .not("lat", "is", null)
          .not("lng", "is", null)
          .limit(200),
        supabase
          .from("family_profiles")
          .select("user_id, default_lat, default_lng, patient_name, default_address, visible_on_map, whatsapp, profiles:user_id(full_name, avatar_url, phone)")
          .eq("visible_on_map", true)
          .not("default_lat", "is", null)
          .not("default_lng", "is", null)
          .limit(200),
        supabase
          .from("institution_profiles")
          .select("user_id, lat, lng, institution_name, city, institution_type, visible_on_map, profiles:user_id(full_name, avatar_url, phone)")
          .eq("visible_on_map", true)
          .not("lat", "is", null)
          .not("lng", "is", null)
          .limit(200),
      ]);

      setPros(
        (proRes.data ?? []).map((p: any) => ({
          id: `pro-${p.user_id}`,
          lat: Number(p.lat),
          lng: Number(p.lng),
          kind: "professional" as const,
          title: p.specialty || "Profesional disponible",
          subtitle: `${p.home_city ?? ""}${p.hourly_rate ? ` · $${Number(p.hourly_rate).toLocaleString("es-CO")}/h` : ""}`,
          userId: p.user_id,
          avatarUrl: p.profiles?.avatar_url ?? null,
          fullName: p.profiles?.full_name ?? null,
          rating: p.avg_rating ?? null,
          hourlyRate: p.hourly_rate ?? null,
          phone: p.profiles?.phone ?? null,
          city: p.home_city ?? null,
          meta: p.specialty ?? null,
          specialty: p.specialty ?? null,
          gender: p.gender ?? null,
          yearsExperience: p.years_experience ?? null,
          subSpecialties: p.sub_specialties ?? null,
        })),
      );
      setFamilies(
        (famRes.data ?? []).map((p: any) => ({
          id: `fam-${p.user_id}`,
          lat: Number(p.default_lat),
          lng: Number(p.default_lng),
          kind: "family" as const,
          title: p.patient_name ? `Familia · ${p.patient_name}` : "Familia",
          subtitle: p.default_address ?? undefined,
          userId: p.user_id,
          avatarUrl: p.profiles?.avatar_url ?? null,
          fullName: p.profiles?.full_name ?? null,
          phone: p.whatsapp ?? p.profiles?.phone ?? null,
          meta: p.default_address ?? null,
        })),
      );
      setInstitutions(
        (instRes.data ?? []).map((p: any) => ({
          id: `inst-${p.user_id}`,
          lat: Number(p.lat),
          lng: Number(p.lng),
          kind: "institution" as const,
          title: p.institution_name || "Institución",
          subtitle: `${p.institution_type ?? ""}${p.city ? ` · ${p.city}` : ""}`,
          userId: p.user_id,
          avatarUrl: p.profiles?.avatar_url ?? null,
          fullName: p.institution_name ?? p.profiles?.full_name ?? null,
          phone: p.profiles?.phone ?? null,
          city: p.city ?? null,
          meta: p.institution_type ?? null,
        })),
      );
    } catch (e) {
      console.error("[LiveMap] load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("live-marketplace-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "professional_profiles" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "family_profiles" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "institution_profiles" }, () => loadAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAvailability = async () => {
    if (isGuest || !userId) return;
    setToggling(true);
    try {
      const next = !available;
      let error: any = null;
      if (effectiveRole === "professional") {
        ({ error } = await supabase
          .from("professional_profiles")
          .update({ available: next })
          .eq("user_id", userId));
      } else if (effectiveRole === "family") {
        ({ error } = await supabase
          .from("family_profiles")
          .update({ visible_on_map: next })
          .eq("user_id", userId));
      } else {
        ({ error } = await supabase
          .from("institution_profiles")
          .update({ visible_on_map: next })
          .eq("user_id", userId));
      }
      if (error) throw error;
      setAvailable(next);
      toast.success(next ? "Estás visible en el mapa" : "Te ocultaste del mapa");
      loadAll();
    } catch (e: any) {
      toast.error("No se pudo actualizar disponibilidad");
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  // Apply filters to professionals
  const filteredPros = useMemo<Point[]>(() => {
    let list = pros.slice();
    const q = filterSpecialty.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hay = `${p.specialty ?? ""} ${(p.subSpecialties ?? []).join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (filterGender !== "any") {
      list = list.filter((p) => (p.gender ?? "").toLowerCase() === filterGender);
    }
    const minY = parseInt(filterMinYears, 10);
    if (!Number.isNaN(minY) && minY > 0) {
      list = list.filter((p) => Number(p.yearsExperience ?? 0) >= minY);
    }
    if (filterMinRating !== "any") {
      const r = parseFloat(filterMinRating);
      list = list.filter((p) => Number(p.rating ?? 0) >= r);
    }
    const req = filterRequirement.trim().toLowerCase();
    if (req) {
      list = list.filter((p) => {
        const hay = `${p.specialty ?? ""} ${(p.subSpecialties ?? []).join(" ")} ${p.city ?? ""}`.toLowerCase();
        return hay.includes(req);
      });
    }
    const maxKm = parseFloat(filterMaxKm);
    if (!Number.isNaN(maxKm) && maxKm > 0 && meCoords.lat != null && meCoords.lng != null) {
      list = list.filter((p) => {
        const d = distanceKm({ lat: meCoords.lat!, lng: meCoords.lng! }, { lat: p.lat, lng: p.lng });
        return d <= maxKm;
      });
    }
    // Sort
    if (filterSortBy === "rating") {
      list.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
    } else if (filterSortBy === "experience") {
      list.sort((a, b) => Number(b.yearsExperience ?? 0) - Number(a.yearsExperience ?? 0));
    } else if (meCoords.lat != null && meCoords.lng != null) {
      list.sort((a, b) => {
        const da = distanceKm({ lat: meCoords.lat!, lng: meCoords.lng! }, { lat: a.lat, lng: a.lng });
        const db = distanceKm({ lat: meCoords.lat!, lng: meCoords.lng! }, { lat: b.lat, lng: b.lng });
        return da - db;
      });
    }
    return list;
  }, [pros, filterSpecialty, filterGender, filterMinYears, filterMinRating, filterRequirement, filterMaxKm, filterSortBy, meCoords.lat, meCoords.lng]);

  // Visible layers depend on role:
  // - professional sees families (yellow) + institutions (fuchsia) = offers
  // - family / institution sees professionals (blue)
  const visiblePoints = useMemo<Point[]>(() => {
    if (effectiveRole === "professional") return [...families, ...institutions];
    if (effectiveRole === "guest") return [...filteredPros, ...families, ...institutions];
    return filteredPros;
  }, [effectiveRole, filteredPros, families, institutions]);

  const center =
    meCoords.lat != null && meCoords.lng != null
      ? { lat: meCoords.lat, lng: meCoords.lng }
      : { lat: 4.6097, lng: -74.0817 }; // Bogotá fallback

  const handlePick = (lat: number, lng: number) => {
    setMeCoords({ lat, lng });
    pickLocation?.onChange(lat, lng);
    if (selfPersist && userId) {
      (async () => {
        try {
          if (effectiveRole === "institution") {
            await supabase
              .from("institution_profiles")
              .update({ lat, lng })
              .eq("user_id", userId);
          } else if (effectiveRole === "family") {
            await supabase
              .from("family_profiles")
              .update({ default_lat: lat, default_lng: lng })
              .eq("user_id", userId);
          }
          toast.success("📍 Ubicación guardada");
        } catch (e) {
          console.error("[LiveMap] could not persist location", e);
          toast.error("No se pudo guardar la ubicación");
        }
      })();
    }
    setPicking(false);
  };

  const useGps = async () => {
    setPicking(true);
    const loc = await getBrowserLocation();
    if (loc) {
      handlePick(loc.lat, loc.lng);
      toast.success("📍 Ubicación detectada");
    } else {
      const fb = await geocodeCity(pickLocation?.defaultCity || "Bogotá");
      if (fb) handlePick(fb.lat, fb.lng);
      else toast.error("No se pudo obtener tu ubicación");
    }
    setPicking(false);
  };

  return (
    <div className="space-y-3">
      <Card className="p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${available ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
          />
          <div>
            <p className="text-sm font-semibold">
              {available ? "Visible en el mapa" : "Oculto del mapa"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isGuest
                ? "Regístrate para activar tu presencia en tiempo real"
                : effectiveRole === "professional"
                ? "Apaga para no recibir ofertas en tiempo real"
                : effectiveRole === "family"
                  ? "Apaga para que profesionales no vean tu ubicación"
                  : "Apaga para que profesionales no vean tu institución"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(pickLocation || selfPersist || isGuest) && (
            <>
              <Button
                variant={picking ? "hero" : "outline"}
                size="sm"
                onClick={() => {
                  if (requireAuth()) return;
                  setPicking((v) => !v);
                }}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {picking ? "Toca el mapa…" : "Marcar ubicación"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (requireAuth()) return;
                  useGps();
                }}
              >
                <Crosshair className="h-4 w-4 mr-1" /> GPS
              </Button>
            </>
          )}
          <Button
            variant={available ? "destructive" : "hero"}
            size="sm"
            onClick={() => {
              if (requireAuth()) return;
              toggleAvailability();
            }}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : available ? (
              <>
                <PowerOff className="h-4 w-4 mr-1" /> Apagar
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-1" /> Encender
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {effectiveRole !== "professional" && (
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.professional }} />
            Profesionales disponibles ({filteredPros.length}
            {filteredPros.length !== pros.length ? ` / ${pros.length}` : ""})
          </Badge>
        )}
        {(effectiveRole === "professional" || effectiveRole === "guest") && (
          <>
            <Badge variant="outline" className="gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.family }} />
              Familias ({families.length})
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.institution }} />
              Instituciones ({institutions.length})
            </Badge>
          </>
        )}
        {pickLocation && (
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-biosensor" />
            Tu ubicación
          </Badge>
        )}
        {showFilters && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7 px-2 text-xs"
            onClick={() => {
              if (requireAuth()) return;
              setFiltersOpen((v) => !v);
            }}
          >
            <SlidersHorizontal className="h-3 w-3 mr-1" />
            {filtersOpen ? "Ocultar filtros" : "Filtros inteligentes"}
          </Button>
        )}
      </div>

      {showFilters && !isGuest && filtersOpen && (
        <Card className="p-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Especialidad</label>
              <Input
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                placeholder="enfermera, terapeuta…"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Género</label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquiera</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Años exp. mín.</label>
              <Input
                type="number"
                min={0}
                value={filterMinYears}
                onChange={(e) => setFilterMinYears(e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Estrellas mín.</label>
              <Select value={filterMinRating} onValueChange={setFilterMinRating}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Todas</SelectItem>
                  <SelectItem value="3">★ 3+</SelectItem>
                  <SelectItem value="4">★ 4+</SelectItem>
                  <SelectItem value="4.5">★ 4.5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Distancia máx. (km)</label>
              <Input
                type="number"
                min={0}
                value={filterMaxKm}
                onChange={(e) => setFilterMaxKm(e.target.value)}
                placeholder="sin límite"
                className="h-8 text-xs"
                disabled={meCoords.lat == null}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Requisito / palabra</label>
              <Input
                value={filterRequirement}
                onChange={(e) => setFilterRequirement(e.target.value)}
                placeholder="UCI, postop…"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ordenar por</span>
            <Select value={filterSortBy} onValueChange={(v: any) => setFilterSortBy(v)}>
              <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distancia</SelectItem>
                <SelectItem value="rating">Mejor calificados</SelectItem>
                <SelectItem value="experience">Más experiencia</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs ml-auto"
              onClick={() => {
                setFilterSpecialty("");
                setFilterGender("any");
                setFilterMinYears("");
                setFilterMinRating("any");
                setFilterMaxKm("");
                setFilterRequirement("");
                setFilterSortBy("distance");
              }}
            >
              <X className="h-3 w-3 mr-1" /> Limpiar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sincronización en vivo de profesionales, familias e instituciones activas.
          </p>
        </Card>
      )}

      <div
        className="rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-card)]"
        style={{ height }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center bg-muted/30">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={11}
            scrollWheelZoom
            style={{ height: "100%", width: "100%", cursor: picking ? "crosshair" : undefined }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {picking && <ClickToPick onPick={handlePick} />}
            {meCoords.lat != null && meCoords.lng != null && (
              <>
                <Marker
                  position={[meCoords.lat, meCoords.lng]}
                  icon={ICONS.me()}
                  draggable={!!pickLocation}
                  eventHandlers={
                    pickLocation
                      ? {
                          dragend: (e: any) => {
                            const ll = e.target.getLatLng();
                            handlePick(ll.lat, ll.lng);
                          },
                        }
                      : undefined
                  }
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">Tu ubicación de servicio</p>
                      {pickLocation && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Arrastra el marcador para ajustar
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
                <RecenterOn lat={meCoords.lat} lng={meCoords.lng} />
              </>
            )}
            {visiblePoints.map((p) => {
              const icon =
                p.kind === "professional"
                  ? ICONS.professional()
                  : p.kind === "family"
                    ? ICONS.family()
                    : ICONS.institution();
              const Icon =
                p.kind === "professional" ? HeartPulse : p.kind === "family" ? Users : Building2;
              const dist =
                meCoords.lat != null && meCoords.lng != null
                  ? distanceKm({ lat: meCoords.lat, lng: meCoords.lng }, { lat: p.lat, lng: p.lng })
                  : null;
              const kindLabel =
                p.kind === "professional" ? "Profesional" : p.kind === "family" ? "Familia" : "Institución";
              const accent = COLORS[p.kind];
              const waHref = p.phone
                ? `https://wa.me/${String(p.phone).replace(/\D/g, "")}`
                : null;
              const telHref = p.phone ? `tel:${p.phone}` : null;
              const profileHref =
                p.kind === "professional" && p.userId
                  ? `/profesional/${p.userId}`
                  : null;
              return (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
                  <Popup minWidth={260} maxWidth={300}>
                    <div className="text-sm" style={{ minWidth: 240 }}>
                      <div className="flex items-center gap-2 mb-2">
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt={p.fullName || p.title}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 9999,
                              objectFit: "cover",
                              border: `2px solid ${accent}`,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 9999,
                              background: `${accent}22`,
                              color: accent,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              border: `2px solid ${accent}`,
                            }}
                          >
                            {(p.fullName || p.title || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p className="font-semibold truncate" style={{ margin: 0 }}>
                            {p.fullName || p.title}
                          </p>
                          <p
                            className="text-xs flex items-center gap-1"
                            style={{ margin: 0, color: accent, fontWeight: 600 }}
                          >
                            <Icon className="h-3 w-3" />
                            {kindLabel}
                          </p>
                        </div>
                      </div>

                      {p.meta && (
                        <p className="text-xs text-muted-foreground" style={{ margin: "2px 0" }}>
                          {p.meta}
                          {p.city ? ` · ${p.city}` : ""}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {dist != null && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              background: "oklch(0.78 0.18 165 / .15)",
                              color: "oklch(0.45 0.18 165)",
                              fontWeight: 600,
                            }}
                          >
                            📍 {formatKm(dist)}
                          </span>
                        )}
                        {p.rating != null && Number(p.rating) > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              background: "oklch(0.85 0.15 85 / .2)",
                              color: "oklch(0.5 0.18 75)",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            ★ {Number(p.rating).toFixed(1)}
                          </span>
                        )}
                        {p.hourlyRate != null && Number(p.hourlyRate) > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              background: "#f3f4f6",
                              color: "#111827",
                              fontWeight: 600,
                            }}
                          >
                            ${Number(p.hourlyRate).toLocaleString("es-CO")}/h
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1.5 mt-3">
                        {isGuest ? (
                          <a
                            href="/auth"
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: accent,
                              color: "white",
                              padding: "8px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            Regístrate para contactar →
                          </a>
                        ) : (
                          <>
                        {waHref && (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "#25D366",
                              color: "white",
                              padding: "6px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </a>
                        )}
                        {telHref && (
                          <a
                            href={telHref}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: accent,
                              color: "white",
                              padding: "6px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <Phone className="h-3 w-3" /> Llamar
                          </a>
                        )}
                        {profileHref && (
                          <a
                            href={profileHref}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "white",
                              border: `1px solid ${accent}`,
                              color: accent,
                              padding: "6px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <UserIcon className="h-3 w-3" /> Perfil
                          </a>
                        )}
                          </>
                        )}
                      </div>

                      {!isGuest && !p.phone && !profileHref && (
                        <p
                          className="text-xs text-muted-foreground"
                          style={{ marginTop: 8, textAlign: "center" }}
                        >
                          Contacto no disponible
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {visiblePoints.length > 1 && <FitBounds points={visiblePoints} />}
          </MapContainer>
        )}
      </div>

      <style>{`@keyframes livePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.85}}`}</style>

      <AlertDialog open={guestPromptOpen} onOpenChange={setGuestPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Crea tu cuenta para continuar</AlertDialogTitle>
            <AlertDialogDescription>
              Para marcar tu ubicación, activar tu visibilidad en el mapa y usar
              los filtros inteligentes necesitas una cuenta. Es gratis y solo
              toma 1 minuto. Al registrarte sincronizas en tiempo real con
              profesionales, familias e instituciones cercanas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ahora no</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setGuestPromptOpen(false);
                navigate({ to: "/auth" });
              }}
            >
              Registrarme gratis
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}