/**
 * Rentas public promotion signal from `listings` row fields (kept in Rentas layer — no dashboard import).
 * Mirrors dashboard semantics: active `boost_expires` or `Leonix:promoted` in `detail_pairs`.
 */

import {
  LEONIX_DP_PROMOTED,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";

function isBoostExpiresActive(boostExpires: unknown): boolean {
  if (boostExpires == null) return false;
  const t = new Date(typeof boostExpires === "string" ? boostExpires : String(boostExpires)).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function leonixPromotedPair(detailPairs: unknown): boolean {
  const v = (readLeonixDetailPairValue(detailPairs, LEONIX_DP_PROMOTED) ?? "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

export function rentasListingPromotedFromRow(row: { boost_expires?: unknown; detail_pairs?: unknown }): boolean {
  return isBoostExpiresActive(row.boost_expires) || leonixPromotedPair(row.detail_pairs);
}
