import { lazy, Suspense } from "react";

export type LocationPickerProps = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, address?: string) => void;
  height?: number;
  defaultCity?: string;
};

const LazyPicker = lazy(() =>
  import("./LocationPicker.client").then((m) => ({ default: m.LocationPicker })),
);

export function LocationPicker(props: LocationPickerProps) {
  const height = props.height ?? 320;
  const placeholder = (
    <div
      className="rounded-2xl border border-border bg-muted/30 animate-pulse"
      style={{ height }}
    />
  );
  if (typeof window === "undefined") return placeholder;
  return (
    <Suspense fallback={placeholder}>
      <LazyPicker {...props} />
    </Suspense>
  );
}
