import "server-only";

import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import { mergeViajesPublicResultRows } from "./viajesPublicInventory";
import { mapViajesStagedRowToViajesBusinessResult } from "./mapViajesStagedRowToViajesResult";
import { fetchApprovedViajesStagedRows } from "./viajesStagedListingsDbServer";

/** Approved staged rows mapped to browse cards (empty when DB offline / not configured). */
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
