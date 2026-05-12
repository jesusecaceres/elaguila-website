/**
 * Rentas public promotion signal from `listings` row fields (kept in Rentas layer — no dashboard import).
 * Staff spotlight / `Leonix:promoted` in `detail_pairs` — distinct from republish ordering (`republished_at`).
 */

import {
  LEONIX_DP_PROMOTED,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";

function leonixPromotedPair(detailPairs: unknown): boolean {
  const v = (readLeonixDetailPairValue(detailPairs, LEONIX_DP_PROMOTED) ?? "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

export function rentasListingPromotedFromRow(row: { admin_promoted?: unknown; detail_pairs?: unknown }): boolean {
  return Boolean(row.admin_promoted) || leonixPromotedPair(row.detail_pairs);
}
