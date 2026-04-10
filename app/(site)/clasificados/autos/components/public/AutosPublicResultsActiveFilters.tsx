"use client";

import type { AutosBrowseUrlBundle } from "../../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../../filters/autosPublicFilterTypes";
import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";

type Chip = { key: string; label: string; onRemove: () => void };

function buildActiveFilterChips(
  bundle: AutosBrowseUrlBundle,
  copy: AutosPublicBlueprintCopy,
  push: (b: AutosBrowseUrlBundle) => void,
): Chip[] {
  const { filters, q } = bundle;
  const chips: Chip[] = [];

  const next = (patch: Partial<AutosBrowseUrlBundle>) => push({ ...bundle, ...patch, page: 1 });

  if (q.trim()) {
    chips.push({
      key: "q",
      label: `“${q.trim()}”`,
      onRemove: () => next({ q: "" }),
    });
  }
  if (filters.city.trim()) {
    chips.push({
      key: "city",
      label: `${copy.cityLabel}: ${filters.city.trim()}`,
      onRemove: () => next({ filters: { ...filters, city: "" } }),
    });
  }
  if (filters.zip.trim()) {
    chips.push({
      key: "zip",
      label: `${copy.zipLabel}: ${filters.zip.trim()}`,
      onRemove: () => next({ filters: { ...filters, zip: "" } }),
    });
  }
  if (filters.sellerType) {
    const lab =
      filters.sellerType === "dealer" ? copy.sellerDealer : filters.sellerType === "private" ? copy.sellerPrivate : "";
    chips.push({
      key: "seller",
      label: lab,
      onRemove: () => next({ filters: { ...filters, sellerType: "" } }),
    });
  }
  if (filters.condition) {
    const map: Record<string, string> = {
      new: copy.conditionNew,
      used: copy.conditionUsed,
      certified: copy.conditionCertified,
    };
    chips.push({
      key: "condition",
      label: map[filters.condition] ?? filters.condition,
      onRemove: () => next({ filters: { ...filters, condition: "" } }),
    });
  }
  if (filters.bodyStyle) {
    chips.push({
      key: "body",
      label: filters.bodyStyle,
      onRemove: () => next({ filters: { ...filters, bodyStyle: "" } }),
    });
  }
  if (filters.make) {
    chips.push({
      key: "make",
      label: filters.make,
      onRemove: () => next({ filters: { ...filters, make: "" } }),
    });
  }
  if (filters.model.trim()) {
    chips.push({
      key: "model",
      label: filters.model.trim(),
      onRemove: () => next({ filters: { ...filters, model: "" } }),
    });
  }
  if (filters.transmission) {
    chips.push({
      key: "transmission",
      label: filters.transmission,
      onRemove: () => next({ filters: { ...filters, transmission: "" } }),
    });
  }
  if (filters.drivetrain) {
    chips.push({
      key: "drivetrain",
      label: filters.drivetrain,
      onRemove: () => next({ filters: { ...filters, drivetrain: "" } }),
    });
  }
  if (filters.fuelType) {
    chips.push({
      key: "fuel",
      label: filters.fuelType,
      onRemove: () => next({ filters: { ...filters, fuelType: "" } }),
    });
  }
  if (filters.titleStatus) {
    chips.push({
      key: "title",
      label: filters.titleStatus,
      onRemove: () => next({ filters: { ...filters, titleStatus: "" } }),
    });
  }
  if (filters.priceMin.trim()) {
    chips.push({
      key: "pmin",
      label: `${copy.priceMin} ${filters.priceMin}`,
      onRemove: () => next({ filters: { ...filters, priceMin: "" } }),
    });
  }
  if (filters.priceMax.trim()) {
    chips.push({
      key: "pmax",
      label: `${copy.priceMax} ${filters.priceMax}`,
      onRemove: () => next({ filters: { ...filters, priceMax: "" } }),
    });
  }
  if (filters.yearMin.trim()) {
    chips.push({
      key: "ymin",
      label: `${copy.yearFrom} ${filters.yearMin}`,
      onRemove: () => next({ filters: { ...filters, yearMin: "" } }),
    });
  }
  if (filters.yearMax.trim()) {
    chips.push({
      key: "ymax",
      label: `${copy.yearTo} ${filters.yearMax}`,
      onRemove: () => next({ filters: { ...filters, yearMax: "" } }),
    });
  }
  if (filters.mileageMin.trim()) {
    chips.push({
      key: "mmin",
      label: `${copy.mileageMin} ${filters.mileageMin}`,
      onRemove: () => next({ filters: { ...filters, mileageMin: "" } }),
    });
  }
  if (filters.mileageMax.trim()) {
    chips.push({
      key: "mmax",
      label: `${copy.mileageMax} ${filters.mileageMax}`,
      onRemove: () => next({ filters: { ...filters, mileageMax: "" } }),
    });
  }

  return chips;
}

export function AutosPublicResultsActiveFilters({
  bundle,
  pushBundle,
  copy,
}: {
  bundle: AutosBrowseUrlBundle;
  pushBundle: (b: AutosBrowseUrlBundle) => void;
  copy: AutosPublicBlueprintCopy;
}) {
  const chips = buildActiveFilterChips(bundle, copy, pushBundle);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-3 py-1.5 text-left text-[11px] font-semibold text-[color:var(--lx-text)]"
          onClick={c.onRemove}
        >
          <span className="min-w-0 truncate">{c.label}</span>
          <span className="shrink-0 text-[color:var(--lx-muted)]" aria-hidden>
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        className="inline-flex items-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--lx-text-2)]"
        onClick={() =>
          pushBundle({
            ...bundle,
            filters: emptyAutosPublicFilters(),
            q: "",
            page: 1,
          })
        }
      >
        {copy.resultsClearAll}
      </button>
    </div>
  );
}
