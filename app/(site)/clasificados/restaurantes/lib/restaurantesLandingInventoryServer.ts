import "server-only";

import {
  blueprintRowToLandingCard,
  RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
} from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
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

export type RestaurantesLandingInventoryMode = "live_pool" | "empty" | "explicit_demo" | "inventory_unavailable";

export type RestaurantesLandingInventoryPayload = {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  mode: RestaurantesLandingInventoryMode;
  landingNote?: string;
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
};

function allowBlueprintDemo(): boolean {
  return process.env.RESTAURANTES_USE_BLUEPRINT_INVENTORY === "true";
}

/**
 * Landing cards: live published selection when DB is configured and non-empty;
 * otherwise empty cards + honest note (no silent blueprint unless explicit demo env).
 */
export async function loadRestaurantesLandingInventoryForPage(): Promise<RestaurantesLandingInventoryPayload> {
  if (!isSupabaseAdminConfigured()) {
    if (allowBlueprintDemo()) {
      const { getRestaurantesBlueprintLandingFeatured, getRestaurantesBlueprintLandingRecent } = await import(
        "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData"
      );
      return {
        featuredCards: getRestaurantesBlueprintLandingFeatured(),
        recentCards: getRestaurantesBlueprintLandingRecent(),
        mode: "explicit_demo",
        landingNote:
          "Módulos destacados/recientes en modo demostración explícito (`RESTAURANTES_USE_BLUEPRINT_INVENTORY=true`).",
        discoveryLookupRows: RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
      };
    }
    return {
      featuredCards: [],
      recentCards: [],
      mode: "inventory_unavailable",
      landingNote:
        "Sin inventario publicado conectado: configura Supabase con rol de servicio para mostrar restaurantes reales en portada y resultados.",
      discoveryLookupRows: [],
    };
  }

  const dbRows = await listRestaurantesPublicListingsFromDb(200);
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
