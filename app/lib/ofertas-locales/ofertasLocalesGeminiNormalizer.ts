import type { OfertaLocalGeminiValidatedCandidate } from "./ofertasLocalesGeminiCandidateValidator";
import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import type { OfertaLocalSearchableItemDraft } from "./ofertasLocalesTypes";

export type MapGeminiCandidatesParams = {
  candidates: OfertaLocalGeminiValidatedCandidate[];
  sourceAssetId: string;
  sourceAssetUrl: string;
  sourceFileName: string;
  sourceStoragePath: string;
  assetKind: "flyer" | "coupon";
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  validFrom?: string;
  validUntil?: string;
};

export function mapGeminiCandidatesToOfertaLocalItems(
  params: MapGeminiCandidatesParams
): OfertaLocalSearchableItemDraft[] {
  return params.candidates.map((candidate) => toItemDraft(candidate, params));
}

function toItemDraft(
  candidate: OfertaLocalGeminiValidatedCandidate,
  params: MapGeminiCandidatesParams
): OfertaLocalSearchableItemDraft {
  const itemName = candidate.productName.trim();
  const normalizedItemName = normalizeOfertaLocalSearchText(itemName);
  const descriptionParts = [
    candidate.brand ? `Brand: ${candidate.brand}` : "",
    candidate.description,
    candidate.needsReviewReason ? `Review: ${candidate.needsReviewReason}` : "",
  ].filter(Boolean);

  const searchTags = [...candidate.searchTags];
  if (candidate.brand) {
    const brandTag = candidate.brand.toLowerCase();
    if (!searchTags.includes(brandTag)) searchTags.unshift(brandTag);
  }

  return {
    itemName,
    normalizedItemName,
    description: descriptionParts.join(" · ").slice(0, 500),
    category: candidate.category || "Grocery",
    subcategory: "",
    priceText: candidate.priceText,
    priceAmount: candidate.priceAmount,
    regularPriceText: candidate.regularPriceText,
    unit: candidate.unit,
    dealType: candidate.dealType,
    quantity: candidate.quantity,
    searchTags,
    candidateType: params.assetKind === "coupon" ? "coupon" : "product_deal",
    offerText: candidate.salePriceText || candidate.priceText,
    terms: candidate.needsReviewReason,
    validFrom: params.validFrom,
    validUntil: params.validUntil,
    sourceAssetId: params.sourceAssetId,
    sourceAssetUrl: params.sourceAssetUrl,
    sourceFileName: params.sourceFileName,
    sourcePage: candidate.sourcePage,
    sourceContext: params.sourceStoragePath,
    sourceBbox: candidate.sourceBbox ?? undefined,
    extractedJson: {
      provider: "gemini_multimodal",
      brand: candidate.brand,
      salePriceText: candidate.salePriceText,
      regularPriceText: candidate.regularPriceText,
      savingsText: candidate.savingsText,
      rawEvidence: candidate.rawEvidence,
      priceRepaired: candidate.priceRepaired,
      needsReviewReason: candidate.needsReviewReason,
      sourceBboxGemini: candidate.sourceBboxGemini,
      commerceMetadata: candidate.commerceMetadata,
    },
    confidence: candidate.confidenceScore,
    reviewStatus: "needs_review",
    isActive: false,
    businessName: params.businessName,
    businessAddress: params.businessAddress,
    businessCity: params.businessCity,
    businessState: params.businessState,
    businessZipCode: params.businessZipCode,
  };
}
