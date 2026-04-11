"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";
import { serializeAutosBrowseUrl, type AutosBrowseUrlBundle } from "../../filters/autosBrowseFilterContract";
import type { AutosPublicFilterState } from "../../filters/autosPublicFilterTypes";

const RESULTADOS_PATH = "/clasificados/autos/resultados";

type ChipDef = { key: string; label: string; patch: Partial<AutosPublicFilterState> };

function chipHref(base: AutosBrowseUrlBundle, patch: Partial<AutosPublicFilterState>): string {
  return `${RESULTADOS_PATH}?${serializeAutosBrowseUrl({
    ...base,
    filters: { ...base.filters, ...patch },
    page: 1,
    sort: "newest",
  })}`;
}

function isChipActive(applied: AutosPublicFilterState, patch: Partial<AutosPublicFilterState>): boolean {
  const keys = Object.keys(patch) as (keyof AutosPublicFilterState)[];
  return keys.every((k) => {
    const v = patch[k];
    if (v === undefined) return true;
    return String(applied[k] ?? "") === String(v);
  });
}

export function AutosPublicResultsQuickChips({
  bundle,
  copy,
}: {
  bundle: AutosBrowseUrlBundle;
  copy: AutosPublicBlueprintCopy;
}) {
  const chips: ChipDef[] = useMemo(() => {
    const c = copy;
    return [
      { key: "sedan", label: c.chips.sedan, patch: { bodyStyle: "Sedan" } },
      { key: "suv", label: c.chips.suv, patch: { bodyStyle: "SUV" } },
      { key: "truck", label: c.chips.truck, patch: { bodyStyle: "Truck" } },
      { key: "private", label: c.chipQuickPrivate, patch: { sellerType: "private" } },
      { key: "dealer", label: c.chipQuickDealer, patch: { sellerType: "dealer" } },
      { key: "new", label: c.conditionNew, patch: { condition: "new" } },
      { key: "used", label: c.conditionUsed, patch: { condition: "used" } },
      { key: "lowMiles", label: c.chipQuickLowMiles, patch: { mileageMax: "35000" } },
      { key: "econ", label: c.chipQuickEconomical, patch: { priceMax: "23000" } },
    ];
  }, [copy]);

  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{copy.resultsQuickFilters}</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pl-1 pr-2 pt-0.5 [scrollbar-width:thin]">
        {chips.map((ch) => {
          const active = isChipActive(bundle.filters, ch.patch);
          const href = chipHref(bundle, ch.patch);
          return (
            <Link
              key={ch.key}
              href={href}
              scroll={false}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)] shadow-sm"
                  : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text-2)] hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
              }`}
            >
              {ch.label}
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[color:var(--lx-muted)]">{copy.resultsQuickFiltersHint}</p>
    </div>
  );
}
