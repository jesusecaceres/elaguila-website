import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { coerceVehicleIdentityFromTaxonomy } from "@/app/lib/clasificados/autos/autosVehicleTaxonomy";
import { coerceEngineFromCatalog, resolveEngineForDisplay } from "@/app/lib/clasificados/autos/autosVehicleEngineOptions";

/**
 * Shallow copy with taxonomy-aware identity (catalog spelling when matchable) plus
 * title-case fallback for unknown segments. Does not mutate persisted draft JSON on its own.
 */
export function withNormalizedVehicleIdentityForDisplay(listing: AutoDealerListing): AutoDealerListing {
  const coerced = coerceVehicleIdentityFromTaxonomy(listing);
  const engineCoerced = coerceEngineFromCatalog(coerced);
  const engineDisplay = resolveEngineForDisplay(engineCoerced);
  return {
    ...coerced,
    ...engineCoerced,
    engine: engineDisplay ?? normalizeVehicleSegment(coerced.engine) ?? coerced.engine,
  };
}
