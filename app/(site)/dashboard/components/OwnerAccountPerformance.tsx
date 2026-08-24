"use client";

import { DashboardMetricLinkCard } from "./DashboardMetricLinkCard";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { accountCommandCenterCopy, type Lang } from "../lib/dashboardI18n";

export function OwnerAccountPerformance({
  lang,
  loading,
  q,
  activeListings,
  activeListingsHint,
  draftCount,
  expiringSoon,
  expiringLabel,
  expiringHint,
  views,
  viewsUnavailable,
  contactActions,
}: {
  lang: Lang;
  loading?: boolean;
  q: string;
  activeListings: string;
  activeListingsHint: string;
  draftCount: string;
  expiringSoon: string;
  expiringLabel: string;
  expiringHint: string;
  views: string | null;
  viewsUnavailable: boolean;
  contactActions: string | null;
}) {
  const t = accountCommandCenterCopy(lang);

  return (
    <section aria-labelledby="owner-account-performance-heading">
      <h2 id="owner-account-performance-heading" className={LX_DASH.sectionTitle}>
        {t.performanceTitle}
      </h2>
      {loading ? <p className={`mt-3 ${LX_DASH.bodyMuted}`}>{t.performanceLoading}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricLinkCard
          href={`/dashboard/mis-anuncios?${q}`}
          label={lang === "es" ? "Anuncios activos" : "Active listings"}
          value={activeListings}
          hint={activeListingsHint}
        />
        <DashboardMetricLinkCard
          href={`/dashboard/drafts?${q}`}
          label={lang === "es" ? "Borradores" : "Drafts"}
          value={draftCount}
          hint={lang === "es" ? "Anuncios guardados sin publicar" : "Saved listings not yet published"}
        />
        {viewsUnavailable ? (
          <div className={LX_DASH.metricCard}>
            <p className={LX_DASH.metricLabel}>{t.views}</p>
            <p className={`${LX_DASH.metricValue} text-[1.15rem] leading-snug sm:text-xl`}>—</p>
            <p className={LX_DASH.metricHint}>{t.analyticsDegraded}</p>
          </div>
        ) : (
          <DashboardMetricLinkCard href={`/dashboard/analytics?${q}`} label={t.views} value={views ?? "—"} hint={t.viewsHint} />
        )}
        {viewsUnavailable || contactActions == null ? (
          <DashboardMetricLinkCard href={`/dashboard/mis-anuncios?${q}`} label={expiringLabel} value={expiringSoon} hint={expiringHint} />
        ) : (
          <DashboardMetricLinkCard href={`/dashboard/analytics?${q}`} label={t.contactActions} value={contactActions} hint={t.contactHint} />
        )}
      </div>
    </section>
  );
}
