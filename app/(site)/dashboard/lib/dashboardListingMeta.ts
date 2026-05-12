/** Parse listing row fields used for dashboard free/pro and En Venta visibility UI. */

import {
  EN_VENTA_VISIBILITY_WINDOW_MS,
  parseDetailPairValue,
} from "@/app/clasificados/en-venta/republish/enVentaRepublishVisibility";
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

/** ISO end of the post-republish visibility window (`republished_at` + En Venta window). */
export function listingRepublishVisibilityWindowEndIso(republishedAt: unknown): string | null {
  if (republishedAt == null) return null;
  const t = new Date(typeof republishedAt === "string" ? republishedAt : String(republishedAt)).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t + EN_VENTA_VISIBILITY_WINDOW_MS).toISOString();
}

export function isListingRepublishWindowActive(republishedAt: unknown): boolean {
  const endIso = listingRepublishVisibilityWindowEndIso(republishedAt);
  if (!endIso) return false;
  const end = new Date(endIso).getTime();
  return Number.isFinite(end) && Date.now() < end;
}

/** Leonix promoted flag in `detail_pairs` (separate from republish / visibility window). */
export function leonixPromotedFromDetailPairs(detailPairs: unknown): boolean {
  const v = (parseDetailPairValue(detailPairs, LEONIX_DP_PROMOTED) ?? "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}
