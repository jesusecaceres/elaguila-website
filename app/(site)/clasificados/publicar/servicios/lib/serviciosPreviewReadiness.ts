import { evaluateServiciosPublishReadiness } from "./serviciosPublishReadiness";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosPublishReadinessResult } from "./serviciosPublishReadiness";

/**
 * TODO: REMOVE THIS TEMPORARY QA BYPASS
 * This flag allows preview without completing all required fields for testing purposes.
 * Set to false to restore normal validation behavior.
 */
const TEMP_QA_PREVIEW_BYPASS = true;

/**
 * Required-for-preview (and publish) — Servicios Clasificados application:
 * - Valid business type preset
 * - Business name (min 2 chars)
 * - Main city (min 2 chars)
 * - At least one contact method enabled with valid phone / website / WhatsApp
 * - About text (min 8 chars)
 * - At least one service (preset chip or custom line)
 * - Hero media: cover image OR ≥1 featured gallery image
 *
 * Publish/readiness uses the same rules via `evaluateServiciosPublishReadiness`.
 * 
 * TEMPORARY QA BYPASS: When TEMP_QA_PREVIEW_BYPASS is true, preview is always allowed.
 * Publish validation remains protected and uses strict validation.
 */
export function evaluateServiciosPreviewReadiness(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
): ServiciosPublishReadinessResult {
  // TEMPORARY QA BYPASS: Allow preview without completing all required fields
  if (TEMP_QA_PREVIEW_BYPASS) {
    return { ok: true, missing: [] };
  }
  
  // Normal validation when bypass is disabled
  return evaluateServiciosPublishReadiness(state, lang);
}
