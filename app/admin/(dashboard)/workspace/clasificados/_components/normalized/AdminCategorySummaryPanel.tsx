import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import type { AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { adminSummaryLowerBoundText, adminSummaryScopeText } from "@/app/admin/_lib/adminFilterTruth";
import { buildAdminCategorySummaryCells, type AdminSummaryCell } from "../../_lib/adminNormalizedShell";

export type AdminCategorySummaryPanelProps = {
  /** From `fetchAdminCategorySummary(slug, { lane })`. A null count renders "—", never a fake 0. */
  summary: AdminCategorySummary;
  lang?: AdminLang;
  /** When the counts are scoped to a lane (Autos lanes, BR Negocio/Privado), say which. */
  laneLabel?: string | null;
  /**
   * True when the page has an active list filter (search / status / owner / Leonix Ad ID / lane …). The summary
   * ALWAYS covers the whole category (or the lane when `laneLabel` is set); this flag only strengthens the
   * caption so nobody reads a whole-category count as the size of the filtered list.
   */
  filtersActive?: boolean;
  /** Extra technical rows tucked under "Advanced / details" (e.g. `[["Table", "public.listings"]]`). */
  technicalDetails?: ReadonlyArray<readonly [label: string, value: string]>;
  className?: string;
};

const TONE_CLASS: Record<AdminSummaryCell["tone"], string> = {
  neutral: "border-[#E8DFD0] bg-[#FFFCF7] text-[#1E1810]",
  good: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warn: "border-amber-300 bg-amber-50 text-amber-900",
  bad: "border-red-200 bg-red-50 text-red-800",
};

/**
 * OPERATING SUMMARY — the same six answers on every category page: total, live, needs attention,
 * payment issue, expired (only when the category has expiry), source health. Technical source
 * detail lives under "Advanced / details". Server-component friendly (no hooks).
 */
export function AdminCategorySummaryPanel({ summary, lang = "en", laneLabel, filtersActive = false, technicalDetails, className }: AdminCategorySummaryPanelProps) {
  const cells = buildAdminCategorySummaryCells(summary, lang);
  return (
    <section
      className={`${adminCardBase} min-w-0 space-y-3 p-4 ${className ?? ""}`}
      data-testid="admin-category-summary"
      aria-label={adminTr(lang, "catShell.summary.title")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-[#1E1810]">{adminTr(lang, "catShell.summary.title")}</p>
        {laneLabel ? (
          <p className="text-[11px] font-semibold text-[#7A7164]" data-testid="admin-category-summary-lane">
            {adminTr(lang, "catShell.summary.laneScoped", { lane: laneLabel })}
          </p>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {cells.map((c) => (
          <div
            key={c.key}
            className={`min-w-0 rounded-xl border px-3 py-2 ${TONE_CLASS[c.tone]}`}
            title={c.title}
            data-testid={`admin-category-summary-${c.key}`}
          >
            <dt className="text-[10px] font-bold uppercase tracking-wide opacity-80">{c.label}</dt>
            <dd className="mt-0.5 text-lg font-bold leading-tight">{c.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-[11px] leading-snug text-[#7A7164]" data-testid="admin-category-summary-scope">
        {adminSummaryScopeText(lang, filtersActive, laneLabel)}
        {summary.lowerBound && summary.lowerBound.length > 0 ? (
          <>
            {" "}
            <span data-testid="admin-category-summary-lower-bound">{adminSummaryLowerBoundText(lang)}</span>
          </>
        ) : null}
      </p>

      {summary.queryError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert" data-testid="admin-category-summary-error">
          {adminTr(lang, "catShell.summary.queryError", { error: summary.queryError })}
        </p>
      ) : null}

      <details className="text-[11px] text-[#7A7164]" data-testid="admin-category-summary-advanced">
        <summary className="cursor-pointer select-none font-semibold">{adminTr(lang, "catShell.advanced")}</summary>
        <dl className="mt-2 space-y-1 font-mono">
          <div>
            <dt className="inline font-semibold">{adminTr(lang, "catShell.summary.querySource")}: </dt>
            <dd className="inline text-[#3D3428]">{summary.sourceHealth.source}</dd>
          </div>
          {summary.sourceHealth.note ? (
            <div>
              <dt className="inline font-semibold">{adminTr(lang, "catShell.summary.note")}: </dt>
              <dd className="inline text-[#3D3428]">{summary.sourceHealth.note}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline font-semibold">slug: </dt>
            <dd className="inline text-[#3D3428]">{summary.slug}</dd>
          </div>
          {(technicalDetails ?? []).map(([label, value]) => (
            <div key={label}>
              <dt className="inline font-semibold">{label}: </dt>
              <dd className="inline text-[#3D3428]">{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
