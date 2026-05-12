/**
 * Discovery ordering for Servicios public rows — **no server-only imports** so client bundles
 * (e.g. `ServiciosHorizontalResultCard`) can share the same comparator as SSR loaders.
 *
 * Mirrors SQL `coalesce(republished_at, published_at, updated_at)` when `republished_at` is absent
 * (older / minimal `servicios_public_listings` schemas).
 */

/** PostgREST `select()` — columns on migrated `servicios_public_listings` (incl. `leonix_ad_id`, `id`). Requires migration `20260506150000_leonix_ad_id_all_classifieds.sql` (or equivalent). */
export const SERVICIOS_PUBLIC_LISTING_SELECT =
  "id, slug, leonix_ad_id, business_name, city, published_at, updated_at, profile_json, leonix_verified, internal_group, listing_status, owner_user_id";

export type ServiciosPublicListingSortInput = {
  slug: string;
  published_at: string;
  updated_at?: string | null;
  republished_at?: string | null;
};

/** Stable key for Like/Save/Share: Leonix ad id, else row UUID, else slug (dev-only fallback). */
export function serviciosEngagementListingKey(row: {
  leonix_ad_id?: string | null;
  id?: string | null;
  slug: string;
}): string {
  const ad = (row.leonix_ad_id ?? "").trim();
  if (ad) return ad;
  const id = (row.id ?? "").trim();
  if (id) return id;
  return (row.slug ?? "").trim();
}

/**
 * Footnote display value only — never UUID-shaped values (those are row ids, not public ad numbers).
 * Shows trimmed `leonix_ad_id` when it looks like a classifieds ad code (e.g. SERV-2026-000001).
 */
export function serviciosPublicFooterLeonixAdId(leonixAdId: string | null | undefined): string | null {
  const s = (leonixAdId ?? "").trim();
  if (!s) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) return null;
  return s;
}

export function serviciosPublicListingDiscoverySortMs(r: ServiciosPublicListingSortInput): number {
  const rep = r.republished_at?.trim();
  const pub = r.published_at?.trim();
  const upd = r.updated_at?.trim();
  const iso =
    rep && rep.length > 0 ? rep : pub && pub.length > 0 ? pub : upd && upd.length > 0 ? upd : "";
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

export function compareServiciosPublicDiscoveryNewestFirst(a: ServiciosPublicListingSortInput, b: ServiciosPublicListingSortInput): number {
  const da = serviciosPublicListingDiscoverySortMs(a);
  const db = serviciosPublicListingDiscoverySortMs(b);
  if (db !== da) return db - da;
  return a.slug.localeCompare(b.slug, "en");
}
