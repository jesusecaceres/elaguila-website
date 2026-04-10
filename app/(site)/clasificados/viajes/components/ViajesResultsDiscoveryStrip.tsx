"use client";

import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { ViajesUi } from "../data/viajesUiCopy";
import { buildViajesBrowseUrl, defaultViajesBrowseState } from "../lib/viajesBrowseContract";

const RESULTS = "/clasificados/viajes/resultados";

export function ViajesResultsDiscoveryStrip({ lang, ui }: { lang: Lang; ui: ViajesUi }) {
  const base = defaultViajesBrowseState(lang);
  const links = [
    { label: ui.results.discoveryLastMinute, state: { ...base, t: "ultimo-minuto" } },
    { label: ui.results.discoveryFamilies, state: { ...base, audience: "familias", t: "tours" } },
    { label: ui.results.discoveryWeekend, state: { ...base, t: "fin-de-semana", from: "san-francisco" } },
  ] as const;

  return (
    <section className="mt-10 rounded-2xl border border-[color:var(--lx-gold-border)]/60 bg-gradient-to-br from-[#fffdfb] to-[#f3f4f7]/90 p-4 sm:p-5" aria-labelledby="viajes-results-discovery-heading">
      <h2 id="viajes-results-discovery-heading" className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">
        {ui.results.discoveryStripTitle}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{ui.results.discoveryStripSubtitle}</p>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={buildViajesBrowseUrl(item.state, RESULTS)}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
