import Link from "next/link";

import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ViajesResultsProviderRail({
  rows,
  ui,
}: {
  rows: ViajesResultRow[];
  ui: ViajesUi;
}) {
  const providers = new Map<string, { name: string; href: string; destination: string }>();
  for (const row of rows) {
    if (row.kind !== "business" || row.sellerLane === "private") continue;
    const name = row.businessName.trim();
    if (!name || name === "—") continue;
    const slug = row.businessProfileSlug?.trim() || slugify(name);
    if (!slug || providers.has(slug)) continue;
    providers.set(slug, {
      name,
      href: appendLangToPath(`/clasificados/viajes/negocio/${slug}`, ui.lang),
      destination: row.destination,
    });
    if (providers.size >= 8) break;
  }

  const list = [...providers.values()];
  if (!list.length) return null;

  return (
    <section className="mt-10 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-[color:var(--lx-text)] sm:text-xl">{ui.results.providerRailTitle}</h2>
        <Link
          href={appendLangToPath("/clasificados/viajes", ui.lang)}
          className="text-sm font-semibold text-[color:var(--lx-burgundy)] underline-offset-2 hover:underline"
        >
          {ui.results.providerRailCta} →
        </Link>
      </div>
      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {list.map((p) => (
          <li key={p.href} className="min-w-[200px] max-w-[220px] shrink-0">
            <Link
              href={p.href}
              className="block rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/50 p-4 transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              <p className="text-sm font-bold text-[color:var(--lx-text)]">{p.name}</p>
              {p.destination ? <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{p.destination}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
