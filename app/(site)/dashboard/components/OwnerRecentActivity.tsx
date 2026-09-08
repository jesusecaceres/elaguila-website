"use client";

import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { accountCommandCenterCopy, type Lang } from "../lib/dashboardI18n";

export function OwnerRecentActivity({ lang }: { lang: Lang }) {
  const t = accountCommandCenterCopy(lang);
  return (
    <section className={LX_DASH.panel} aria-labelledby="owner-recent-activity-heading">
      <h2 id="owner-recent-activity-heading" className={LX_DASH.sectionTitle}>
        {t.activityTitle}
      </h2>
      <p className={`mt-3 ${LX_DASH.emptyState}`}>{t.activityUnsupported}</p>
    </section>
  );
}
