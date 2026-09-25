/**
 * AUTOS DEALER — Quick / Full field boundary for the dealer listing payload.
 *
 * Product lock (Autos Dealer):
 *   QUICK  = ONE primary website (`dealerWebsite`), the dealer's contact channels (phone / SMS /
 *            WhatsApp / email), no social links (`dealerSocials`, including its `website` key), no
 *            Google Reviews / Google Business / Yelp link, no extra business/resource links
 *            (`dealerCustomLinks`, `dealerBookingUrl`, `financeApplicationUrl`), no video, and no
 *            additional inventory vehicles (1 active vehicle, no pack).
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
  "additionalInventoryVehicles",
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
  return { listing: value as unknown as T, changedPaths: bounded.changedPaths };
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
