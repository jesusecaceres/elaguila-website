/**
 * Discovery ordering for Servicios public rows — **no server-only imports** so client bundles
 * (e.g. `ServiciosHorizontalResultCard`) can share the same comparator as SSR loaders.
 *
 * Mirrors SQL `coalesce(republished_at, published_at, updated_at)` when `republished_at` is absent
 * (older / minimal `servicios_public_listings` schemas).
 */

/** PostgREST `select()` fragment — only columns present on all production `servicios_public_listings`. */
export const SERVICIOS_PUBLIC_LISTING_SELECT =
  "slug, business_name, city, published_at, updated_at, profile_json, leonix_verified, internal_group, listing_status, owner_user_id";

export type ServiciosPublicListingSortInput = {
  slug: string;
  published_at: string;
  updated_at?: string | null;
  republished_at?: string | null;
};

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
