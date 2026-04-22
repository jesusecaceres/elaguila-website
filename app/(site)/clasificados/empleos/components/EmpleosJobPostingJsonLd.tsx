import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { empleosJobPublicAbsoluteUrl } from "../lib/empleosSiteUrl";

const JOB_TYPE_TO_SCHEMA: Record<string, string> = {
  "tiempo-completo": "FULL_TIME",
  "medio-tiempo": "PART_TIME",
  temporal: "TEMPORARY",
  "por-contrato": "CONTRACTOR",
};

type Props = {
  job: EmpleosJobRecord;
  lang: Lang;
};

function validThroughIso(job: EmpleosJobRecord): string {
  if (job.validThroughIso) return job.validThroughIso;
  const d = new Date(job.publishedAt);
  d.setUTCDate(d.getUTCDate() + 90);
  return d.toISOString();
}

/**
 * Single-job JobPosting JSON-LD for Google for Jobs eligibility (list pages must not emit this).
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function EmpleosJobPostingJsonLd({ job, lang }: Props) {
  const url = empleosJobPublicAbsoluteUrl(job.slug, lang);
  const employmentType = JOB_TYPE_TO_SCHEMA[job.jobType] ?? "FULL_TIME";
  const description = [job.summary, job.description].filter(Boolean).join("\n\n").trim() || job.title;

  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted: job.publishedAt,
    validThrough: validThroughIso(job),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        addressRegion: job.state,
        addressCountry: "US",
        ...(job.postalCode ? { postalCode: job.postalCode } : {}),
      },
    },
    employmentType,
    occupationalCategory: job.category,
    identifier: {
      "@type": "PropertyValue",
      name: "listing_id",
      value: job.id,
    },
    url,
    directApply: job.quickApply,
  };

  if (job.modality === "remoto") {
    json.jobLocationType = "TELECOMMUTE";
  }

  if (job.salaryMax > 0) {
    json.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "YEAR",
      },
    };
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
