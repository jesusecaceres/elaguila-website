"use client";

import Link from "next/link";
import {
  buildEnVentaPostAnotherHref,
  buildEnVentaPublishedListingHref,
  buildEnVentaSellerDashboardHref,
  getEnVentaPublishSuccessCopy,
} from "./enVentaPublishSuccessCopy";

type Props = {
  lang: "es" | "en";
  plan: "free" | "pro";
  listingId: string;
  leonixAdId: string | null;
};

export function EnVentaPublishSuccessPanel({ lang, plan, listingId, leonixAdId }: Props) {
  const t = getEnVentaPublishSuccessCopy(lang, plan);
  const detailHref = buildEnVentaPublishedListingHref(listingId, lang);
  const dashboardHref = buildEnVentaSellerDashboardHref(lang);
  const postAnotherHref = buildEnVentaPostAnotherHref(lang, plan);

  return (
    <div
      className="rounded-2xl border border-[#C9B46A]/45 bg-[#FFFCF7] p-5 shadow-sm ring-1 ring-[#C9B46A]/18"
      data-testid="ev-publish-success"
      role="status"
      aria-live="polite"
    >
      <h2 className="text-base font-bold text-[#3D2C12]">{t.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#3D2C12]/90">{t.body}</p>

      {leonixAdId ? (
        <p
          className="mt-3 rounded-lg border border-[#C9B46A]/30 bg-[#FBF7EF] px-3 py-2 text-sm text-[#3D2C12]/90"
          data-testid="ev-publish-success-leonix-id"
        >
          <span className="font-semibold">{t.leonixIdLabel}</span>{" "}
          <span className="select-all font-mono text-[13px]">{leonixAdId}</span>
        </p>
      ) : null}

      <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#3D2C12]/88">
        <li>{t.duration}</li>
        <li>{t.republish}</li>
        <li>{t.soldReminder}</li>
        <li>{t.termsReminder}</li>
        <li>{t.flagWarning}</li>
      </ul>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link
          data-testid="ev-publish-success-detail"
          href={detailHref}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#2F4A65]/35 bg-gradient-to-br from-[#F5F8FB] to-[#E8EEF3] px-4 py-2.5 text-sm font-semibold text-[#2F4A65] transition hover:brightness-[1.02]"
        >
          {t.viewAd}
        </Link>
        <Link
          data-testid="ev-publish-success-dashboard"
          href={dashboardHref}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#B28A2F]/50 bg-[#B28A2F]/15 px-4 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#B28A2F]/25"
        >
          {t.dashboard}
        </Link>
        <Link
          data-testid="ev-publish-success-post-another"
          href={postAnotherHref}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#D8C79A]/70 bg-[#FFFCF4] px-4 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#FFF6E7]"
        >
          {t.postAnother}
        </Link>
      </div>
    </div>
  );
}
