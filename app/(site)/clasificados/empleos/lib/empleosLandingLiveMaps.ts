import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { SampleFeaturedJob, SampleRecentJob } from "../data/empleosLandingSampleData";
import type { EmpleosJobRecord } from "../data/empleosJobTypes";

function publishedLabel(iso: string, nowMs: number, lang: Lang): string {
  const diffH = Math.floor((nowMs - new Date(iso).getTime()) / 3600000);
  if (lang === "en") {
    if (diffH < 48) return `${Math.max(1, diffH)}h ago`;
    const days = Math.floor(diffH / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
  if (diffH < 48) return `Hace ${Math.max(1, diffH)} horas`;
  const days = Math.floor(diffH / 24);
  return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}

function toFeaturedCard(j: EmpleosJobRecord): SampleFeaturedJob {
  const vis: SampleFeaturedJob["empleosVisibility"] =
    j.listingTier === "promoted" ? "promoted" : j.listingTier === "featured" ? "featured" : "standard";
  return {
    id: j.id,
    slug: j.slug,
    title: j.title,
    company: j.company,
    city: j.city,
    state: j.state,
    category: j.category,
    modality: j.modality,
    jobType: j.jobType,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryLabel: j.salaryLabel,
    featured: j.listingTier !== "standard",
    quickApply: j.quickApply,
    benefitChips: [...j.benefitChips],
    companyInitials: j.companyInitials,
    empleosVisibility: vis,
  };
}

/**
 * Landing “Destacados”: prefer paid tiers for honest visibility, then fall back to any live row so the strip is not empty.
 * Capped — full inventory + filters live on **Resultados**.
 */
export function mapEmpleosLiveToFeaturedLanding(jobs: EmpleosJobRecord[], limit: number): SampleFeaturedJob[] {
  const tiered = jobs.filter((j) => j.listingTier === "featured" || j.listingTier === "promoted");
  const pool = tiered.length ? tiered : jobs;
  return pool.slice(0, limit).map(toFeaturedCard);
}

function toRecentRow(j: EmpleosJobRecord, nowMs: number, lang: Lang): SampleRecentJob {
  return {
    id: j.id,
    slug: j.slug,
    title: j.title,
    company: j.company,
    city: j.city,
    state: j.state,
    modality: j.modality,
    jobType: j.jobType,
    salaryLabel: j.salaryLabel,
    category: j.category,
    publishedAtLabel: publishedLabel(j.publishedAt, nowMs, lang),
    quickApply: j.quickApply,
  };
}

/** Pure `publishedAt` desc slice (used when no standard-tier rows exist). */
export function mapEmpleosLiveToRecentLanding(jobs: EmpleosJobRecord[], nowMs: number, lang: Lang, limit: number): SampleRecentJob[] {
  return [...jobs]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
    .map((j) => toRecentRow(j, nowMs, lang));
}

/**
 * Landing “Últimos empleos publicados”: still ordered by **publish date** (newest first), never pay-to-rank.
 * Fairness: when at least one `standard` listing exists, reserve up to two of the capped slots for the newest standard
 * listings, then fill the remainder from the global chronological list so the strip is not exclusively promoted/featured.
 */
export function mapEmpleosLiveToRecentLandingFair(jobs: EmpleosJobRecord[], nowMs: number, lang: Lang, limit: number): SampleRecentJob[] {
  const byDate = [...jobs].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const standards = byDate.filter((j) => j.listingTier === "standard");
  if (standards.length === 0) {
    return mapEmpleosLiveToRecentLanding(jobs, nowMs, lang, limit);
  }
  const reserved = Math.min(standards.length, limit > 2 ? 2 : 1);
  const stdPick = standards.slice(0, reserved);
  const picked = new Set(stdPick.map((j) => j.id));
  const rest = byDate.filter((j) => !picked.has(j.id)).slice(0, limit - stdPick.length);
  const combined = [...stdPick, ...rest].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
  return combined.map((j) => toRecentRow(j, nowMs, lang));
}
