import { mergeComidaLocalDraftFromStorage } from "./comidaLocalDraftPersistence";
import type { ComidaLocalDraft } from "./comidaLocalTypes";

/**
 * Comida Local LEGACY ROW -> draft reverse mapper (pure, read-only, no I/O).
 *
 * Rows written before `listing_json` existed (or with an unusable one) still carry the NORMALIZED
 * columns that `draftToComidaLocalPublicListingInsert` writes. This is the deterministic inverse of
 * that forward mapping, restricted to the fields the columns actually hold:
 *   business_name, food_type, food_type_custom, city_canonical, city_display, zone_note, que_vendes,
 *   phone, whatsapp, instagram_url, facebook_url, tiktok_url, location_note, location_url,
 *   availability_note, service_options, payment_methods, payment_other_note, price_level, languages,
 *   main_photo, logo_image, gallery_images.
 * Everything the columns do NOT hold (smsPhone, email, businessType, weekly hours, highlights, custom
 * "other" values, address line, additional websites, event/catering/meal-prep notes...) is left at the
 * empty-draft default: nothing is guessed or fabricated. The values are passed through the SAME
 * tolerant allowlist merge every stored draft goes through (`mergeComidaLocalDraftFromStorage`), so an
 * unexpected column value is dropped by the same rules, never trusted raw.
 *
 * SAFE-RECONSTRUCTION MINIMUM (the fail-visible line). A row is reconstructed only when it has ALL of:
 *   1. a non-empty `business_name`,
 *   2. a non-empty `que_vendes`,
 *   3. a city (`city_display` OR `city_canonical`),
 *   4. at least one contact channel (`phone` OR `whatsapp`).
 * These are the same essentials the publish-readiness validator demands of a listing
 * (comidaLocalValidation.ts), so a row that lacks any of them is too incomplete for the columns to be
 * a trustworthy picture of what is stored; it is REFUSED (`ok: false`, with the missing keys) and the
 * caller must fail visibly instead of opening a blank form over the real row. The caller (edit-context
 * hydration) additionally requires `slug` and `draft_listing_id` so a same-row save stays possible.
 *
 * Video: Comida Local carries no video field anywhere (draft, columns, publish validator
 * `maxExternalVideos: 0`), so there is nothing to map or preserve.
 */

export type ComidaLocalLegacyReconstructionMissing = "business_name" | "que_vendes" | "city" | "contact";

export type ComidaLocalLegacyReconstruction =
  | { ok: true; draft: ComidaLocalDraft }
  | { ok: false; missing: ComidaLocalLegacyReconstructionMissing[] };

/** Columns the owner-scoped edit fetch must select so a legacy row can be reconstructed. */
export const COMIDA_LOCAL_LEGACY_ROW_COLUMNS = [
  "business_name",
  "food_type",
  "food_type_custom",
  "city_canonical",
  "city_display",
  "zone_note",
  "que_vendes",
  "phone",
  "whatsapp",
  "instagram_url",
  "facebook_url",
  "tiktok_url",
  "location_note",
  "location_url",
  "availability_note",
  "service_options",
  "payment_methods",
  "payment_other_note",
  "price_level",
  "languages",
  "main_photo",
  "logo_image",
  "gallery_images",
] as const;

function col(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v.trim() : "";
}

function colArray(row: Record<string, unknown>, key: string): unknown[] {
  const v = row[key];
  return Array.isArray(v) ? v : [];
}

export function comidaLocalDraftFromLegacyRowColumns(row: Record<string, unknown>): ComidaLocalLegacyReconstruction {
  const missing: ComidaLocalLegacyReconstructionMissing[] = [];
  if (!col(row, "business_name")) missing.push("business_name");
  if (!col(row, "que_vendes")) missing.push("que_vendes");
  if (!col(row, "city_display") && !col(row, "city_canonical")) missing.push("city");
  if (!col(row, "phone") && !col(row, "whatsapp")) missing.push("contact");
  if (missing.length > 0) return { ok: false, missing };

  const storageShape: Record<string, unknown> = {
    businessName: col(row, "business_name"),
    foodType: col(row, "food_type"),
    foodTypeCustom: col(row, "food_type_custom"),
    cityCanonical: col(row, "city_canonical"),
    cityDisplay: col(row, "city_display"),
    zoneNote: col(row, "zone_note"),
    queVendes: col(row, "que_vendes"),
    phone: col(row, "phone"),
    whatsapp: col(row, "whatsapp"),
    instagramUrl: col(row, "instagram_url"),
    facebookUrl: col(row, "facebook_url"),
    tiktokUrl: col(row, "tiktok_url"),
    locationNote: col(row, "location_note"),
    locationUrl: col(row, "location_url"),
    availabilityNote: col(row, "availability_note"),
    serviceOptions: colArray(row, "service_options"),
    paymentMethods: colArray(row, "payment_methods"),
    paymentOtherNote: col(row, "payment_other_note"),
    priceLevel: col(row, "price_level"),
    languages: colArray(row, "languages"),
    mainPhoto: row.main_photo ?? null,
    logoImage: row.logo_image ?? null,
    galleryImages: colArray(row, "gallery_images"),
  };
  return { ok: true, draft: mergeComidaLocalDraftFromStorage(storageShape) };
}
