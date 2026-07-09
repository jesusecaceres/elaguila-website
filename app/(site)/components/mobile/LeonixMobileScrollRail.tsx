"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Leonix Global Mobile/PWA Foundation V1 — shared horizontal scroll rail.
 *
 * Generalized from the En Venta hub rail behavior (snap-x, hidden scrollbars,
 * edge fades, arrow controls, swipe hint, rail dots) with no category-specific
 * content. Mobile = horizontal scroll; desktop can wrap, become a grid, or stay
 * as a scroll rail depending on `desktopMode`.
 *
 * Brand palette: burgundy #7A1E2C · gold/bronze #C9A84A · ivory #FFFCF7 / #FAF6EE
 * · charcoal #1F241C.
 */

type Lang = "es" | "en";

export type LeonixMobileScrollRailProps = {
  children: ReactNode;
  label?: string;
  swipeHint?: string;
  lang?: Lang;
  className?: string;
  edgeFadeFromClass?: string;
  desktopMode?: "wrap" | "grid" | "none";
  desktopGridClass?: string;
  showRailDots?: boolean;
  showScrollControls?: boolean;
  ariaLabel?: string;
};

const RAIL_SCROLL =
  "flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-1 scroll-pr-4 pb-1.5 pt-0.5 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const RAIL_DESKTOP_WRAP =
  "sm:flex sm:flex-wrap sm:gap-2 sm:snap-none sm:overflow-visible sm:scroll-pl-0 sm:scroll-pr-0 sm:pb-1.5";

function scrollButtonLabels(lang: Lang) {
  return lang === "es"
    ? { left: "Desplazar a la izquierda", right: "Desplazar a la derecha" }
    : { left: "Scroll left", right: "Scroll right" };
}

function SwipeHintBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[#C9A84A]/40 bg-[#FFFBF0]/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[#7A5C12] sm:hidden">
      {label}
    </span>
  );
}

function EdgeFade({ side, fromClass }: { side: "left" | "right"; fromClass: string }) {
  const pos =
    side === "right"
      ? `right-0 bg-gradient-to-l ${fromClass} via-40% to-transparent`
      : `left-0 bg-gradient-to-r ${fromClass} via-40% to-transparent`;
  return <div className={`pointer-events-none absolute inset-y-0 z-[1] w-6 ${pos} sm:hidden`} aria-hidden />;
}

function RailDots() {
  return (
    <div className="mt-1 flex items-center justify-center gap-1.5 sm:hidden" aria-hidden>
      <span className="h-0.5 w-5 rounded-full bg-[#C9A84A]/55" />
      <span className="h-0.5 w-1 rounded-full bg-[#D6C7AD]/80" />
      <span className="h-0.5 w-1 rounded-full bg-[#D6C7AD]/55" />
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D6C7AD]/80 bg-[#FFFCF7]/95 text-[#B8891A] transition enabled:hover:border-[#C9A84A]/50 enabled:hover:bg-[#FFFBF0] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 disabled:opacity-25 sm:hidden"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
        {direction === "left" ? (
          <path d="M14 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M10 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

export function LeonixMobileScrollRail({
  children,
  label,
  swipeHint,
  lang = "es",
  className = "",
  edgeFadeFromClass = "from-[#FAF6EE]",
  desktopMode = "wrap",
  desktopGridClass,
  showRailDots = false,
  showScrollControls = true,
  ariaLabel,
}: LeonixMobileScrollRailProps) {
  const isGrid = desktopMode === "grid";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const desktopClass =
    desktopMode === "wrap" ? RAIL_DESKTOP_WRAP : desktopMode === "none" ? "" : "sm:hidden";
  const scrollClass = `${RAIL_SCROLL} ${desktopClass} ${className}`.trim();

  const labels = scrollButtonLabels(lang);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(maxScroll > 6 && el.scrollLeft < maxScroll - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollByDirection = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.68, 140);
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const scrollSurface = (
    <div className="relative min-w-0 flex-1 sm:w-full">
      {canScrollLeft ? <EdgeFade side="left" fromClass={edgeFadeFromClass} /> : null}
      {canScrollRight ? <EdgeFade side="right" fromClass={edgeFadeFromClass} /> : null}
      <div ref={scrollRef} className={scrollClass} aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );

  const mobileScrollRow = (
    <div className="flex items-stretch gap-0.5 sm:block">
      {showScrollControls ? (
        <ArrowButton
          direction="left"
          disabled={!canScrollLeft}
          onClick={() => scrollByDirection(-1)}
          label={labels.left}
        />
      ) : null}
      {scrollSurface}
      {showScrollControls ? (
        <ArrowButton
          direction="right"
          disabled={!canScrollRight}
          onClick={() => scrollByDirection(1)}
          label={labels.right}
        />
      ) : null}
    </div>
  );

  const header =
    label || swipeHint ? (
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{label}</p>
        ) : (
          <span />
        )}
        {swipeHint ? <SwipeHintBadge label={swipeHint} /> : null}
      </div>
    ) : null;

  return (
    <div className="relative min-w-0 -mx-0.5 sm:mx-0">
      {header}
      <div className={isGrid ? "sm:hidden" : ""}>{mobileScrollRow}</div>
      {showRailDots ? <RailDots /> : null}
      {isGrid ? (
        <div className={`mt-3 hidden gap-4 sm:grid ${desktopGridClass ?? ""}`} aria-label={ariaLabel}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
