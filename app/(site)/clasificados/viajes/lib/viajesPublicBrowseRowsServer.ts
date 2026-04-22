import "server-only";

import { unstable_cache } from "next/cache";

import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import { VIAJES_CACHE_TAG_BROWSE } from "./viajesCacheTags";
import { mergeViajesPublicResultRows } from "./viajesPublicInventory";
import { mapViajesStagedRowToViajesBusinessResult } from "./mapViajesStagedRowToViajesResult";
import { fetchApprovedViajesStagedRows } from "./viajesStagedListingsDbServer";

async function fetchViajesPublicBrowseRowsMergedUncached(): Promise<{
  rows: ViajesResultRow[];
  stagedApprovedCount: number;
}> {
  const stagedRows = await fetchApprovedViajesStagedRows();
  const mapped = stagedRows.map(mapViajesStagedRowToViajesBusinessResult).filter((x): x is NonNullable<typeof x> => x != null);
  return {
    rows: mergeViajesPublicResultRows(mapped),
    stagedApprovedCount: mapped.length,
  };
}

/** Approved staged rows merged with curated seed; tag-invalidated on moderation changes. */
export async function fetchViajesPublicBrowseRowsMerged(): Promise<{
  rows: ViajesResultRow[];
  stagedApprovedCount: number;
}> {
  return unstable_cache(fetchViajesPublicBrowseRowsMergedUncached, ["viajes-public-browse-rows-merged-v1"], {
    tags: [VIAJES_CACHE_TAG_BROWSE],
  })();
}
