/**
 * Prefer canonical (category-owned) wizard keys; fall back to legacy shared-wizard keys once.
 */

import { LEGACY_WIZARD_SHARED_NEGOCIO } from "./wizardDraftLegacyKeys";

export function coalesceWizardDetailValue(
  details: Record<string, string | undefined>,
  canonicalKey: string,
  legacyKey: string
): string {
  const a = details[canonicalKey];
  const b = details[legacyKey];
  const s = (typeof a === "string" && a.trim() ? a : typeof b === "string" ? b : "").trim();
  return s;
}

export function coalesceNegocioNombreFromWizard(details: Record<string, string | undefined>): string {
  return coalesceWizardDetailValue(details, "negocioNombre", LEGACY_WIZARD_SHARED_NEGOCIO.businessName);
}

export function coalesceNegocioAgenteFromWizard(details: Record<string, string | undefined>): string {
  return coalesceWizardDetailValue(details, "negocioAgente", LEGACY_WIZARD_SHARED_NEGOCIO.agentName);
}
