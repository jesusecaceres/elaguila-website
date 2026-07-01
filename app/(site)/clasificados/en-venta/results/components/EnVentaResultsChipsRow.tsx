"use client";

import {
  EnVentaHubMobileScrollRail,
  EnVentaHubSwipeHintBadge,
} from "../../hub/EnVentaHubHorizontalScroll";

type Chip = { key: string; label: string; onRemove: () => void };

const chipClass =
  "inline-flex h-[30px] max-w-full shrink-0 snap-start items-center gap-1 rounded-md border border-[#C9A84A]/40 bg-[#FBF7EF] px-2.5 text-left text-[11px] font-semibold text-[#3D3428] transition hover:border-[#C9A84A]/60 focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs";

export function EnVentaResultsChipsRow({
  label,
  clearLabel,
  chips,
  onClearAll,
  swipeHint,
  lang = "es",
}: {
  label: string;
  clearLabel: string;
  chips: Chip[];
  onClearAll: () => void;
  swipeHint?: string;
  lang?: "es" | "en";
}) {
  if (chips.length === 0) return null;
  const showSwipe = Boolean(swipeHint && chips.length > 2);
  return (
    <div className="w-full rounded-xl border border-[#D6C7AD]/80 bg-[#FFFCF7]/95 px-2.5 py-1.5 shadow-sm sm:px-4 sm:py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{label}</span>
        {showSwipe && swipeHint ? <EnVentaHubSwipeHintBadge label={swipeHint} /> : null}
      </div>
      <div className="mt-1.5 sm:mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <EnVentaHubMobileScrollRail
              lang={lang}
              edgeFadeFromClass="from-[#FFFCF7]"
              showRailDots={showSwipe}
              showScrollControls={showSwipe}
            >
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
            </EnVentaHubMobileScrollRail>
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 rounded-md border border-[#C9A84A]/45 bg-[#FFFDF7] px-2.5 py-1 text-[11px] font-semibold text-[#3D3428] transition hover:bg-[#FBF7EF] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs"
          >
            {clearLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
