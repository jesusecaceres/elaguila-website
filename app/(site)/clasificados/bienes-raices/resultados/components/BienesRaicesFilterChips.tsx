"use client";

import type { BrPrimaryChipId, BrSecondaryChipId } from "../search/filterTypes";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";

const PRIMARY_IDS: BrPrimaryChipId[] = ["casas", "departamentos", "venta", "renta", "comerciales", "terrenos"];

const SECONDARY_IDS: BrSecondaryChipId[] = ["piscina", "mascotas"];

type Props = {
  copy: BrResultsCopy;
  primary: Set<BrPrimaryChipId>;
  secondary: Set<BrSecondaryChipId>;
  onTogglePrimary: (id: BrPrimaryChipId) => void;
  onToggleSecondary: (id: BrSecondaryChipId) => void;
  onMoreFilters: () => void;
  matchCount: number;
};

function chipClass(on: boolean) {
  return (
    "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
    (on
      ? "border-[#C9B46A]/70 bg-[#FFF6E7] text-[#6E5418] shadow-[0_2px_8px_rgba(184,149,74,0.15)]"
      : "border-[#E8DFD0] bg-[#FDFBF7]/90 text-[#5C5346] hover:border-[#D4C4A8]")
  );
}

export function BienesRaicesFilterChips({
  copy,
  primary,
  secondary,
  onTogglePrimary,
  onToggleSecondary,
  onMoreFilters,
  matchCount,
}: Props) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRIMARY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onTogglePrimary(id)}
            className={chipClass(primary.has(id))}
          >
            {copy.primaryChips[id]}
          </button>
        ))}
        <button type="button" onClick={onMoreFilters} className={chipClass(false) + " border-dashed"}>
          {copy.filterMore}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {SECONDARY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onToggleSecondary(id)}
            className={chipClass(secondary.has(id)) + " py-1 text-[11px]"}
          >
            {copy.secondaryChips[id]}
          </button>
        ))}
        <span className="ml-1 rounded-full border border-[#E8DFD0] bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#5C5346]">
          {matchCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
