import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosBusinessProfile, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import { serviciosVerifiedRankingBias } from "./serviciosLeonixVerificationModel";
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
  /** `contact.messageEnabled` */
  msg?: "1";
  /** Physical storefront / mailing address captured */
  phys?: "1";
  /** Multiple service-area tokens (application `serviceAreaNotes` richness) */
  svcMulti?: "1";
  /** Promo / offer headline present */
  offer?: "1";
  /** All three legal attestations complete at publish (stored in `opsMeta.discovery`) */
  legal?: "1";
  /** Language chip `lang_es` from application */
  langEs?: "1";
  /** Language chip `lang_en` */
  langEn?: "1";
  /** Language chip `lang_otro` */
  langOt?: "1";
  /** Advertiser requested Leonix verification review (`opsMeta.leonixVerifiedInterest`) */
  vint?: "1";
  /** Saturday or Sunday has non-closed hours line in weekly schedule */
  wknd?: "1";
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
      q.msg === "1" ||
      q.phys === "1" ||
      q.svcMulti === "1" ||
      q.offer === "1" ||
      q.legal === "1" ||
      q.langEs === "1" ||
      q.langEn === "1" ||
      q.langOt === "1" ||
      q.vint === "1" ||
      q.wknd === "1" ||
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

function wireHasPhysicalAddress(p: ServiciosBusinessProfile): boolean {
  const c = p.contact;
  return Boolean(c?.physicalStreet?.trim() || c?.physicalCity?.trim() || c?.physicalPostalCode?.trim());
}

function wireWeekendOpen(p: ServiciosBusinessProfile): boolean {
  const rows = p.contact?.hours?.weeklyRows;
  if (!rows?.length) return false;
  return rows.some((r) => {
    const d = normalize(r.dayLabel);
    const isWeekend = d.includes("sáb") || d.includes("dom") || d.includes("sat") || d.includes("sun");
    if (!isWeekend) return false;
    const line = normalize(r.line);
    return line.length > 0 && !line.includes("cerrado") && !line.includes("closed");
  });
}

function rowLangChip(pj: ServiciosBusinessProfile, chip: string): boolean {
  const ids = pj.opsMeta?.discovery?.languageChipIds;
  if (ids && ids.length) return ids.includes(chip);
  const badges = pj.hero?.badges ?? [];
  if (chip === "lang_es") return badges.some((b) => b.kind === "spanish");
  if (chip === "lang_en") return badges.some((b) => b.kind === "custom" && /inglés|english/i.test(b.label ?? ""));
  if (chip === "lang_otro") return badges.some((b) => b.kind === "custom" && /otro|other/i.test(b.label ?? ""));
  return false;
}

function rowSvcMulti(pj: ServiciosBusinessProfile): boolean {
  if (pj.opsMeta?.discovery?.hasServiceAreaMultiLine === true) return true;
  const n = pj.serviceAreas?.items?.length ?? 0;
  return n >= 2;
}

function rowOffer(pj: ServiciosBusinessProfile): boolean {
  if (pj.opsMeta?.discovery?.hasPromoHeadline === true) return true;
  return Boolean(pj.promo?.headline?.trim());
}

function rowLegalComplete(pj: ServiciosBusinessProfile): boolean {
  return pj.opsMeta?.discovery?.listerAttestationsComplete === true;
}

function rowPhysDiscovery(pj: ServiciosBusinessProfile): boolean {
  if (pj.opsMeta?.discovery?.hasPhysicalAddress === true) return true;
  return wireHasPhysicalAddress(pj);
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
  const wantMsg = q.msg === "1";
  const wantPhys = q.phys === "1";
  const wantSvcMulti = q.svcMulti === "1";
  const wantOffer = q.offer === "1";
  const wantLegal = q.legal === "1";
  const wantLangEs = q.langEs === "1";
  const wantLangEn = q.langEn === "1";
  const wantLangOt = q.langOt === "1";
  const wantVint = q.vint === "1";
  const wantWknd = q.wknd === "1";

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
    !wantMobileSvc &&
    !wantMsg &&
    !wantPhys &&
    !wantSvcMulti &&
    !wantOffer &&
    !wantLegal &&
    !wantLangEs &&
    !wantLangEn &&
    !wantLangOt &&
    !wantVint &&
    !wantWknd
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
    if (wantMsg && pj.contact?.messageEnabled !== true) return false;
    if (wantPhys && !rowPhysDiscovery(pj)) return false;
    if (wantSvcMulti && !rowSvcMulti(pj)) return false;
    if (wantOffer && !rowOffer(pj)) return false;
    if (wantLegal && !rowLegalComplete(pj)) return false;
    if (wantLangEs && !rowLangChip(pj, "lang_es")) return false;
    if (wantLangEn && !rowLangChip(pj, "lang_en")) return false;
    if (wantLangOt && !rowLangChip(pj, "lang_otro")) return false;
    if (wantVint && pj.opsMeta?.leonixVerifiedInterest !== true) return false;
    if (wantWknd && !wireWeekendOpen(pj)) return false;

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

function compareVerifiedThenPublishedThenSlug(
  a: ServiciosPublicListingRow,
  b: ServiciosPublicListingRow,
  tieSlug: (x: ServiciosPublicListingRow, y: ServiciosPublicListingRow) => number,
): number {
  const vb = serviciosVerifiedRankingBias(b) - serviciosVerifiedRankingBias(a);
  if (vb !== 0) return vb;
  if (a.published_at < b.published_at) return 1;
  if (a.published_at > b.published_at) return -1;
  return tieSlug(a, b);
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
      if (c !== 0) return c;
      const vb = serviciosVerifiedRankingBias(b) - serviciosVerifiedRankingBias(a);
      if (vb !== 0) return vb;
      return tieSlug(a, b);
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
      const vb = serviciosVerifiedRankingBias(b) - serviciosVerifiedRankingBias(a);
      if (vb !== 0) return vb;
      if (a.published_at < b.published_at) return 1;
      if (a.published_at > b.published_at) return -1;
      return tieSlug(a, b);
    });
    return copy;
  }
  copy.sort((a, b) => compareVerifiedThenPublishedThenSlug(a, b, tieSlug));
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
