import "server-only";

/**
 * Gate RESTAURANTES-2 — Related Listings for the Restaurantes public vitrina.
 *
 * Derived entirely from REAL published listing data and REAL Restaurantes relationships. There is
 * no ranking engine here and no recommendation model: candidates come from the same canonical
 * published reader the results page uses (`tryListRestaurantesPublicListingsFromDb`, already
 * `.eq("status","published")` and ordered by `updated_at`), and are scored by two relationships
 * this category actually has:
 *
 *   1. CUISINE / TYPE — `primary_cuisine`, `secondary_cuisine` and `business_type`, the same
 *      columns the results `cuisine=` and `biz=` filters match on.
 *   2. LOCATION — `city_canonical`, then `zip_code`, the same columns the results location filter
 *      matches on.
 *
 * Nothing is fabricated: a listing with no shared cuisine/type and no shared location is simply not
 * related, and the caller renders a real browse link instead of an empty section (the same
 * never-a-broken-promise shape the Servicios and En Venta rails established).
 *
 * Ordering within a score tier is the reader's own order — this module never invents a secondary
 * ranking signal, and deliberately does NOT consult `promoted`, entitlement tier or
 * `resolveCanonicalVisibilityBucketWeights`: relatedness is an editorial relationship, not an ad
 * slot. That is also why this file does not reuse `restaurantesResultsInventoryServer`, which
 * exists specifically to apply that paid-placement overlay.
 */
import {
  tryListRestaurantesPublicListingsFromDb,
  type RestaurantesPublicListingDbRow,
} from "./restaurantesPublicListingsServer";

/** Bounded candidate pool — the same order of magnitude as the other categories' related readers. */
const CANDIDATE_POOL = 120;

/** Never more than one short rail's worth. */
export const RESTAURANTES_RELATED_MAX = 3;

function token(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

/** Every cuisine-ish token a row publishes, so "same food" matches on either cuisine slot. */
function cuisineTokens(row: RestaurantesPublicListingDbRow): Set<string> {
  return new Set([token(row.primary_cuisine), token(row.secondary_cuisine)].filter(Boolean));
}

function sharesCuisine(a: Set<string>, b: Set<string>): boolean {
  for (const t of a) if (t && b.has(t)) return true;
  return false;
}

/**
 * Score is a small, explicit tier — not a tuned weight:
 *   4 = same cuisine AND same city        (strongest real relationship)
 *   3 = same cuisine AND same ZIP         (same food, walkable)
 *   2 = same cuisine, anywhere            (same food)
 *   1 = same city AND same business type  (local alternative of the same kind)
 *   0 = no real relationship -> excluded entirely
 *
 * Same city ALONE is deliberately not a relationship for this category: "another restaurant
 * somewhere in San José" is not something a reader would recognize as related, whereas for a
 * service provider (Servicios) locality alone genuinely is the relationship.
 */
function relatednessScore(
  candidate: RestaurantesPublicListingDbRow,
  currentCuisines: Set<string>,
  currentCity: string,
  currentZip: string,
  currentBizType: string,
): number {
  const sameCuisine = sharesCuisine(currentCuisines, cuisineTokens(candidate));
  const sameCity = Boolean(currentCity) && token(candidate.city_canonical) === currentCity;
  const sameZip = Boolean(currentZip) && token(candidate.zip_code) === currentZip;
  const sameBizType = Boolean(currentBizType) && token(candidate.business_type) === currentBizType;

  if (sameCuisine && sameCity) return 4;
  if (sameCuisine && sameZip) return 3;
  if (sameCuisine) return 2;
  if (sameCity && sameBizType) return 1;
  return 0;
}

export type RestaurantesRelatedListingsResult = {
  rows: RestaurantesPublicListingDbRow[];
  /** True when a real shared cuisine drove the matching — lets the caller title the rail honestly. */
  matchedByCuisine: boolean;
};

/**
 * Related published Restaurantes listings for one listing, excluding itself.
 * Returns an empty array (never a fabricated filler row) when nothing genuinely relates.
 */
export async function listRelatedRestaurantesListings(
  current: RestaurantesPublicListingDbRow,
  limit: number = RESTAURANTES_RELATED_MAX,
): Promise<RestaurantesRelatedListingsResult> {
  const currentCuisines = cuisineTokens(current);
  const currentCity = token(current.city_canonical);
  const currentZip = token(current.zip_code);
  const currentBizType = token(current.business_type);

  // No facet at all to relate on — honest empty rather than "newest listings" dressed up as related.
  if (currentCuisines.size === 0 && !currentCity) {
    return { rows: [], matchedByCuisine: false };
  }

  const listed = await tryListRestaurantesPublicListingsFromDb(CANDIDATE_POOL);
  if (!listed.ok) return { rows: [], matchedByCuisine: false };

  const scored: { row: RestaurantesPublicListingDbRow; score: number }[] = [];
  for (const candidate of listed.rows) {
    if (candidate.id === current.id) continue;
    if (candidate.slug === current.slug) continue;
    const score = relatednessScore(candidate, currentCuisines, currentCity, currentZip, currentBizType);
    if (score > 0) scored.push({ row: candidate, score });
  }

  // Stable: higher tier first, the reader's own order preserved inside each tier.
  scored.sort((a, b) => b.score - a.score);

  const rows = scored.slice(0, Math.max(0, limit)).map((s) => s.row);
  const matchedByCuisine = scored.slice(0, rows.length).some((s) => s.score >= 2);
  return { rows, matchedByCuisine };
}
