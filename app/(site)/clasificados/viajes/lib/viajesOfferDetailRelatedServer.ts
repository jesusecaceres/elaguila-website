import "server-only";

import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import type { ViajesOfferModelV2 } from "./v2/viajesOfferModelV2";
import { fetchViajesPublicBrowseRowsMerged } from "./viajesPublicBrowseRowsServer";
import { filterViajesMoreFromProvider, filterViajesSimilarGetaways } from "./viajesProviderMatch";
import { filterViajesProductionCommercialRows } from "./viajesPublicInventory";

export async function fetchViajesOfferDetailRelated(
  offer: ViajesOfferModelV2 | undefined,
  excludeSlug: string
): Promise<{ moreFromProvider: ViajesResultRow[]; similar: ViajesResultRow[] }> {
  if (!offer) return { moreFromProvider: [], similar: [] };
  const { rows } = await fetchViajesPublicBrowseRowsMerged();
  const commercial = filterViajesProductionCommercialRows(rows);
  return {
    moreFromProvider: filterViajesMoreFromProvider(commercial, offer, { excludeSlug, limit: 6 }),
    similar: filterViajesSimilarGetaways(commercial, offer, { excludeSlug, limit: 6 }),
  };
}
