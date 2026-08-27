import { isOfertaLocalAiIncludedInPackage } from "./ofertasLocalesApplicationHelpers";
import { getOfertaLocalScanEligibleAssets } from "./ofertasLocalesAiScanReadiness";
import { OFERTAS_LOCALES_VALIDATION_LIMITS } from "./ofertasLocalesConstants";
import { normalizeOfertaLocalZipInput } from "./ofertasLocalesFormatting";
import { mapOfertaLocalDraftToInsertPayload } from "./ofertasLocalesPublishMapper";
import type { OfertaLocalDraft, OfertaLocalDbInsertPayload, OfertaLocalValidationIssue } from "./ofertasLocalesTypes";
import { hasContactChannel } from "./ofertasLocalesValidation";

const LIMITS = OFERTAS_LOCALES_VALIDATION_LIMITS;

/**
 * Minimum draft fields + uploaded scan-ready asset to create/update a server
 * record for AI scan. Deliberately narrower than the full final-publish
 * validator: publish-only fields (offer validity dates, coupon text) aren't
 * required to start a scan — they're still enforced later at final
 * publish/submission.
 */
export function validateOfertaLocalDraftForAiScanPersist(
  draft: OfertaLocalDraft,
  ownerId?: string | null,
  options?: { skipAuth?: boolean }
): OfertaLocalValidationIssue[] {
  const issues: OfertaLocalValidationIssue[] = [];

  if (!draft.businessCategory) {
    issues.push({
      field: "businessCategory",
      message: "La categoría del negocio es obligatoria.",
      severity: "error",
    });
  }
  if (draft.businessCategory === "other_business" && !draft.customMarketType.trim()) {
    issues.push({
      field: "customMarketType",
      message: "Agrega el tipo de negocio.",
      severity: "error",
    });
  }
  if (
    draft.marketType === "other" &&
    draft.businessCategory !== "other_business" &&
    !draft.customMarketType.trim()
  ) {
    issues.push({
      field: "customMarketType",
      message: "Agrega el tipo de negocio.",
      severity: "error",
    });
  }
  if (draft.businessName.trim().length < LIMITS.businessNameMin) {
    issues.push({
      field: "businessName",
      message: "El nombre del negocio es obligatorio.",
      severity: "error",
    });
  }
  if (draft.title.trim().length < LIMITS.titleMin) {
    issues.push({ field: "title", message: "El título es obligatorio.", severity: "error" });
  }
  if (!draft.city.trim()) {
    issues.push({ field: "city", message: "La ciudad es obligatoria.", severity: "error" });
  }
  if (normalizeOfertaLocalZipInput(draft.zipCode).length < 2) {
    issues.push({
      field: "zipCode",
      message: "El código postal es obligatorio.",
      severity: "error",
    });
  }
  if (!hasContactChannel(draft)) {
    issues.push({
      field: "phone",
      message: "Agrega teléfono, WhatsApp o sitio web para que te contacten.",
      severity: "error",
    });
  }

  if (!isOfertaLocalAiIncludedInPackage(draft)) {
    issues.push({
      field: "wantsAiSearchableSpecials",
      message: "Activa Búsqueda por producto con AI para escanear archivos.",
      severity: "error",
    });
  }

  const eligibleCount = getOfertaLocalScanEligibleAssets(draft).length;
  if (eligibleCount < 1) {
    issues.push({
      field: "assets",
      message: "Sube un PDF, JPG o PNG subido para activar el escaneo AI.",
      severity: "error",
    });
  }

  if (!options?.skipAuth && !ownerId?.trim()) {
    issues.push({
      field: "ownerId",
      message: "Debes iniciar sesión para escanear con AI.",
      severity: "error",
    });
  }

  return issues;
}

export function canOfertaLocalDraftPersistForAiScan(draft: OfertaLocalDraft): boolean {
  return (
    validateOfertaLocalDraftForAiScanPersist(draft, null, { skipAuth: true }).filter(
      (i) => i.severity === "error"
    ).length === 0
  );
}

export function listOfertaLocalDraftMissingFieldsForAiScanPersist(
  draft: OfertaLocalDraft,
  ownerId?: string | null
): string[] {
  return validateOfertaLocalDraftForAiScanPersist(draft, ownerId)
    .filter((i) => i.severity === "error")
    .map((i) => i.field);
}

/** Update payload for scan-prep — preserves owner_id and submitted_at on the server. */
export function mapOfertaLocalDraftToScanPrepUpdatePayload(
  draft: OfertaLocalDraft,
  ownerId: string
): Omit<OfertaLocalDbInsertPayload, "owner_id" | "submitted_at"> & { updated_at: string } {
  const insert = mapOfertaLocalDraftToInsertPayload(draft, ownerId);
  const { owner_id: _owner, submitted_at: _submitted, ...rest } = insert;
  return {
    ...rest,
    updated_at: new Date().toISOString(),
  };
}
