import type { ComidaLocalDraft, ComidaLocalValidationIssue } from "./comidaLocalTypes";
import { resolveComidaLocalCityCanonical } from "./comidaLocalCity";
import { normalizeComidaLocalPhoneDigits } from "./comidaLocalFormatting";
import {
  COMIDA_LOCAL_GALLERY_MAX,
  hasComidaLocalMainPhoto,
  validateComidaLocalGalleryCount,
} from "./comidaLocalImageValidation";

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
  return Boolean(resolveComidaLocalCityCanonical(draft));
}

function hasCanonicalCity(draft: ComidaLocalDraft): boolean {
  return Boolean(resolveComidaLocalCityCanonical(draft));
}

function pushIssue(
  issues: ComidaLocalValidationIssue[],
  field: string,
  message: string,
  severity: ComidaLocalValidationIssue["severity"]
) {
  issues.push({ field, message, severity });
}

/** Gentle checks for future preview (FOOD-L4). `es` defaults to true — every existing call site
 * that doesn't pass it explicitly keeps its prior Spanish-only behavior unchanged; the
 * application client and preview VM builder pass the real page locale explicitly. */
export function validateComidaLocalDraftForPreview(
  draft: ComidaLocalDraft,
  es = true,
): ComidaLocalValidationIssue[] {
  const issues: ComidaLocalValidationIssue[] = [];
  if (!draft.businessName.trim()) {
    pushIssue(
      issues,
      "businessName",
      es ? "Agrega el nombre de tu puesto para ver la vista previa." : "Add your stand's name to see the preview.",
      "warning",
    );
  }
  if (!hasFoodType(draft)) {
    pushIssue(
      issues,
      "foodType",
      es ? "Elige un tipo de comida para la vista previa." : "Choose a food type for the preview.",
      "warning",
    );
  }
  if (!hasCity(draft)) {
    pushIssue(
      issues,
      "cityDisplay",
      es ? "Indica la ciudad donde vendes." : "Tell us the city where you sell.",
      "warning",
    );
  } else if (!hasCanonicalCity(draft)) {
    pushIssue(
      issues,
      "cityDisplay",
      es
        ? "Elige una ciudad de la lista NorCal para la vista previa."
        : "Choose a city from the NorCal list for the preview.",
      "warning"
    );
  }
  return issues;
}

/** Stricter checks aligned with FOOD-L1 publish requirements. `es` defaults to true for the same
 * reason as validateComidaLocalDraftForPreview above. */
export function validateComidaLocalDraftForFuturePublish(
  draft: ComidaLocalDraft,
  es = true,
): ComidaLocalValidationIssue[] {
  const issues: ComidaLocalValidationIssue[] = [];

  if (draft.businessName.trim().length < MIN_BUSINESS_NAME) {
    pushIssue(
      issues,
      "businessName",
      es ? "El nombre del puesto es obligatorio." : "The stand's name is required.",
      "error",
    );
  }
  if (!hasFoodType(draft)) {
    pushIssue(
      issues,
      "foodType",
      es ? "Elige un tipo de comida o describe otro tipo." : "Choose a food type or describe another type.",
      "error",
    );
  }
  if (!hasCanonicalCity(draft)) {
    pushIssue(
      issues,
      "cityDisplay",
      draft.cityDisplay.trim()
        ? es
          ? "Elige una ciudad válida de la lista NorCal."
          : "Choose a valid city from the NorCal list."
        : es
          ? "La ciudad es obligatoria."
          : "City is required.",
      "error"
    );
  }
  if (!hasContact(draft)) {
    pushIssue(
      issues,
      "phone",
      es ? "Agrega teléfono o WhatsApp para que te contacten." : "Add a phone or WhatsApp number so people can reach you.",
      "error",
    );
  }
  if (draft.queVendes.trim().length < MIN_QUE_VENDES) {
    pushIssue(
      issues,
      "queVendes",
      es
        ? `Describe qué vendes (mínimo ${MIN_QUE_VENDES} caracteres).`
        : `Describe what you sell (minimum ${MIN_QUE_VENDES} characters).`,
      "error"
    );
  }
  if (!hasComidaLocalMainPhoto(draft)) {
    pushIssue(
      issues,
      "mainPhoto",
      es ? "Sube una foto principal antes de publicar." : "Upload a main photo before publishing.",
      "error"
    );
  }

  if (!validateComidaLocalGalleryCount(draft.galleryImages.length)) {
    pushIssue(
      issues,
      "galleryImages",
      es
        ? `Máximo ${COMIDA_LOCAL_GALLERY_MAX} fotos en la galería.`
        : `Maximum ${COMIDA_LOCAL_GALLERY_MAX} photos in the gallery.`,
      "error"
    );
  }

  return issues;
}
