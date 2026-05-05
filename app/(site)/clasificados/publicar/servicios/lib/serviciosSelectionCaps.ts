import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";

/** Max preset service chips selected at once */
export const MAX_SERVICES_SELECTION = 4;
/** Max free-text custom services (independent of preset cap) */
export const MAX_CUSTOM_SERVICES_OFFERED = 16;
export const MAX_REASONS_SELECTION = 3;
export const MAX_QUICK_FACTS_SELECTION = 3;

export const CUSTOM_CHIP_MAX_LENGTH = 28;

/**
 * Keeps preset id arrays, custom services list, and custom “included” flags within per-section caps (storage, merge, normalize).
 */
export function enforceServiciosSelectionCaps(
  s: ClasificadosServiciosApplicationState,
): ClasificadosServiciosApplicationState {
  const sis = [...s.selectedServiceIds];
  while (sis.length > MAX_SERVICES_SELECTION) {
    sis.pop();
  }

  const customsIn = Array.isArray(s.customServicesOffered) ? [...s.customServicesOffered] : [];
  const customs: string[] = [];
  const seen = new Set<string>();
  for (const raw of customsIn) {
    if (typeof raw !== "string") continue;
    const t = raw.trim().slice(0, CUSTOM_CHIP_MAX_LENGTH);
    if (!t) continue;
    const k = t
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    if (seen.has(k)) continue;
    seen.add(k);
    customs.push(t);
    if (customs.length >= MAX_CUSTOM_SERVICES_OFFERED) break;
  }

  let customR = !!(s.customReasonIncluded && s.customReasonLabel.trim());
  const ris = [...s.selectedReasonIds];
  while (ris.length + (customR ? 1 : 0) > MAX_REASONS_SELECTION) {
    if (ris.length > 0) ris.pop();
    else {
      customR = false;
      break;
    }
  }

  let customQ = !!(s.customQuickFactIncluded && s.customQuickFactLabel.trim());
  const qis = [...s.selectedQuickFactIds];
  while (qis.length + (customQ ? 1 : 0) > MAX_QUICK_FACTS_SELECTION) {
    if (qis.length > 0) qis.pop();
    else {
      customQ = false;
      break;
    }
  }

  return {
    ...s,
    selectedServiceIds: sis,
    selectedReasonIds: ris,
    selectedQuickFactIds: qis,
    customServicesOffered: customs,
    customServiceIncluded: false,
    customReasonIncluded: customR,
    customQuickFactIncluded: customQ,
  };
}
