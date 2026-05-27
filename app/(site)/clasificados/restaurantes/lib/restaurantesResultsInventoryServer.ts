import "server-only";

import { mapRestaurantesPublicListingDbRowsToShellInventory } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  applyRestauranteLikeCountsToBlueprintRows,
} from "@/app/clasificados/restaurantes/lib/restaurantesListingEngagement";
import { fetchRestaurantesNetLikeCountsForDbRows } from "@/app/clasificados/restaurantes/lib/restaurantesListingEngagementServer";
import {
  isSupabaseAdminConfigured,
  tryListRestaurantesPublicListingsFromDb,
  type RestaurantesPublicListingDbRow,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { overlayActiveEntitlementsForRestaurantesResults } from "./restaurantesEntitlementOverlay";
import {
  packageEntitlementGrantsDestacado,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

/**
 * `published` — real DB inventory (may be empty array).
 * `inventory_unavailable` — missing server-side Supabase admin config. **No** sample/blueprint rows (launch path).
 * `inventory_query_failed` — Supabase returned an error (distinct from “no published rows”).
 */
export type RestaurantesResultsInventorySource = "published" | "inventory_unavailable" | "inventory_query_failed";

function applyRestaurantesPromotedFromEntitlement(
  row: RestaurantesPublicListingDbRow & Record<string, unknown>,
): RestaurantesPublicListingDbRow {
  const summary = resolveListingPlacementEntitlement({
    category: "restaurantes",
    listing: row as Record<string, unknown>,
  });
  return {
    ...row,
    promoted: packageEntitlementGrantsDestacado(summary),
  };
}

export type RestaurantesResultsInventoryPayload = {
  rows: RestaurantesPublicBlueprintRow[];
  source: RestaurantesResultsInventorySource;
  bannerNote?: string;
};

/**
 * Launch path: only published rows from `restaurantes_public_listings`.
 * Blueprint/sample inventory is not used on this route.
 */
export async function loadRestaurantesResultsInventoryForPage(): Promise<RestaurantesResultsInventoryPayload> {
  if (!isSupabaseAdminConfigured()) {
    return {
      rows: [],
      source: "inventory_unavailable",
      bannerNote:
        "Sin conexión a inventario publicado: configura `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el servidor.",
    };
  }

  const listed = await tryListRestaurantesPublicListingsFromDb(2000);
  if (!listed.ok) {
    return {
      rows: [],
      source: "inventory_query_failed",
      bannerNote: listed.error,
    };
  }
  if (listed.rows.length === 0) {
    return {
      rows: [],
      source: "published",
      bannerNote:
        "Aún no hay restaurantes con estado «published». Publica desde /publicar/restaurantes (vista previa → Publicar) con sesión iniciada para asociar propietario.",
    };
  }

  const hydrated = await overlayActiveEntitlementsForRestaurantesResults(listed.rows);
  const rowsForMap = hydrated.map(applyRestaurantesPromotedFromEntitlement);
  const mapped = mapRestaurantesPublicListingDbRowsToShellInventory(rowsForMap);
  const likeMap = await fetchRestaurantesNetLikeCountsForDbRows(rowsForMap);
  const rows = applyRestauranteLikeCountsToBlueprintRows(mapped, likeMap);

  return {
    rows,
    source: "published",
  };
}
