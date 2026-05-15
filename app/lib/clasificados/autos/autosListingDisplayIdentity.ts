import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { coerceVehicleIdentityFromTaxonomy } from "@/app/lib/clasificados/autos/autosVehicleTaxonomy";

/**
 * Shallow copy with taxonomy-aware identity (catalog spelling when matchable) plus
 * title-case fallback for unknown segments. Does not mutate persisted draft JSON on its own.
 */
export function withNormalizedVehicleIdentityForDisplay(listing: AutoDealerListing): AutoDealerListing {
  const coerced = coerceVehicleIdentityFromTaxonomy(listing);
  return {
    ...coerced,
    engine: normalizeVehicleSegment(coerced.engine) ?? coerced.engine,
  };
}
