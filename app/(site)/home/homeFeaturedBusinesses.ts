/**
 * Gate HOME-4 — Home-only featured business slots (no DB/admin in this gate).
 * Populate entries only with real confirmed advertisers.
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
