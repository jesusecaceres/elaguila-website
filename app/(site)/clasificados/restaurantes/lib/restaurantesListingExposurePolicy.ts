/**
 * Fair exposure policy for Restaurantes discovery (landing + results).
 *
 * **Future:** Swap blueprint rows for published `RestauranteListingApplication` rows mapped via
 * `adapters/restauranteApplicationToDiscoveryRow`. Ranking inputs: `publishedAt`, `planTier`,
 * `boosted`, `featured`, `externalRatingValue`, organic quality signals.
 *
 * @see `restaurantesDiscoveryContract.ts` — URL state is separate from this ranking logic.
 */

import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

/** @public Caps for mixed destacados carousel (landing). */
export const RESTAURANTES_LANDING_DESTACADOS_MAX = 3;
/** @public Newest-first cap for “recientes” (landing). */
export const RESTAURANTES_LANDING_RECIENTES_MAX = 3;
/** @public Promoted strip on results — visibility without crowding organic grid. */
export const RESTAURANTES_RESULTS_PROMOTED_BAND_MAX = 3;

const LANDING_DESTACADOS_MAX = RESTAURANTES_LANDING_DESTACADOS_MAX;
const LANDING_RECIENTES_MAX = RESTAURANTES_LANDING_RECIENTES_MAX;
const PROMOTED_BAND_MAX = RESTAURANTES_RESULTS_PROMOTED_BAND_MAX;

/** Organic score: rating + light recency (demo). */
function organicScore(row: RestaurantesPublicBlueprintRow): number {
  const t = new Date(row.listedAt).getTime();
  return row.rating * 10 + t / 1e12;
}

/**
 * **Destacados (landing):** mixed slots — not pay-only.
 * - Up to two slots favor `promoted` (paid / featured-eligible stand-in).
 * - Remaining slots: strong organic listings, with light cuisine diversity when possible.
 */
export function selectLandingDestacadosCandidates(rows: RestaurantesPublicBlueprintRow[]): RestaurantesPublicBlueprintRow[] {
  const promoted = rows.filter((r) => r.promoted).sort((a, b) => organicScore(b) - organicScore(a));
  const organic = rows.filter((r) => !r.promoted).sort((a, b) => organicScore(b) - organicScore(a));

  const out: RestaurantesPublicBlueprintRow[] = [];
  const seen = new Set<string>();
  const push = (r: RestaurantesPublicBlueprintRow) => {
    if (out.length >= LANDING_DESTACADOS_MAX || seen.has(r.id)) return;
    seen.add(r.id);
    out.push(r);
  };

  for (const r of promoted.slice(0, 2)) push(r);

  for (const r of organic) {
    if (out.length >= LANDING_DESTACADOS_MAX) break;
    const cuisines = new Set(out.map((x) => x.primaryCuisineKey));
    if (!cuisines.has(r.primaryCuisineKey)) push(r);
  }
  for (const r of organic) {
    if (out.length >= LANDING_DESTACADOS_MAX) break;
    push(r);
  }
  for (const r of promoted) {
    if (out.length >= LANDING_DESTACADOS_MAX) break;
    push(r);
  }

  return out;
}

/**
 * **Recientes (landing):** strictly time-ordered — newest `listedAt` first.
 * Rotates automatically as new listings publish (same pool, sorted).
 */
export function selectLandingRecientesCandidates(rows: RestaurantesPublicBlueprintRow[]): RestaurantesPublicBlueprintRow[] {
  return [...rows]
    .sort((a, b) => b.listedAt.localeCompare(a.listedAt))
    .slice(0, LANDING_RECIENTES_MAX);
}

/**
 * **Results promoted band:** paid/boosted signal (`promoted`) gets visibility, capped so organic grid stays primary.
 */
export function selectPromotedResultsCandidates(
  sortedFiltered: RestaurantesPublicBlueprintRow[],
  max: number = PROMOTED_BAND_MAX,
): RestaurantesPublicBlueprintRow[] {
  return sortedFiltered.filter((r) => r.promoted).slice(0, max);
}
