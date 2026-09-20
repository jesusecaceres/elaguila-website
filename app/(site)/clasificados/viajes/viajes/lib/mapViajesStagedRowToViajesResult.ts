import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import type { ViajesStagedListingRow } from "./viajesStagedListingTypes";
import { mapViajesStagedRowToViajesBusinessResultV2 } from "./v2/mapViajesOfferV2ToBrowseResult";

/** Browse mapper — V1 and V2 staged JSON via normalize boundary. */
export function mapViajesStagedRowToViajesBusinessResult(row: ViajesStagedListingRow): ViajesBusinessResult | null {
  return mapViajesStagedRowToViajesBusinessResultV2(row);
}
