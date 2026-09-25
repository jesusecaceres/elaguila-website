/**
 * AUTOS DEALER — Quick / Full field boundary for the dealer listing payload.
 *
 * Product lock (Autos Dealer):
 *   QUICK  = ONE primary website (`dealerWebsite`), the dealer's contact channels (phone / SMS /
 *            WhatsApp / email), no social links (`dealerSocials`, including its `website` key), no
 *            Google Reviews / Google Business / Yelp link, no extra business/resource links
 *            (`dealerCustomLinks`, `dealerBookingUrl`, `financeApplicationUrl`), no video, and at most
 *            FIVE active vehicles in total (main + up to four additional), no inventory pack.
 *   FULL   = everything, unchanged.
 *
 * This is the SERVER-enforceable half of that lock: it expresses the Full-only field paths of the
 * dealer payload as data and applies the ONE shared boundary (`applyQuickFullOnlyBoundary`) to them.
 * The application also hides those fields for Quick, but the browser is never the boundary — every
 * dealer write seam (POST, PATCH, staff-assisted publish) runs this on the payload it actually
 * receives.
 *
 * Restore, not delete: when the row already stores a value for a Full-only path, that STORED value is
 * kept (a Full customer later resolved as Quick keeps their history); otherwise the path is emptied.
 * The browser-supplied value never wins for a Quick product.
 *
 * Gate: `quickFullOnlyBoundaryApplies(decision)` — true ONLY for a PROVEN Quick product. An
 * `unverified` product may be a Full customer on a first, pre-payment save, so it is never stripped.
 *
 * Pure: no IO, no React. Safe for server seams, the client preview and node:assert verifiers.
 */
import type { QuickBusinessProductDecision } from "@/app/lib/listingPlans/quickBusinessProductIdentity";
import { QUICK_DEALER_ACTIVE_VEHICLE_LIMIT } from "./autosDealerInventoryPolicy";
import {
  applyQuickFullOnlyBoundary,
  quickFullOnlyBoundaryApplies,
} from "@/app/lib/quickBusiness/quickFullOnlyBoundary";

type Json = Record<string, unknown>;

/** Real `AutoDealerListing` field names that are Full-only for the dealer lane. */
export const AUTOS_DEALER_QUICK_FULL_ONLY_PATHS = [
  "dealerSocials",
  "googleReviewsUrl",
  "yelpReviewsUrl",
  "googleBusinessUrl",
  "dealerCustomLinks",
  "dealerBookingUrl",
  "financeApplicationUrl",
  "videoUrls",
  "videoUrl",
] as const;

export type QuickDealerStripResult<T> = {
  listing: T;
  /** Full-only paths whose incoming value was changed (empty when nothing Full-only was present). */
  changedPaths: string[];
};

/**
 * Apply the Quick boundary UNCONDITIONALLY (the caller already knows this is a Quick session — the
 * client preview, or a seam that has proven Quick). Prefer `stripQuickDealerFullOnlyFields` on the server.
 */
export function applyAutosDealerQuickBoundary<T extends object>(input: {
  listing: T;
  /** The `listing_payload` already stored on the row being written, when there is one. */
  existing?: object | null;
}): QuickDealerStripResult<T> {
  const bounded = applyQuickFullOnlyBoundary({
    incoming: input.listing as unknown as Json,
    existing: (input.existing ?? null) as Json | null,
    paths: AUTOS_DEALER_QUICK_FULL_ONLY_PATHS,
  });
  const value = bounded.value as Json;
  // A video source flag with no video behind it is an orphan; keep the payload self-consistent.
  const videoUrls = value.videoUrls;
  const hasVideo =
    (Array.isArray(videoUrls) && videoUrls.some((v) => typeof v === "string" && v.trim() !== "")) ||
    (typeof value.videoUrl === "string" && value.videoUrl.trim() !== "");
  if (!hasVideo && bounded.changedPaths.some((p) => p === "videoUrls" || p === "videoUrl")) {
    if ("videoSourceType" in value) value.videoSourceType = null;
    if ("videoUploadStatus" in value) value.videoUploadStatus = null;
    if ("videoFileDataUrl" in value) value.videoFileDataUrl = undefined;
    if ("videoFileName" in value) value.videoFileName = undefined;
  }
  const changedPaths = [...bounded.changedPaths];
  // BASE inventory is CAPPED, not stripped: the main vehicle plus up to (allowance - 1) additional ones.
  const staged = value.additionalInventoryVehicles;
  const maxAdditional = Math.max(0, QUICK_DEALER_ACTIVE_VEHICLE_LIMIT - 1);
  if (Array.isArray(staged) && staged.length > maxAdditional) {
    value.additionalInventoryVehicles = staged.slice(0, maxAdditional);
    changedPaths.push("additionalInventoryVehicles");
  }
  return { listing: value as unknown as T, changedPaths };
}

export type QuickDealerAddonRefusal = { status: number; code: string; message: string };

/**
 * Should the dealer inventory pack (+10 vehicles, $129) be refused for this parent's product?
 * Refused ONLY for a PROVEN BASE (Quick) parent — the pack is a PRO-only entitlement, so BASE must
 * upgrade to PRO first. Full and `unverified` are unchanged (no Full customer is blocked on a guess).
 */
export function quickDealerInventoryAddonRefusal(
  decision: Pick<QuickBusinessProductDecision, "product" | "source"> | null | undefined,
): QuickDealerAddonRefusal | null {
  if (!quickFullOnlyBoundaryApplies(decision)) return null;
  return {
    status: 422,
    code: "quick_inventory_addon_not_available",
    message:
      "The vehicle inventory pack is not available on the BASE package. Upgrade to PRO first to add the +10 vehicle pack.",
  };
}

/**
 * Gated variant for the server seams. Untouched (same reference, no changed paths) unless the
 * product decision PROVES Quick.
 */
export function stripQuickDealerFullOnlyFields<T extends object>(input: {
  listing: T;
  existing?: object | null;
  decision: Pick<QuickBusinessProductDecision, "product" | "source"> | null | undefined;
}): QuickDealerStripResult<T> {
  if (!quickFullOnlyBoundaryApplies(input.decision)) return { listing: input.listing, changedPaths: [] };
  return applyAutosDealerQuickBoundary({ listing: input.listing, existing: input.existing });
}
