import "server-only";

import { RESTAURANTES_PUBLIC_BLUEPRINT_ROWS } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import {
  mapDbRowsToPublicResultsRows,
  mapPublicResultsRowsToShellInventory,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  isSupabaseAdminConfigured,
  listRestaurantesPublicListingsFromDb,
} from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

export type RestaurantesResultsInventorySource = "published" | "demo_fallback";

export type RestaurantesResultsInventoryPayload = {
  rows: RestaurantesPublicBlueprintRow[];
  source: RestaurantesResultsInventorySource;
  /** Shown above results when non-empty (honest dev / empty states). */
  bannerNote?: string;
};

/**
 * Primary inventory for `/clasificados/restaurantes/resultados`.
 * - Published rows when service role + table return data.
 * - Explicit demo fallback only when Supabase admin is not configured (local UI QA).
 */
export async function loadRestaurantesResultsInventoryForPage(): Promise<RestaurantesResultsInventoryPayload> {
  if (!isSupabaseAdminConfigured()) {
    return {
      rows: RESTAURANTES_PUBLIC_BLUEPRINT_ROWS,
      source: "demo_fallback",
      bannerNote:
        "Modo demo: falta `SUPABASE_SERVICE_ROLE_KEY` (o URL) en el servidor. Se muestran filas de diseño; la publicación real no aparecerá aquí hasta configurar Supabase.",
    };
  }

  const dbRows = await listRestaurantesPublicListingsFromDb(500);
  if (dbRows.length === 0) {
    return {
      rows: [],
      source: "published",
      bannerNote:
        "Aún no hay restaurantes publicados en la base. Publica desde /publicar/restaurantes → vista previa → Publicar (con sesión iniciada para asociar owner).",
    };
  }

  const mapped = mapPublicResultsRowsToShellInventory(mapDbRowsToPublicResultsRows(dbRows));
  return { rows: mapped, source: "published" };
}
