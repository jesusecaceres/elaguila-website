import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { brNegocioFeaturedListing, brNegocioGridListings } from "../resultados/demoData";

/** Stable demo pool for development / self-tests — not merged on production (see `brPublicInventoryMode`). */
export function buildBrDemoListingPool(): BrNegocioListing[] {
  const ids = new Set(brNegocioGridListings.map((l) => l.id));
  const extra = !ids.has(brNegocioFeaturedListing.id) ? [brNegocioFeaturedListing] : [];
  return [...extra, ...brNegocioGridListings];
}
