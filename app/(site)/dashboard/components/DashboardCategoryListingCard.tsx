"use client";

import { DashboardListingActionBar } from "./DashboardListingActionBar";

type Lang = "es" | "en";

type DashboardCategoryListingCardProps = {
  lang: Lang;
  categoryLabel: string;
  title: string;
  status: string;
  subtitle?: string | null;
  badges?: string[];
  metaItems?: Array<{ label: string; value: string }>;
  /** Tiny disclaimer under the meta grid (e.g. listing plan vs account plan). */
  footerHint?: string | null;
  actions: Array<{ href?: string; label: string; tone?: "primary" | "secondary" | "subtle"; onClick?: () => void; disabled?: boolean }>;
};

export function DashboardCategoryListingCard({
  lang: _lang,
  categoryLabel,
  title,
  status,
  subtitle,
  badges = [],
  metaItems = [],
  footerHint,
  actions,
}: DashboardCategoryListingCardProps) {
  return (
    <article className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#FBF7EF] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#5C4E2E]">
          {categoryLabel}
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">{status}</span>
        {badges.map((badge) => (
          <span key={badge} className="rounded-full border border-[#E8DFD0] px-2 py-0.5 text-[11px] font-semibold text-[#5C5346]">
            {badge}
          </span>
        ))}
      </div>
      <h3 className="mt-3 text-lg font-bold text-[#1E1810]">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-[#5C5346]/90">{subtitle}</p> : null}
      {metaItems.length > 0 ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {metaItems.map((item) => (
            <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-[#E8DFD0]/70 bg-[#FAF7F2]/70 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{item.label}</dt>
              <dd className="mt-1 font-semibold text-[#1E1810]">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {footerHint ? <p className="mt-3 text-[10px] leading-snug text-[#7A7164]/95">{footerHint}</p> : null}
      <div className="mt-4">
        <DashboardListingActionBar actions={actions} />
      </div>
    </article>
  );
}
