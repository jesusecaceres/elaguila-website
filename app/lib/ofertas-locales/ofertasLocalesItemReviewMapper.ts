/**
 * Ofertas Locales AI item owner review — pure mapping/validation (Stack B).
 */

import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import { resolveOfertaLocalItemIsActiveOnReviewPatch } from "./ofertasLocalesItemReviewActivation";
import { EMPTY_OFERTA_LOCAL_ITEM_COMMERCE_METADATA } from "./ofertasLocalesTypes";
import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemCommerceMetadata,
  OfertaLocalItemOnlineAvailability,
  OfertaLocalItemReviewPatch,
  OfertaLocalItemReviewStatus,
  OfertaLocalItemReviewViewModel,
  OfertaLocalItemUrlSource,
  OfertaLocalPublishStatus,
  OfertaLocalSearchableItemDraft,
  OfertaLocalSourceBoundingBox,
} from "./ofertasLocalesTypes";

const MAX_NAME = 200;
const MAX_SHORT = 64;
const MAX_TAGS = 25;
const COMMERCE_MAX_SHORT = 80;
const COMMERCE_MAX_URL = 500;
const COMMERCE_MAX_NOTE = 240;

const ONLINE_AVAILABILITY_VALUES: ReadonlySet<OfertaLocalItemOnlineAvailability> = new Set([
  "unknown",
  "online",
  "in_store",
  "both",
]);

const REVIEW_STATUSES: ReadonlySet<OfertaLocalItemReviewStatus> = new Set([
  "pending",
  "needs_review",
  "approved",
  "rejected",
]);

function sanitizeText(raw: string, max: number): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

function sanitizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    const n = normalizeOfertaLocalSearchText(tag);
    if (n && !out.includes(n) && out.length < MAX_TAGS) out.push(n);
  }
  return out;
}

function normalizeOnlineAvailability(raw: unknown): OfertaLocalItemOnlineAvailability {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (key === "online" || key === "in_store" || key === "both") return key;
  if (key === "instore" || key === "in-store") return "in_store";
  if (key === "online_and_in_store" || key === "online_in_store") return "both";
  return "unknown";
}

/** HTTPS-only product URL safe for storage and display. */
export function validateOfertaLocalCommerceItemUrl(
  url: string | null | undefined
): string | null {
  const t = String(url ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  ) {
    return null;
  }
  if (t.startsWith("/") || !t.startsWith("https://")) return null;
  try {
    const parsed = new URL(t);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString().slice(0, COMMERCE_MAX_URL);
  } catch {
    return null;
  }
}

export function parseOfertaLocalCommerceMetadataFromExtractedJson(
  extractedJson: Record<string, unknown> | null | undefined
): OfertaLocalItemCommerceMetadata {
  const base = { ...EMPTY_OFERTA_LOCAL_ITEM_COMMERCE_METADATA };
  if (!extractedJson || typeof extractedJson !== "object") return base;
  const raw = extractedJson.commerceMetadata;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  const itemUrl = validateOfertaLocalCommerceItemUrl(String(o.itemUrl ?? "")) ?? "";
  return {
    itemNumber: sanitizeText(String(o.itemNumber ?? ""), COMMERCE_MAX_SHORT),
    sku: sanitizeText(String(o.sku ?? ""), COMMERCE_MAX_SHORT),
    modelNumber: sanitizeText(String(o.modelNumber ?? ""), COMMERCE_MAX_SHORT),
    upc: sanitizeText(String(o.upc ?? ""), COMMERCE_MAX_SHORT),
    couponCode: sanitizeText(String(o.couponCode ?? ""), COMMERCE_MAX_SHORT),
    itemUrl,
    onlineAvailability: normalizeOnlineAvailability(o.onlineAvailability),
    itemUrlSource:
      o.itemUrlSource === "ai_visible" || o.itemUrlSource === "manual"
        ? o.itemUrlSource
        : itemUrl
          ? "manual"
          : "",
    metadataNote: sanitizeText(String(o.metadataNote ?? ""), COMMERCE_MAX_NOTE),
  };
}

export function ofertaLocalCommerceMetadataHasDisplayData(
  metadata: OfertaLocalItemCommerceMetadata
): boolean {
  return Boolean(
    metadata.itemNumber.trim() ||
      metadata.sku.trim() ||
      metadata.modelNumber.trim() ||
      metadata.upc.trim() ||
      metadata.couponCode.trim() ||
      metadata.itemUrl.trim()
  );
}

export function sanitizeOfertaLocalCommerceMetadataFromGeminiRaw(raw: {
  item_number?: unknown;
  sku?: unknown;
  model_number?: unknown;
  upc?: unknown;
  coupon_code?: unknown;
  item_url?: unknown;
  online_availability?: unknown;
}): OfertaLocalItemCommerceMetadata {
  const metadataNoteParts: string[] = [];
  const itemUrlRaw = sanitizeText(String(raw.item_url ?? ""), COMMERCE_MAX_URL);
  let itemUrl = "";
  let itemUrlSource: OfertaLocalItemUrlSource = "";
  if (itemUrlRaw) {
    const validated = validateOfertaLocalCommerceItemUrl(itemUrlRaw);
    if (validated) {
      itemUrl = validated;
      itemUrlSource = "ai_visible";
    } else {
      metadataNoteParts.push("AI item_url rejected (non-HTTPS or unsafe)");
    }
  }

  return {
    itemNumber: sanitizeText(String(raw.item_number ?? ""), COMMERCE_MAX_SHORT),
    sku: sanitizeText(String(raw.sku ?? ""), COMMERCE_MAX_SHORT),
    modelNumber: sanitizeText(String(raw.model_number ?? ""), COMMERCE_MAX_SHORT),
    upc: sanitizeText(String(raw.upc ?? ""), COMMERCE_MAX_SHORT),
    couponCode: sanitizeText(String(raw.coupon_code ?? ""), COMMERCE_MAX_SHORT),
    itemUrl,
    onlineAvailability: normalizeOnlineAvailability(raw.online_availability),
    itemUrlSource,
    metadataNote: metadataNoteParts.join(" · ").slice(0, COMMERCE_MAX_NOTE),
  };
}

export type OfertaLocalCommerceMetadataPatchResult =
  | { ok: true; metadata: OfertaLocalItemCommerceMetadata }
  | { ok: false; error: string };

export function sanitizeOfertaLocalCommerceMetadataPatch(
  raw: unknown,
  existing?: OfertaLocalItemCommerceMetadata
): OfertaLocalCommerceMetadataPatchResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "invalid_commerce_metadata" };
  }
  const o = raw as Record<string, unknown>;
  const base = existing ?? { ...EMPTY_OFERTA_LOCAL_ITEM_COMMERCE_METADATA };

  let itemUrl = base.itemUrl;
  let itemUrlSource = base.itemUrlSource;
  if (o.itemUrl !== undefined) {
    const rawUrl = sanitizeText(String(o.itemUrl ?? ""), COMMERCE_MAX_URL);
    if (!rawUrl) {
      itemUrl = "";
      itemUrlSource = "";
    } else {
      const validated = validateOfertaLocalCommerceItemUrl(rawUrl);
      if (validated === null) return { ok: false, error: "invalid_item_url" };
      itemUrl = validated;
      itemUrlSource = "manual";
    }
  }

  const metadata: OfertaLocalItemCommerceMetadata = {
    itemNumber:
      o.itemNumber !== undefined
        ? sanitizeText(String(o.itemNumber ?? ""), COMMERCE_MAX_SHORT)
        : base.itemNumber,
    sku: o.sku !== undefined ? sanitizeText(String(o.sku ?? ""), COMMERCE_MAX_SHORT) : base.sku,
    modelNumber:
      o.modelNumber !== undefined
        ? sanitizeText(String(o.modelNumber ?? ""), COMMERCE_MAX_SHORT)
        : base.modelNumber,
    upc: o.upc !== undefined ? sanitizeText(String(o.upc ?? ""), COMMERCE_MAX_SHORT) : base.upc,
    couponCode:
      o.couponCode !== undefined
        ? sanitizeText(String(o.couponCode ?? ""), COMMERCE_MAX_SHORT)
        : base.couponCode,
    itemUrl,
    onlineAvailability:
      o.onlineAvailability !== undefined
        ? normalizeOnlineAvailability(o.onlineAvailability)
        : base.onlineAvailability,
    itemUrlSource,
    metadataNote:
      o.metadataNote !== undefined
        ? sanitizeText(String(o.metadataNote ?? ""), COMMERCE_MAX_NOTE)
        : base.metadataNote,
  };

  if (!ONLINE_AVAILABILITY_VALUES.has(metadata.onlineAvailability)) {
    metadata.onlineAvailability = "unknown";
  }

  return { ok: true, metadata };
}

export function mergeCommerceMetadataIntoExtractedJson(
  existing: Record<string, unknown>,
  metadata: OfertaLocalItemCommerceMetadata
): Record<string, unknown> {
  return {
    ...existing,
    commerceMetadata: { ...metadata },
  };
}

export function formatOfertaLocalItemConfidenceLabel(
  confidence: number | null
): "high" | "medium" | "low" | "unknown" {
  if (confidence == null || Number.isNaN(confidence)) return "unknown";
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

export function mapOfertaLocalItemReviewRowToViewModel(row: OfertaLocalItemDbRow): OfertaLocalItemReviewViewModel {
  return {
    id: row.id,
    ofertaLocalId: row.oferta_local_id,
    scanJobId: row.scan_job_id,
    itemName: row.item_name,
    normalizedItemName: row.normalized_item_name ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    priceText: row.price_text ?? "",
    priceAmount: row.price_amount,
    regularPriceText: row.regular_price_text ?? "",
    unit: row.unit ?? "",
    dealType: row.deal_type ?? "",
    quantity: row.quantity ?? "",
    searchTags: row.search_tags ?? [],
    candidateType: row.candidate_type ?? "product_deal",
    couponTitle: row.coupon_title ?? "",
    offerText: row.offer_text ?? "",
    terms: row.terms ?? "",
    reviewStatus: row.review_status,
    confidence: row.confidence,
    confidenceLabel: formatOfertaLocalItemConfidenceLabel(row.confidence),
    sourceAssetId: row.source_asset_id ?? "",
    sourceAssetUrl: row.source_asset_url ?? "",
    sourceFileName: row.source_file_name ?? "",
    sourcePage: row.source_page,
    sourceContext: row.source_context ?? "",
    sourceBbox: parseSourceBbox(row.source_bbox),
    sourceCropUrl: row.source_crop_url ?? "",
    businessName: row.business_name ?? "",
    businessCity: row.business_city ?? "",
    businessState: row.business_state ?? "",
    businessZipCode: row.business_zip_code ?? "",
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    commerceMetadata: parseOfertaLocalCommerceMetadataFromExtractedJson(
      row.extracted_json as Record<string, unknown> | null
    ),
  };
}

export type OfertaLocalItemReviewPatchValidationResult =
  | { ok: true; patch: OfertaLocalItemReviewPatch }
  | { ok: false; error: string };

export function validateOfertaLocalItemReviewPatch(
  raw: unknown
): OfertaLocalItemReviewPatchValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "invalid_body" };
  }

  const o = raw as Record<string, unknown>;
  const patch: OfertaLocalItemReviewPatch = {};

  if (o.itemName !== undefined) {
    const itemName = sanitizeText(String(o.itemName), MAX_NAME);
    if (!itemName) return { ok: false, error: "item_name_required" };
    patch.itemName = itemName;
  }

  if (o.normalizedItemName !== undefined) {
    patch.normalizedItemName = sanitizeText(String(o.normalizedItemName), MAX_NAME);
  }

  if (o.category !== undefined) patch.category = sanitizeText(String(o.category), 80);
  if (o.subcategory !== undefined) patch.subcategory = sanitizeText(String(o.subcategory), 80);
  if (o.description !== undefined) patch.description = sanitizeText(String(o.description), MAX_NAME);
  if (o.regularPriceText !== undefined) patch.regularPriceText = sanitizeText(String(o.regularPriceText), MAX_SHORT);
  if (o.couponTitle !== undefined) patch.couponTitle = sanitizeText(String(o.couponTitle), MAX_NAME);
  if (o.offerText !== undefined) patch.offerText = sanitizeText(String(o.offerText), MAX_SHORT);
  if (o.terms !== undefined) patch.terms = sanitizeText(String(o.terms), MAX_NAME);
  if (o.priceText !== undefined) patch.priceText = sanitizeText(String(o.priceText), MAX_SHORT);
  if (o.unit !== undefined) patch.unit = sanitizeText(String(o.unit), MAX_SHORT);
  if (o.dealType !== undefined) patch.dealType = sanitizeText(String(o.dealType), MAX_SHORT);
  if (o.quantity !== undefined) patch.quantity = sanitizeText(String(o.quantity), MAX_SHORT);

  if (o.priceAmount !== undefined) {
    if (o.priceAmount === null || o.priceAmount === "") {
      patch.priceAmount = null;
    } else {
      const n = Number(o.priceAmount);
      if (!Number.isFinite(n) || n < 0) return { ok: false, error: "invalid_price_amount" };
      patch.priceAmount = n;
    }
  }

  if (o.searchTags !== undefined) {
    if (!Array.isArray(o.searchTags)) return { ok: false, error: "invalid_search_tags" };
    patch.searchTags = sanitizeTags(o.searchTags.map(String));
  }

  if (o.reviewStatus !== undefined) {
    const status = String(o.reviewStatus) as OfertaLocalItemReviewStatus;
    if (!REVIEW_STATUSES.has(status)) return { ok: false, error: "invalid_review_status" };
    patch.reviewStatus = status;
  }

  if (o.commerceMetadata !== undefined) {
    const commerce = sanitizeOfertaLocalCommerceMetadataPatch(o.commerceMetadata);
    if (!commerce.ok) return { ok: false, error: commerce.error };
    patch.commerceMetadata = commerce.metadata;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "empty_patch" };
  }

  return { ok: true, patch };
}

/** DB update payload — activates only when item approved and parent offer is approved. */
export function mapOfertaLocalItemReviewPatchToDbUpdate(
  patch: OfertaLocalItemReviewPatch,
  existing: Pick<
    OfertaLocalItemDbRow,
    "item_name" | "normalized_item_name" | "review_status" | "is_active" | "extracted_json"
  >,
  parentOfferStatus: OfertaLocalPublishStatus = "pending_review"
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    is_active: resolveOfertaLocalItemIsActiveOnReviewPatch(patch, existing, parentOfferStatus),
    updated_at: new Date().toISOString(),
  };

  if (patch.itemName !== undefined) {
    out.item_name = patch.itemName;
    out.normalized_item_name =
      patch.normalizedItemName !== undefined
        ? patch.normalizedItemName || normalizeOfertaLocalSearchText(patch.itemName)
        : normalizeOfertaLocalSearchText(patch.itemName);
  } else if (patch.normalizedItemName !== undefined) {
    out.normalized_item_name = patch.normalizedItemName;
  }

  if (patch.category !== undefined) out.category = patch.category || null;
  if (patch.subcategory !== undefined) out.subcategory = patch.subcategory || null;
  if (patch.description !== undefined) out.description = patch.description || null;
  if (patch.regularPriceText !== undefined) out.regular_price_text = patch.regularPriceText || null;
  if (patch.couponTitle !== undefined) out.coupon_title = patch.couponTitle || null;
  if (patch.offerText !== undefined) out.offer_text = patch.offerText || null;
  if (patch.terms !== undefined) out.terms = patch.terms || null;
  if (patch.priceText !== undefined) out.price_text = patch.priceText || null;
  if (patch.priceAmount !== undefined) out.price_amount = patch.priceAmount;
  if (patch.unit !== undefined) out.unit = patch.unit || null;
  if (patch.dealType !== undefined) out.deal_type = patch.dealType || null;
  if (patch.quantity !== undefined) out.quantity = patch.quantity || null;
  if (patch.searchTags !== undefined) out.search_tags = patch.searchTags;
  if (patch.reviewStatus !== undefined) out.review_status = patch.reviewStatus;

  if (patch.commerceMetadata !== undefined) {
    const existingJson = (existing.extracted_json as Record<string, unknown> | null) ?? {};
    const existingMeta = parseOfertaLocalCommerceMetadataFromExtractedJson(existingJson);
    const nextMeta: OfertaLocalItemCommerceMetadata = {
      ...patch.commerceMetadata,
      metadataNote: patch.commerceMetadata.metadataNote || existingMeta.metadataNote,
      itemUrlSource: patch.commerceMetadata.itemUrl
        ? patch.commerceMetadata.itemUrlSource ||
          (patch.commerceMetadata.itemUrl === existingMeta.itemUrl
            ? existingMeta.itemUrlSource
            : "manual")
        : "",
    };
    out.extracted_json = mergeCommerceMetadataIntoExtractedJson(existingJson, nextMeta);
  }

  if (existing && patch.itemName === undefined && patch.normalizedItemName === undefined) {
    // no-op preserve
  }

  return out;
}

export function summarizeOfertaLocalItemReviewCounts(
  items: OfertaLocalItemReviewViewModel[]
): Record<OfertaLocalItemReviewStatus, number> {
  const counts: Record<OfertaLocalItemReviewStatus, number> = {
    pending: 0,
    needs_review: 0,
    approved: 0,
    rejected: 0,
  };
  for (const item of items) {
    counts[item.reviewStatus] += 1;
  }
  return counts;
}

function parseSourceBbox(raw: Record<string, unknown> | null): OfertaLocalSourceBoundingBox | null {
  if (!raw) return null;
  const xMin = Number(raw.xMin);
  const yMin = Number(raw.yMin);
  const xMax = Number(raw.xMax);
  const yMax = Number(raw.yMax);
  if (![xMin, yMin, xMax, yMax].every((n) => Number.isFinite(n))) return null;
  return { xMin, yMin, xMax, yMax };
}

/** HTTPS-only crop URL safe for preview img src. */
export function getSafeOfertaLocalSourceCropUrl(url: string | null | undefined): string | null {
  const t = String(url ?? "").trim();
  if (!t.startsWith("https://")) return null;
  try {
    const parsed = new URL(t);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function resolveOfertaLocalItemCropDisplayUrl(
  item: Pick<OfertaLocalItemReviewViewModel, "sourceCropUrl">
): string | null {
  return getSafeOfertaLocalSourceCropUrl(item.sourceCropUrl);
}

export function itemHasMissingFlyerCrop(
  item: Pick<OfertaLocalItemReviewViewModel, "sourceCropUrl" | "sourceBbox" | "sourcePage">
): boolean {
  if (resolveOfertaLocalItemCropDisplayUrl(item)) return false;
  return Boolean(item.sourceBbox) || item.sourcePage != null;
}

/** Rehydrate DB row for crop backfill — does not mutate review fields. */
export function mapOfertaLocalItemReviewRowToSearchableDraft(
  row: OfertaLocalItemDbRow
): OfertaLocalSearchableItemDraft {
  return {
    id: row.id,
    ofertaLocalId: row.oferta_local_id,
    ownerId: row.owner_id,
    itemName: row.item_name,
    normalizedItemName: row.normalized_item_name ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    priceText: row.price_text ?? "",
    priceAmount: row.price_amount,
    regularPriceText: row.regular_price_text ?? "",
    unit: row.unit ?? "",
    dealType: row.deal_type ?? "",
    quantity: row.quantity ?? "",
    searchTags: row.search_tags ?? [],
    candidateType: row.candidate_type ?? "product_deal",
    couponTitle: row.coupon_title ?? "",
    offerText: row.offer_text ?? "",
    terms: row.terms ?? "",
    validFrom: row.valid_from ?? undefined,
    validUntil: row.valid_until ?? undefined,
    sourceAssetId: row.source_asset_id ?? "",
    sourceAssetUrl: row.source_asset_url ?? "",
    sourceFileName: row.source_file_name ?? "",
    sourcePage: row.source_page,
    sourceContext: row.source_context ?? "",
    sourceBbox: parseSourceBbox(row.source_bbox),
    sourceCropUrl: row.source_crop_url ?? "",
    extractedJson: (row.extracted_json as Record<string, unknown> | null) ?? {},
    confidence: row.confidence,
    reviewStatus: row.review_status,
    isActive: row.is_active,
  };
}
