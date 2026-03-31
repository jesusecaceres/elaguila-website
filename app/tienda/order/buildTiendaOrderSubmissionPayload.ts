"use client";

import type { Lang } from "../types/tienda";
import type { TiendaFulfillmentPreference, TiendaOrderReviewSummary, TiendaOrderSource } from "../types/orderHandoff";
import type { TiendaCustomerDetails } from "../types/orderHandoff";
import type { TiendaOrderSubmissionPayload, TiendaOrderAssetSummary } from "../types/orderSubmission";
import { mapBusinessCardSessionToReview, readBusinessCardSessionRaw } from "./mappers/businessCardDocumentToReview";
import { mapPrintUploadSessionToReview, readPrintUploadSessionRaw } from "./mappers/printUploadDocumentToReview";
import { extractBusinessCardSubmissionExtra } from "./mappers/businessCardDocumentToReview";
import { extractPrintUploadSubmissionExtra } from "./mappers/printUploadDocumentToReview";

function stripAssets(review: TiendaOrderReviewSummary): TiendaOrderAssetSummary[] {
  return review.assets.map((a) => ({
    id: a.id,
    kind: a.kind,
    labelEs: a.label.es,
    labelEn: a.label.en,
    metaLinesEs: a.metaLines.map((m) => m.es),
    metaLinesEn: a.metaLines.map((m) => m.en),
    hadInlinePreviewHint: !!(a.thumbnailUrl && a.thumbnailUrl.startsWith("data:")),
  }));
}

/** Ensures session still maps to the same review before building API payload. */
export function buildTiendaOrderSubmissionPayload(params: {
  orderId: string;
  review: TiendaOrderReviewSummary;
  customer: TiendaCustomerDetails;
  fulfillment: TiendaFulfillmentPreference;
  source: TiendaOrderSource;
  slug: string;
  lang: Lang;
}): TiendaOrderSubmissionPayload | null {
  const { orderId, review, customer, fulfillment, source, slug, lang } = params;
  if (review.source !== source || review.productSlug !== slug) return null;

  const raw =
    source === "business-cards" ? readBusinessCardSessionRaw(slug) : readPrintUploadSessionRaw(slug);
  const mapped =
    source === "business-cards"
      ? mapBusinessCardSessionToReview(slug, raw)
      : mapPrintUploadSessionToReview(slug, raw);

  if (!mapped) return null;

  const bcExtra = source === "business-cards" ? extractBusinessCardSubmissionExtra(slug, raw) : null;
  const puExtra = source === "print-upload" ? extractPrintUploadSubmissionExtra(slug, raw) : null;

  if (source === "business-cards" && !bcExtra) return null;
  if (source === "print-upload" && !puExtra) return null;

  return {
    v: 2,
    orderId,
    source,
    productSlug: review.productSlug,
    productTitleEs: review.productTitle.es,
    productTitleEn: review.productTitle.en,
    categorySlug: review.categorySlug,
    specLines: review.specLines,
    sidednessSummary: review.sidednessSummary,
    assets: stripAssets(review),
    customer: {
      fullName: customer.fullName.trim(),
      businessName: customer.businessName.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      notes: customer.notes.trim(),
    },
    fulfillment,
    approvalStatus: review.approvalStatus,
    approvalDetails: review.approvalDetails,
    warnings: review.warnings,
    builderSavedAt: review.builderSavedAt,
    businessCardExtra: bcExtra ?? undefined,
    printUploadExtra: puExtra ?? undefined,
    preferredLang: lang,
  };
}
