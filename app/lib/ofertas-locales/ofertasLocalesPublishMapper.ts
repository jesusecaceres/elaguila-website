import {
  activeOfertaLocalDraftAssets,
  assetHasExternalUrlReady,
  assetHasUploadedStorage,
} from "./ofertasLocalesDraftAssetHelpers";
import {
  normalizeOfertaLocalPhoneInput,
  normalizeOfertaLocalUrlInput,
  normalizeOfertaLocalZipInput,
} from "./ofertasLocalesFormatting";
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

function sanitizeZipList(zips: string[]): string[] {
  const out: string[] = [];
  for (const z of zips) {
    const n = normalizeOfertaLocalZipInput(z);
    if (n.length === 5 && !out.includes(n)) out.push(n);
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

  return {
    owner_id: ownerId,
    status: "pending_review",
    offer_type: String(draft.offerType),
    business_category: String(draft.businessCategory),
    market_type: draft.marketType ? String(draft.marketType) : null,
    business_name: sanitizeText(draft.businessName, MAX_TITLE),
    title: sanitizeText(draft.title, MAX_TITLE),
    description: sanitizeOptionalText(draft.description),
    coupon_text: sanitizeOptionalText(draft.couponText),
    flyer_title: sanitizeOptionalText(draft.flyerTitle, 160),
    valid_from: draft.validFrom.trim(),
    valid_until: draft.validUntil.trim(),
    address: sanitizeOptionalText(draft.address, 300),
    city: sanitizeText(draft.city, 120),
    state: sanitizeOptionalText(draft.state, 40),
    zip_code: zip,
    service_zip_codes: sanitizeZipList(draft.serviceZipCodes),
    phone: sanitizeOptionalPhone(draft.phone),
    whatsapp: sanitizeOptionalPhone(draft.whatsapp),
    website_url: sanitizeOptionalUrl(draft.websiteUrl),
    directions_url: sanitizeOptionalUrl(draft.directionsUrl),
    membership_url: sanitizeOptionalUrl(draft.membershipUrl),
    membership_cta_label: sanitizeOptionalText(draft.membershipCtaLabel, 80),
    membership_note: sanitizeOptionalText(draft.membershipNote),
    requires_membership_for_deals: Boolean(draft.requiresMembershipForDeals),
    digital_coupon_url: sanitizeOptionalUrl(draft.digitalCouponUrl),
    digital_coupon_note: sanitizeOptionalText(draft.digitalCouponNote),
    is_magazine_pickup_partner: Boolean(draft.isMagazinePickupPartner),
    magazine_distribution_status: String(draft.magazineDistributionStatus || "not_offered"),
    magazine_monthly_drop_estimate: sanitizeOptionalText(draft.magazineMonthlyDropEstimate, 80),
    magazine_pickup_notes: sanitizeOptionalText(draft.magazinePickupNotes),
    flyer_assets: mapAssets(draft.flyerAssets),
    coupon_assets: mapAssets(draft.couponAssets),
    is_featured_requested: Boolean(draft.isFeaturedRequested),
    language_tags: draft.languageTags.filter((t) => t === "es" || t === "en" || t === "bilingual"),
    internal_notes: sanitizeOptionalText(draft.internalNotes ?? "", MAX_SHORT),
    submitted_at: now,
  };
}
