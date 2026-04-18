import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const pinIcon = L.divIcon({
  className: "humanix-pin",
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:oklch(0.78 0.18 165);border:3px solid white;box-shadow:0 0 0 3px oklch(0.78 0.18 165 / .35),0 6px 14px rgba(0,0,0,.3)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 13), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function ClickToSet({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  lat,
  lng,
  onChange,
  height = 320,
  defaultCity = "Bogotá",
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, address?: string) => void;
  height?: number;
  defaultCity?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setMounted(true), []);

  const center = {
    lat: lat ?? 4.6097,
    lng: lng ?? -74.0817,
  };

  async function geocode() {
    const q = search.trim();
    if (!q) return;
    setBusy(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(q + " " + defaultCity)}`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await r.json();
      if (Array.isArray(data) && data[0]) {
        const item = data[0] as { lat: string; lon: string; display_name: string };
        onChange(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
        toast.success("Ubicación encontrada");
      } else {
        toast.error("No se encontró esa dirección");
      }
    } catch {
      toast.error("Error buscando la dirección");
    } finally {
      setBusy(false);
    }
  }

  function useGps() {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        toast.success("Ubicación GPS aplicada");
        setBusy(false);
      },
      () => {
        toast.error("No pudimos obtener tu ubicación");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  if (!mounted) {
    return (
      <div
        className="rounded-2xl border border-border bg-muted/30 animate-pulse"
        style={{ height }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Busca tu dirección, barrio o ciudad"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void geocode();
            }
          }}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button type="button" onClick={geocode} variant="glass" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            <span className="ml-1.5">Buscar</span>
          </Button>
          <Button type="button" onClick={useGps} variant="glass" disabled={busy} title="Usar mi ubicación actual">
            <Crosshair className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">GPS</span>
          </Button>
        </div>
      </div>
      <div
        className="rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-card)] relative"
        style={{ height }}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={lat && lng ? 14 : 11}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {lat != null && lng != null && (
            <>
              <Marker position={[lat, lng]} icon={pinIcon} />
              <Recenter lat={lat} lng={lng} />
            </>
          )}
          <ClickToSet onPick={(la, ln) => onChange(la, ln)} />
        </MapContainer>
        <div className="absolute bottom-2 left-2 right-2 bg-background/90 backdrop-blur rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground pointer-events-none">
          Toca el mapa para fijar tu ubicación · usa GPS para tu posición actual
        </div>
      </div>
      {lat != null && lng != null && (
        <p className="text-[11px] text-muted-foreground">
          📍 {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
