import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { inferServiciosSellerPresentation } from "./serviciosSellerKind";

export type ServiciosResultsFilterQuery = {
  city?: string;
  group?: string;
  whatsapp?: "1" | "0";
  promo?: "1" | "0";
  call?: "1" | "0";
  /** Keyword — matched against name, city, category line, about (shell-ready for future index) */
  q?: string;
  sort?: "newest" | "name";
  /** Derived from profile contact fields when not `all` */
  seller?: "all" | "business" | "independent";
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
      (q.sort && q.sort !== "newest") ||
      (q.seller && q.seller !== "all"),
  );
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

  if (!cityQ && !groupQ && !wantWa && !wantPromo && !wantCall) return rows;

  return rows.filter((row) => {
    if (groupQ && normalize(row.internal_group ?? "") !== groupQ) return false;
    if (cityQ && !normalize(row.city).includes(cityQ)) return false;

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

export function sortServiciosListingRows(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
  sort: ServiciosResultsFilterQuery["sort"],
): ServiciosPublicListingRow[] {
  const s = sort ?? "newest";
  const copy = [...rows];
  if (s === "name") {
    copy.sort((a, b) =>
      normalize(a.business_name).localeCompare(normalize(b.business_name), lang === "en" ? "en" : "es"),
    );
    return copy;
  }
  copy.sort((a, b) => (a.published_at < b.published_at ? 1 : a.published_at > b.published_at ? -1 : 0));
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
  return [
    ...sortServiciosListingRows(promoted, lang, sort),
    ...sortServiciosListingRows(rest, lang, sort),
  ];
}
