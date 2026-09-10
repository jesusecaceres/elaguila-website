import "server-only";

/**
 * Gate COMIDA-LOCAL-2 — Related Listings for the Comida Local public vitrina.
 *
 * Derived entirely from REAL published listing data and REAL Comida Local relationships. There is
 * no ranking engine here and no recommendation model: candidates come from the same canonical
 * published reader the landing/results page uses (`listPublishedComidaLocalListings`, already
 * `.eq("status","published")` and ordered by `published_at` desc), called with empty filters so it
 * returns the unfiltered published pool.
 *
 * Scored on the three relationships this category actually has — each one a column the LIVE results
 * filter itself matches on (`filterComidaLocalPublicRows`):
 *
 *   1. FOOD TYPE — `food_type`, plus `food_type_custom` when the seller picked "otro", the same
 *      column the results `foodType=` filter matches on.
 *   2. LOCATION — `city_canonical` (falling back to `city_display`), the same values the results
 *      `city=` filter matches on.
 *   3. SERVICE MODE — `service_options`, the same column the results `service=` filter matches on.
 *
 * Nothing is fabricated: a listing with no shared food type and no shared city+service is simply not
 * related, and the caller renders a real browse link instead of filler (the same
 * never-a-broken-promise shape the Servicios, Restaurantes and En Venta rails established).
 *
 * NOT USED, deliberately:
 *   - `package_tier`, `payment_status` and any entitlement/placement signal — relatedness is an
 *     editorial relationship, not an ad slot. This category has no `promoted` column at all, and no
 *     paid-placement overlay is consulted or introduced.
 *   - FIND ME TODAY (`location_note` / `location_url` / `locationUpdatedAt`) — the Gate
 *     COMIDA-LOCAL-1 temporary location is a 24-hour-scoped value. Relating two listings by where
 *     their owners happened to be today would produce a rail whose membership silently changes as
 *     notes expire, and would leak an expired location's influence into a page that must not show
 *     it. Permanent facets only.
 *   - `businessAddressLine` — private by default and never a public relationship key.
 */
import {
  listPublishedComidaLocalListings,
} from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import { emptyComidaLocalResultsFilters } from "@/app/lib/clasificados/comida-local/comidaLocalResultsUrl";
import type { ComidaLocalPublicListingRow } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";

/** Never more than one short rail's worth. */
export const COMIDA_LOCAL_RELATED_MAX = 3;

function token(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

/** The city value the results filter would match on, normalized for exact comparison here. */
function cityToken(row: ComidaLocalPublicListingRow): string {
  return token(row.city_canonical) || token(row.city_display);
}

/**
 * Every food token a row publishes. `food_type === "otro"` carries its real meaning in
 * `food_type_custom`, so two "otro" rows are only the same food when their custom text agrees —
 * matching on the bare token "otro" would relate pupusas to birria.
 */
function foodTokens(row: ComidaLocalPublicListingRow): Set<string> {
  const base = token(row.food_type);
  const out = new Set<string>();
  if (base && base !== "otro") out.add(base);
  const custom = token(row.food_type_custom);
  if (custom) out.add(`custom:${custom}`);
  return out;
}

function serviceTokens(row: ComidaLocalPublicListingRow): Set<string> {
  const raw = row.service_options;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((v): v is string => typeof v === "string").map(token).filter(Boolean));
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const t of a) if (t && b.has(t)) return true;
  return false;
}

/**
 * Score is a small, explicit tier — not a tuned weight:
 *   3 = same food AND same city          (strongest real relationship)
 *   2 = same food, anywhere              (same food)
 *   1 = same city AND a shared service mode (local alternative you can actually get the same way)
 *   0 = no real relationship -> excluded entirely
 *
 * Same city ALONE is deliberately not a relationship: for a category whose sellers are stands,
 * pop-ups and mobile vendors spread across a whole metro, "another food seller somewhere in San
 * José" is not something a reader would recognize as related. Requiring a shared service mode
 * alongside the city keeps tier 1 a real statement ("also nearby, also delivers").
 */
function relatednessScore(
  candidate: ComidaLocalPublicListingRow,
  currentFoods: Set<string>,
  currentCity: string,
  currentServices: Set<string>,
): number {
  const sameFood = intersects(currentFoods, foodTokens(candidate));
  const sameCity = Boolean(currentCity) && cityToken(candidate) === currentCity;
  const sharedService = intersects(currentServices, serviceTokens(candidate));

  if (sameFood && sameCity) return 3;
  if (sameFood) return 2;
  if (sameCity && sharedService) return 1;
  return 0;
}

export type ComidaLocalRelatedListingsResult = {
  rows: ComidaLocalPublicListingRow[];
  /** True when a real shared food type drove the matching — lets the caller title the rail honestly. */
  matchedByFood: boolean;
};

/**
 * Related published Comida Local listings for one listing, excluding itself.
 * Returns an empty array (never a fabricated filler row) when nothing genuinely relates.
 */
export async function listRelatedComidaLocalListings(
  current: ComidaLocalPublicListingRow,
  limit: number = COMIDA_LOCAL_RELATED_MAX,
): Promise<ComidaLocalRelatedListingsResult> {
  const currentFoods = foodTokens(current);
  const currentCity = cityToken(current);
  const currentServices = serviceTokens(current);

  // No facet at all to relate on — honest empty rather than "newest listings" dressed up as related.
  if (currentFoods.size === 0 && !currentCity) {
    return { rows: [], matchedByFood: false };
  }

  const listed = await listPublishedComidaLocalListings(emptyComidaLocalResultsFilters());
  if (listed.source !== "published") return { rows: [], matchedByFood: false };

  const scored: { row: ComidaLocalPublicListingRow; score: number }[] = [];
  for (const candidate of listed.rows) {
    if (candidate.id === current.id) continue;
    if (candidate.slug === current.slug) continue;
    const score = relatednessScore(candidate, currentFoods, currentCity, currentServices);
    if (score > 0) scored.push({ row: candidate, score });
  }

  // Stable: higher tier first, the reader's own published_at order preserved inside each tier.
  scored.sort((a, b) => b.score - a.score);

  const rows = scored.slice(0, Math.max(0, limit)).map((s) => s.row);
  const matchedByFood = scored.slice(0, rows.length).some((s) => s.score >= 2);
  return { rows, matchedByFood };
}
