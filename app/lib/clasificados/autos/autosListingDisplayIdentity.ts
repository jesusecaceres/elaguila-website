import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";

/**
 * Shallow copy with display-normalized make/model/trim/engine (title-case words).
 * Does not mutate persisted draft JSON on its own — use at render / map-to-public boundaries.
 */
export function withNormalizedVehicleIdentityForDisplay(listing: AutoDealerListing): AutoDealerListing {
  return {
    ...listing,
    make: normalizeVehicleSegment(listing.make) ?? listing.make,
    model: normalizeVehicleSegment(listing.model) ?? listing.model,
    trim: normalizeVehicleSegment(listing.trim) ?? listing.trim,
    engine: normalizeVehicleSegment(listing.engine) ?? listing.engine,
  };
}
