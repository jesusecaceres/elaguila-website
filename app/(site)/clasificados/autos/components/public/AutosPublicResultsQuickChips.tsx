"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";
import { serializeAutosBrowseUrl, type AutosBrowseUrlBundle } from "../../filters/autosBrowseFilterContract";
import type { AutosPublicFilterState } from "../../filters/autosPublicFilterTypes";
import type { AutosPublicMarket } from "@/app/lib/clasificados/autos/autosPublicMarket";
import { autosMarketDefaultSellerType } from "@/app/lib/clasificados/autos/autosPublicMarket";

type ChipDef = { key: string; label: string; patch: Partial<AutosPublicFilterState> };

function chipHref(base: AutosBrowseUrlBundle, patch: Partial<AutosPublicFilterState>, resultsPath: string): string {
  return `${resultsPath}?${serializeAutosBrowseUrl({
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
  market = "private",
  resultsPath = "/clasificados/autos/results",
}: {
  bundle: AutosBrowseUrlBundle;
  copy: AutosPublicBlueprintCopy;
  market?: AutosPublicMarket;
  resultsPath?: string;
}) {
  const defaultSeller = autosMarketDefaultSellerType(market);
  const chips: ChipDef[] = useMemo(() => {
    const c = copy;
    const seller = defaultSeller;
    if (market === "private") {
      return [
        { key: "sedan", label: c.chips.sedan, patch: { bodyStyle: "Sedan", sellerType: seller } },
        { key: "suv", label: c.chips.suv, patch: { bodyStyle: "SUV", sellerType: seller } },
        { key: "truck", label: c.chips.truck, patch: { bodyStyle: "Truck", sellerType: seller } },
        { key: "private", label: c.chipQuickPrivate, patch: { sellerType: "private" } },
        { key: "used", label: c.conditionUsed, patch: { condition: "used", sellerType: seller } },
        { key: "lowMiles", label: c.chipQuickLowMiles, patch: { mileageMax: "35000", sellerType: seller } },
        { key: "econ", label: c.chipQuickEconomical, patch: { priceMax: "23000", sellerType: seller } },
      ];
    }
    return [
      { key: "dealer", label: c.chipQuickDealer, patch: { sellerType: "dealer" } },
      { key: "used", label: c.conditionUsed, patch: { condition: "used", sellerType: seller } },
      { key: "new", label: c.conditionNew, patch: { condition: "new", sellerType: seller } },
      { key: "lowMiles", label: c.chipQuickLowMiles, patch: { mileageMax: "35000", sellerType: seller } },
      { key: "truck", label: c.chips.truck, patch: { bodyStyle: "Truck", sellerType: seller } },
      { key: "suv", label: c.chips.suv, patch: { bodyStyle: "SUV", sellerType: seller } },
    ];
  }, [copy, defaultSeller, market]);

  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{copy.resultsQuickFilters}</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pl-1 pr-2 pt-0.5 [scrollbar-width:thin]">
        {chips.map((ch) => {
          const active = isChipActive(bundle.filters, ch.patch);
          const href = chipHref(bundle, ch.patch, resultsPath);
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
