import "server-only";

import { blueprintRowToLandingCard } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { mapRestaurantesPublicListingDbRowsToShellInventory } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  isSupabaseAdminConfigured,
  listRestaurantesPublicListingsFromDb,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import {
  selectLandingDestacadosCandidates,
  selectLandingRecientesCandidates,
} from "@/app/clasificados/restaurantes/lib/restaurantesListingExposurePolicy";
import type { RestaurantesBlueprintCard } from "@/app/clasificados/restaurantes/lib/restaurantesBlueprintTypes";

export type RestaurantesLandingInventoryMode = "live_pool" | "empty" | "inventory_unavailable";

export type RestaurantesLandingInventoryPayload = {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  mode: RestaurantesLandingInventoryMode;
  landingNote?: string;
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
};

/**
 * Landing cards: live published selection when DB is configured and non-empty;
 * otherwise empty modules + honest note. **No** blueprint/sample inventory on this path.
 */
export async function loadRestaurantesLandingInventoryForPage(): Promise<RestaurantesLandingInventoryPayload> {
  if (!isSupabaseAdminConfigured()) {
    return {
      featuredCards: [],
      recentCards: [],
      mode: "inventory_unavailable",
      landingNote:
        "Sin inventario publicado conectado: configura `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el servidor para mostrar restaurantes reales.",
      discoveryLookupRows: [],
    };
  }

  /** Large enough pool so “recientes” can reflect true newest rows in busy catalogs (still bounded). */
  const dbRows = await listRestaurantesPublicListingsFromDb(2000);
  if (dbRows.length === 0) {
    return {
      featuredCards: [],
      recentCards: [],
      mode: "empty",
      landingNote:
        "Aún no hay publicaciones: las secciones destacadas y recientes aparecerán cuando existan listados «published».",
      discoveryLookupRows: [],
    };
  }

  const shellRows = mapRestaurantesPublicListingDbRowsToShellInventory(dbRows);
  const featured = selectLandingDestacadosCandidates(shellRows).map(blueprintRowToLandingCard);
  const recent = selectLandingRecientesCandidates(shellRows).map(blueprintRowToLandingCard);
  return {
    featuredCards: featured,
    recentCards: recent,
    mode: "live_pool",
    discoveryLookupRows: shellRows,
  };
}
