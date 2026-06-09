/**
 * Ofertas Locales AI item owner review — pure mapping/validation (Stack B).
 */

import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import { resolveOfertaLocalItemIsActiveOnReviewPatch } from "./ofertasLocalesItemReviewActivation";
import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemReviewPatch,
  OfertaLocalItemReviewStatus,
  OfertaLocalItemReviewViewModel,
  OfertaLocalPublishStatus,
} from "./ofertasLocalesTypes";

const MAX_NAME = 200;
const MAX_SHORT = 64;
const MAX_TAGS = 25;

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
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    priceText: row.price_text ?? "",
    priceAmount: row.price_amount,
    unit: row.unit ?? "",
    dealType: row.deal_type ?? "",
    quantity: row.quantity ?? "",
    searchTags: row.search_tags ?? [],
    reviewStatus: row.review_status,
    confidence: row.confidence,
    confidenceLabel: formatOfertaLocalItemConfidenceLabel(row.confidence),
    sourceAssetId: row.source_asset_id ?? "",
    sourceAssetUrl: row.source_asset_url ?? "",
    sourcePage: row.source_page,
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

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "empty_patch" };
  }

  return { ok: true, patch };
}

/** DB update payload — activates only when item approved and parent offer is approved. */
export function mapOfertaLocalItemReviewPatchToDbUpdate(
  patch: OfertaLocalItemReviewPatch,
  existing: Pick<OfertaLocalItemDbRow, "item_name" | "normalized_item_name" | "review_status" | "is_active">,
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
  if (patch.priceText !== undefined) out.price_text = patch.priceText || null;
  if (patch.priceAmount !== undefined) out.price_amount = patch.priceAmount;
  if (patch.unit !== undefined) out.unit = patch.unit || null;
  if (patch.dealType !== undefined) out.deal_type = patch.dealType || null;
  if (patch.quantity !== undefined) out.quantity = patch.quantity || null;
  if (patch.searchTags !== undefined) out.search_tags = patch.searchTags;
  if (patch.reviewStatus !== undefined) out.review_status = patch.reviewStatus;

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
