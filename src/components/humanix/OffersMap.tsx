// SSR-safe wrapper. Leaflet touches `window` at import time, so we lazy-load
// the real map only on the client and render a placeholder during SSR.
import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";
import type { MapPoint } from "./OffersMap.client";

export type { MapPoint };

const LazyMap =
  typeof window === "undefined"
    ? null
    : lazy(() =>
        import("./OffersMap.client").then((m) => ({ default: m.OffersMap })),
      );

type Props = ComponentProps<typeof import("./OffersMap.client")["OffersMap"]>;

export function OffersMap(props: Props) {
  const height = props.height ?? 420;
  if (!LazyMap) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-xl bg-muted/30 animate-pulse"
        aria-label="Cargando mapa"
      />
    );
  }
  return (
    <Suspense
      fallback={
        <div
          style={{ height }}
          className="w-full rounded-xl bg-muted/30 animate-pulse"
        />
      }
    >
      <LazyMap {...props} />
    </Suspense>
  );
}
