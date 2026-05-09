/**
 * Shared admin-facing identity for ads across Clasificados tables (Phase 1).
 * Pure helpers — no DB writes. URLs follow existing site/admin routes.
 */

import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { autosClassifiedsRowToDashboardRow } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";

export type AdminAdSource = "generic" | "restaurantes" | "servicios" | "empleos" | "autos";

/** Optional owner hints (e.g. from `profiles`) — never required for normalization. */
export type AdminAdOwnerHints = {
  ownerUserId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
};

export type AdminNormalizedAd = {
  source: AdminAdSource;
  categorySlug: string;
  internalId: string;
  /** Real public/published code from DB when present (optional columns). */
  publishedId: string | null;
  /** `leonix_ad_id` column only (subset of `publishedId` when that column is the source). */
  leonixAdId?: string | null;
  /** Same as `displayId` — stable label for admin tables (Leonix code or fallback). */
  publicIdLabel: string;
  /** Deterministic admin-only display code when no publishedId. */
  fallbackDisplayId: string;
  /** publishedId ?? fallbackDisplayId — always non-empty when internalId is valid. */
  displayId: string;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  title: string;
  slug: string | null;
  status: string | null;
  city: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publicUrl: string;
  adminUrl: string;
  editUrl: string | null;
  /** Non-sensitive hints for debugging (no tokens, no full listing_json). */
  sourceMeta?: Record<string, string | number | boolean | null>;
};

const RESTAURANT_PUBLIC_PATH = "/clasificados/restaurantes";
const SERVICIOS_PUBLIC_PATH = "/clasificados/servicios";
const GENERIC_ANUNCIO_PATH = "/clasificados/anuncio";
const EMPLEOS_PUBLIC_PATH = "/clasificados/empleos";

/** Known DB column names that may carry a human-facing public id (additive; absent on older DBs). */
const PUBLISHED_ID_KEYS = ["leonix_ad_id", "published_id", "public_id", "public_listing_id", "listing_public_id"] as const;

function nonEmptyString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/**
 * Category slug → admin display prefix (stable contract for fallback IDs).
 */
export function adminCategoryPrefixForSlug(categorySlug: string): string {
  const s = (categorySlug ?? "").trim().toLowerCase();
  if (!s) return "LIST";
  if (s === "restaurantes") return "REST";
  if (s === "servicios") return "SERV";
  if (s === "en-venta") return "SALE";
  if (s === "rentas") return "RENT";
  if (s === "empleos") return "JOB";
  if (s === "autos") return "AUTO";
  if (s === "travel" || s === "viajes") return "TRAV";
  if (s === "comunidad") return "COM";
  if (s === "clases") return "CLASS";
  return "LIST";
}

/**
 * Deterministic short token from internal id (UUID or opaque string).
 */
export function adminShortIdFromInternalId(internalId: string): string {
  const raw = (internalId ?? "").trim();
  if (!raw) return "000000";
  const hex = raw.replace(/-/g, "").toUpperCase();
  if (/^[0-9A-F]+$/.test(hex) && hex.length >= 6) {
    return hex.slice(0, 6);
  }
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) + h + raw.charCodeAt(i);
    h |= 0;
  }
  const n = Math.abs(h);
  return n.toString(36).toUpperCase().slice(0, 6).padStart(6, "0");
}

export function buildAdminFallbackDisplayId(categorySlug: string, internalId: string): string {
  const prefix = adminCategoryPrefixForSlug(categorySlug);
  const short = adminShortIdFromInternalId(internalId);
  return `${prefix}-${short}`;
}

/**
 * Reads optional published/public id fields from a loose row object (legacy-safe).
 */
export function readPublishedIdFromRow(row: Record<string, unknown>): string | null {
  for (const k of PUBLISHED_ID_KEYS) {
    const v = nonEmptyString(row[k]);
    if (v) return v;
  }
  return null;
}

function mergeOwner(
  rowOwnerId: string | null,
  hints?: AdminAdOwnerHints | null,
): Pick<AdminNormalizedAd, "ownerUserId" | "ownerName" | "ownerEmail" | "ownerPhone"> {
  const ownerUserId = nonEmptyString(hints?.ownerUserId) ?? nonEmptyString(rowOwnerId);
  return {
    ownerUserId,
    ownerName: nonEmptyString(hints?.ownerName),
    ownerEmail: nonEmptyString(hints?.ownerEmail),
    ownerPhone: nonEmptyString(hints?.ownerPhone),
  };
}

function finalizeDisplayIds(
  categorySlug: string,
  internalId: string,
  publishedId: string | null,
): { publishedId: string | null; fallbackDisplayId: string; displayId: string; publicIdLabel: string } {
  const fb = buildAdminFallbackDisplayId(categorySlug, internalId);
  const pub = publishedId && publishedId.trim() ? publishedId.trim() : null;
  const displayId = pub ?? fb;
  return { publishedId: pub, fallbackDisplayId: fb, displayId, publicIdLabel: displayId };
}

export type GenericListingAdminInput = {
  id: string;
  title?: string | null;
  category?: string | null;
  status?: string | null;
  owner_id?: string | null;
  city?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
} & Record<string, unknown>;

/**
 * Normalize a `listings` row for admin (generic Clasificados).
 */
export function normalizeGenericListingForAdmin(
  row: GenericListingAdminInput,
  hints?: AdminAdOwnerHints | null,
): AdminNormalizedAd | null {
  const internalId = nonEmptyString(row.id);
  if (!internalId) return null;

  const categorySlug = nonEmptyString(row.category) ?? "unknown";
  const publishedFromRow = readPublishedIdFromRow(row as Record<string, unknown>);
  const { publishedId, fallbackDisplayId, displayId, publicIdLabel } = finalizeDisplayIds(categorySlug, internalId, publishedFromRow);
  const leonixAdId = nonEmptyString((row as Record<string, unknown>).leonix_ad_id);

  const owner = mergeOwner(nonEmptyString(row.owner_id), hints);
  const title = nonEmptyString(row.title) ?? "(sin título)";

  return {
    source: "generic",
    categorySlug,
    internalId,
    publishedId,
    leonixAdId,
    publicIdLabel,
    fallbackDisplayId,
    displayId,
    ...owner,
    title,
    slug: nonEmptyString(row.slug),
    status: nonEmptyString(row.status),
    city: nonEmptyString(row.city),
    createdAt: nonEmptyString(row.created_at),
    updatedAt: nonEmptyString(row.updated_at),
    publicUrl: `${GENERIC_ANUNCIO_PATH}/${encodeURIComponent(internalId)}`,
    adminUrl: publishedId
      ? `/admin/workspace/clasificados?q=${encodeURIComponent(publishedId)}`
      : `/admin/workspace/clasificados?q=${encodeURIComponent(internalId)}`,
    /** Seller-only; see `resolveAdminAdActions` — not staff “edit as owner”. */
    editUrl: null,
    sourceMeta: {
      table: "listings",
      hasPublishedIdColumn: publishedFromRow != null,
    },
  };
}

export type RestaurantePublicListingAdminInput = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  business_name: string;
  status?: string | null;
  owner_user_id?: string | null;
  city_canonical?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
} & Record<string, unknown>;

/**
 * Normalize a `restaurantes_public_listings` row for admin.
 */
export function normalizeRestaurantePublicListingForAdmin(
  row: RestaurantePublicListingAdminInput,
  hints?: AdminAdOwnerHints | null,
): AdminNormalizedAd | null {
  const internalId = nonEmptyString(row.id);
  const slug = nonEmptyString(row.slug);
  if (!internalId || !slug) return null;

  const categorySlug = "restaurantes";
  const publishedFromRow = readPublishedIdFromRow(row as Record<string, unknown>);
  const { publishedId, fallbackDisplayId, displayId, publicIdLabel } = finalizeDisplayIds(categorySlug, internalId, publishedFromRow);

  const owner = mergeOwner(nonEmptyString(row.owner_user_id), hints);
  const title = nonEmptyString(row.business_name) ?? "(sin nombre)";

  const publicUrl = `${RESTAURANT_PUBLIC_PATH}/${encodeURIComponent(slug)}?lang=es`;
  const leonix = nonEmptyString(row.leonix_ad_id);
  const adminUrl = leonix
    ? `/admin/workspace/clasificados/restaurantes?leonix_ad_id=${encodeURIComponent(leonix)}`
    : `/admin/workspace/clasificados/restaurantes?slug=${encodeURIComponent(slug)}`;

  return {
    source: "restaurantes",
    categorySlug,
    internalId,
    publishedId,
    leonixAdId: leonix,
    publicIdLabel,
    fallbackDisplayId,
    displayId,
    ...owner,
    title,
    slug,
    status: nonEmptyString(row.status),
    city: nonEmptyString(row.city_canonical),
    createdAt: nonEmptyString(row.published_at),
    updatedAt: nonEmptyString(row.updated_at),
    publicUrl,
    adminUrl,
    editUrl: null,
    sourceMeta: {
      table: "restaurantes_public_listings",
      hasPublishedIdColumn: publishedFromRow != null,
      draftListingId: nonEmptyString((row as { draft_listing_id?: unknown }).draft_listing_id),
    },
  };
}

export type ServiciosPublicListingAdminInput = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  business_name: string;
  city?: string | null;
  listing_status?: string | null;
  owner_user_id?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
} & Record<string, unknown>;

/**
 * Normalize a `servicios_public_listings` row for admin (shape aligned with `ServiciosPublicAdminRow`).
 */
export function normalizeServiciosPublicListingForAdmin(
  row: ServiciosPublicListingAdminInput,
  hints?: AdminAdOwnerHints | null,
): AdminNormalizedAd | null {
  const internalId = nonEmptyString(row.id);
  const slug = nonEmptyString(row.slug);
  if (!internalId || !slug) return null;

  const categorySlug = "servicios";
  const publishedFromRow = readPublishedIdFromRow(row as Record<string, unknown>);
  const { publishedId, fallbackDisplayId, displayId, publicIdLabel } = finalizeDisplayIds(categorySlug, internalId, publishedFromRow);

  const owner = mergeOwner(nonEmptyString(row.owner_user_id), hints);
  const title = nonEmptyString(row.business_name) ?? "(sin nombre)";

  const publicUrl = `${SERVICIOS_PUBLIC_PATH}/${encodeURIComponent(slug)}?lang=es`;
  const leonix = nonEmptyString(row.leonix_ad_id);
  const adminUrl = leonix
    ? `/admin/workspace/clasificados/servicios?leonix_ad_id=${encodeURIComponent(leonix)}`
    : `/admin/workspace/clasificados/servicios?slug=${encodeURIComponent(slug)}`;

  return {
    source: "servicios",
    categorySlug,
    internalId,
    publishedId,
    leonixAdId: leonix,
    publicIdLabel,
    fallbackDisplayId,
    displayId,
    ...owner,
    title,
    slug,
    status: nonEmptyString(row.listing_status),
    city: nonEmptyString(row.city),
    createdAt: nonEmptyString(row.published_at),
    updatedAt: nonEmptyString(row.updated_at),
    publicUrl,
    adminUrl,
    editUrl: null,
    sourceMeta: {
      table: "servicios_public_listings",
      hasPublishedIdColumn: publishedFromRow != null,
    },
  };
}

export type EmpleosPublicListingAdminInput = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  title: string;
  company_name: string;
  lifecycle_status?: string | null;
  lane?: string | null;
  owner_user_id?: string | null;
  city?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  lang?: string | null;
} & Record<string, unknown>;

function empleosPublicPathWithLang(slug: string, lang: string | null | undefined): string {
  const l = (lang ?? "es").trim().toLowerCase() === "en" ? "en" : "es";
  const base = `${EMPLEOS_PUBLIC_PATH}/${encodeURIComponent(slug)}`;
  return `${base}?lang=${l}`;
}

/**
 * Normalize an `empleos_public_listings` row for admin (workspace + public job detail).
 */
export function normalizeEmpleosPublicListingForAdmin(
  row: EmpleosPublicListingAdminInput,
  hints?: AdminAdOwnerHints | null,
): AdminNormalizedAd | null {
  const internalId = nonEmptyString(row.id);
  const slug = nonEmptyString(row.slug);
  if (!internalId || !slug) return null;

  const categorySlug = "empleos";
  const publishedFromRow = readPublishedIdFromRow(row as Record<string, unknown>);
  const { publishedId, fallbackDisplayId, displayId, publicIdLabel } = finalizeDisplayIds(categorySlug, internalId, publishedFromRow);

  const owner = mergeOwner(nonEmptyString(row.owner_user_id), hints);
  const titleBase = nonEmptyString(row.title) ?? "(sin título)";
  const company = nonEmptyString(row.company_name);
  const title = company ? `${titleBase} · ${company}` : titleBase;

  const lang = nonEmptyString(row.lang);
  const publicUrl = empleosPublicPathWithLang(slug, lang);
  const leonixQ = nonEmptyString(row.leonix_ad_id);
  const adminUrl = leonixQ
    ? `/admin/workspace/clasificados/empleos?q=${encodeURIComponent(leonixQ)}`
    : `/admin/workspace/clasificados/empleos?q=${encodeURIComponent(internalId)}`;

  return {
    source: "empleos",
    categorySlug,
    internalId,
    publishedId,
    leonixAdId: leonixQ,
    publicIdLabel,
    fallbackDisplayId,
    displayId,
    ...owner,
    title,
    slug,
    status: nonEmptyString(row.lifecycle_status),
    city: nonEmptyString(row.city),
    createdAt: nonEmptyString(row.published_at) ?? nonEmptyString(row.updated_at),
    updatedAt: nonEmptyString(row.updated_at),
    publicUrl,
    adminUrl,
    editUrl: null,
    sourceMeta: {
      table: "empleos_public_listings",
      hasPublishedIdColumn: publishedFromRow != null,
      lane: nonEmptyString(row.lane),
      lang: (lang ?? "es").trim().toLowerCase() === "en" ? "en" : "es",
    },
  };
}

/**
 * Normalize an `autos_classifieds_listings` row for admin (paid Autos vertical).
 */
export function normalizeAutosClassifiedsListingForAdmin(
  row: AutosClassifiedsListingRow,
  hints?: AdminAdOwnerHints | null,
): AdminNormalizedAd | null {
  const internalId = nonEmptyString(row.id);
  if (!internalId) return null;

  const categorySlug = "autos";
  const publishedFromRow = readPublishedIdFromRow(row as unknown as Record<string, unknown>);
  const { publishedId, fallbackDisplayId, displayId, publicIdLabel } = finalizeDisplayIds(categorySlug, internalId, publishedFromRow);

  const owner = mergeOwner(nonEmptyString(row.owner_user_id), hints);
  const dash = autosClassifiedsRowToDashboardRow(row);
  const title = (dash.title ?? "").trim() ? dash.title.trim() : "(sin título)";

  const lang = row.lang === "en" ? "en" : "es";
  const publicUrl = `/clasificados/autos/vehiculo/${encodeURIComponent(internalId)}?lang=${lang}`;
  const lx = nonEmptyString(row.leonix_ad_id);
  const adminUrl = `/admin/workspace/clasificados/autos?q=${encodeURIComponent(lx ?? internalId)}`;

  return {
    source: "autos",
    categorySlug,
    internalId,
    publishedId,
    leonixAdId: lx,
    publicIdLabel,
    fallbackDisplayId,
    displayId,
    ...owner,
    title,
    slug: null,
    status: nonEmptyString(row.status),
    city: (dash.city ?? "").trim() ? dash.city.trim() : null,
    createdAt: nonEmptyString(row.published_at) ?? nonEmptyString(row.created_at),
    updatedAt: nonEmptyString(row.updated_at),
    publicUrl,
    adminUrl,
    editUrl: null,
    sourceMeta: {
      table: "autos_classifieds_listings",
      hasPublishedIdColumn: publishedFromRow != null,
      lane: nonEmptyString(row.lane),
    },
  };
}

const RESTAURANT_URL_RE = /\/clasificados\/restaurantes\/([^/?#]+)/i;

/**
 * Extract restaurant slug from a pasted public URL or return trimmed input if it already looks like a slug.
 */
export function extractRestauranteSlugFromPublicUrlOrSlug(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  const m = raw.match(RESTAURANT_URL_RE);
  if (m?.[1]) return decodeURIComponent(m[1]).trim() || null;
  if (raw.includes("/")) return null;
  return raw;
}
