"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { ViajesUi } from "../data/viajesUiCopy";
import { buildViajesBrowseUrl, type ViajesBrowseState } from "../lib/viajesBrowseContract";

const RESULTS = "/clasificados/viajes/resultados";

type StripLink = { label: string; state: ViajesBrowseState };

export function ViajesResultsDiscoveryStrip({ ui, browse }: { ui: ViajesUi; browse: ViajesBrowseState }) {
  const links = useMemo((): StripLink[] => {
    const out: StripLink[] = [];
    const hasDest = Boolean(browse.dest.trim() || browse.q.trim());

    if (hasDest) {
      out.push({
        label: ui.results.discoveryClearDestination,
        state: { ...browse, dest: "", q: "", page: 1 },
      });
    }

    out.push({
      label: ui.results.discoveryLastMinuteFromCurrent,
      state: { ...browse, t: "ultimo-minuto", dest: "", q: "", page: 1 },
    });

    if (!browse.audience.trim()) {
      out.push({
        label: ui.results.discoveryFamilies,
        state: { ...browse, audience: "familias", t: "tours", page: 1 },
      });
    }

    out.push({
      label: ui.results.discoveryWeekend,
      state: { ...browse, t: "fin-de-semana", from: browse.from || "san-francisco", page: 1 },
    });

    const seen = new Set<string>();
    const deduped: StripLink[] = [];
    for (const item of out) {
      const key = buildViajesBrowseUrl(item.state, RESULTS);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= 4) break;
    }
    return deduped;
  }, [browse, ui]);

  return (
    <section
      className="mt-10 rounded-2xl border border-[color:var(--lx-gold-border)]/60 bg-gradient-to-br from-[#fffdfb] via-[#faf6ef]/90 to-[#f0f4f8]/90 p-4 shadow-[0_16px_44px_-28px_rgba(30,50,75,0.12)] sm:p-5"
      aria-labelledby="viajes-results-discovery-heading"
    >
      <h2 id="viajes-results-discovery-heading" className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">
        {ui.results.discoveryStripTitle}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{ui.results.discoveryStripSubtitle}</p>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        {links.map((item, i) => (
          <li key={`${i}-${item.label}`} className="min-w-0 flex-1 sm:flex-none sm:max-w-[calc(50%-0.375rem)] lg:max-w-none">
            <Link
              href={buildViajesBrowseUrl(item.state, RESULTS)}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-center text-sm font-semibold leading-snug text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
