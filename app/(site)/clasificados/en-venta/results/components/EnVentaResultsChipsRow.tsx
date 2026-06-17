"use client";

import { EnVentaHubSwipeHintBadge } from "../../hub/EnVentaHubHorizontalScroll";

type Chip = { key: string; label: string; onRemove: () => void };

const chipClass =
  "inline-flex max-w-full shrink-0 snap-start items-center gap-1.5 rounded-full border border-[#C9A84A]/35 bg-gradient-to-br from-[#FFFBF0] to-[#FFFDF7] px-3 py-1.5 text-left text-xs font-semibold text-[#2C2416] shadow-sm transition hover:border-[#C9A84A]/55 hover:bg-[#FFF9EE] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45";

const railClass =
  "flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-1 scroll-pr-6 pb-1 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:scroll-pl-0 sm:scroll-pr-0 [&::-webkit-scrollbar]:hidden";

export function EnVentaResultsChipsRow({
  label,
  clearLabel,
  chips,
  onClearAll,
  swipeHint,
}: {
  label: string;
  clearLabel: string;
  chips: Chip[];
  onClearAll: () => void;
  swipeHint?: string;
}) {
  if (chips.length === 0) return null;
  const showSwipe = swipeHint && chips.length > 2;
  return (
    <div className="w-full rounded-xl border border-[#D6C7AD]/80 bg-[#FFFCF7]/95 px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{label}</span>
        {showSwipe ? <EnVentaHubSwipeHintBadge label={swipeHint} /> : null}
      </div>
      <div className="relative mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className={railClass}>
            {chips.map((c) => (
              <button
                key={`${c.key}:${c.label}`}
                type="button"
                onClick={c.onRemove}
                className={chipClass}
                aria-label={`${c.label} — remove filter`}
              >
                <span className="min-w-0 truncate">{c.label}</span>
                <span aria-hidden className="shrink-0 text-[#B8891A]">×</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] shadow-sm transition hover:border-[#C9A84A]/40 hover:bg-[#FAF7F2] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
          >
            {clearLabel}
          </button>
        </div>
        {showSwipe ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FFFCF7] via-60% to-transparent sm:hidden"
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
