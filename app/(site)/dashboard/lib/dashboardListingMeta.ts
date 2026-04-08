/** Parse listing row fields used for dashboard free/pro and boost UI. */

import { parseDetailPairValue } from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";
import { LEONIX_DP_PROMOTED } from "@/app/clasificados/lib/leonixRealEstateListingContract";

export function listingPlanFromDetailPairs(detailPairs: unknown): "free" | "pro" {
  if (!Array.isArray(detailPairs)) return "free";
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    if (o.label === "Leonix:plan") {
      const v = (o.value ?? "").trim().toLowerCase();
      if (v === "pro") return "pro";
      return "free";
    }
  }
  return "free";
}

export function isListingBoosted(boostExpires: unknown): boolean {
  if (boostExpires == null) return false;
  const t = new Date(typeof boostExpires === "string" ? boostExpires : String(boostExpires)).getTime();
  return Number.isFinite(t) && t > Date.now();
}

/** Leonix promoted flag in `detail_pairs` (complements time-bound `boost_expires`). */
export function leonixPromotedFromDetailPairs(detailPairs: unknown): boolean {
  const v = (parseDetailPairValue(detailPairs, LEONIX_DP_PROMOTED) ?? "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}
