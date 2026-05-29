// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Power, PowerOff, Loader2, Users, Building2, HeartPulse, MapPin, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { geocodeCity, getBrowserLocation } from "@/lib/geo";

type Role = "professional" | "family" | "institution";

type Point = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  kind: "professional" | "family" | "institution";
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
}: {
  role: Role;
  userId: string;
  height?: number;
  pickLocation?: {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number, address?: string) => void;
    defaultCity?: string;
  };
}) {
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

  useEffect(() => {
    setMeCoords({ lat: pickLocation?.lat ?? null, lng: pickLocation?.lng ?? null });
  }, [pickLocation?.lat, pickLocation?.lng]);

  // Load own availability
  useEffect(() => {
    (async () => {
      try {
        if (role === "professional") {
          const { data } = await supabase
            .from("professional_profiles")
            .select("available")
            .eq("user_id", userId)
            .maybeSingle();
          setAvailable(data?.available ?? true);
        } else if (role === "family") {
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
  }, [role, userId]);

  const loadAll = async () => {
    try {
      const [proRes, famRes, instRes] = await Promise.all([
        supabase
          .from("professional_profiles")
          .select("user_id, lat, lng, specialty, home_city, hourly_rate, avg_rating, available")
          .eq("available", true)
          .not("lat", "is", null)
          .not("lng", "is", null)
          .limit(200),
        supabase
          .from("family_profiles")
          .select("user_id, default_lat, default_lng, patient_name, default_address, visible_on_map")
          .eq("visible_on_map", true)
          .not("default_lat", "is", null)
          .not("default_lng", "is", null)
          .limit(200),
        supabase
          .from("institution_profiles")
          .select("user_id, lat, lng, institution_name, city, institution_type, visible_on_map")
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
    setToggling(true);
    try {
      const next = !available;
      let error: any = null;
      if (role === "professional") {
        ({ error } = await supabase
          .from("professional_profiles")
          .update({ available: next })
          .eq("user_id", userId));
      } else if (role === "family") {
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

  // Visible layers depend on role:
  // - professional sees families (yellow) + institutions (fuchsia) = offers
  // - family / institution sees professionals (blue)
  const visiblePoints = useMemo<Point[]>(() => {
    if (role === "professional") return [...families, ...institutions];
    return pros;
  }, [role, pros, families, institutions]);

  const center =
    meCoords.lat != null && meCoords.lng != null
      ? { lat: meCoords.lat, lng: meCoords.lng }
      : { lat: 4.6097, lng: -74.0817 }; // Bogotá fallback

  const handlePick = (lat: number, lng: number) => {
    setMeCoords({ lat, lng });
    pickLocation?.onChange(lat, lng);
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
              {role === "professional"
                ? "Apaga para no recibir ofertas en tiempo real"
                : role === "family"
                  ? "Apaga para que profesionales no vean tu ubicación"
                  : "Apaga para que profesionales no vean tu institución"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pickLocation && (
            <>
              <Button
                variant={picking ? "hero" : "outline"}
                size="sm"
                onClick={() => setPicking((v) => !v)}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {picking ? "Toca el mapa…" : "Marcar ubicación"}
              </Button>
              <Button variant="outline" size="sm" onClick={useGps}>
                <Crosshair className="h-4 w-4 mr-1" /> GPS
              </Button>
            </>
          )}
          <Button
            variant={available ? "destructive" : "hero"}
            size="sm"
            onClick={toggleAvailability}
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
        {role !== "professional" && (
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.professional }} />
            Profesionales disponibles ({pros.length})
          </Badge>
        )}
        {role === "professional" && (
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
      </div>

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
              return (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {p.title}
                      </p>
                      {p.subtitle && (
                        <p className="text-muted-foreground text-xs mt-0.5">{p.subtitle}</p>
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
    </div>
  );
}