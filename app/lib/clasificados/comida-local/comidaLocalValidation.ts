import type { ComidaLocalDraft, ComidaLocalValidationIssue } from "./comidaLocalTypes";
import { normalizeComidaLocalPhoneDigits } from "./comidaLocalFormatting";

const MIN_BUSINESS_NAME = 2;
const MIN_QUE_VENDES = 20;

function hasContact(draft: ComidaLocalDraft): boolean {
  const phone = normalizeComidaLocalPhoneDigits(draft.phone);
  const wa = normalizeComidaLocalPhoneDigits(draft.whatsapp);
  return phone.length >= 10 || wa.length >= 8;
}

function hasFoodType(draft: ComidaLocalDraft): boolean {
  if (draft.foodType && draft.foodType !== "otro") return true;
  if (draft.foodType === "otro" && draft.foodTypeCustom.trim().length >= 2) return true;
  return false;
}

function hasCity(draft: ComidaLocalDraft): boolean {
  return Boolean(draft.cityCanonical.trim() || draft.cityDisplay.trim());
}

function pushIssue(
  issues: ComidaLocalValidationIssue[],
  field: string,
  message: string,
  severity: ComidaLocalValidationIssue["severity"]
) {
  issues.push({ field, message, severity });
}

/** Gentle checks for future preview (FOOD-L4). */
export function validateComidaLocalDraftForPreview(draft: ComidaLocalDraft): ComidaLocalValidationIssue[] {
  const issues: ComidaLocalValidationIssue[] = [];
  if (!draft.businessName.trim()) {
    pushIssue(issues, "businessName", "Agrega el nombre de tu puesto para ver la vista previa.", "warning");
  }
  if (!hasFoodType(draft)) {
    pushIssue(issues, "foodType", "Elige un tipo de comida para la vista previa.", "warning");
  }
  if (!hasCity(draft)) {
    pushIssue(issues, "cityDisplay", "Indica la ciudad donde vendes.", "warning");
  }
  return issues;
}

/** Stricter checks aligned with FOOD-L1 publish requirements (not wired to API in FOOD-L2). */
export function validateComidaLocalDraftForFuturePublish(draft: ComidaLocalDraft): ComidaLocalValidationIssue[] {
  const issues: ComidaLocalValidationIssue[] = [];

  if (draft.businessName.trim().length < MIN_BUSINESS_NAME) {
    pushIssue(issues, "businessName", "El nombre del puesto es obligatorio.", "error");
  }
  if (!hasFoodType(draft)) {
    pushIssue(issues, "foodType", "Elige un tipo de comida o describe otro tipo.", "error");
  }
  if (!hasCity(draft)) {
    pushIssue(issues, "cityDisplay", "La ciudad es obligatoria.", "error");
  }
  if (!hasContact(draft)) {
    pushIssue(issues, "phone", "Agrega teléfono o WhatsApp para que te contacten.", "error");
  }
  if (draft.queVendes.trim().length < MIN_QUE_VENDES) {
    pushIssue(
      issues,
      "queVendes",
      `Describe qué vendes (mínimo ${MIN_QUE_VENDES} caracteres).`,
      "error"
    );
  }
  if (!draft.mainPhoto?.previewUrl && !draft.mainPhoto?.storageKey) {
    pushIssue(
      issues,
      "mainPhoto",
      "La foto principal será obligatoria al publicar (FOOD-L3/FOOD-L5).",
      "warning"
    );
  }

  return issues;
}
