import { evaluateServiciosPublishReadiness } from "./serviciosPublishReadiness";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosPublishReadinessResult } from "./serviciosPublishReadiness";

/**
 * Required-for-preview (content + contact + media) — same as publish except legal attestations.
 * Terms stay on the final step; publish from preview still requires the three confirmations.
 */
export function evaluateServiciosPreviewReadiness(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
): ServiciosPublishReadinessResult {
  const full = evaluateServiciosPublishReadiness(state, lang);
  const missing = full.missing.filter((m) => m.id !== "legal_attest");
  return { ok: missing.length === 0, missing };
}
