/**
 * Ofertas Locales AI scan/item DB mapping — pure helpers (Stack 11).
 * No Supabase client, fetch, or external API calls.
 */

import {
  isOfertaLocalActiveByDates,
  normalizeOfertaLocalSearchText,
} from "./ofertasLocalesFormatting";
import type {
  OfertaLocalItemDbInsert,
  OfertaLocalItemPublicEligibilityInput,
  OfertaLocalPublishStatus,
  OfertaLocalScanJobDbInsert,
  OfertaLocalScanJobRecordDraft,
  OfertaLocalSearchableItemDraft,
} from "./ofertasLocalesTypes";

const MAX_TEXT = 4000;
const MAX_SHORT = 500;
const MAX_NAME = 200;
const MAX_TAGS = 25;

function sanitizeText(raw: string, max = MAX_TEXT): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
}

function sanitizeOptionalText(raw: string | undefined | null, max = MAX_TEXT): string | null {
  const t = sanitizeText(raw ?? "", max);
  return t || null;
}

function sanitizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    const n = normalizeOfertaLocalSearchText(tag);
    if (n && !out.includes(n) && out.length < MAX_TAGS) out.push(n);
  }
  return out;
}

function parseOptionalDate(raw: string | undefined | null): string | null {
  const t = sanitizeText(raw ?? "", 32);
  if (!t) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function parseOptionalNumber(raw: number | null | undefined): number | null {
  if (raw == null || Number.isNaN(raw)) return null;
  return raw;
}

/** Draft review fields → DB eligibility input. */
export function toOfertaLocalItemPublicEligibilityInput(
  item: Pick<OfertaLocalSearchableItemDraft, "reviewStatus" | "isActive" | "validFrom" | "validUntil">,
  parentOfferStatus: OfertaLocalPublishStatus | "" = ""
): OfertaLocalItemPublicEligibilityInput {
  return {
    review_status: item.reviewStatus,
    is_active: item.isActive !== false,
    valid_from: item.validFrom ?? null,
    valid_until: item.validUntil ?? null,
    parentOfferStatus,
  };
}

/** DB row → eligibility input. */
export function ofertaLocalItemDbRowToEligibilityInput(
  row: Pick<OfertaLocalItemDbInsert, "review_status" | "is_active" | "valid_from" | "valid_until">,
  parentOfferStatus: OfertaLocalPublishStatus | "" = ""
): OfertaLocalItemPublicEligibilityInput {
  return {
    review_status: row.review_status,
    is_active: row.is_active,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    parentOfferStatus,
  };
}

/**
 * Whether an item may become publicly eligible in a future public-results gate.
 * Does not grant public access by itself — no public RLS in Stack 11.
 */
export function canOfertaLocalItemBePubliclyEligible(
  item: OfertaLocalItemPublicEligibilityInput,
  parentStatus: OfertaLocalPublishStatus | "" = item.parentOfferStatus ?? ""
): boolean {
  if (item.review_status !== "approved") return false;
  if (!item.is_active) return false;
  if (parentStatus !== "approved") return false;

  const from = item.valid_from?.trim() ?? "";
  const until = item.valid_until?.trim() ?? "";
  if (from && until) {
    return isOfertaLocalActiveByDates(from, until);
  }

  return true;
}

export function mapOfertaLocalScanJobRecordDraftToDbInsert(
  scanJob: OfertaLocalScanJobRecordDraft,
  ownerId: string,
  ofertaLocalId: string
): OfertaLocalScanJobDbInsert {
  const owner = sanitizeText(ownerId, 64);
  const ofertaId = sanitizeText(ofertaLocalId, 64);

  return {
    oferta_local_id: ofertaId,
    owner_id: owner,
    source_asset_id: sanitizeOptionalText(scanJob.sourceAssetId, MAX_SHORT),
    source_asset_type: sanitizeOptionalText(scanJob.sourceAssetType, 64),
    source_asset_url: sanitizeOptionalText(scanJob.sourceAssetUrl, MAX_SHORT),
    provider: scanJob.provider,
    normalizer_provider: scanJob.normalizerProvider,
    status: scanJob.status,
    started_at: sanitizeOptionalText(scanJob.startedAt, 64),
    completed_at: sanitizeOptionalText(scanJob.completedAt, 64),
    raw_result_storage_path: sanitizeOptionalText(scanJob.rawResultStoragePath, MAX_SHORT),
    normalized_result_storage_path: sanitizeOptionalText(scanJob.normalizedResultStoragePath, MAX_SHORT),
    error_message: sanitizeOptionalText(scanJob.errorMessage, MAX_TEXT),
    pages_processed: scanJob.pagesProcessed ?? 0,
    items_extracted_count: scanJob.itemsExtractedCount ?? 0,
    confidence_average: parseOptionalNumber(scanJob.confidenceAverage),
  };
}

/** Alias for Stack 11 spec naming. */
export const mapOfertaLocalScanJobDraftToDbInsert = mapOfertaLocalScanJobRecordDraftToDbInsert;

export function mapOfertaLocalSearchableItemDraftToDbInsert(
  item: OfertaLocalSearchableItemDraft,
  ownerId: string,
  ofertaLocalId: string,
  scanJobId?: string | null
): OfertaLocalItemDbInsert {
  const owner = sanitizeText(ownerId, 64);
  const ofertaId = sanitizeText(ofertaLocalId, 64);
  const itemName = sanitizeText(item.itemName, MAX_NAME);
  const normalizedName =
    normalizeOfertaLocalSearchText(item.normalizedItemName || item.itemName) || itemName;

  return {
    oferta_local_id: ofertaId,
    scan_job_id: scanJobId ? sanitizeText(scanJobId, 64) : null,
    owner_id: owner,
    business_name: sanitizeOptionalText(item.businessName, MAX_NAME),
    business_address: sanitizeOptionalText(item.businessAddress, MAX_SHORT),
    business_city: sanitizeOptionalText(item.businessCity, 80),
    business_state: sanitizeOptionalText(item.businessState, 40),
    business_zip_code: sanitizeOptionalText(item.businessZipCode, 16),
    business_latitude: parseOptionalNumber(item.businessLatitude),
    business_longitude: parseOptionalNumber(item.businessLongitude),
    item_name: itemName,
    normalized_item_name: normalizedName,
    description: sanitizeOptionalText(item.description),
    price_text: sanitizeOptionalText(item.priceText, 64),
    price_amount: parseOptionalNumber(item.priceAmount),
    unit: sanitizeOptionalText(item.unit, 64),
    deal_type: sanitizeOptionalText(item.dealType, 64),
    quantity: sanitizeOptionalText(item.quantity, 64),
    category: sanitizeOptionalText(item.category, 80),
    subcategory: sanitizeOptionalText(item.subcategory, 80),
    search_tags: sanitizeTags(item.searchTags ?? []),
    valid_from: parseOptionalDate(item.validFrom),
    valid_until: parseOptionalDate(item.validUntil),
    source_asset_id: sanitizeOptionalText(item.sourceAssetId, MAX_SHORT),
    source_asset_url: sanitizeOptionalText(item.sourceAssetUrl, MAX_SHORT),
    source_page: item.sourcePage ?? null,
    source_crop_url: sanitizeOptionalText(item.sourceCropUrl, MAX_SHORT),
    confidence: parseOptionalNumber(item.confidence),
    review_status: item.reviewStatus ?? "pending",
    reviewer_note: sanitizeOptionalText(item.reviewerNote),
    is_active: item.isActive === true,
    is_sponsored: item.isSponsored === true,
    sponsorship_weight: item.sponsorshipWeight ?? 0,
  };
}
