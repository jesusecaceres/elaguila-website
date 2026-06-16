import Link from "next/link";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import {
  adminCardBase,
  adminDashboardCtaActive,
  adminDashboardCtaNeutral,
  adminDashboardCtaPremium,
  adminDashboardCtaPrimary,
  adminDashboardCtaView,
} from "@/app/admin/_components/adminTheme";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { adminCategoryLiveListingsWiredBySlug } from "@/app/admin/_lib/adminCategoryStatusTruth";
import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";
import { clasificadosQueueSurfaceForSlug } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";

type Props = {
  categorySlug: string;
  lang: AdminLang;
  queueHref: string;
  liveHref: string;
  rowCount: number;
  configured: boolean;
  fetchError: string | null;
};

function stripLiveScope(href: string): string {
  return href.replace(/([?&])scope=live&?|&scope=live/g, "$1").replace(/[?&]$/, "");
}

export function ClasificadosLiveScopePanel({
  categorySlug,
  lang,
  queueHref,
  liveHref,
  rowCount,
  configured,
  fetchError,
}: Props) {
  const m = adminMessages(lang);
  const surface = clasificadosQueueSurfaceForSlug(categorySlug);
  const wired = adminCategoryLiveListingsWiredBySlug(categorySlug);
  const compact = "!min-h-[44px] sm:!min-h-[42px]";
  const isEmpty = configured && !fetchError && rowCount === 0;
  const queueBase = stripLiveScope(queueHref) || adminCategoryWorkspaceQueueHref(categorySlug);

  return (
    <section
      className={`${adminCardBase} border-[#C9B46A]/40 bg-[#FFFCF7]/95 p-5 sm:p-6`}
      data-testid="clasificados-live-scope-state"
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("listingsCategoryOps.scopeLive")}</p>
      {!wired ? (
        <>
          <h2 className="mt-2 text-lg font-bold text-[#1E1810]">{m("listingsCategoryOps.liveNotWiredTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{m("listingsCategoryOps.liveNotWiredBody")}</p>
        </>
      ) : isEmpty ? (
        <>
          <h2 className="mt-2 text-lg font-bold text-[#1E1810]">{m("listingsCategoryOps.liveEmptyTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{m("listingsCategoryOps.liveEmptyBody")}</p>
          <p className="mt-2 font-mono text-xs text-[#7A7164]">
            Source: <span className="text-[#3D3428]">{surface.sourceTable}</span>
          </p>
        </>
      ) : fetchError ? (
        <p className="mt-2 text-sm text-red-800">{fetchError}</p>
      ) : null}

      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("listingsCategoryOps.actionsTitle")}</p>
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={queueBase} className={`${adminDashboardCtaPrimary} ${compact}`}>
          {m("listingsCategoryOps.actionQueue")} →
        </Link>
        {wired ? (
          <Link href={liveHref} className={`${adminDashboardCtaActive} ${compact}`} aria-current="page">
            {isEmpty ? m("hub.liveListingsEmptyLabel") : m("hub.liveListingsCta")} →
          </Link>
        ) : (
          <span className={`${adminDashboardCtaNeutral} ${compact} cursor-not-allowed opacity-60`} title={m("listingsCategoryOps.liveNotWiredTitle")}>
            {m("hub.liveListingsUnavailable")}
          </span>
        )}
        <Link href={surface.publicHref} className={`${adminDashboardCtaView} ${compact}`} target="_blank" rel="noopener noreferrer">
          {m("listingsCategoryOps.actionPublic")} →
        </Link>
        {surface.publishHref ? (
          <Link href={surface.publishHref} className={`${adminDashboardCtaView} ${compact}`} target="_blank" rel="noopener noreferrer">
            {m("listingsCategoryOps.actionPublish")} →
          </Link>
        ) : null}
        <Link href="/admin/workspace/clasificados" className={`${adminDashboardCtaNeutral} ${compact}`}>
          {m("listingsCategoryOps.actionHub")} →
        </Link>
        <Link href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF} className={`${adminDashboardCtaPremium} ${compact}`}>
          {m("listingsCategoryOps.actionRegistry")} →
        </Link>
      </div>
    </section>
  );
}
