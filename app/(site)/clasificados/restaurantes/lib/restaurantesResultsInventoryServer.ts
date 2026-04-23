import "server-only";

import { mapRestaurantesPublicListingDbRowsToShellInventory } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  isSupabaseAdminConfigured,
  listRestaurantesPublicListingsFromDb,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

/**
 * `published` — real DB inventory (may be empty array).
 * `inventory_unavailable` — missing server-side Supabase admin config. **No** sample/blueprint rows (launch path).
 */
export type RestaurantesResultsInventorySource = "published" | "inventory_unavailable";

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

  const dbRows = await listRestaurantesPublicListingsFromDb(2000);
  if (dbRows.length === 0) {
    return {
      rows: [],
      source: "published",
      bannerNote:
        "Aún no hay restaurantes con estado «published». Publica desde /publicar/restaurantes (vista previa → Publicar) con sesión iniciada para asociar propietario.",
    };
  }

  return {
    rows: mapRestaurantesPublicListingDbRowsToShellInventory(dbRows),
    source: "published",
  };
}
