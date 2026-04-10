/**
 * URL query ↔ sample catalog filtering (adapter-ready for API later).
 */

import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import type { EmpleosResultadosParams } from "../shared/utils/empleosListaUrl";

/** Stable clock for sample “recent” windows (matches landing copy date). */
export const EMPLEOS_SAMPLE_NOW_MS = Date.parse("2026-04-10T18:00:00.000Z");

export type EmpleosSortKey = "relevance" | "date_desc" | "salary_desc";

export type ParsedEmpleosResultsQuery = {
  q: string;
  city: string;
  category: string;
  jobType: string;
  modality: string;
  salaryMin: string;
  salaryMax: string;
  experience: string;
  companyType: string;
  featuredOnly: boolean;
  recentOnly: boolean;
  quickApplyOnly: boolean;
  sort: EmpleosSortKey;
};

const SORT_VALUES: EmpleosSortKey[] = ["relevance", "date_desc", "salary_desc"];

export function parseEmpleosResultsQuery(sp: URLSearchParams): ParsedEmpleosResultsQuery {
  const sortRaw = sp.get("sort") ?? "";
  const sort = SORT_VALUES.includes(sortRaw as EmpleosSortKey) ? (sortRaw as EmpleosSortKey) : "relevance";
  return {
    q: (sp.get("q") ?? "").trim(),
    city: (sp.get("city") ?? "").trim(),
    category: (sp.get("category") ?? "").trim(),
    jobType: (sp.get("jobType") ?? "").trim(),
    modality: (sp.get("modality") ?? "").trim(),
    salaryMin: (sp.get("salaryMin") ?? "").trim(),
    salaryMax: (sp.get("salaryMax") ?? "").trim(),
    experience: (sp.get("experience") ?? "").trim(),
    companyType: (sp.get("companyType") ?? "").trim(),
    featuredOnly: sp.get("featured") === "1",
    recentOnly: sp.get("recent") === "1",
    quickApplyOnly: sp.get("quickApply") === "1",
    sort,
  };
}

function num(v: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const RECENT_MS = 7 * 24 * 3600 * 1000;

export function filterEmpleosJobs(jobs: EmpleosJobRecord[], p: ParsedEmpleosResultsQuery, nowMs: number): EmpleosJobRecord[] {
  const qLower = p.q.toLowerCase();
  const cityLower = p.city.toLowerCase();

  return jobs.filter((j) => {
    if (p.featuredOnly && j.listingTier === "standard") return false;
    if (p.recentOnly && nowMs - new Date(j.publishedAt).getTime() > RECENT_MS) return false;
    if (p.quickApplyOnly && !j.quickApply) return false;
    if (p.category && j.category !== p.category) return false;
    if (p.jobType && j.jobType !== p.jobType) return false;
    if (p.modality && j.modality !== p.modality) return false;
    if (p.experience && j.experience !== p.experience) return false;
    if (p.companyType && j.companyType !== p.companyType) return false;

    const smin = num(p.salaryMin);
    const smax = num(p.salaryMax);
    if (smin != null && j.salaryMax < smin) return false;
    if (smax != null && j.salaryMin > smax) return false;

    if (qLower) {
      const blob = `${j.title} ${j.company} ${j.summary} ${j.description}`.toLowerCase();
      if (!blob.includes(qLower)) return false;
    }

    if (cityLower) {
      const loc = `${j.city} ${j.state}`.toLowerCase();
      if (!loc.includes(cityLower)) return false;
    }

    return true;
  });
}

export function sortEmpleosJobs(jobs: EmpleosJobRecord[], sort: EmpleosSortKey): EmpleosJobRecord[] {
  const copy = [...jobs];
  if (sort === "date_desc") {
    copy.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return copy;
  }
  if (sort === "salary_desc") {
    copy.sort((a, b) => b.salaryMax - a.salaryMax);
    return copy;
  }
  const tierRank = (t: EmpleosJobRecord["listingTier"]) => (t === "promoted" ? 2 : t === "featured" ? 1 : 0);
  copy.sort((a, b) => {
    const tr = tierRank(b.listingTier) - tierRank(a.listingTier);
    if (tr !== 0) return tr;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
  return copy;
}

/** Build filter object from current URL (drops `lang` and optional `omit` key). */
export function empleosParamsFromSearchParams(sp: URLSearchParams, omit?: string): EmpleosResultadosParams {
  const o: EmpleosResultadosParams = {};
  sp.forEach((val, k) => {
    if (k === "lang" || k === omit || val === "") return;
    (o as Record<string, string>)[k] = val;
  });
  return o;
}
