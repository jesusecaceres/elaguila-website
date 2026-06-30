import {
  activeOfertaLocalDraftAssets,
  assetHasExternalUrlReady,
  assetHasUploadedStorage,
} from "./ofertasLocalesDraftAssetHelpers";
import {
  normalizeOfertaLocalPhoneInput,
  normalizeOfertaLocalStateInput,
  normalizeOfertaLocalUrlInput,
  normalizeOfertaLocalZipInput,
  buildOfertaLocalGoogleMapsSearchUrl,
} from "./ofertasLocalesFormatting";
import { normalizeOfertaLocalDraftCategoryFields } from "./ofertasLocalesBusinessCategoryUx";
import { inferPrimaryAdFormatFromDraft } from "./ofertasLocalesTwoLaneProductModel";
import { validateOfertaLocalDraftForFuturePublish } from "./ofertasLocalesValidation";
import type {
  OfertaLocalDbInsertPayload,
  OfertaLocalDraft,
  OfertaLocalDraftAsset,
  OfertaLocalPublishedAssetMetadata,
  OfertaLocalValidationIssue,
} from "./ofertasLocalesTypes";

const MAX_TEXT = 8000;
const MAX_SHORT = 500;
const MAX_TITLE = 200;
const INTERNAL_METADATA_PREFIX = "[ofertas_locales_metadata]";

function sanitizeText(raw: string, max = MAX_TEXT): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
}

function sanitizeOptionalText(raw: string, max = MAX_TEXT): string | null {
  const t = sanitizeText(raw, max);
  return t || null;
}

function sanitizeOptionalUrl(raw: string): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  return normalizeOfertaLocalUrlInput(t) || null;
}

function sanitizeOptionalPhone(raw: string): string | null {
  const d = normalizeOfertaLocalPhoneInput(raw);
  return d.length >= 10 ? d : d || null;
}

function sanitizeOptionalState(raw: string): string | null {
  const t = normalizeOfertaLocalStateInput(raw);
  return t || null;
}

function sanitizeZipList(zips: string[]): string[] {
  const out: string[] = [];
  for (const z of zips) {
    const n = normalizeOfertaLocalZipInput(z);
    if (n && !out.includes(n)) out.push(n);
  }
  return out.slice(0, 50);
}

export function assetIsPublishReady(asset: OfertaLocalDraftAsset): boolean {
  if (asset.assetType === "external_url") return assetHasExternalUrlReady(asset);
  return assetHasUploadedStorage(asset) || Boolean(sanitizeOptionalUrl(asset.url));
}

function mapAssetToPublishedMetadata(asset: OfertaLocalDraftAsset): OfertaLocalPublishedAssetMetadata {
  return {
    id: sanitizeText(asset.id, 80),
    assetType: asset.assetType,
    title: sanitizeText(asset.title, 120),
    note: sanitizeText(asset.note, MAX_SHORT),
    url: sanitizeOptionalUrl(asset.url) ?? "",
    fileName: sanitizeText(asset.fileName, 160),
    mimeType: sanitizeText(asset.mimeType, 80),
    storagePath: sanitizeText(asset.storagePath, 500),
    sizeBytes:
      typeof asset.sizeBytes === "number" && Number.isFinite(asset.sizeBytes) && asset.sizeBytes >= 0
        ? asset.sizeBytes
        : null,
    pageNumber:
      typeof asset.pageNumber === "number" && Number.isFinite(asset.pageNumber)
        ? asset.pageNumber
        : null,
    sortOrder: typeof asset.sortOrder === "number" ? asset.sortOrder : 0,
  };
}

function mapAssets(assets: OfertaLocalDraftAsset[]): OfertaLocalPublishedAssetMetadata[] {
  return activeOfertaLocalDraftAssets(assets)
    .filter(assetIsPublishReady)
    .map(mapAssetToPublishedMetadata);
}

function buildOfertaLocalInternalNotesForPublish(draft: OfertaLocalDraft): string | null {
  const chunks: string[] = [];
  const userNote = sanitizeOptionalText(draft.internalNotes ?? "", MAX_SHORT);
  if (userNote) chunks.push(userNote);

  const socialLinks: Record<string, string> = {};
  const fb = sanitizeOptionalUrl(draft.facebookUrl);
  if (fb) socialLinks.facebookUrl = fb;
  const ig = sanitizeOptionalUrl(draft.instagramUrl);
  if (ig) socialLinks.instagramUrl = ig;
  const tt = sanitizeOptionalUrl(draft.tiktokUrl);
  if (tt) socialLinks.tiktokUrl = tt;
  const yt = sanitizeOptionalUrl(draft.youtubeUrl);
  if (yt) socialLinks.youtubeUrl = yt;
  const gb = sanitizeOptionalUrl(draft.googleBusinessUrl);
  if (gb) socialLinks.googleBusinessUrl = gb;
  const gr = sanitizeOptionalUrl(draft.googleReviewUrl);
  if (gr) socialLinks.googleReviewUrl = gr;
  const yelp = sanitizeOptionalUrl(draft.yelpUrl);
  if (yelp) socialLinks.yelpUrl = yelp;

  const metadata: Record<string, unknown> = {};
  if (Object.keys(socialLinks).length) metadata.socialLinks = socialLinks;
  if (draft.wantsFeaturedPlacement && draft.featuredPlacementScope !== "none") {
    metadata.featuredPlacementScope = draft.featuredPlacementScope;
  }
  if (draft.wantsAiSearchableSpecials) metadata.wantsAiSearchableSpecials = true;
  const customMarket = sanitizeOptionalText(draft.customMarketType ?? "", 120);
  if (customMarket) metadata.customMarketType = customMarket;
  const primaryAdFormat = inferPrimaryAdFormatFromDraft(draft);
  if (primaryAdFormat) metadata.primaryAdFormat = primaryAdFormat;

  if (Object.keys(metadata).length) {
    chunks.push(`${INTERNAL_METADATA_PREFIX}${JSON.stringify(metadata)}`);
  }

  if (!chunks.length) return null;
  return chunks.join("\n\n").slice(0, MAX_SHORT);
}

export function validateOfertaLocalDraftForServerPublish(
  draft: OfertaLocalDraft,
  ownerId?: string | null
): OfertaLocalValidationIssue[] {
  const issues = [...validateOfertaLocalDraftForFuturePublish(draft)];

  if (!ownerId?.trim()) {
    issues.push({
      field: "ownerId",
      message: "Debes iniciar sesión para enviar la oferta.",
      severity: "error",
    });
  }

  for (const asset of activeOfertaLocalDraftAssets(draft.flyerAssets)) {
    if (!assetIsPublishReady(asset)) {
      issues.push({
        field: `flyerAssets.${asset.id}`,
        message:
          "Cada archivo de volante debe estar subido o tener una URL externa válida antes de enviar.",
        severity: "error",
      });
    }
  }

  for (const asset of activeOfertaLocalDraftAssets(draft.couponAssets)) {
    if (!assetIsPublishReady(asset)) {
      issues.push({
        field: `couponAssets.${asset.id}`,
        message:
          "Cada archivo de cupón debe estar subido o tener una URL externa válida antes de enviar.",
        severity: "error",
      });
    }
  }

  if (draft.offerType === "weekly_flyer") {
    const readyFlyers = activeOfertaLocalDraftAssets(draft.flyerAssets).filter(assetIsPublishReady);
    if (readyFlyers.length < 1) {
      issues.push({
        field: "flyerAssets",
        message: "El volante semanal requiere al menos un archivo subido o URL externa.",
        severity: "error",
      });
    }
  }

  return issues;
}

export function mapOfertaLocalDraftToInsertPayload(
  draft: OfertaLocalDraft,
  ownerId: string
): OfertaLocalDbInsertPayload {
  const now = new Date().toISOString();
  const zip = normalizeOfertaLocalZipInput(draft.zipCode);
  const categoryFields = normalizeOfertaLocalDraftCategoryFields(draft);
  const businessCategory = categoryFields.businessCategory;
  const marketType =
    businessCategory === "other_business"
      ? categoryFields.customMarketType.trim()
        ? "other"
        : null
      : categoryFields.marketType
        ? String(categoryFields.marketType)
        : null;

  return {
    owner_id: ownerId,
    status: "pending_review",
    offer_type: String(draft.offerType),
    business_category: String(businessCategory),
    market_type: marketType,
    business_name: sanitizeText(draft.businessName, MAX_TITLE),
    title: sanitizeText(draft.title, MAX_TITLE),
    description: sanitizeOptionalText(draft.description),
    coupon_text: sanitizeOptionalText(draft.couponText),
    flyer_title: sanitizeOptionalText(draft.flyerTitle.trim() || draft.title, 160),
    valid_from: draft.validFrom.trim(),
    valid_until: draft.validUntil.trim(),
    address: sanitizeOptionalText(draft.address, 300),
    city: sanitizeText(draft.city, 120),
    state: sanitizeOptionalState(draft.state),
    zip_code: zip,
    service_zips: sanitizeZipList(draft.serviceZipCodes),
    phone: sanitizeOptionalPhone(draft.phone),
    whatsapp: sanitizeOptionalPhone(draft.whatsapp),
    website_url: sanitizeOptionalUrl(draft.websiteUrl),
    directions_url:
      sanitizeOptionalUrl(draft.directionsUrl) ||
      sanitizeOptionalUrl(buildOfertaLocalGoogleMapsSearchUrl(draft)),
    membership_url: sanitizeOptionalUrl(draft.membershipUrl),
    membership_note: sanitizeOptionalText(draft.membershipNote),
    digital_coupon_url: sanitizeOptionalUrl(draft.digitalCouponUrl),
    digital_coupon_note: sanitizeOptionalText(draft.digitalCouponNote),
    is_magazine_pickup_partner: Boolean(draft.isMagazinePickupPartner),
    flyer_assets: mapAssets(draft.flyerAssets),
    coupon_assets: mapAssets(draft.couponAssets),
    is_featured_requested: Boolean(draft.wantsFeaturedPlacement || draft.isFeaturedRequested),
    language_tags: draft.languageTags.filter((t) => t === "es" || t === "en" || t === "bilingual"),
    internal_notes: buildOfertaLocalInternalNotesForPublish(draft),
    submitted_at: now,
  };
}
