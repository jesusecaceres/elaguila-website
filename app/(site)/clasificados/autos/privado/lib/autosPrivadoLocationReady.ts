import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  AUTOS_DEFAULT_COUNTRY,
  AUTOS_DEFAULT_STATE,
  normalizeAutosPostalCode,
} from "@/app/lib/clasificados/autos/autosLocationContract";

function fieldText(raw: unknown): string {
  return String(raw ?? "").trim();
}

/**
 * Privado vehicle location for the preview-ready gate.
 * City/ZIP must be actually filled. State/country use the same visible defaults
 * as the application selects (CA / United States) when those controls were never touched.
 */
export function resolvePrivadoLocationFields(
  listing: Pick<AutoDealerListing, "city" | "state" | "zip" | "country">,
): { city: string; state: string; zip: string; country: string } {
  return {
    city: fieldText(listing.city),
    state: fieldText(listing.state) || AUTOS_DEFAULT_STATE,
    zip: normalizeAutosPostalCode(listing.zip) ?? fieldText(listing.zip),
    country: fieldText(listing.country) || AUTOS_DEFAULT_COUNTRY,
  };
}

export function hasPrivadoPreviewLocation(
  listing: Pick<AutoDealerListing, "city" | "state" | "zip" | "country">,
): boolean {
  const loc = resolvePrivadoLocationFields(listing);
  return Boolean(loc.city) && Boolean(loc.state) && Boolean(loc.zip);
}

/** Persist the same state/country the Privado location selects already display. */
export function withPrivadoLocationDefaults(listing: AutoDealerListing): AutoDealerListing {
  return {
    ...listing,
    autosLane: "privado",
    state: fieldText(listing.state) || AUTOS_DEFAULT_STATE,
    country: fieldText(listing.country) || AUTOS_DEFAULT_COUNTRY,
  };
}
