"use client";

import type { BrResultsCopy } from "../bienesRaicesResultsCopy";
import type { BrResultsParsedState } from "../lib/brResultsUrlState";

type Chip = { key: string; patch: Record<string, string | null>; label: string };

function buildChips(parsed: BrResultsParsedState, copy: BrResultsCopy): Chip[] {
  const chips: Chip[] = [];
  const { filterLabels: L } = copy;

  if (parsed.q.trim())
    chips.push({ key: "q", patch: { q: null }, label: `${L.q}: ${parsed.q.trim()}` });
  if (parsed.city.trim())
    chips.push({ key: "city", patch: { city: null }, label: `${L.city}: ${parsed.city.trim()}` });
  if (parsed.operationType)
    chips.push({
      key: "operationType",
      patch: { operationType: null },
      label: `${L.operationType}: ${parsed.operationType === "venta" ? copy.operationSale : copy.operationRent}`,
    });
  if (parsed.propertyType) {
    const pt =
      parsed.propertyType === "casa"
        ? copy.typeHouse
        : parsed.propertyType === "departamento"
          ? copy.typeApt
          : parsed.propertyType === "terreno"
            ? copy.typeLand
            : parsed.propertyType === "comercial"
              ? copy.typeCommercial
              : parsed.propertyType;
    chips.push({ key: "propertyType", patch: { propertyType: null, tipo: null }, label: `${L.propertyType}: ${pt}` });
  }
  if (parsed.sellerType)
    chips.push({
      key: "sellerType",
      patch: { sellerType: null },
      label: `${L.sellerType}: ${parsed.sellerType === "negocio" ? copy.sellerBusiness : copy.sellerPrivate}`,
    });
  if (parsed.priceMin.trim())
    chips.push({ key: "priceMin", patch: { priceMin: null }, label: `${L.priceMin}: ${parsed.priceMin}` });
  if (parsed.priceMax.trim())
    chips.push({ key: "priceMax", patch: { priceMax: null }, label: `${L.priceMax}: ${parsed.priceMax}` });
  if (parsed.beds)
    chips.push({ key: "beds", patch: { beds: null, recs: null }, label: `${L.beds}: ${parsed.beds}+` });
  if (parsed.baths)
    chips.push({ key: "baths", patch: { baths: null }, label: `${L.baths}: ${parsed.baths}+` });
  if (parsed.pets === "true")
    chips.push({ key: "pets", patch: { pets: null }, label: L.pets });
  if (parsed.furnished === "true")
    chips.push({ key: "furnished", patch: { furnished: null }, label: L.furnished });
  if (parsed.pool === "true") chips.push({ key: "pool", patch: { pool: null }, label: L.pool });
  if (parsed.precio)
    chips.push({ key: "precio", patch: { precio: null }, label: `${L.precio}: ${parsed.precio}` });
  if (parsed.primary.trim())
    chips.push({ key: "primary", patch: { primary: null }, label: `${L.primary}: ${parsed.primary}` });
  if (parsed.secondary.trim())
    chips.push({ key: "secondary", patch: { secondary: null }, label: `${L.secondary}: ${parsed.secondary}` });

  return chips;
}

export function BienesRaicesResultsActiveFilters({
  parsed,
  copy,
  onPatch,
  onClearAll,
  propiedadActive,
}: {
  parsed: BrResultsParsedState;
  copy: BrResultsCopy;
  onPatch: (patch: Record<string, string | null>) => void;
  onClearAll: () => void;
  /** Structural `propiedad` filter (separate query key). */
  propiedadActive: string | null;
}) {
  const chips = buildChips(parsed, copy);
  if (propiedadActive) {
    chips.push({
      key: "propiedad",
      patch: { propiedad: null },
      label: `${copy.filterLabels.propiedad}: ${propiedadActive}`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-3 sm:px-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{copy.activeFiltersLabel}</p>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-2 hover:text-[#8A6F3A]"
        >
          {copy.clearAllFilters}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key + c.label}
            type="button"
            onClick={() => onPatch(c.patch)}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#C9B46A]/45 bg-white/95 px-3 py-1.5 text-left text-[11px] font-semibold text-[#3D3630] shadow-sm transition hover:border-[#B8954A]/70"
          >
            <span className="min-w-0 truncate">{c.label}</span>
            <span className="shrink-0 text-[#B8954A]" aria-hidden>
              ×
            </span>
            <span className="sr-only">{copy.removeFilter}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
