import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import { buildEmpleosJobPostingJsonLdObject } from "../lib/empleosJobPostingSchema";

type Props = {
  job: EmpleosJobRecord;
  lang: Lang;
};

/**
 * Single-job JobPosting JSON-LD for Google for Jobs eligibility (list pages must not emit this).
 * Render only for published live rows from `empleos_public_listings`.
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function EmpleosJobPostingJsonLd({ job, lang }: Props) {
  const json = buildEmpleosJobPostingJsonLdObject(job, lang);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
