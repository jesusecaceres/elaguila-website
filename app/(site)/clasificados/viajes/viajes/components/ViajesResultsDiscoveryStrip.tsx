"use client";

import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { buildViajesBrowseUrl, defaultViajesBrowseState, type ViajesBrowseState } from "../lib/viajesBrowseContract";

const RESULTS = "/clasificados/viajes/resultados";

export function ViajesResultsDiscoveryStrip({ ui, browse }: { ui: ViajesUi; browse: ViajesBrowseState }) {
  const base = defaultViajesBrowseState(browse.lang);
  const links = [
    {
      label: ui.results.discoveryNearYou,
      href: buildViajesBrowseUrl({ ...base, t: "cerca", page: 1 }, RESULTS),
    },
    {
      label: ui.results.discoveryFamilyTrips,
      href: buildViajesBrowseUrl({ ...base, audience: "familias", page: 1 }, RESULTS),
    },
    {
      label: ui.results.discoveryGuidesInspiration,
      href: buildViajesBrowseUrl({ ...base, t: "tours", page: 1 }, RESULTS),
    },
  ];

  return (
    <section
      className="mt-10 rounded-2xl border border-[color:var(--lx-gold-border)]/60 bg-gradient-to-br from-[#fffdfb] via-[#faf6ef]/90 to-[#f0f4f8]/90 p-4 shadow-sm sm:p-5"
      aria-labelledby="viajes-results-discovery-heading"
    >
      <h2 id="viajes-results-discovery-heading" className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">
        {ui.lang === "en" ? "Still exploring?" : "¿Todavía explorando?"}
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex min-h-[72px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-3 text-center text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
