import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosBusinessProfile, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import { inferServiciosSellerPresentation } from "./serviciosSellerKind";

export type ServiciosResultsFilterQuery = {
  city?: string;
  group?: string;
  whatsapp?: "1" | "0";
  promo?: "1" | "0";
  call?: "1" | "0";
  /** Keyword — matched against name, city, category line, about, location strings, services, trust, reviews */
  q?: string;
  sort?: "newest" | "name" | "rating";
  /** Derived from profile contact fields when not `all` */
  seller?: "all" | "business" | "independent";
  /** Leonix-verified listing (`leonix_verified` on row) */
  verified?: "1";
  /** Public website URL present on published profile */
  web?: "1";
  /** `quickFacts` includes bilingual signal */
  bilingual?: "1";
  /** Public email on profile (mailto-capable) */
  email?: "1";
  /** Quick fact kind `emergency` */
  emergency?: "1";
  /** Quick fact kind `mobile_service` */
  mobileSvc?: "1";
};

function normalize(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function serviciosResultsHasActiveFilters(q: ServiciosResultsFilterQuery): boolean {
  return Boolean(
    normalize(q.city) ||
      normalize(q.group) ||
      normalize(q.q) ||
      q.whatsapp === "1" ||
      q.promo === "1" ||
      q.call === "1" ||
      q.verified === "1" ||
      q.web === "1" ||
      q.bilingual === "1" ||
      q.email === "1" ||
      q.emergency === "1" ||
      q.mobileSvc === "1" ||
      (q.sort && q.sort !== "newest") ||
      (q.seller && q.seller !== "all"),
  );
}

function wireHasPublicWebsite(p: ServiciosBusinessProfile): boolean {
  return Boolean(p.contact?.websiteUrl?.trim());
}

function wireHasBilingualQuickFact(p: ServiciosBusinessProfile): boolean {
  return (p.quickFacts ?? []).some((f) => f.kind === "bilingual");
}

function wireHasQuickFactKind(p: ServiciosBusinessProfile, kind: string): boolean {
  return (p.quickFacts ?? []).some((f) => f.kind === kind);
}

function wireHasPublicEmail(p: ServiciosBusinessProfile): boolean {
  return Boolean(p.contact?.email?.trim());
}

/** City/ZIP/area filter: row city + published contact/hero/service-area text (substring match). */
export function rowMatchesLocationQuery(row: ServiciosPublicListingRow, cityQ: string): boolean {
  const q = normalize(cityQ);
  if (!q) return true;
  if (normalize(row.city).includes(q)) return true;
  const pj = row.profile_json;
  const c = pj.contact;
  if (normalize(c?.physicalPostalCode ?? "").includes(q)) return true;
  if (normalize(c?.physicalCity ?? "").includes(q)) return true;
  if (normalize(pj.hero?.locationSummary ?? "").includes(q)) return true;
  for (const item of pj.serviceAreas?.items ?? []) {
    if (normalize(item.label).includes(q)) return true;
  }
  return false;
}

function resolvedProfile(row: ServiciosPublicListingRow, lang: ServiciosLang) {
  const wire = { ...row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
  return resolveServiciosProfile(wire, lang);
}

/** Leonix “destacado” / partner emphasis from published profile wire. */
export function isServiciosListingPromoted(row: ServiciosPublicListingRow): boolean {
  return row.profile_json.contact?.isFeatured === true;
}

/**
 * Server-side filter on listing rows using the same resolved profile shape as preview/live.
 */
export function filterServiciosPublicListingRows(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  q: ServiciosResultsFilterQuery,
): ServiciosPublicListingRow[] {
  const cityQ = normalize(q.city);
  const groupQ = normalize(q.group);
  const wantWa = q.whatsapp === "1";
  const wantPromo = q.promo === "1";
  const wantCall = q.call === "1";
  const wantVerified = q.verified === "1";
  const wantWeb = q.web === "1";
  const wantBilingual = q.bilingual === "1";
  const wantEmail = q.email === "1";
  const wantEmergency = q.emergency === "1";
  const wantMobileSvc = q.mobileSvc === "1";

  if (
    !cityQ &&
    !groupQ &&
    !wantWa &&
    !wantPromo &&
    !wantCall &&
    !wantVerified &&
    !wantWeb &&
    !wantBilingual &&
    !wantEmail &&
    !wantEmergency &&
    !wantMobileSvc
  ) {
    return rows;
  }

  return rows.filter((row) => {
    const pj = row.profile_json;
    if (groupQ && normalize(row.internal_group ?? "") !== groupQ) return false;
    if (cityQ && !rowMatchesLocationQuery(row, cityQ)) return false;
    if (wantVerified && row.leonix_verified !== true) return false;
    if (wantWeb && !wireHasPublicWebsite(pj)) return false;
    if (wantBilingual && !wireHasBilingualQuickFact(pj)) return false;
    if (wantEmail && !wireHasPublicEmail(pj)) return false;
    if (wantEmergency && !wireHasQuickFactKind(pj, "emergency")) return false;
    if (wantMobileSvc && !wireHasQuickFactKind(pj, "mobile_service")) return false;

    if (wantWa || wantPromo || wantCall) {
      const profile = resolvedProfile(row, lang);
      if (wantWa && !profile.contact.socialLinks?.whatsapp) return false;
      if (wantPromo && !profile.promo?.headline?.trim()) return false;
      if (wantCall && !(profile.contact.phoneDisplay && profile.contact.phoneTelHref)) return false;
    }

    return true;
  });
}

export function filterServiciosRowsByKeyword(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  rawQ: string | undefined,
): ServiciosPublicListingRow[] {
  const kw = normalize(rawQ);
  if (!kw) return rows;

  return rows.filter((row) => {
    if (normalize(row.business_name).includes(kw)) return true;
    if (normalize(row.city).includes(kw)) return true;
    const profile = resolvedProfile(row, lang);
    if (normalize(profile.hero.categoryLine).includes(kw)) return true;
    if (normalize(profile.about?.text).includes(kw)) return true;
    if (normalize(profile.about?.specialtiesLine).includes(kw)) return true;
    const pj = row.profile_json;
    if (normalize(pj.contact?.physicalPostalCode ?? "").includes(kw)) return true;
    if (normalize(pj.contact?.physicalCity ?? "").includes(kw)) return true;
    if (normalize(pj.hero?.locationSummary ?? "").includes(kw)) return true;
    for (const item of pj.serviceAreas?.items ?? []) {
      if (normalize(item.label).includes(kw)) return true;
    }
    for (const s of profile.services ?? []) {
      if (normalize(s.title).includes(kw)) return true;
      if (normalize(s.secondaryLine).includes(kw)) return true;
    }
    for (const t of profile.trust ?? []) {
      if (normalize(t.label).includes(kw)) return true;
    }
    for (const r of profile.reviews ?? []) {
      if (normalize(r.quote).includes(kw) || normalize(r.authorName).includes(kw)) return true;
    }
    for (const f of profile.quickFacts ?? []) {
      if (normalize(f.label).includes(kw)) return true;
    }
    return false;
  });
}

export function filterServiciosRowsBySeller(
  rows: ServiciosPublicListingRow[],
  _lang: ServiciosLang,
  seller: ServiciosResultsFilterQuery["seller"],
): ServiciosPublicListingRow[] {
  if (!seller || seller === "all") return rows;

  return rows.filter((row) => {
    const kind = inferServiciosSellerPresentation(row.profile_json);
    return kind === seller;
  });
}

function rowRatingAvg(row: ServiciosPublicListingRow): number | null {
  const n = row.review_rating_avg;
  const c = row.review_rating_count ?? 0;
  if (typeof n === "number" && Number.isFinite(n) && c > 0) return n;
  return null;
}

export function sortServiciosListingRows(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  sort: ServiciosResultsFilterQuery["sort"],
): ServiciosPublicListingRow[] {
  const s = sort ?? "newest";
  const copy = [...rows];
  const tieSlug = (a: ServiciosPublicListingRow, b: ServiciosPublicListingRow) => a.slug.localeCompare(b.slug, "en");

  if (s === "name") {
    copy.sort((a, b) => {
      const c = normalize(a.business_name).localeCompare(normalize(b.business_name), lang === "en" ? "en" : "es");
      return c !== 0 ? c : tieSlug(a, b);
    });
    return copy;
  }
  if (s === "rating") {
    copy.sort((a, b) => {
      const ra = rowRatingAvg(a);
      const rb = rowRatingAvg(b);
      if (ra != null && rb != null && ra !== rb) return rb - ra;
      if (ra != null && rb == null) return -1;
      if (ra == null && rb != null) return 1;
      if (a.published_at < b.published_at) return 1;
      if (a.published_at > b.published_at) return -1;
      return tieSlug(a, b);
    });
    return copy;
  }
  copy.sort((a, b) => {
    if (a.published_at < b.published_at) return 1;
    if (a.published_at > b.published_at) return -1;
    return tieSlug(a, b);
  });
  return copy;
}

/**
 * Destacado listings first (rewarded visibility), then the rest — each block sorted by `sort`.
 */
export function sortServiciosResultsForDisplay(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  sort: ServiciosResultsFilterQuery["sort"],
): ServiciosPublicListingRow[] {
  const promoted = rows.filter(isServiciosListingPromoted);
  const rest = rows.filter((r) => !isServiciosListingPromoted(r));
  return [...sortServiciosListingRows(promoted, lang, sort), ...sortServiciosListingRows(rest, lang, sort)];
}
