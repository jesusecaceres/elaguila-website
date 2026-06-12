import { OFERTAS_LOCALES_VALIDATION_LIMITS } from "./ofertasLocalesConstants";
import {
  normalizeOfertaLocalPhoneInput,
  normalizeOfertaLocalUrlInput,
  normalizeOfertaLocalZipInput,
} from "./ofertasLocalesFormatting";
import { activeOfertaLocalDraftAssets } from "./ofertasLocalesDraftAssetHelpers";
import type {
  OfertaLocalDraft,
  OfertaLocalDraftAsset,
  OfertaLocalValidationIssue,
} from "./ofertasLocalesTypes";

const LIMITS = OFERTAS_LOCALES_VALIDATION_LIMITS;

function pushIssue(
  issues: OfertaLocalValidationIssue[],
  field: string,
  message: string,
  severity: OfertaLocalValidationIssue["severity"]
) {
  issues.push({ field, message, severity });
}

function hasContactChannel(draft: OfertaLocalDraft): boolean {
  const phone = normalizeOfertaLocalPhoneInput(draft.phone);
  const whatsapp = normalizeOfertaLocalPhoneInput(draft.whatsapp);
  const website = normalizeOfertaLocalUrlInput(draft.websiteUrl);
  return (
    phone.length >= LIMITS.phoneDigitsMin ||
    whatsapp.length >= LIMITS.whatsappDigitsMin ||
    Boolean(website)
  );
}

function hasFlyerAsset(draft: OfertaLocalDraft): boolean {
  return activeOfertaLocalDraftAssets(draft.flyerAssets).length > 0;
}

function validateDraftAssetIssues(
  issues: OfertaLocalValidationIssue[],
  asset: OfertaLocalDraftAsset,
  fieldPrefix: string
) {
  if (asset.title.trim().length > LIMITS.draftAssetTitleMax) {
    pushIssue(
      issues,
      `${fieldPrefix}.${asset.id}.title`,
      `El título del archivo es demasiado largo (máx. ${LIMITS.draftAssetTitleMax}).`,
      "warning"
    );
  }
  if (asset.assetType === "external_url" && asset.url.trim()) {
    if (!normalizeOfertaLocalUrlInput(asset.url)) {
      pushIssue(
        issues,
        `${fieldPrefix}.${asset.id}.url`,
        "La URL externa del archivo debe ser válida (http o https).",
        "error"
      );
    }
  }
}

function appendDraftAssetValidation(issues: OfertaLocalValidationIssue[], draft: OfertaLocalDraft) {
  for (const asset of activeOfertaLocalDraftAssets(draft.flyerAssets)) {
    validateDraftAssetIssues(issues, asset, "flyerAssets");
  }
  for (const asset of activeOfertaLocalDraftAssets(draft.couponAssets)) {
    validateDraftAssetIssues(issues, asset, "couponAssets");
  }
}

function hasCouponContent(draft: OfertaLocalDraft): boolean {
  return Boolean(draft.couponText.trim() || draft.description.trim());
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(d.getTime());
}

function validateOptionalUrlField(
  issues: OfertaLocalValidationIssue[],
  field: string,
  raw: string,
  label: string
) {
  const t = String(raw ?? "").trim();
  if (!t) return;
  if (!normalizeOfertaLocalUrlInput(t)) {
    pushIssue(issues, field, `${label} debe ser una URL válida (http o https).`, "error");
  }
}

function appendOptionalUrlValidation(issues: OfertaLocalValidationIssue[], draft: OfertaLocalDraft) {
  validateOptionalUrlField(issues, "membershipUrl", draft.membershipUrl, "La URL de membresía");
  validateOptionalUrlField(issues, "digitalCouponUrl", draft.digitalCouponUrl, "La URL del cupón digital");
}

/** Gentle checks for future preview surfaces. */
export function validateOfertaLocalDraftForPreview(draft: OfertaLocalDraft): OfertaLocalValidationIssue[] {
  const issues: OfertaLocalValidationIssue[] = [];

  if (!draft.businessName.trim()) {
    pushIssue(issues, "businessName", "Agrega el nombre del negocio para ver la vista previa.", "warning");
  }
  if (!draft.title.trim()) {
    pushIssue(issues, "title", "Agrega un título para la vista previa.", "warning");
  }
  if (!draft.offerType) {
    pushIssue(issues, "offerType", "Elige un tipo de oferta para la vista previa.", "warning");
  }

  appendOptionalUrlValidation(issues, draft);
  appendDraftAssetValidation(issues, draft);

  return issues;
}

/** Stricter checks aligned with future publish requirements (not wired to API in Gate 1). */
export function validateOfertaLocalDraftForFuturePublish(
  draft: OfertaLocalDraft
): OfertaLocalValidationIssue[] {
  const issues: OfertaLocalValidationIssue[] = [];

  if (!draft.offerType) {
    pushIssue(issues, "offerType", "El tipo de oferta es obligatorio.", "error");
  }
  if (!draft.businessCategory) {
    pushIssue(issues, "businessCategory", "La categoría del negocio es obligatoria.", "error");
  }
  if (
    draft.businessCategory === "other_business" &&
    !draft.customMarketType.trim()
  ) {
    pushIssue(issues, "customMarketType", "Agrega el tipo de negocio.", "error");
  }
  if (
    draft.marketType === "other" &&
    draft.businessCategory !== "other_business" &&
    !draft.customMarketType.trim()
  ) {
    pushIssue(issues, "customMarketType", "Agrega el tipo de negocio.", "error");
  }
  if (draft.businessName.trim().length < LIMITS.businessNameMin) {
    pushIssue(issues, "businessName", "El nombre del negocio es obligatorio.", "error");
  }
  if (draft.title.trim().length < LIMITS.titleMin) {
    pushIssue(issues, "title", "El título es obligatorio.", "error");
  }
  if (!draft.validFrom.trim() || !isIsoDate(draft.validFrom.trim())) {
    pushIssue(issues, "validFrom", "La fecha de inicio es obligatoria (YYYY-MM-DD).", "error");
  }
  if (!draft.validUntil.trim() || !isIsoDate(draft.validUntil.trim())) {
    pushIssue(issues, "validUntil", "La fecha de fin es obligatoria (YYYY-MM-DD).", "error");
  }
  if (
    draft.validFrom.trim() &&
    draft.validUntil.trim() &&
    isIsoDate(draft.validFrom.trim()) &&
    isIsoDate(draft.validUntil.trim()) &&
    draft.validFrom.trim() > draft.validUntil.trim()
  ) {
    pushIssue(issues, "validUntil", "La fecha de fin debe ser igual o posterior a la de inicio.", "error");
  }
  if (!draft.city.trim()) {
    pushIssue(issues, "city", "La ciudad es obligatoria.", "error");
  }
  const zip = normalizeOfertaLocalZipInput(draft.zipCode);
  if (zip.length !== LIMITS.zipCodeLen) {
    pushIssue(issues, "zipCode", "El código postal (ZIP) de 5 dígitos es obligatorio.", "error");
  }
  if (!hasContactChannel(draft)) {
    pushIssue(
      issues,
      "phone",
      "Agrega teléfono, WhatsApp o sitio web para que te contacten.",
      "error"
    );
  }

  if (draft.offerType === "weekly_flyer" && !hasFlyerAsset(draft)) {
    pushIssue(
      issues,
      "flyerAssets",
      "Al publicar, el volante semanal requerirá al menos un archivo (PDF o imagen).",
      "warning"
    );
  }

  if (
    (draft.offerType === "coupon" || draft.offerType === "promotion") &&
    !hasCouponContent(draft)
  ) {
    pushIssue(
      issues,
      "couponText",
      "Los cupones y promociones requieren texto del cupón o una descripción.",
      "error"
    );
  }

  appendOptionalUrlValidation(issues, draft);
  appendDraftAssetValidation(issues, draft);

  return issues;
}

/** Structured missing-field summary for future publish UI. */
export function listOfertaLocalDraftMissingFieldsForFuturePublish(
  draft: OfertaLocalDraft
): string[] {
  return validateOfertaLocalDraftForFuturePublish(draft)
    .filter((i) => i.severity === "error")
    .map((i) => i.field);
}
