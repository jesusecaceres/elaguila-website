import "server-only";

import { blueprintRowToLandingCard } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { mapRestaurantesPublicListingDbRowsToShellInventory } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  applyRestauranteLikeCountsToBlueprintRows,
} from "@/app/clasificados/restaurantes/lib/restaurantesListingEngagement";
import { fetchRestaurantesNetLikeCountsForDbRows } from "@/app/clasificados/restaurantes/lib/restaurantesListingEngagementServer";
import {
  isSupabaseAdminConfigured,
  tryListRestaurantesPublicListingsFromDb,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { hydratePublicRowsWithActivePackageEntitlements } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import {
  packageEntitlementGrantsDestacado,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
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
  const listed = await tryListRestaurantesPublicListingsFromDb(2000);
  if (!listed.ok) {
    return {
      featuredCards: [],
      recentCards: [],
      mode: "inventory_unavailable",
      landingNote: `No se pudo leer la tabla de listados: ${listed.error}`,
      discoveryLookupRows: [],
    };
  }
  if (listed.rows.length === 0) {
    return {
      featuredCards: [],
      recentCards: [],
      mode: "empty",
      landingNote:
        "Aún no hay publicaciones: las secciones destacadas y recientes aparecerán cuando existan listados «published».",
      discoveryLookupRows: [],
    };
  }

  const hydrated = await hydratePublicRowsWithActivePackageEntitlements(listed.rows, {
    category: "restaurantes",
    listingSource: "restaurantes_public_listings",
  });
  const rowsForMap = hydrated.map((row) => {
    const summary = resolveListingPlacementEntitlement({
      category: "restaurantes",
      listing: row as Record<string, unknown>,
    });
    return { ...row, promoted: packageEntitlementGrantsDestacado(summary) };
  });
  const mapped = mapRestaurantesPublicListingDbRowsToShellInventory(rowsForMap);
  const likeMap = await fetchRestaurantesNetLikeCountsForDbRows(rowsForMap);
  const shellRows = applyRestauranteLikeCountsToBlueprintRows(mapped, likeMap);
  const featured = selectLandingDestacadosCandidates(shellRows).map(blueprintRowToLandingCard);
  const recent = selectLandingRecientesCandidates(shellRows).map(blueprintRowToLandingCard);
  return {
    featuredCards: featured,
    recentCards: recent,
    mode: "live_pool",
    discoveryLookupRows: shellRows,
  };
}
