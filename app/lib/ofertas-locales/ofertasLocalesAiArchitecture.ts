/**
 * Ofertas Locales AI extraction / item / shopping / route — pure planning helpers (Stack 10).
 * No API calls, SDKs, or database access.
 */

import {
  OFERTAS_LOCALES_AI_PIPELINE_STEPS,
  OFERTAS_LOCALES_AI_REVIEW_RULES,
  OFERTAS_LOCALES_AI_TOOL_STACK,
  OFERTAS_LOCALES_GOOGLE_MAPS_ROUTE_V1_NOTE,
  OFERTAS_LOCALES_SHOPPING_ROUTE_MAX_STOPS,
} from "./ofertasLocalesConstants";
import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import {
  canOfertaLocalItemBePubliclyEligible,
  toOfertaLocalItemPublicEligibilityInput,
} from "./ofertasLocalesAiDbMapper";
import type {
  OfertaLocalItemPublicEligibilityInput,
  OfertaLocalPublishStatus,
  OfertaLocalScanJobRecordDraft,
  OfertaLocalSearchableItemDraft,
  OfertaLocalShoppingRouteStopDraft,
} from "./ofertasLocalesTypes";

export type { OfertaLocalItemPublicEligibilityInput };

/** Pipeline steps for docs/UI — no side effects. */
export function getOfertaLocalAiPipelineSteps(): readonly string[] {
  return OFERTAS_LOCALES_AI_PIPELINE_STEPS;
}

export function getOfertaLocalAiReviewRules(): readonly string[] {
  return OFERTAS_LOCALES_AI_REVIEW_RULES;
}

export function getOfertaLocalAiToolStack(): typeof OFERTAS_LOCALES_AI_TOOL_STACK {
  return OFERTAS_LOCALES_AI_TOOL_STACK;
}

export function getOfertaLocalShoppingRouteMaxStops(): number {
  return OFERTAS_LOCALES_SHOPPING_ROUTE_MAX_STOPS;
}

export function getOfertaLocalGoogleMapsRouteV1Note(): string {
  return OFERTAS_LOCALES_GOOGLE_MAPS_ROUTE_V1_NOTE;
}

/**
 * Whether a searchable item may appear in future public search/cards.
 * Parent offer must be approved; valid dates must be active when provided.
 */
export function canOfertaLocalItemGoPublic(
  item: Pick<OfertaLocalSearchableItemDraft, "reviewStatus" | "isActive" | "validFrom" | "validUntil"> & {
    parentOfferStatus?: OfertaLocalPublishStatus | "";
  },
  parentStatus: OfertaLocalPublishStatus | "" = item.parentOfferStatus ?? ""
): boolean {
  return canOfertaLocalItemBePubliclyEligible(
    toOfertaLocalItemPublicEligibilityInput(item, parentStatus),
    parentStatus
  );
}

export { canOfertaLocalItemBePubliclyEligible };

/** Stable key for grouping route stops / shopping list by store. */
export function getOfertaLocalRouteStopKey(stop: OfertaLocalShoppingRouteStopDraft): string {
  const parts = [
    stop.businessName.trim().toLowerCase(),
    stop.address.trim().toLowerCase(),
    stop.city.trim().toLowerCase(),
    stop.state.trim().toLowerCase(),
    stop.zipCode.trim(),
  ];
  return parts.filter(Boolean).join("|");
}

/** Normalize item text for future search indexing. */
export function normalizeOfertaLocalItemSearchText(text: string): string {
  return normalizeOfertaLocalSearchText(text);
}

export function createEmptyOfertaLocalSearchableItemDraft(): OfertaLocalSearchableItemDraft {
  return {
    itemName: "",
    normalizedItemName: "",
    description: "",
    category: "",
    subcategory: "",
    priceText: "",
    priceAmount: null,
    unit: "",
    dealType: "",
    quantity: "",
    searchTags: [],
    sourceAssetId: "",
    sourceAssetUrl: "",
    sourcePage: null,
    sourceCropUrl: "",
    confidence: null,
    reviewStatus: "pending",
    reviewerNote: "",
    isActive: false,
    isSponsored: false,
    sponsorshipWeight: null,
  };
}

export function createEmptyOfertaLocalScanJobRecordDraft(): OfertaLocalScanJobRecordDraft {
  return {
    id: "",
    ofertaLocalId: "",
    ownerId: "",
    sourceAssetId: "",
    sourceAssetType: "",
    sourceAssetUrl: "",
    provider: "google_document_ai",
    normalizerProvider: "leonix_normalizer",
    status: "idle",
    startedAt: "",
    completedAt: "",
    rawResultStoragePath: "",
    normalizedResultStoragePath: "",
    errorMessage: "",
    pagesProcessed: null,
    itemsExtractedCount: null,
    confidenceAverage: null,
  };
}
