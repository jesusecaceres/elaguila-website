"use client";

import type { ReactNode } from "react";

const railClass =
  "flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-3 scroll-pr-3 pb-1.5 pt-0.5 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] sm:snap-none sm:flex-wrap sm:overflow-visible sm:scroll-pl-0 sm:scroll-pr-0 [&::-webkit-scrollbar]:hidden";

type Props = {
  children: ReactNode;
  /** Visible section label */
  label: string;
  /** Optional swipe hint (shown on mobile) */
  swipeHint?: string;
  className?: string;
};

/**
 * Mobile-first horizontal chip/card rail; wraps on `sm+`.
 */
export function EnVentaHubHorizontalScroll({ children, label, swipeHint, className = "" }: Props) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{label}</p>
        {swipeHint ? (
          <span className="shrink-0 text-[10px] font-medium text-[#7A7164] sm:hidden">{swipeHint}</span>
        ) : null}
      </div>
      <div className={railClass}>{children}</div>
    </div>
  );
}
