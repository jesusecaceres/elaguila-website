"use client";

import type { ReactNode } from "react";

const railScrollClass =
  "flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-3 scroll-pr-12 pb-2 pt-0.5 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const railDesktopWrapClass =
  "sm:flex sm:flex-wrap sm:gap-2 sm:snap-none sm:overflow-visible sm:scroll-pl-0 sm:scroll-pr-0 sm:pb-1.5";

/** Decorative mobile swipe cue — not a control. */
export function EnVentaHubSwipeHintBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#C9A84A]/55 bg-gradient-to-r from-[#FFFBF0] to-[#FFFDF7] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#7A5C12] shadow-[0_2px_10px_-4px_rgba(201,168,74,0.45)] sm:hidden"
    >
      <span className="flex items-center gap-0.5 text-[#B8891A]" aria-hidden>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </span>
  );
}

/** Right-edge fade hinting more content off-screen (mobile only). */
export function EnVentaHubScrollEdgeFade({ fromClass = "from-[#FAF6EE]" }: { fromClass?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 right-0 z-[1] w-14 bg-gradient-to-l ${fromClass} via-55% to-transparent sm:hidden`}
      aria-hidden
    />
  );
}

/** Decorative right-edge chevron — hints horizontal scroll (mobile only). */
export function EnVentaHubScrollChevronHint({ fromClass = "from-[#FAF6EE]/90" }: { fromClass?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-y-1 right-0.5 z-[2] flex w-9 items-center justify-end sm:hidden`}
      aria-hidden
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#C9A84A]/35 bg-gradient-to-br ${fromClass} to-[#FFFCF7]/95 text-[#B8891A] shadow-[0_2px_8px_-4px_rgba(42,36,22,0.18)]`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

/** Decorative scroll rail dots (mobile only). */
function EnVentaHubScrollRailDots() {
  return (
    <div className="mt-1.5 flex justify-center items-center gap-1.5 sm:hidden" aria-hidden>
      <span className="h-1 w-7 rounded-full bg-[#C9A84A]/65" />
      <span className="h-1 w-1.5 rounded-full bg-[#D6C7AD]/90" />
      <span className="h-1 w-1 rounded-full bg-[#D6C7AD]/65" />
    </div>
  );
}

type MobileScrollRailProps = {
  children: ReactNode;
  className?: string;
  edgeFadeFromClass?: string;
  showRailDots?: boolean;
  ariaLabel?: string;
  /** On `sm+`, use grid instead of horizontal scroll (e.g. listing cards). */
  desktopGridClass?: string;
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
}: MobileScrollRailProps) {
  const mobileOnly = Boolean(desktopGridClass);
  const scrollClass = mobileOnly
    ? `${railScrollClass} sm:hidden ${className}`.trim()
    : `${railScrollClass} ${railDesktopWrapClass} ${className}`.trim();

  const fadeFrom = edgeFadeFromClass ?? "from-[#FAF6EE]";
  const chevronFrom = edgeFadeFromClass ?? "from-[#FAF6EE]/90";

  return (
    <div className="relative min-w-0 -mx-1 sm:mx-0">
      <div className={scrollClass} aria-label={ariaLabel}>
        {children}
      </div>
      {!mobileOnly ? (
        <>
          <EnVentaHubScrollEdgeFade fromClass={fadeFrom} />
          <EnVentaHubScrollChevronHint fromClass={chevronFrom} />
        </>
      ) : null}
      {showRailDots && !mobileOnly ? <EnVentaHubScrollRailDots /> : null}
      {mobileOnly ? (
        <>
          <EnVentaHubScrollEdgeFade fromClass={fadeFrom} />
          <EnVentaHubScrollChevronHint fromClass={chevronFrom} />
          {showRailDots ? <EnVentaHubScrollRailDots /> : null}
          <div
            className={`mt-3 hidden gap-4 sm:grid ${desktopGridClass}`}
            aria-label={ariaLabel}
          >
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}

type Props = {
  children: ReactNode;
  label: string;
  swipeHint?: string;
  className?: string;
  /** Tailwind `from-*` class for edge fade (match parent surface). */
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
}: Props) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{label}</p>
        {swipeHint ? <EnVentaHubSwipeHintBadge label={swipeHint} /> : null}
      </div>
      <EnVentaHubMobileScrollRail edgeFadeFromClass={edgeFadeFromClass} className="mt-1 sm:flex-wrap">
        {children}
      </EnVentaHubMobileScrollRail>
    </div>
  );
}
