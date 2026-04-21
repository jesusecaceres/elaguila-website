import "server-only";

import { RESTAURANTES_PUBLIC_BLUEPRINT_ROWS } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { mapRestaurantesPublicListingDbRowsToShellInventory } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  isSupabaseAdminConfigured,
  listRestaurantesPublicListingsFromDb,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

/**
 * `published` — real DB inventory (may be empty array).
 * `explicit_demo` — only when `RESTAURANTES_USE_BLUEPRINT_INVENTORY=true` (local/storybook); never default.
 * `inventory_unavailable` — missing server-side Supabase admin config; **no** silent blueprint.
 */
export type RestaurantesResultsInventorySource = "published" | "explicit_demo" | "inventory_unavailable";

export type RestaurantesResultsInventoryPayload = {
  rows: RestaurantesPublicBlueprintRow[];
  source: RestaurantesResultsInventorySource;
  bannerNote?: string;
};

function allowBlueprintDemo(): boolean {
  return process.env.RESTAURANTES_USE_BLUEPRINT_INVENTORY === "true";
}

/**
 * Production path: only published rows from `restaurantes_public_listings`.
 * Blueprint rows are **opt-in** via `RESTAURANTES_USE_BLUEPRINT_INVENTORY=true` for isolated QA.
 */
export async function loadRestaurantesResultsInventoryForPage(): Promise<RestaurantesResultsInventoryPayload> {
  if (!isSupabaseAdminConfigured()) {
    if (allowBlueprintDemo()) {
      return {
        rows: RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
        source: "explicit_demo",
        bannerNote:
          "Inventario de demostración explícito (`RESTAURANTES_USE_BLUEPRINT_INVENTORY=true`). No usar en producción.",
      };
    }
    return {
      rows: [],
      source: "inventory_unavailable",
      bannerNote:
        "Sin conexión a inventario publicado: configura `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el servidor. No se muestran filas de muestra.",
    };
  }

  const dbRows = await listRestaurantesPublicListingsFromDb(500);
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
