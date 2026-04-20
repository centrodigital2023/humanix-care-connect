import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Pixels to scroll per arrow click. Defaults to 280 (typical card width + gap). */
  step?: number;
};

/**
 * Horizontal scroll container with mobile swipe + desktop arrow navigation.
 * Arrows only appear on md+ when there is content to scroll.
 */
export function HScrollCarousel({ children, className, step = 280 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      <div
        ref={ref}
        className={cn(
          "overflow-x-auto overflow-y-hidden pb-2 -mx-1 snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain",
          className,
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
      {/* Desktop nav arrows */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={!canPrev}
        aria-label="Anterior"
        className={cn(
          "hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10",
          "h-9 w-9 items-center justify-center rounded-full",
          "bg-background/90 backdrop-blur border border-border shadow-md",
          "hover:bg-background hover:scale-105 transition-all",
          "disabled:opacity-0 disabled:pointer-events-none",
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={!canNext}
        aria-label="Siguiente"
        className={cn(
          "hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10",
          "h-9 w-9 items-center justify-center rounded-full",
          "bg-background/90 backdrop-blur border border-border shadow-md",
          "hover:bg-background hover:scale-105 transition-all",
          "disabled:opacity-0 disabled:pointer-events-none",
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}