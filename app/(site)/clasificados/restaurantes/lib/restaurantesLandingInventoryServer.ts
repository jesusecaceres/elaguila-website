import "server-only";

import {
  blueprintRowToLandingCard,
  RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
} from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import {
  mapDbRowsToPublicResultsRows,
  mapPublicResultsRowsToShellInventory,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  isSupabaseAdminConfigured,
  listRestaurantesPublicListingsFromDb,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import {
  selectLandingDestacadosCandidates,
  selectLandingRecientesCandidates,
} from "@/app/clasificados/restaurantes/lib/restaurantesListingExposurePolicy";
import type { RestaurantesBlueprintCard } from "@/app/clasificados/restaurantes/lib/restaurantesBlueprintTypes";

export type RestaurantesLandingInventoryMode = "live_pool" | "demo_editorial";

export type RestaurantesLandingInventoryPayload = {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  mode: RestaurantesLandingInventoryMode;
  /** Optional honesty strip under hero modules */
  landingNote?: string;
  /** Rows used to resolve featured/recent card clicks → results deep links + public slugs. */
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
};

/**
 * Featured + recientes cards for the landing page.
 * When published inventory exists, selection uses the same exposure helpers as blueprint (mixed / time-ordered).
 * Otherwise falls back to blueprint editorial pool (design continuity).
 */
export async function loadRestaurantesLandingInventoryForPage(): Promise<RestaurantesLandingInventoryPayload> {
  if (!isSupabaseAdminConfigured()) {
    const { getRestaurantesBlueprintLandingFeatured, getRestaurantesBlueprintLandingRecent } = await import(
      "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData"
    );
    return {
      featuredCards: getRestaurantesBlueprintLandingFeatured(),
      recentCards: getRestaurantesBlueprintLandingRecent(),
      mode: "demo_editorial",
      landingNote:
        "Destacados y recientes de muestra (diseño). Resultados y fichas públicas usan datos reales cuando Supabase está configurado.",
      discoveryLookupRows: RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
    };
  }

  const dbRows = await listRestaurantesPublicListingsFromDb(200);
  if (dbRows.length === 0) {
    const { getRestaurantesBlueprintLandingFeatured, getRestaurantesBlueprintLandingRecent } = await import(
      "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData"
    );
    return {
      featuredCards: getRestaurantesBlueprintLandingFeatured(),
      recentCards: getRestaurantesBlueprintLandingRecent(),
      mode: "demo_editorial",
      landingNote:
        "Sin publicaciones aún: se muestran tarjetas editoriales de muestra. Publica un restaurante para reemplazarlas con datos vivos.",
      discoveryLookupRows: RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
    };
  }

  const shellRows = mapPublicResultsRowsToShellInventory(mapDbRowsToPublicResultsRows(dbRows));
  const featured = selectLandingDestacadosCandidates(shellRows).map(blueprintRowToLandingCard);
  const recent = selectLandingRecientesCandidates(shellRows).map(blueprintRowToLandingCard);
  return {
    featuredCards: featured,
    recentCards: recent,
    mode: "live_pool",
    discoveryLookupRows: shellRows,
  };
}
