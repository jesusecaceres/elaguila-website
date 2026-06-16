import { isOfertaLocalCouponPromotionFlow } from "./ofertasLocalesApplicationHelpers";
import { getOfertaLocalScanEligibleAssets } from "./ofertasLocalesAiScanReadiness";
import { mapOfertaLocalDraftToInsertPayload } from "./ofertasLocalesPublishMapper";
import type { OfertaLocalDraft, OfertaLocalDbInsertPayload, OfertaLocalValidationIssue } from "./ofertasLocalesTypes";
import { validateOfertaLocalDraftForFuturePublish } from "./ofertasLocalesValidation";

/** Minimum draft fields + uploaded scan-ready asset to create/update a server record for AI scan. */
export function validateOfertaLocalDraftForAiScanPersist(
  draft: OfertaLocalDraft,
  ownerId?: string | null,
  options?: { skipAuth?: boolean }
): OfertaLocalValidationIssue[] {
  const eligibleCount = getOfertaLocalScanEligibleAssets(draft).length;

  const issues = validateOfertaLocalDraftForFuturePublish(draft).filter((issue) => {
    if (issue.severity !== "error") return true;
    if (isOfertaLocalCouponPromotionFlow(draft.offerType) && issue.field === "couponText" && eligibleCount > 0) {
      return false;
    }
    if (draft.offerType === "weekly_flyer" && issue.field === "flyerAssets") {
      return false;
    }
    return true;
  });

  if (!draft.wantsAiSearchableSpecials) {
    issues.push({
      field: "wantsAiSearchableSpecials",
      message: "Activa Búsqueda por producto con AI para escanear archivos.",
      severity: "error",
    });
  }

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
