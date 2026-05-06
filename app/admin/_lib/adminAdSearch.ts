/**
 * Pure helpers for admin category queue search (Phase 4). Safe to import from client or server.
 */

export const ADMIN_QUEUE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LEONIX_AD_ID_RE = /^[A-Z]{2,5}-\d{4}-\d{6}$/i;

export function normalizeAdminQueueSearchInput(raw: string): string {
  return (raw ?? "").trim();
}

export function adminQueueIsUuid(s: string): boolean {
  return ADMIN_QUEUE_UUID_RE.test((s ?? "").trim());
}

export function adminQueueLooksLikeLeonixAdId(s: string): boolean {
  return LEONIX_AD_ID_RE.test((s ?? "").trim());
}

export function adminQueueNormalizeLeonixAdId(s: string): string | null {
  const t = (s ?? "").trim();
  if (!adminQueueLooksLikeLeonixAdId(t)) return null;
  return t.toUpperCase();
}

/** Digits only — useful for loose phone matching. */
export function adminQueueNormalizePhoneDigits(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

export function adminQueueExtractRestauranteSlugFromUrl(input: string): string | null {
  const m = (input ?? "").trim().match(/\/clasificados\/restaurantes\/([^/?#]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]).trim() || null : null;
}

export function adminQueueExtractServiciosSlugFromUrl(input: string): string | null {
  const m = (input ?? "").trim().match(/\/clasificados\/servicios\/([^/?#]+)/i);
  if (!m?.[1]) return null;
  const s = decodeURIComponent(m[1]).trim();
  if (!s) return null;
  const low = s.toLowerCase();
  if (low === "resultados" || low === "publicar") return null;
  return s;
}

export function adminQueueExtractEmpleosSlugFromUrl(input: string): string | null {
  const m = (input ?? "").trim().match(/\/clasificados\/empleos\/([^/?#]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]).trim() || null : null;
}

export function adminQueueExtractAutosListingIdFromUrl(input: string): string | null {
  const m = (input ?? "").trim().match(/\/clasificados\/autos\/vehiculo\/([^/?#]+)/i);
  if (!m?.[1]) return null;
  const id = decodeURIComponent(m[1]).trim();
  return adminQueueIsUuid(id) ? id : null;
}

export type EmpleosAdminQueueRowLite = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  owner_user_id: string | null;
  city?: string | null;
  state?: string | null;
  /** Present when `empleos_public_listings.leonix_ad_id` exists in DB. */
  leonix_ad_id?: string | null;
};

export function empleosRowMatchesAdminQueueSearch(
  row: EmpleosAdminQueueRowLite,
  qRawTrimmed: string,
  profileOwnerIds: ReadonlySet<string>,
): boolean {
  const q = normalizeAdminQueueSearchInput(qRawTrimmed);
  if (!q) return true;
  const n = q.toLowerCase();
  if (row.id.toLowerCase() === n || row.id.toLowerCase().includes(n)) return true;
  if (row.owner_user_id) {
    if (row.owner_user_id === q || row.owner_user_id.toLowerCase().includes(n)) return true;
    if (profileOwnerIds.size > 0 && profileOwnerIds.has(row.owner_user_id)) return true;
  }
  if (row.slug.toLowerCase().includes(n)) return true;
  if (row.title.toLowerCase().includes(n)) return true;
  if (row.company_name.toLowerCase().includes(n)) return true;
  if (row.city && row.city.toLowerCase().includes(n)) return true;
  if (row.state && row.state.toLowerCase().includes(n)) return true;
  const slugFromUrl = adminQueueExtractEmpleosSlugFromUrl(q);
  if (slugFromUrl && row.slug.toLowerCase() === slugFromUrl.toLowerCase()) return true;
  if (adminQueueIsUuid(q) && row.id === q) return true;
  const nlx = adminQueueNormalizeLeonixAdId(q);
  if (nlx && row.leonix_ad_id && String(row.leonix_ad_id).toUpperCase() === nlx) return true;
  return false;
}

export type AutosAdminQueueRowLite = {
  id: string;
  owner_user_id: string;
  title: string;
  city: string;
  /** When `autos_classifieds_listings.leonix_ad_id` exists. */
  leonix_ad_id?: string | null;
  /** Lowercased haystack (make, model, VIN, etc.). */
  vehicleTextBlob?: string;
};

export function autosRowMatchesAdminQueueSearch(
  row: AutosAdminQueueRowLite,
  qRawTrimmed: string,
  profileOwnerIds: ReadonlySet<string>,
): boolean {
  const q = normalizeAdminQueueSearchInput(qRawTrimmed);
  if (!q) return true;
  const n = q.toLowerCase();
  if (row.id === q || row.id.toLowerCase() === n || row.id.toLowerCase().startsWith(n)) return true;
  const urlId = adminQueueExtractAutosListingIdFromUrl(q);
  if (urlId && row.id === urlId) return true;
  if (row.owner_user_id === q || row.owner_user_id.toLowerCase().includes(n)) return true;
  if (profileOwnerIds.size > 0 && profileOwnerIds.has(row.owner_user_id)) return true;
  if (row.title.toLowerCase().includes(n)) return true;
  if (row.city.toLowerCase().includes(n)) return true;
  if (row.vehicleTextBlob && row.vehicleTextBlob.includes(n)) return true;
  const nlx = adminQueueNormalizeLeonixAdId(q);
  if (nlx && row.leonix_ad_id && String(row.leonix_ad_id).toUpperCase() === nlx) return true;
  if (adminQueueIsUuid(q) && row.id === q) return true;
  return false;
}
