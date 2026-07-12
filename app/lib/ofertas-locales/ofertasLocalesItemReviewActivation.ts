/**
 * Item public activation rules for FINAL-AI-1 — approved items become active only under approved parent offers.
 */

import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemReviewPatch,
  OfertaLocalItemReviewStatus,
  OfertaLocalPublishStatus,
} from "./ofertasLocalesTypes";

/** Whether an item may be publicly active given review + parent offer status. */
export function shouldOfertaLocalItemBePubliclyActive(
  reviewStatus: OfertaLocalItemReviewStatus | string,
  parentOfferStatus: OfertaLocalPublishStatus
): boolean {
  if (reviewStatus === "rejected") return false;
  if (reviewStatus !== "approved") return false;
  if (parentOfferStatus !== "approved") return false;
  return true;
}

export function resolveOfertaLocalItemIsActiveOnReviewPatch(
  patch: OfertaLocalItemReviewPatch,
  existing: Pick<OfertaLocalItemDbRow, "review_status" | "is_active">,
  parentOfferStatus: OfertaLocalPublishStatus
): boolean {
  const nextReviewStatus = patch.reviewStatus ?? existing.review_status;
  return shouldOfertaLocalItemBePubliclyActive(nextReviewStatus, parentOfferStatus);
}
