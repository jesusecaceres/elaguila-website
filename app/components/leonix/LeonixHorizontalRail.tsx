"use client";

/**
 * Shared horizontal-rail discoverability (Servicios Owner QA SVC-QA-13/14/33/34).
 *
 * Wraps an existing scrolling track and only adds affordances when the track REALLY overflows:
 * an edge fade plus a small chevron on each side that still has hidden content. When everything
 * fits, it renders the track alone — no arrows, no fade, no false "drag me" cue.
 *
 * - The track keeps the consumer's own classes (snap, gap, padding), so native touch swipe,
 *   momentum and snap behave exactly as before; the chevrons are small edge buttons that never
 *   cover the track's middle, and fades are `pointer-events-none`.
 * - Chevrons are real buttons with bilingual labels and hide at the matching rail end.
 * - `revealKey`: when it changes, the item marked `data-rail-active="true"` is scrolled into view
 *   inside the track only (never scrolls the page vertically) — used by the application step rail.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const EDGE_EPSILON_PX = 2;

export function LeonixHorizontalRail({
  children,
  trackClassName,
  className = "",
  lang,
  fadeColor = "#FFFFFF",
  ariaLabel,
  revealKey,
  trackProps,
}: {
  children: ReactNode;
  /** The consumer's existing track classes (must include its own `flex … overflow-x-auto`). */
  trackClassName: string;
  /** Wrapper classes (e.g. `md:hidden`, margins). */
  className?: string;
  lang: "es" | "en";
  /** Colour behind the rail, used for the edge fade. */
  fadeColor?: string;
  ariaLabel?: string;
  /** Change this to scroll the `data-rail-active="true"` child into view. */
  revealKey?: string | number;
  /** Extra attributes for the track element (data-* / aria-*). */
  trackProps?: Record<string, string | undefined>;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const left = el.scrollLeft > EDGE_EPSILON_PX;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - EDGE_EPSILON_PX;
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(measure) : null;
    mo?.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    if (revealKey === undefined) return;
    const el = trackRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[data-rail-active="true"]');
    if (!active) return;
    const target = active.offsetLeft - (el.clientWidth - active.clientWidth) / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [revealKey]);

  const scrollByPage = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const labels =
    lang === "en" ? { prev: "Show previous", next: "Show more" } : { prev: "Ver anteriores", next: "Ver más" };
  const chevronClass =
    "absolute top-1/2 z-[3] flex h-9 w-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#3D2C12] shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B66AD]/60";

  return (
    <div className={`relative min-w-0 ${className}`.trim()} data-leonix-rail={edges.left || edges.right ? "overflow" : "static"}>
      <div ref={trackRef} className={trackClassName} aria-label={ariaLabel} {...trackProps}>
        {children}
      </div>
      {edges.left ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-8"
            style={{ background: `linear-gradient(to right, ${fadeColor}, transparent)` }}
          />
          <button type="button" aria-label={labels.prev} onClick={() => scrollByPage(-1)} className={`${chevronClass} left-0`}>
            <FiChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        </>
      ) : null}
      {edges.right ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-8"
            style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }}
          />
          <button type="button" aria-label={labels.next} onClick={() => scrollByPage(1)} className={`${chevronClass} right-0`}>
            <FiChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}
