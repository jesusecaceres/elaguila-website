"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. Canonical performance summary.
 *
 * One shared component for every category's "how is this listing doing" metrics row.
 * Renders ONLY the metrics the caller passes — never invents a metric, never shows a
 * synthetic zero for a metric this category has no real data source for. If `metrics` is
 * empty the whole section renders nothing (the workspace composer also skips the section
 * title in that case), which is the truthful state for a category with no proven per-listing
 * analytics yet (e.g. Restaurantes today) rather than a fabricated "0 views" row.
 */
export type OwnerEntityMetric = { key: string; label: string; value: number };

export function OwnerEntityPerformance({ title, metrics }: { title: string; metrics: OwnerEntityMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <section aria-label={title}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{title}</h3>
      <dl className="mt-2 flex flex-wrap gap-1.5">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="inline-flex items-center gap-1 rounded-full border border-[#D6C7AD]/70 bg-[#FBF7EF] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C5346]"
          >
            <dt className="text-[#7A7164]">{m.label}</dt>
            <dd className="tabular-nums text-[#1E1810]">{m.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
