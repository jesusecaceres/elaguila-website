import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";

export const MAX_SERVICES_SELECTION = 4;
export const MAX_REASONS_SELECTION = 3;
export const MAX_QUICK_FACTS_SELECTION = 3;

export const CUSTOM_CHIP_MAX_LENGTH = 28;

/**
 * Keeps preset id arrays + custom “included” flags within per-section caps (storage, merge, normalize).
 * Trims preset selections first; may drop custom inclusion if still over limit.
 */
export function enforceServiciosSelectionCaps(
  s: ClasificadosServiciosApplicationState,
): ClasificadosServiciosApplicationState {
  let customSvc = !!(s.customServiceIncluded && s.customServiceLabel.trim());
  let sis = [...s.selectedServiceIds];
  while (sis.length + (customSvc ? 1 : 0) > MAX_SERVICES_SELECTION) {
    if (sis.length > 0) sis.pop();
    else {
      customSvc = false;
      break;
    }
  }

  let customR = !!(s.customReasonIncluded && s.customReasonLabel.trim());
  let ris = [...s.selectedReasonIds];
  while (ris.length + (customR ? 1 : 0) > MAX_REASONS_SELECTION) {
    if (ris.length > 0) ris.pop();
    else {
      customR = false;
      break;
    }
  }

  let customQ = !!(s.customQuickFactIncluded && s.customQuickFactLabel.trim());
  let qis = [...s.selectedQuickFactIds];
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
    customServiceIncluded: customSvc,
    customReasonIncluded: customR,
    customQuickFactIncluded: customQ,
  };
}
