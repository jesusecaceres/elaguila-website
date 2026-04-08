import { evaluateServiciosPublishReadiness } from "./serviciosPublishReadiness";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosPublishReadinessResult } from "./serviciosPublishReadiness";

/**
 * Required-for-preview (and publish) — Servicios Clasificados application:
 * - Valid business type preset
 * - Business name (min 2 chars)
 * - Main city (min 2 chars)
 * - At least one contact method enabled with valid phone / website / WhatsApp
 * - About text (min 8 chars)
 * - At least one service (preset chip or custom line)
 * - Hero media: cover image OR ≥1 featured gallery image
 * - When the preset defines primary CTA options, a valid primary CTA selection
 *
 * Publish/readiness uses the same rules via `evaluateServiciosPublishReadiness`.
 */
export function evaluateServiciosPreviewReadiness(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
): ServiciosPublishReadinessResult {
  return evaluateServiciosPublishReadiness(state, lang);
}
