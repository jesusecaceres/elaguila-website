/**
 * Item public activation rules for FINAL-AI-1 — approved items become active only under approved parent offers.
 */

import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemReviewPatch,
  OfertaLocalPublishStatus,
} from "./ofertasLocalesTypes";

export function resolveOfertaLocalItemIsActiveOnReviewPatch(
  patch: OfertaLocalItemReviewPatch,
  existing: Pick<OfertaLocalItemDbRow, "review_status" | "is_active">,
  parentOfferStatus: OfertaLocalPublishStatus
): boolean {
  const nextReviewStatus = patch.reviewStatus ?? existing.review_status;

  if (nextReviewStatus === "rejected") return false;
  if (nextReviewStatus !== "approved") return false;
  if (parentOfferStatus !== "approved") return false;

  return true;
}
