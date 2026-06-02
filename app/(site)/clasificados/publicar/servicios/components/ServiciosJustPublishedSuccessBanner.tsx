"use client";

import Link from "next/link";
import {
  buildServiciosPostAnotherHref,
  buildServiciosPublishedProfileHref,
  buildServiciosSellerDashboardHref,
  getServiciosPublishSuccessCopy,
} from "../lib/serviciosPublishSuccessCopy";
import type { ServiciosLang } from "../lib/clasificadosServiciosApplicationTypes";

type Props = {
  lang: ServiciosLang;
  slug: string;
  leonixAdId?: string | null;
  persistence?: string;
  videoSkippedNotice?: string | null;
  discoveryResultsHref?: string | null;
};

export function ServiciosJustPublishedSuccessBanner({
  lang,
  slug,
  leonixAdId,
  persistence,
  videoSkippedNotice,
  discoveryResultsHref,
}: Props) {
  const t = getServiciosPublishSuccessCopy(lang, persistence);
  const profileHref = buildServiciosPublishedProfileHref(slug, lang);
  const dashboardHref = buildServiciosSellerDashboardHref(lang);
  const postAnotherHref = buildServiciosPostAnotherHref(lang);
  const persistenceNote =
    t.persistenceNoteDatabase ?? t.persistenceNoteDev ?? t.persistenceNoteBrowser ?? null;

  return (
    <div
      className="border-b border-[#C9B46A]/45 bg-[#FFFCF7] px-4 py-4 sm:px-6 sm:py-5"
      data-testid="servicios-publish-success"
      role="status"
      aria-live="polite"
    >
      <h2 className="text-base font-bold text-[#3D2C12] sm:text-lg">{t.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#3D2C12]/90">{t.body}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#5D4A25]/90">{t.clientLine}</p>

      {leonixAdId ? (
        <p
          className="mt-3 rounded-lg border border-[#C9B46A]/30 bg-[#FBF7EF] px-3 py-2 text-sm text-[#3D2C12]/90"
          data-testid="servicios-publish-success-leonix-id"
        >
          <span className="font-semibold">{t.leonixIdLabel}</span>{" "}
          <span className="select-all font-mono text-[13px]">{leonixAdId}</span>
        </p>
      ) : null}

      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#3D2C12]/88">
        {persistenceNote ? <li>{persistenceNote}</li> : null}
        <li>{t.statusGuidance}</li>
        <li>{t.termsReminder}</li>
        <li>{t.flagWarning}</li>
        {videoSkippedNotice ? <li className="text-[#6B5420]">{videoSkippedNotice}</li> : null}
      </ul>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={profileHref}
          data-testid="servicios-publish-success-profile"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#7A1E2C]/35 bg-[#7A1E2C] px-4 py-2.5 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.05] sm:min-w-[10rem] sm:flex-none"
        >
          {t.viewProfile}
        </Link>
        <Link
          href={dashboardHref}
          data-testid="servicios-publish-success-dashboard"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#B28A2F]/50 bg-[#B28A2F]/15 px-4 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#B28A2F]/25 sm:min-w-[10rem] sm:flex-none"
        >
          {t.dashboard}
        </Link>
        <Link
          href={postAnotherHref}
          data-testid="servicios-publish-success-post-another"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#D8C79A]/70 bg-[#FFFCF4] px-4 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#FFF6E7] sm:min-w-[10rem] sm:flex-none"
        >
          {t.postAnother}
        </Link>
        {discoveryResultsHref?.trim() ? (
          <Link
            href={discoveryResultsHref.trim()}
            data-testid="servicios-publish-success-results"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#D8C79A]/60 bg-white px-4 py-2.5 text-sm font-semibold text-[#7A1E2C] underline-offset-2 transition hover:bg-[#FFF6E7] sm:min-w-[10rem] sm:flex-none"
          >
            {t.viewResults}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
