import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

export type LiveMarketplaceMapProps = {
  role: "professional" | "family" | "institution";
  userId: string;
  height?: number;
};

const LazyMap = lazy(() =>
  import("./LiveMarketplaceMap.client").then((m) => ({ default: m.LiveMarketplaceMap })),
);

export function LiveMarketplaceMap(props: LiveMarketplaceMapProps) {
  const height = props.height ?? 480;
  const placeholder = (
    <div
      style={{ height }}
      className="w-full rounded-2xl bg-muted/30 animate-pulse"
      aria-label="Cargando mapa en vivo"
    />
  );
  return (
    <ClientOnly fallback={placeholder}>
      <Suspense fallback={placeholder}>
        <LazyMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}