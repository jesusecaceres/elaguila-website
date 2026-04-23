/**
 * URL query ↔ sample catalog filtering (adapter-ready for API later).
 * Filter contract: `empleosFilterContract.ts`.
 */

import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import type { EmpleosResultadosParams } from "../shared/utils/empleosListaUrl";

/** @deprecated Prefer server-fed `serverNowMs` for “recent” windows on live results. */
export const EMPLEOS_SAMPLE_NOW_MS = Date.parse("2026-04-10T18:00:00.000Z");

export type EmpleosSortKey = "relevance" | "date_desc" | "salary_desc";

export type ParsedEmpleosResultsQuery = {
  q: string;
  city: string;
  state: string;
  zip: string;
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
  verifiedOnly: boolean;
  premiumOnly: boolean;
  /** quick | premium | feria — live listings only */
  lane: string;
  industry: string;
  bilingualOnly: boolean;
  /** Parsed but not used for filtering until geo pipeline exists. */
  radiusKm: string;
  sort: EmpleosSortKey;
};

const SORT_VALUES: EmpleosSortKey[] = ["relevance", "date_desc", "salary_desc"];

export function parseEmpleosResultsQuery(sp: URLSearchParams): ParsedEmpleosResultsQuery {
  const sortRaw = sp.get("sort") ?? "";
  const sort = SORT_VALUES.includes(sortRaw as EmpleosSortKey) ? (sortRaw as EmpleosSortKey) : "relevance";
  return {
    q: (sp.get("q") ?? "").trim(),
    city: (sp.get("city") ?? "").trim(),
    state: (sp.get("state") ?? "").trim(),
    zip: (sp.get("zip") ?? "").trim(),
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
    verifiedOnly: sp.get("verified") === "1",
    premiumOnly: sp.get("premium") === "1",
    lane: (sp.get("lane") ?? "").trim(),
    industry: (sp.get("industry") ?? "").trim(),
    bilingualOnly: sp.get("bilingual") === "1",
    radiusKm: (sp.get("radiusKm") ?? "").trim(),
    sort,
  };
}

function num(v: string): number | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Normalize user ZIP input to 5 digits (US). */
export function normalizeZip5(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

const RECENT_MS = 7 * 24 * 3600 * 1000;

export function filterEmpleosJobs(jobs: EmpleosJobRecord[], p: ParsedEmpleosResultsQuery, nowMs: number): EmpleosJobRecord[] {
  const qLower = p.q.toLowerCase();
  const cityLower = p.city.toLowerCase();
  const stateUpper = p.state.trim().toUpperCase();
  const zip5 = normalizeZip5(p.zip);
  const laneLower = p.lane.toLowerCase();
  const industryLower = p.industry.toLowerCase();

  return jobs.filter((j) => {
    if (p.featuredOnly && j.listingTier === "standard") return false;
    if (p.recentOnly && nowMs - new Date(j.publishedAt).getTime() > RECENT_MS) return false;
    if (p.quickApplyOnly && !j.quickApply) return false;
    if (p.verifiedOnly && !j.verifiedEmployer) return false;
    if (p.premiumOnly && !j.premiumEmployer) return false;
    if (laneLower && j.publicationLane !== laneLower) return false;
    if (industryLower && !(j.industryFocus ?? "").toLowerCase().includes(industryLower)) return false;
    if (p.bilingualOnly && !j.bilingual) return false;
    if (p.category && j.category !== p.category) return false;
    if (p.jobType && j.jobType !== p.jobType) return false;
    if (p.modality && j.modality !== p.modality) return false;
    if (p.experience && j.experience !== p.experience) return false;
    if (p.companyType && j.companyType !== p.companyType) return false;

    if (stateUpper && j.state.toUpperCase() !== stateUpper) return false;

    if (zip5.length === 5) {
      const jobZip = j.postalCode ? normalizeZip5(j.postalCode) : "";
      if (!jobZip || jobZip !== zip5) return false;
    }

    const smin = num(p.salaryMin);
    const smax = num(p.salaryMax);
    if (smin != null && j.salaryMax < smin) return false;
    if (smax != null && j.salaryMin > smax) return false;

    if (qLower) {
      const blob =
        `${j.title} ${j.company} ${j.summary} ${j.description} ${j.industryFocus ?? ""} ${j.scheduleLabel ?? ""} ${j.languagesSpoken ?? ""}`.toLowerCase();
      if (!blob.includes(qLower)) return false;
    }

    if (cityLower) {
      const loc = `${j.city} ${j.state}`.toLowerCase();
      if (!loc.includes(cityLower)) return false;
    }

    // radiusKm: staged — requires lat/lng + geo index; do not fake proximity in sample phase.
    // if (p.radiusKm && Number(p.radiusKm) > 0) { /* future */ }

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
