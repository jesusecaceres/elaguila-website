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
  /** Compact seller-management layout for Mis anuncios. */
  compact?: boolean;
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
  compact = false,
  actions,
}: DashboardCategoryListingCardProps) {
  const visibleMeta = compact ? metaItems.slice(0, 3) : metaItems;
  return (
    <article
      className={
        compact
          ? "rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-3.5 shadow-[0_6px_20px_-10px_rgba(42,36,22,0.08)]"
          : "rounded-3xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.08)]"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[color:var(--lx-section)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
          {categoryLabel}
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">{status}</span>
        {badges.map((badge) => (
          <span key={badge} className="rounded-full border border-[color:var(--lx-border)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--lx-muted)]">
            {badge}
          </span>
        ))}
      </div>
      <h3 className={compact ? "mt-2 text-base font-bold text-[color:var(--lx-text)]" : "mt-3 text-lg font-bold text-[color:var(--lx-text)]"}>
        {title}
      </h3>
      {subtitle ? <p className="mt-0.5 truncate text-xs text-[color:var(--lx-muted)]/90">{subtitle}</p> : null}
      {visibleMeta.length > 0 ? (
        <dl className={compact ? "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" : "mt-4 grid gap-2 text-sm sm:grid-cols-2"}>
          {visibleMeta.map((item) =>
            compact ? (
              <div key={`${item.label}-${item.value}`} className="inline-flex gap-1.5">
                <dt className="font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{item.label}:</dt>
                <dd className="font-semibold text-[color:var(--lx-text)]">{item.value}</dd>
              </div>
            ) : (
              <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)]/70 px-3 py-2">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{item.label}</dt>
                <dd className="mt-1 font-semibold text-[color:var(--lx-text)]">{item.value}</dd>
              </div>
            ),
          )}
        </dl>
      ) : null}
      {footerHint ? <p className="mt-2 text-[10px] leading-snug text-[color:var(--lx-muted)]/95">{footerHint}</p> : null}
      <div className={compact ? "mt-3" : "mt-4"}>
        <DashboardListingActionBar actions={actions} />
      </div>
    </article>
  );
}
