/**
 * Manual coupon → searchable oferta_local_items row mapping (Two-Lane
 * Execution — Gap A). Reuses the certified, protected
 * mapOfertaLocalSearchableItemDraftToDbInsert() export unchanged (no
 * scanner file edited) so manually-authored coupons flow through the exact
 * same sanitization/normalization the AI pipeline already uses, with
 * scan_job_id left null — the existing, already-nullable marker this table
 * uses to distinguish "no scan involved" rows. No new table, no new search
 * engine: these rows are returned by the existing public-search route
 * unchanged, since that query has never filtered on scan_job_id.
 */
import { mapOfertaLocalSearchableItemDraftToDbInsert } from "./ofertasLocalesAiDbMapper";
import type {
  OfertaLocalCouponEntryDraft,
  OfertaLocalItemDbInsert,
  OfertaLocalSearchableItemDraft,
} from "./ofertasLocalesTypes";

export type OfertaLocalCouponSyncParentContext = {
  ownerId: string;
  ofertaLocalId: string;
  businessName: string;
  address: string | null;
  city: string;
  state: string | null;
  zipCode: string;
  businessCategory: string;
  marketType: string | null;
  customMarketType: string | null;
  validFrom: string;
  validUntil: string;
};

/** Marks a manual coupon item's extracted_json so it is never confused with an AI candidate. */
export const MANUAL_COUPON_EXTRACTED_JSON_MARKER = "manualCoupon" as const;

export function buildOfertaLocalCouponItemInsertRow(
  entry: OfertaLocalCouponEntryDraft,
  parent: OfertaLocalCouponSyncParentContext
): OfertaLocalItemDbInsert {
  const resolvedImage = entry.imageUploadedUrl.trim() || entry.imageUrl.trim();
  const searchableDraft: OfertaLocalSearchableItemDraft = {
    ofertaLocalId: parent.ofertaLocalId,
    ownerId: parent.ownerId,
    businessName: parent.businessName,
    businessAddress: parent.address ?? undefined,
    businessCity: parent.city,
    businessState: parent.state ?? undefined,
    businessZipCode: parent.zipCode,
    itemName: entry.title,
    normalizedItemName: entry.title,
    description: entry.description,
    category: parent.businessCategory,
    subcategory: parent.marketType || parent.customMarketType || "",
    priceText: "",
    priceAmount: null,
    unit: "",
    dealType: "",
    quantity: "",
    searchTags: [entry.couponCode, parent.businessCategory, parent.marketType ?? ""].filter(
      (t): t is string => Boolean(t && t.trim())
    ),
    candidateType: "coupon",
    couponTitle: entry.title,
    offerText: entry.description,
    terms: entry.redemptionNote,
    validFrom: parent.validFrom || undefined,
    validUntil: parent.validUntil || undefined,
    sourceAssetId: "",
    sourcePage: null,
    extractedJson: {
      [MANUAL_COUPON_EXTRACTED_JSON_MARKER]: true,
      couponEntryId: entry.id,
      couponCode: entry.couponCode || null,
      redemptionNote: entry.redemptionNote || null,
      imageUrl: resolvedImage || null,
    },
    confidence: null,
    reviewStatus: "approved",
    isActive: true,
  };

  const row = mapOfertaLocalSearchableItemDraftToDbInsert(
    searchableDraft,
    parent.ownerId,
    parent.ofertaLocalId,
    null
  );

  // The protected mapper doesn't thread a draft id through to the insert row
  // (AI items get their id from the DB on first insert) — the coupon editor
  // already generates a stable client-side UUID per entry, so we reuse it
  // as the row's own primary key here, in this unprotected file, to get a
  // free, exact upsert key: same coupon edited twice -> same row updated,
  // never duplicated.
  return { ...row, id: entry.id };
}

export function buildOfertaLocalCouponItemInsertRows(
  entries: OfertaLocalCouponEntryDraft[],
  parent: OfertaLocalCouponSyncParentContext
): OfertaLocalItemDbInsert[] {
  return entries
    .filter((entry) => entry.title.trim().length > 0)
    .map((entry) => buildOfertaLocalCouponItemInsertRow(entry, parent));
}

/** Ids of previously-synced manual coupon items no longer present in the current entry set. */
export function findStaleOfertaLocalCouponItemIds(
  existingManualItemIds: string[],
  currentEntryIds: string[]
): string[] {
  const current = new Set(currentEntryIds);
  return existingManualItemIds.filter((id) => !current.has(id));
}
