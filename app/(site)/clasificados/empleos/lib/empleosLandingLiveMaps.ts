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

/** Prefer promoted/featured inventory for the landing strip; fall back to any live rows. */
export function mapEmpleosLiveToFeaturedLanding(jobs: EmpleosJobRecord[], limit = 4): SampleFeaturedJob[] {
  const tiered = jobs.filter((j) => j.listingTier === "featured" || j.listingTier === "promoted");
  const pool = tiered.length ? tiered : jobs;
  return pool.slice(0, limit).map((j) => ({
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
  }));
}

export function mapEmpleosLiveToRecentLanding(jobs: EmpleosJobRecord[], nowMs: number, lang: Lang, limit = 5): SampleRecentJob[] {
  return [...jobs]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
    .map((j) => ({
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
    }));
}
