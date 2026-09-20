/** Next.js cache tags for Viajes public inventory + staged offer detail (moderation invalidation). */

export const VIAJES_CACHE_TAG_BROWSE = "viajes-public-browse";

export function viajesOfferDetailCacheTag(slug: string): string {
  return `viajes-offer-detail:${slug.trim().toLowerCase()}`;
}
