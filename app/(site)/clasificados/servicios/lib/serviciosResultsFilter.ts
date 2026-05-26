import { serviciosHoursSummaryIsOpenNow } from "@/app/servicios/components/serviciosHeroHoursStatus";
import { isAllowedServiciosImageUrl } from "@/app/servicios/lib/serviciosMediaUrl";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosBusinessProfile, ServiciosLang, ServiciosProfileResolved } from "@/app/servicios/types/serviciosBusinessProfile";
import {
  packageEntitlementGrantsDestacado,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import {
  resolveServiciosListingRank,
  applyServiciosVisibilityRanking,
} from "./serviciosVisibilityRanking";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import { serviciosPublicListingDiscoverySortMs, compareServiciosPublicResultsNewestFirst } from "./serviciosPublicListingSort";
import { serviciosVerifiedRankingBias } from "./serviciosLeonixVerificationModel";
import { inferServiciosSellerPresentation } from "./serviciosSellerKind";

export type ServiciosResultsFilterQuery = {
  city?: string;
  group?: string;
  whatsapp?: "1" | "0";
  promo?: "1" | "0";
  call?: "1" | "0";
  /** Keyword — matched against name, city, category line, about, locations, services, trust, reviews, promos/offers, highlights */
  q?: string;
  sort?: "newest" | "name" | "rating" | "most_liked" | "most_saved" | "open_now";
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
  /** URL: open_now=1 — listing must be “open” per vitrina hero hours logic at filter time */
  openNow?: "1";
  /** URL: licensed=1 — license credentials, licensed+insured quick fact, or hero “licensed” badge */
  licensed?: "1";
  /** URL: insured=1 — insurance credentials, licensed+insured quick fact, or hero “insured” badge */
  insured?: "1";
  /** URL: free_estimate=1 — quick fact, amenity, or trusted marketing copy */
  freeEstimate?: "1";
  /** URL: free_consultation=1 — amenity or trusted marketing copy */
  freeConsultation?: "1";
  /** URL: has_photos=1 — resolved gallery/cover/logo/service images (sanitized URLs; excludes empty/blob) */
  hasPhotos?: "1";
  /** URL: has_videos=1 — resolved gallery videos with public playback URL (Mux HLS / https, post-sanitize) */
  hasVideos?: "1";
  /** URL: has_offers=1 — resolved promotions/offers (same gate as public shell, not blank-only) */
  hasOffers?: "1";
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
      q.openNow === "1" ||
      q.licensed === "1" ||
      q.insured === "1" ||
      q.freeEstimate === "1" ||
      q.freeConsultation === "1" ||
      q.hasPhotos === "1" ||
      q.hasVideos === "1" ||
      q.hasOffers === "1" ||
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
  const qf = p.quickFacts;
  if (!Array.isArray(qf)) return false;
  return qf.some((f) => f && f.kind === kind);
}

function wireHeroBadgeKinds(pj: ServiciosBusinessProfile): Set<string> {
  const badges = pj.hero?.badges;
  if (!Array.isArray(badges)) return new Set();
  const out = new Set<string>();
  for (const b of badges) {
    if (b && typeof b.kind === "string") out.add(b.kind);
  }
  return out;
}

function wireHasAmenityOptionId(pj: ServiciosBusinessProfile, id: string): boolean {
  const ids = pj.amenityOptionIds;
  if (!Array.isArray(ids)) return false;
  return ids.includes(id);
}

/** Substrings on normalized (lowercased) marketing text — multi-word / specific only. */
const FREE_ESTIMATE_PHRASES = [
  "free estimate",
  "free estimates",
  "cotización gratis",
  "cotizacion gratis",
  "presupuesto gratis",
  "estimado gratis",
  "estimados gratis",
];

const FREE_CONSULTATION_PHRASES = [
  "free consultation",
  "free initial consultation",
  "consulta gratis",
  "consultas gratis",
  "consulta inicial gratis",
];

function wireTrustMarketingHaystackNormalized(pj: ServiciosBusinessProfile): string {
  try {
    const parts: string[] = [];
    const push = (s: unknown) => {
      if (typeof s === "string" && s.trim()) parts.push(s);
    };
    const qf = Array.isArray(pj.quickFacts) ? pj.quickFacts : [];
    for (const f of qf) {
      if (f && typeof f.label === "string") push(f.label);
    }
    const trust = Array.isArray(pj.trust) ? pj.trust : [];
    for (const t of trust) {
      if (t && typeof t.label === "string") push(t.label);
    }
    const services = Array.isArray(pj.services) ? pj.services : [];
    for (const s of services) {
      if (s && typeof s.title === "string") push(s.title);
      if (s && typeof s.secondaryLine === "string") push(s.secondaryLine);
    }
    const highlights = Array.isArray(pj.businessHighlights) ? pj.businessHighlights : [];
    for (const h of highlights) {
      if (h && typeof h.label === "string") push(h.label);
    }
    const badges = Array.isArray(pj.hero?.badges) ? pj.hero!.badges! : [];
    for (const b of badges) {
      if (b && typeof b.label === "string") push(b.label);
    }
    for (const raw of wirePromotionalTextFields(pj)) {
      push(raw);
    }
    const customAmenities = pj.customAmenityOptions;
    if (Array.isArray(customAmenities)) {
      for (const c of customAmenities) push(c);
    }
    return normalize(parts.join("\n"));
  } catch {
    return "";
  }
}

function haystackContainsAnyPhrase(hay: string, phrases: readonly string[]): boolean {
  if (!hay) return false;
  for (const p of phrases) {
    const n = normalize(p);
    if (n && hay.includes(n)) return true;
  }
  return false;
}

function rowMatchesLicensed(pj: ServiciosBusinessProfile): boolean {
  try {
    if (pj.credentials?.hasLicense === true) return true;
    if (wireHasQuickFactKind(pj, "licensed_insured")) return true;
    return wireHeroBadgeKinds(pj).has("licensed");
  } catch {
    return false;
  }
}

function rowMatchesInsured(pj: ServiciosBusinessProfile): boolean {
  try {
    if (pj.credentials?.isInsured === true) return true;
    if (wireHasQuickFactKind(pj, "licensed_insured")) return true;
    return wireHeroBadgeKinds(pj).has("insured");
  } catch {
    return false;
  }
}

function rowMatchesFreeEstimate(pj: ServiciosBusinessProfile): boolean {
  try {
    if (wireHasQuickFactKind(pj, "free_estimate")) return true;
    if (wireHasAmenityOptionId(pj, "service_free_estimates")) return true;
    const hay = wireTrustMarketingHaystackNormalized(pj);
    return haystackContainsAnyPhrase(hay, FREE_ESTIMATE_PHRASES);
  } catch {
    return false;
  }
}

function rowMatchesFreeConsultation(pj: ServiciosBusinessProfile): boolean {
  try {
    if (wireHasAmenityOptionId(pj, "service_free_initial_consultation")) return true;
    const hay = wireTrustMarketingHaystackNormalized(pj);
    return haystackContainsAnyPhrase(hay, FREE_CONSULTATION_PHRASES);
  } catch {
    return false;
  }
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
  if (pj.promo?.headline?.trim()) return true;
  return (pj.promotions ?? []).some((p) => p?.headline?.trim());
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

/** Hero image counts as a public photo when URL passes the same allowlist as gallery (excludes blob: drafts). */
function resolvedHeroPhotoUrl(url: string | undefined): boolean {
  const t = (url ?? "").trim();
  if (!t || t.startsWith("blob:")) return false;
  return isAllowedServiciosImageUrl(t);
}

function resolvedHasPublicPhotos(profile: ServiciosProfileResolved): boolean {
  try {
    const nMain = profile.gallery?.length ?? 0;
    const nMore = profile.galleryMore?.length ?? 0;
    if (nMain + nMore > 0) return true;
    if (resolvedHeroPhotoUrl(profile.hero.coverImageUrl)) return true;
    if (resolvedHeroPhotoUrl(profile.hero.logoUrl)) return true;
    const services = profile.services;
    if (!Array.isArray(services)) return false;
    return services.some((s) => Boolean(s?.imageUrl?.trim()));
  } catch {
    return false;
  }
}

function resolvedHasPlayableGalleryVideos(profile: ServiciosProfileResolved): boolean {
  try {
    const vids = profile.galleryVideos;
    if (!Array.isArray(vids) || vids.length === 0) return false;
    return vids.some((v) => {
      if (!v || typeof v.url !== "string") return false;
      const u = v.url.trim();
      if (!u || u.startsWith("blob:")) return false;
      return Boolean(v.muxPlaybackId?.trim()) || u.startsWith("http://") || u.startsWith("https://");
    });
  } catch {
    return false;
  }
}

function resolvedHasOffers(profile: ServiciosProfileResolved): boolean {
  try {
    return Array.isArray(profile.promotions) && profile.promotions.length > 0;
  } catch {
    return false;
  }
}

/** Collects free-text promo/offer fields from wire JSON (supports legacy keys like title/details). */
function wirePromotionalTextFields(pj: ServiciosBusinessProfile): string[] {
  const out: string[] = [];
  const push = (s: unknown) => {
    if (typeof s === "string" && s.trim()) out.push(s);
  };
  push(pj.promo?.headline);
  push(pj.promo?.footnote);
  for (const p of pj.promotions ?? []) {
    const o = p as Record<string, unknown>;
    push(o.headline);
    push(o.footnote);
    push(o.title);
    push(o.details);
    push(o.description);
  }
  return out;
}

export function serviciosPublicRowToEntitlementListing(row: ServiciosPublicListingRow): Record<string, unknown> {
  return {
    id: row.id ?? null,
    slug: row.slug,
    leonix_ad_id: row.leonix_ad_id ?? null,
    package_entitlement_tier: row.package_entitlement_tier ?? null,
    starts_at: row.entitlement_starts_at ?? null,
    ends_at: row.entitlement_ends_at ?? null,
    category: "servicios",
  };
}

/** Destacado band: active Premium entitlement only (not legacy `isFeatured` alone). */
export function isServiciosListingPromoted(row: ServiciosPublicListingRow): boolean {
  const summary = resolveListingPlacementEntitlement({
    category: "servicios",
    listing: serviciosPublicRowToEntitlementListing(row),
  });
  return packageEntitlementGrantsDestacado(summary);
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
  const wantOpenNow = q.openNow === "1";
  const wantLicensed = q.licensed === "1";
  const wantInsured = q.insured === "1";
  const wantFreeEstimate = q.freeEstimate === "1";
  const wantFreeConsultation = q.freeConsultation === "1";
  const wantHasPhotos = q.hasPhotos === "1";
  const wantHasVideos = q.hasVideos === "1";
  const wantHasOffers = q.hasOffers === "1";

  if (
    !cityQ &&
    !groupQ &&
    !wantWa &&
    !wantPromo &&
    !wantCall &&
    !wantOpenNow &&
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
    !wantWknd &&
    !wantLicensed &&
    !wantInsured &&
    !wantFreeEstimate &&
    !wantFreeConsultation &&
    !wantHasPhotos &&
    !wantHasVideos &&
    !wantHasOffers
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

    if (wantLicensed && !rowMatchesLicensed(pj)) return false;
    if (wantInsured && !rowMatchesInsured(pj)) return false;
    if (wantFreeEstimate && !rowMatchesFreeEstimate(pj)) return false;
    if (wantFreeConsultation && !rowMatchesFreeConsultation(pj)) return false;

    if (wantWa || wantPromo || wantCall || wantOpenNow || wantHasPhotos || wantHasVideos || wantHasOffers) {
      const profile = resolvedProfile(row, lang);
      if (wantOpenNow && !serviciosHoursSummaryIsOpenNow(profile.contact.hours, lang)) return false;
      if (wantWa && !profile.contact.socialLinks?.whatsapp) return false;
      if (wantPromo && !profile.promotions.some((p) => p.headline?.trim())) return false;
      if (wantCall && !(profile.contact.phoneDisplay && profile.contact.phoneTelHref)) return false;
      if (wantHasPhotos && !resolvedHasPublicPhotos(profile)) return false;
      if (wantHasVideos && !resolvedHasPlayableGalleryVideos(profile)) return false;
      if (wantHasOffers && !resolvedHasOffers(profile)) return false;
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
    for (const h of profile.highlights ?? []) {
      if (normalize(h.label).includes(kw)) return true;
    }
    for (const p of profile.promotions ?? []) {
      if (normalize(p.headline).includes(kw)) return true;
      if (normalize(p.footnote ?? "").includes(kw)) return true;
    }
    for (const raw of wirePromotionalTextFields(pj)) {
      if (normalize(raw).includes(kw)) return true;
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
  const ta = serviciosPublicListingDiscoverySortMs(a);
  const tb = serviciosPublicListingDiscoverySortMs(b);
  if (ta < tb) return 1;
  if (ta > tb) return -1;
  return tieSlug(a, b);
}

export type SortServiciosListingRowsOpts = {
  /**
   * When true (Servicios **results** page only), `sort=newest` uses {@link compareServiciosPublicResultsNewestFirst}.
   * Landing and other callers omit this so order stays republish-aware via discovery timestamps.
   */
  resultsNewest?: boolean;
};

export function sortServiciosListingRows(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  sort: ServiciosResultsFilterQuery["sort"],
  opts?: SortServiciosListingRowsOpts,
): ServiciosPublicListingRow[] {
  const s = sort ?? "newest";
  const copy = [...rows];
  const tieSlug = (a: ServiciosPublicListingRow, b: ServiciosPublicListingRow) => a.slug.localeCompare(b.slug, "en");
  const useResultsNewest = opts?.resultsNewest === true && s === "newest";

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
      const ta = serviciosPublicListingDiscoverySortMs(a);
      const tb = serviciosPublicListingDiscoverySortMs(b);
      if (ta < tb) return 1;
      if (ta > tb) return -1;
      return tieSlug(a, b);
    });
    return copy;
  }
  if (s === "most_liked") {
    copy.sort((a, b) => {
      const la = Math.max(0, Math.floor(Number(a.public_like_net_count ?? 0)));
      const lb = Math.max(0, Math.floor(Number(b.public_like_net_count ?? 0)));
      if (lb !== la) return lb - la;
      const vb = serviciosVerifiedRankingBias(b) - serviciosVerifiedRankingBias(a);
      if (vb !== 0) return vb;
      return compareServiciosPublicResultsNewestFirst(a, b);
    });
    return copy;
  }
  if (s === "most_saved") {
    copy.sort((a, b) => {
      const sa = Math.max(0, Math.floor(Number(a.public_save_count ?? 0)));
      const sb = Math.max(0, Math.floor(Number(b.public_save_count ?? 0)));
      if (sb !== sa) return sb - sa;
      const vb = serviciosVerifiedRankingBias(b) - serviciosVerifiedRankingBias(a);
      if (vb !== 0) return vb;
      return compareServiciosPublicResultsNewestFirst(a, b);
    });
    return copy;
  }
  if (s === "open_now") {
    const openMap = new Map<string, boolean>();
    for (const row of copy) {
      try {
        const p = resolvedProfile(row, lang);
        openMap.set(row.slug, serviciosHoursSummaryIsOpenNow(p.contact.hours, lang));
      } catch {
        openMap.set(row.slug, false);
      }
    }
    copy.sort((a, b) => {
      const oa = openMap.get(a.slug) ? 1 : 0;
      const ob = openMap.get(b.slug) ? 1 : 0;
      if (ob !== oa) return ob - oa;
      const vb = serviciosVerifiedRankingBias(b) - serviciosVerifiedRankingBias(a);
      if (vb !== 0) return vb;
      return compareServiciosPublicResultsNewestFirst(a, b);
    });
    return copy;
  }

  copy.sort((a, b) => {
    if (useResultsNewest) {
      const vb = serviciosVerifiedRankingBias(b) - serviciosVerifiedRankingBias(a);
      if (vb !== 0) return vb;
      return compareServiciosPublicResultsNewestFirst(a, b);
    }
    return compareVerifiedThenPublishedThenSlug(a, b, tieSlug);
  });
  return copy;
}

/**
 * Print-to-Digital placement order: Premium Destacado → Full-page priority → print pool → organic.
 * Within each visibility bucket, apply the user-selected `sort`.
 *
 * Gate G2-SERVICIOS: uses resolveListingVisibilityRank via the serviciosVisibilityRanking adapter.
 * Search/filter must run before this function — it only re-orders matching results.
 */
export function sortServiciosResultsForDisplay(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  sort: ServiciosResultsFilterQuery["sort"],
): ServiciosPublicListingRow[] {
  const weightOrder = [600, 500, 400, 300, 200, 100, 50, 25, 0] as const;
  const buckets = new Map<number, ServiciosPublicListingRow[]>();
  const rankBySlug = new Map<string, ReturnType<typeof resolveServiciosListingRank>>();

  for (const row of rows) {
    const rank = resolveServiciosListingRank(row);
    rankBySlug.set(row.slug, rank);
    const list = buckets.get(rank.rankWeight) ?? [];
    list.push(row);
    buckets.set(rank.rankWeight, list);
  }

  const sorted: ServiciosPublicListingRow[] = [];
  for (const w of weightOrder) {
    const block = buckets.get(w);
    if (!block?.length) continue;
    const rankedBlock = applyServiciosVisibilityRanking(block);
    sorted.push(...sortServiciosListingRows(rankedBlock, lang, sort, { resultsNewest: true }));
  }
  return sorted;
}
