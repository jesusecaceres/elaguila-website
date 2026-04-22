import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import { empleosJobPublicAbsoluteUrl } from "./empleosSiteUrl";

const JOB_TYPE_TO_SCHEMA: Record<string, string> = {
  "tiempo-completo": "FULL_TIME",
  "medio-tiempo": "PART_TIME",
  temporal: "TEMPORARY",
  "por-contrato": "CONTRACTOR",
};

function validThroughIso(job: EmpleosJobRecord): string {
  if (job.validThroughIso) return job.validThroughIso;
  const d = new Date(job.publishedAt);
  d.setUTCDate(d.getUTCDate() + 90);
  return d.toISOString();
}

/** Pure JobPosting object for JSON-LD (must match visible detail fields). */
export function buildEmpleosJobPostingJsonLdObject(job: EmpleosJobRecord, lang: Lang): Record<string, unknown> {
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

  return json;
}

/** In-repo validation for required Google JobPosting fields (shape + non-empty strings). */
export function validateEmpleosJobPostingJsonLdObject(obj: Record<string, unknown>): string[] {
  const errs: string[] = [];
  if (obj["@context"] !== "https://schema.org") errs.push("@context");
  if (obj["@type"] !== "JobPosting") errs.push("@type");
  for (const k of ["title", "description", "datePosted", "validThrough", "url"] as const) {
    if (typeof obj[k] !== "string" || !(obj[k] as string).trim()) errs.push(k);
  }
  const ho = obj.hiringOrganization;
  if (!ho || typeof ho !== "object" || typeof (ho as { name?: unknown }).name !== "string" || !(ho as { name: string }).name.trim()) {
    errs.push("hiringOrganization.name");
  }
  const jl = obj.jobLocation;
  if (!jl || typeof jl !== "object") {
    errs.push("jobLocation");
  } else {
    const addr = (jl as { address?: unknown }).address;
    if (!addr || typeof addr !== "object") errs.push("jobLocation.address");
    else {
      const a = addr as Record<string, unknown>;
      if (typeof a.addressLocality !== "string" || !a.addressLocality.trim()) errs.push("addressLocality");
      if (typeof a.addressRegion !== "string" || !a.addressRegion.trim()) errs.push("addressRegion");
      if (typeof a.addressCountry !== "string" || !a.addressCountry.trim()) errs.push("addressCountry");
    }
  }
  if (typeof obj.employmentType !== "string" || !String(obj.employmentType).trim()) errs.push("employmentType");
  return errs;
}
