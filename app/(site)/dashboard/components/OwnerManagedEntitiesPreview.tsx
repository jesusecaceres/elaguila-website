"use client";

import Link from "next/link";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { accountCommandCenterCopy, type Lang } from "../lib/dashboardI18n";
import { listingUiStatusChipClass, listingUiStatusLabel, resolveListingUiStatus } from "../lib/listingDisplayStatus";

export type OwnerManagedEntityPreviewItem = {
  id: string;
  title: string;
  status: string | null;
  isPublished: boolean | null;
  href: string;
};

export function OwnerManagedEntitiesPreview({
  lang,
  q,
  loading,
  error,
  items,
}: {
  lang: Lang;
  q: string;
  loading?: boolean;
  error?: boolean;
  items: OwnerManagedEntityPreviewItem[];
}) {
  const t = accountCommandCenterCopy(lang);

  return (
    <section className={LX_DASH.panel} aria-labelledby="owner-managed-entities-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="owner-managed-entities-heading" className={LX_DASH.sectionTitle}>
            {t.entitiesTitle}
          </h2>
          <p className={`mt-1 ${LX_DASH.bodyMuted}`}>{t.entitiesSubsetNote}</p>
        </div>
        <Link href={`/dashboard/mis-anuncios?${q}`} className={LX_DASH.btnSecondary}>
          {t.seeAllListings}
        </Link>
      </div>
      {loading ? (
        <p className={`mt-4 ${LX_DASH.bodyMuted}`}>{t.entitiesLoading}</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-800">{t.entitiesError}</p>
      ) : items.length === 0 ? (
        <p className={`mt-4 ${LX_DASH.emptyState}`}>{t.entitiesEmpty}</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const ui = resolveListingUiStatus({ status: item.status, is_published: item.isPublished });
            return (
              <li key={item.id} className="rounded-xl border border-[#D6C7AD]/80 bg-[#FFFCF7] p-4">
                <p className="font-semibold text-[#1F241C]">{item.title}</p>
                <p className={`mt-2 ${listingUiStatusChipClass(ui)}`}>{listingUiStatusLabel(ui, lang)}</p>
                <Link href={item.href} className={`mt-3 ${LX_DASH.btnManage}`}>
                  {t.manageListing}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
