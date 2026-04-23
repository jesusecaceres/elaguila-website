"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";

import { EmpleoJobFairDetailPage } from "./components/jobFair/EmpleoJobFairDetailPage";
import { EmpleoPremiumDetailPage } from "./components/premiumJob/EmpleoPremiumDetailPage";
import { EmpleoQuickDetailPage } from "./components/quickJob/EmpleoQuickDetailPage";
import { EmpleosApplyForm, isLiveListingId } from "./components/EmpleosApplyForm";
import { EmpleosJobResultCard } from "./components/EmpleosJobResultCard";
import { getRelatedJobs } from "./data/empleosSampleCatalog";
import type { EmpleosJobRecord } from "./data/empleosJobTypes";
import {
  EMPLEOS_CTA_PRIMARY,
  EMPLEOS_LINK_MUTED,
} from "./lib/empleosPremiumUi";
import {
  mapPublishedFeriaToShell,
  mapPublishedPremiumToShell,
  mapPublishedQuickToShell,
} from "./lib/empleosPublishedLaneShell";
import { buildEmpleosResultadosUrl } from "./shared/utils/empleosListaUrl";

type Props = {
  slug: string;
  job: EmpleosJobRecord;
  envelope: EmpleosPublishEnvelope | null;
  relatedExtra?: EmpleosJobRecord[];
  omitMarketingSeedCatalog?: boolean;
  trackPublicViewsForSlug?: string | null;
};

function PublicApplyFooter({ job, lang }: { job: EmpleosJobRecord; lang: Lang }) {
  const resultsHref = appendLangToPath("/clasificados/empleos/resultados", lang);
  const publishHref = appendLangToPath("/clasificados/publicar/empleos", lang);
  return (
    <div className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-6 shadow-[0_10px_32px_rgba(42,40,38,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7A8899]">
        {lang === "es" ? "Siguiente paso" : "Next step"}
      </p>
      <p className="mt-2 text-sm text-[#4A4744]">
        {lang === "es"
          ? "Envía tu interés o aplica según las opciones del anuncio."
          : "Send your interest or apply using the options on this listing."}
      </p>
      {job.externalApplyUrl ? (
        <a
          href={job.externalApplyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${EMPLEOS_CTA_PRIMARY} mt-4 inline-flex w-full justify-center px-4 text-center sm:w-auto`}
        >
          {lang === "es" ? "Abrir página para postular" : "Open apply page"}
        </a>
      ) : null}
      {isLiveListingId(job.id) ? (
        <div className="mt-4">
          <EmpleosApplyForm listingId={job.id} lang={lang} screenerQuestions={job.screenerQuestions} />
        </div>
      ) : (
        <Link href={appendLangToPath("/contacto", lang)} className={`${EMPLEOS_CTA_PRIMARY} mt-4 inline-flex w-full justify-center px-4 text-center`}>
          {lang === "es" ? "Contactar a Leonix" : "Contact Leonix"}
        </Link>
      )}
      <div className="mt-4 flex flex-col gap-2 text-center sm:text-left">
        <Link href={buildEmpleosResultadosUrl(lang, { category: job.category })} className={`${EMPLEOS_LINK_MUTED}`}>
          {lang === "es" ? "Más empleos en esta categoría" : "More jobs in this category"}
        </Link>
        <Link href={publishHref} className={`${EMPLEOS_LINK_MUTED}`}>
          {lang === "es" ? "¿Eres empleador? Publica" : "Employer? Post a listing"}
        </Link>
        <Link href={resultsHref} className={`${EMPLEOS_LINK_MUTED}`}>
          {lang === "es" ? "Volver a resultados" : "Back to results"}
        </Link>
      </div>
    </div>
  );
}

export function EmpleosPublicLaneDetailClient({
  slug,
  job,
  envelope,
  relatedExtra = [],
  omitMarketingSeedCatalog = false,
  trackPublicViewsForSlug = null,
}: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);

  useEffect(() => {
    const s = trackPublicViewsForSlug?.trim();
    if (!s) return;
    try {
      const key = `empleos_public_view_v1:${s}`;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
    void fetch("/api/clasificados/empleos/listings/public-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: s }),
    }).catch(() => {});
  }, [trackPublicViewsForSlug]);

  const related = useMemo(
    () => getRelatedJobs(slug, 3, relatedExtra, { omitMarketingCatalog: omitMarketingSeedCatalog }),
    [slug, relatedExtra, omitMarketingSeedCatalog],
  );

  const lane = job.publicationLane ?? envelope?.lane ?? "quick";
  const footer = <PublicApplyFooter job={job} lang={lang} />;

  if (lane === "premium") {
    const data = mapPublishedPremiumToShell(job, envelope);
    return (
      <>
        <EmpleoPremiumDetailPage data={data} withSiteChrome={false} publicFooterSlot={footer} />
        {related.length > 0 ? (
          <section className="mx-auto mt-12 max-w-6xl px-4 pb-16 sm:px-5 lg:px-8">
            <h2 className="text-lg font-bold text-[#2A2826]">{lang === "es" ? "Relacionados" : "Related"}</h2>
            <div className="mt-4 flex flex-col gap-4">
              {related.map((r) => (
                <EmpleosJobResultCard key={r.id} job={r} lang={lang} variant="list" />
              ))}
            </div>
          </section>
        ) : null}
      </>
    );
  }

  if (lane === "feria") {
    const data = mapPublishedFeriaToShell(job, envelope);
    return (
      <>
        <EmpleoJobFairDetailPage data={data} withSiteChrome={false} publicFooterSlot={footer} />
        {related.length > 0 ? (
          <section className="mx-auto mt-12 max-w-6xl px-4 pb-16 sm:px-5 lg:px-8">
            <h2 className="text-lg font-bold text-[#2A2826]">{lang === "es" ? "Relacionados" : "Related"}</h2>
            <div className="mt-4 flex flex-col gap-4">
              {related.map((r) => (
                <EmpleosJobResultCard key={r.id} job={r} lang={lang} variant="list" />
              ))}
            </div>
          </section>
        ) : null}
      </>
    );
  }

  const quickData = mapPublishedQuickToShell(job, envelope);
  return (
    <>
      <EmpleoQuickDetailPage data={quickData} withSiteChrome={false} publicFooterSlot={footer} />
      {related.length > 0 ? (
        <section className="mx-auto mt-12 max-w-6xl px-4 pb-16 sm:px-5 lg:px-8">
          <h2 className="text-lg font-bold text-[#2A2826]">{lang === "es" ? "Relacionados" : "Related"}</h2>
          <div className="mt-4 flex flex-col gap-4">
            {related.map((r) => (
              <EmpleosJobResultCard key={r.id} job={r} lang={lang} variant="list" />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
