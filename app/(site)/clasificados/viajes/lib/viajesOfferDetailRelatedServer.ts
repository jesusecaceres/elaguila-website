import "server-only";

import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import type { ViajesOfferModelV2 } from "./v2/viajesOfferModelV2";
import { fetchViajesPublicBrowseRowsMerged } from "./viajesPublicBrowseRowsServer";
import { filterViajesMoreFromProvider, filterViajesSimilarGetaways } from "./viajesProviderMatch";

export async function fetchViajesOfferDetailRelated(
  offer: ViajesOfferModelV2 | undefined,
  excludeSlug: string
): Promise<{ moreFromProvider: ViajesResultRow[]; similar: ViajesResultRow[] }> {
  if (!offer) return { moreFromProvider: [], similar: [] };
  const { rows } = await fetchViajesPublicBrowseRowsMerged();
  return {
    moreFromProvider: filterViajesMoreFromProvider(rows, offer, { excludeSlug, limit: 6 }),
    similar: filterViajesSimilarGetaways(rows, offer, { excludeSlug, limit: 6 }),
  };
}
