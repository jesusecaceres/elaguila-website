"use client";

import Link from "next/link";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { accountCommandCenterCopy, type Lang } from "../lib/dashboardI18n";

export function OwnerBusinessGrowthEntry({ lang, q }: { lang: Lang; q: string }) {
  const t = accountCommandCenterCopy(lang);
  return (
    <section className={LX_DASH.panel} aria-labelledby="owner-business-growth-heading">
      <h2 id="owner-business-growth-heading" className={LX_DASH.sectionTitle}>
        {t.growthTitle}
      </h2>
      <p className={`mt-2 max-w-3xl ${LX_DASH.bodyMuted}`}>{t.growthBody}</p>
      <p className="mt-3 text-sm text-[#3D3428]">{t.growthIdea}</p>
      <p className="mt-2 text-sm text-[#3D3428]">{t.growthLearn}</p>
      {/* Pre-release audit fix: "Publicar" was duplicated here — the page's own header above
          already renders it as the page-level primary CTA (OwnerAccountCommandCenter.tsx),
          same href, same label. Repeating it below in a different (secondary) treatment read as
          two competing bottom-of-page actions rather than one clear entry point for this
          section's own distinct purpose. */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/dashboard/business-tools?${q}`} className={LX_DASH.btnPremium}>
          {t.growthCta}
        </Link>
      </div>
    </section>
  );
}
