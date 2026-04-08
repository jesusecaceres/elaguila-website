import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";

export type AutosDraftNormalizeLane = "privado" | "negocios";

/**
 * Normalizes stored/partial listing data without throwing (localStorage + IDB recovery).
 * Lane fixes `autosLane` for empty fallbacks and merge hints.
 */
export function safeNormalizeAutosDraftListing(raw: unknown, lane?: AutosDraftNormalizeLane): AutoDealerListing {
  const empty = (): AutoDealerListing => {
    if (lane === "privado") return normalizeLoadedListing({ autosLane: "privado" });
    if (lane === "negocios") return normalizeLoadedListing({ autosLane: "negocios" });
    return normalizeLoadedListing(undefined);
  };

  try {
    if (!raw || typeof raw !== "object") {
      return empty();
    }
    const asPartial = { ...(raw as Record<string, unknown>) } as Partial<AutoDealerListing>;
    if (lane) asPartial.autosLane = lane;
    try {
      return normalizeLoadedListing(asPartial);
    } catch {
      try {
        return normalizeLoadedListing({
          ...asPartial,
          mediaImages: [],
          heroImages: [],
          dealerHours: [],
          relatedDealerListings: [],
          badges: [],
          features: [],
          ...(lane ? { autosLane: lane } : {}),
        });
      } catch {
        return empty();
      }
    }
  } catch {
    return empty();
  }
}
