"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import { EmpleosJobResultCard } from "./EmpleosJobResultCard";
import { EmpleosJobTranslationLayer } from "./EmpleosJobTranslationLayer";

/**
 * Related-job card on the public Empleos detail pages. Titles, company names and snippets are
 * authored prose, so this uses the SAME translation behavior as the Empleos results list
 * (EmpleosJobTranslationLayer + TranslateAdControl), not a second translator. Same props as the
 * results list: no stored listing language, keyed by the job id.
 */
export function EmpleosRelatedJobCard({ job, lang }: { job: EmpleosJobRecord; lang: Lang }) {
  return (
    <EmpleosJobTranslationLayer job={job} siteLocale={lang} listingLang={null} listingKey={job.id}>
      {(displayJob, translateControl) => (
        <div className="min-w-0" data-empleos-related-card="1">
          {translateControl ? <div className="mb-2 flex justify-end">{translateControl}</div> : null}
          <EmpleosJobResultCard job={displayJob} lang={lang} variant="list" />
        </div>
      )}
    </EmpleosJobTranslationLayer>
  );
}
