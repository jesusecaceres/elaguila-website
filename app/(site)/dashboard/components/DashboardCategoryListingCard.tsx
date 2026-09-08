"use client";

import { DashboardListingActionBar, type ActionItem } from "./DashboardListingActionBar";
import { DashboardMobileActionSheet } from "./DashboardMobileActionSheet";
import { lxDashStatusChipClass } from "../lib/dashboardLeonixTheme";

type Lang = "es" | "en";

type DashboardCategoryListingCardProps = {
  lang: Lang;
  categoryLabel: string;
  title: string;
  status: string;
  /** Work Package I.8A — optional display tone for the status pill. Omitted (or any category
   * that doesn't yet pass a resolved status) keeps the original hardcoded-emerald look for
   * backward compatibility with callers not yet updated. */
  statusTone?: "neutral" | "positive" | "warn" | "danger";
  subtitle?: string | null;
  badges?: string[];
  metaItems?: Array<{ label: string; value: string }>;
  /**
   * Gate 2B — optional real performance metrics (e.g. views), rendered in their own row
   * separate from identity meta (plan/ID/dates) when a caller actually has real data to
   * supply. Omitted entirely (no placeholder, no synthetic zero) when a category has no
   * per-card metric wired up yet — never fabricated here.
   */
  performanceSnapshot?: Array<{ label: string; value: string }>;
  /** Tiny disclaimer under the meta grid (e.g. listing plan vs account plan). */
  footerHint?: string | null;
  /**
   * Gate G.3.2 — optional, read-only global owner status/attention line (no mutation controls).
   * Additive: categories that don't pass this render exactly as before.
   */
  lifecycleNote?: { text: string; tone: "urgent" | "warning" | "neutral" } | null;
  /** Compact seller-management layout for Mis anuncios. */
  compact?: boolean;
  actions: ActionItem[];
};

export function DashboardCategoryListingCard({
  lang,
  categoryLabel,
  title,
  status,
  statusTone,
  subtitle,
  badges = [],
  metaItems = [],
  performanceSnapshot = [],
  footerHint,
  lifecycleNote,
  compact = false,
  actions,
}: DashboardCategoryListingCardProps) {
  const visibleMeta = compact ? metaItems.slice(0, 3) : metaItems;

  // Gate 2B/2C — presentation-only grouping of the SAME action array/hrefs/callbacks
  // already resolved by the caller (dashboardMisAnunciosCategoryTools.ts et al). One
  // dominant primary slot; view-tier, lifecycle, and specialized/premium actions each
  // render as their own visually-separated row on md:+ instead of one undifferentiated
  // cluster, and collapse (in that same order) into the mobile overflow sheet below md:.
  // No action added, removed, relabeled, or rerouted here — Gate 2C classifies actions
  // it already receives by the `tone` the caller assigned; it doesn't invent new ones.
  const primaryActions = actions.filter((a) => a.tone === "primary");
  const viewActions = actions.filter((a) => a.tone === "secondary" || a.tone === "subtle");
  const lifecycleActions = actions.filter((a) => a.tone === "positive" || a.tone === "warning" || a.tone === "danger");
  const premiumActions = actions.filter((a) => a.tone === "premium");
  const restActions = [...viewActions, ...lifecycleActions, ...premiumActions];

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[color:var(--lx-section)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
          {categoryLabel}
        </span>
        <span className={lxDashStatusChipClass(statusTone ?? "positive")}>{status}</span>
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
      {performanceSnapshot.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {performanceSnapshot.map((item) => (
            <span key={`${item.label}-${item.value}`} className="inline-flex items-baseline gap-1">
              <span className="font-bold text-[color:var(--lx-text)]">{item.value}</span>
              <span className="text-[color:var(--lx-muted)]">{item.label}</span>
            </span>
          ))}
        </div>
      ) : null}
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
      {lifecycleNote ? (
        <p
          className={
            "mt-2 text-[11px] font-medium " +
            (lifecycleNote.tone === "urgent"
              ? "text-red-700"
              : lifecycleNote.tone === "warning"
                ? "text-amber-800"
                : "text-[color:var(--lx-muted)]")
          }
        >
          {lifecycleNote.text}
        </p>
      ) : null}
      {footerHint ? <p className="mt-2 text-[10px] leading-snug text-[color:var(--lx-muted)]/95">{footerHint}</p> : null}
    </>
  );

  // Gate 2B — one dominant primary slot, the rest inline on md:+ (wrapped, organized — not a
  // cluster) and collapsed into the mobile "More" sheet below md:. Reuses the same
  // DashboardListingActionBar/DashboardMobileActionSheet for both, so there is exactly one
  // place actions are actually rendered from.
  const actionArea = (
    <div className="flex flex-col gap-2">
      {primaryActions.length > 0 ? <DashboardListingActionBar actions={primaryActions} /> : null}
      {restActions.length > 0 ? (
        <div className="hidden flex-col gap-2 md:flex">
          {viewActions.length > 0 ? <DashboardListingActionBar actions={viewActions} /> : null}
          {lifecycleActions.length > 0 ? <DashboardListingActionBar actions={lifecycleActions} /> : null}
          {premiumActions.length > 0 ? <DashboardListingActionBar actions={premiumActions} /> : null}
        </div>
      ) : null}
      {restActions.length > 0 ? (
        <DashboardMobileActionSheet
          triggerLabel={lang === "es" ? "Más opciones" : "More options"}
          sheetTitle={lang === "es" ? "Más opciones" : "More options"}
          closeLabel={lang === "es" ? "Cerrar" : "Close"}
          actions={restActions}
        />
      ) : null}
    </div>
  );

  return (
    <article
      className={
        compact
          ? "rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-3.5 shadow-[0_6px_20px_-10px_rgba(42,36,22,0.08)] lg:p-4"
          : "rounded-3xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.08)]"
      }
    >
      {compact ? (
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">{body}</div>
          <div className="mt-3 shrink-0 lg:mt-0 lg:w-auto lg:max-w-sm">{actionArea}</div>
        </div>
      ) : (
        <>
          {body}
          <div className="mt-4">{actionArea}</div>
        </>
      )}
    </article>
  );
}
