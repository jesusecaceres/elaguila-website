import "server-only";

import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import { mergeViajesPublicResultRows } from "./viajesPublicInventory";
import { mapViajesStagedRowToViajesBusinessResult } from "./mapViajesStagedRowToViajesResult";
import { fetchApprovedViajesStagedRows } from "./viajesStagedListingsDbServer";

/**
 * Approved staged rows merged with curated seed.
 * Intentionally uncached: resultados is `force-dynamic` and must reflect approvals
 * immediately (tag expire alone was insufficient under `next start` for e2e).
 * Offer-detail caches remain tag-scoped separately.
 */
export async function fetchViajesPublicBrowseRowsMerged(): Promise<{
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
