"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Lang = "es" | "en";

const railScrollClass =
  "flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-1 scroll-pr-4 pb-1.5 pt-0.5 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const railDesktopWrapClass =
  "sm:flex sm:flex-wrap sm:gap-2 sm:snap-none sm:overflow-visible sm:scroll-pl-0 sm:scroll-pr-0 sm:pb-1.5";

export function enVentaSwipeHintLabel(lang: Lang): string {
  return lang === "es" ? "Desliza ← →" : "Swipe ← →";
}

function scrollButtonLabels(lang: Lang) {
  return lang === "es"
    ? { left: "Desplazar a la izquierda", right: "Desplazar a la derecha" }
    : { left: "Scroll left", right: "Scroll right" };
}

/** Concise directional cue — not a control. */
export function EnVentaHubSwipeHintBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-[#C9A84A]/55 bg-gradient-to-r from-[#FFFBF0] to-[#FFFDF7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A5C12] shadow-[0_2px_10px_-4px_rgba(201,168,74,0.45)] sm:hidden"
    >
      {label}
    </span>
  );
}

/** Subtle edge fade (mobile only) — does not cover peek zone. */
export function EnVentaHubScrollEdgeFade({
  side,
  fromClass = "from-[#FAF6EE]",
}: {
  side: "left" | "right";
  fromClass?: string;
}) {
  const pos =
    side === "right"
      ? `right-0 bg-gradient-to-l ${fromClass} via-40% to-transparent`
      : `left-0 bg-gradient-to-r ${fromClass} via-40% to-transparent`;
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 z-[1] w-6 ${pos} sm:hidden`}
      aria-hidden
    />
  );
}

function EnVentaHubScrollRailDots() {
  return (
    <div className="mt-1 flex items-center justify-center gap-1.5 sm:hidden" aria-hidden>
      <span className="h-0.5 w-5 rounded-full bg-[#C9A84A]/55" />
      <span className="h-0.5 w-1 rounded-full bg-[#D6C7AD]/80" />
      <span className="h-0.5 w-1 rounded-full bg-[#D6C7AD]/55" />
    </div>
  );
}

function EnVentaHubScrollArrowButton({
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
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/40 bg-[#FFFCF7] text-[#B8891A] shadow-sm transition enabled:hover:border-[#C9A84A]/60 enabled:hover:bg-[#FFFBF0] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 disabled:opacity-30 sm:hidden"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        {direction === "left" ? (
          <path d="M14 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M10 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

type MobileScrollRailProps = {
  children: ReactNode;
  className?: string;
  edgeFadeFromClass?: string;
  showRailDots?: boolean;
  ariaLabel?: string;
  lang?: Lang;
  /** On `sm+`, use grid instead of horizontal scroll (e.g. listing cards). */
  desktopGridClass?: string;
  /** Show scroll arrows on mobile (default true when lang provided). */
  showScrollControls?: boolean;
};

/**
 * Shared horizontal scroll surface for En Venta hub rails (listings, chips, cards).
 */
export function EnVentaHubMobileScrollRail({
  children,
  className = "",
  edgeFadeFromClass,
  showRailDots = true,
  ariaLabel,
  desktopGridClass,
  lang = "es",
  showScrollControls = true,
}: MobileScrollRailProps) {
  const mobileOnly = Boolean(desktopGridClass);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollClass = mobileOnly
    ? `${railScrollClass} sm:hidden ${className}`.trim()
    : `${railScrollClass} ${railDesktopWrapClass} ${className}`.trim();

  const fadeFrom = edgeFadeFromClass ?? "from-[#FAF6EE]";
  const labels = scrollButtonLabels(lang);
  const controlsOn = showScrollControls;

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
      {canScrollLeft ? <EnVentaHubScrollEdgeFade side="left" fromClass={fadeFrom} /> : null}
      {canScrollRight ? <EnVentaHubScrollEdgeFade side="right" fromClass={fadeFrom} /> : null}
      <div ref={scrollRef} className={scrollClass} aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );

  const mobileScrollRow = (
    <div className="flex items-stretch gap-1 sm:block">
      {controlsOn ? (
        <EnVentaHubScrollArrowButton
          direction="left"
          disabled={!canScrollLeft}
          onClick={() => scrollByDirection(-1)}
          label={labels.left}
        />
      ) : null}
      {scrollSurface}
      {controlsOn ? (
        <EnVentaHubScrollArrowButton
          direction="right"
          disabled={!canScrollRight}
          onClick={() => scrollByDirection(1)}
          label={labels.right}
        />
      ) : null}
    </div>
  );

  if (mobileOnly) {
    return (
      <div className="relative min-w-0 -mx-0.5 sm:mx-0">
        <div className="sm:hidden">{mobileScrollRow}</div>
        {showRailDots ? <EnVentaHubScrollRailDots /> : null}
        <div className={`mt-3 hidden gap-4 sm:grid ${desktopGridClass}`} aria-label={ariaLabel}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 -mx-0.5 sm:mx-0">
      {mobileScrollRow}
      {showRailDots ? <EnVentaHubScrollRailDots /> : null}
    </div>
  );
}

type Props = {
  children: ReactNode;
  label: string;
  swipeHint?: string;
  className?: string;
  lang?: Lang;
  edgeFadeFromClass?: string;
};

/**
 * Mobile-first horizontal chip/card rail; wraps on `sm+`.
 */
export function EnVentaHubHorizontalScroll({
  children,
  label,
  swipeHint,
  className = "",
  edgeFadeFromClass,
  lang = "es",
}: Props) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{label}</p>
        {swipeHint ? <EnVentaHubSwipeHintBadge label={swipeHint} /> : null}
      </div>
      <EnVentaHubMobileScrollRail
        lang={lang}
        edgeFadeFromClass={edgeFadeFromClass}
        className="mt-1 sm:flex-wrap"
      >
        {children}
      </EnVentaHubMobileScrollRail>
    </div>
  );
}
