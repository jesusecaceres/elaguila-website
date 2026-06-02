/**
 * Gate HOME-5 — Home-only featured business slots (no DB/admin).
 * Core package: 5 premium slots; up to 7 when populated. Real advertisers only.
 */

export type HomeFeaturedBusiness = {
  name: string;
  category: string;
  imageSrc: string;
  href: string;
  location: string;
  tagline: string;
  featured: boolean;
};

/** Intended premium package size */
export const CORE_HOME_FEATURED_SLOTS = 5;

/** Hard cap when more advertisers are confirmed */
export const MAX_HOME_FEATURED_BUSINESSES = 7;

/** Default empty — render only populated rows. */
export const HOME_FEATURED_BUSINESSES: HomeFeaturedBusiness[] = [];

export function getPopulatedFeaturedBusinesses(
  source: HomeFeaturedBusiness[] = HOME_FEATURED_BUSINESSES
): HomeFeaturedBusiness[] {
  return source
    .filter((b) => b.featured && b.name.trim().length > 0 && b.href.trim().length > 0)
    .slice(0, MAX_HOME_FEATURED_BUSINESSES);
}
