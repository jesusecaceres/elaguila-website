"use client";

import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import {
  buildViajesBrowseUrl,
  defaultViajesBrowseState,
  type ViajesBrowseState,
} from "../lib/viajesBrowseContract";
import { getViajesResultsTripTypeOptions } from "../lib/viajesResultsTripTypeOptions";

type Chip = { key: string; label: string; clear: Partial<ViajesBrowseState> };

export function ViajesResultsActiveFilters({
  browse,
  ui,
  pathname,
}: {
  browse: ViajesBrowseState;
  ui: ViajesUi;
  pathname: string;
}) {
  const tripLabel =
    getViajesResultsTripTypeOptions(ui.lang).find((o) => o.value === browse.t)?.label ?? browse.t;
  const hub: Record<string, string> = {
    "san-jose": "San José",
    "san-francisco": "San Francisco",
    oakland: "Oakland",
  };

  const chips: Chip[] = [];
  if (browse.from.trim()) {
    chips.push({
      key: "from",
      label: `${ui.results.departurePrefix} ${hub[browse.from] ?? browse.from}`,
      clear: { from: "", originByGeo: "" },
    });
  }
  if (browse.t.trim()) {
    chips.push({ key: "t", label: tripLabel, clear: { t: "" } });
  }
  const dest = browse.q.trim() || browse.dest.trim();
  if (dest) {
    chips.push({ key: "dest", label: dest, clear: { q: "", dest: "" } });
  }
  if (browse.budget.trim()) {
    chips.push({ key: "budget", label: browse.budget, clear: { budget: "" } });
  }
  if (browse.audience.trim()) {
    chips.push({ key: "audience", label: browse.audience, clear: { audience: "" } });
  }

  if (!chips.length) return null;

  const clearHref = buildViajesBrowseUrl(defaultViajesBrowseState(browse.lang), pathname);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
        {ui.results.activeFiltersTitle}
      </span>
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={buildViajesBrowseUrl({ ...browse, ...chip.clear, page: 1 }, pathname)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 text-xs font-semibold text-[color:var(--lx-text)]"
        >
          {chip.label}
          <span aria-hidden>×</span>
        </Link>
      ))}
      <Link href={clearHref} className="text-xs font-bold text-rose-700 underline-offset-2 hover:underline">
        {ui.results.clearFilters}
      </Link>
    </div>
  );
}
