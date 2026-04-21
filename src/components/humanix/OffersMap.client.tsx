import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix iconos rotos al bundlear
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const greenIcon = L.divIcon({
  className: "humanix-marker",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:oklch(0.78 0.18 165);border:3px solid white;box-shadow:0 0 0 2px oklch(0.78 0.18 165 / .4),0 4px 12px rgba(0,0,0,.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const blueIcon = L.divIcon({
  className: "humanix-marker",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:oklch(0.55 0.22 260);border:3px solid white;box-shadow:0 0 0 2px oklch(0.55 0.22 260 / .4),0 4px 12px rgba(0,0,0,.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  status?: "available" | "reserved";
  href?: string;
};

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [points, map]);
  return null;
}

export function OffersMap({
  points,
  height = 420,
  center = { lat: 4.6097, lng: -74.0817 }, // Bogotá
  zoom = 11,
}: {
  points: MapPoint[];
  height?: number;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        className="rounded-2xl border border-border bg-muted/30 animate-pulse"
        style={{ height }}
      />
    );
  }
  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  return (
    <div
      className="rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-card)]"
      style={{ height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {valid.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={p.status === "reserved" ? blueIcon : greenIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{p.title}</p>
                {p.subtitle && <p className="text-muted-foreground text-xs mt-0.5">{p.subtitle}</p>}
                {p.href && (
                  <a href={p.href} className="text-biosensor text-xs font-medium mt-2 inline-block">
                    Ver detalles →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {valid.length > 1 && <FitBounds points={valid} />}
      </MapContainer>
    </div>
  );
}
