import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { isBusinessHighlightPresetId } from "./businessHighlightPresets";
import { normalizeBusinessHighlightDedupeKey } from "./serviciosCustomBusinessHighlights";
import {
  BUSINESS_HIGHLIGHT_LABEL_MAX,
  MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION,
  MAX_CUSTOM_BUSINESS_HIGHLIGHTS,
} from "./serviciosHighlightCaps";
import {
  CUSTOM_PAYMENT_LABEL_MAX,
  sanitizeCustomPaymentMethodLabels,
  sanitizeServiciosPaymentMethodIds,
} from "@/app/servicios/lib/serviciosPaymentMethodCatalog";
import {
  CUSTOM_SERVICIOS_AMENITY_LABEL_MAX,
  sanitizeCustomServiciosAmenityLabels,
  sanitizeServiciosAmenityOptionIds,
} from "@/app/servicios/lib/serviciosAmenitiesCatalog";

/** Max preset service chips selected at once (generous cap for real listings) */
export const MAX_SERVICES_SELECTION = 24;
/** Max free-text custom services (independent of preset cap) */
export const MAX_CUSTOM_SERVICES_OFFERED = 40;
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

  const highlightIds = [...s.selectedBusinessHighlightIds].filter((id) => isBusinessHighlightPresetId(id));
  while (highlightIds.length > MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION) {
    highlightIds.pop();
  }

  const bhCustomIn = Array.isArray(s.customBusinessHighlights) ? [...s.customBusinessHighlights] : [];
  const bhCustom: string[] = [];
  const bhSeen = new Set<string>();
  for (const raw of bhCustomIn) {
    if (typeof raw !== "string") continue;
    const t = raw.trim().slice(0, BUSINESS_HIGHLIGHT_LABEL_MAX);
    if (!t) continue;
    const k = normalizeBusinessHighlightDedupeKey(t);
    if (bhSeen.has(k)) continue;
    bhSeen.add(k);
    bhCustom.push(t);
    if (bhCustom.length >= MAX_CUSTOM_BUSINESS_HIGHLIGHTS) break;
  }

  const customBusinessHighlightLabel =
    typeof s.customBusinessHighlightLabel === "string"
      ? s.customBusinessHighlightLabel.trim().slice(0, BUSINESS_HIGHLIGHT_LABEL_MAX)
      : "";

  const paymentMethodIds = sanitizeServiciosPaymentMethodIds(s.paymentMethodIds);
  const customPaymentMethods = sanitizeCustomPaymentMethodLabels(s.customPaymentMethods);
  const customPaymentMethodLabel =
    typeof s.customPaymentMethodLabel === "string"
      ? s.customPaymentMethodLabel.trim().slice(0, CUSTOM_PAYMENT_LABEL_MAX)
      : "";

  const amenityOptionIds = sanitizeServiciosAmenityOptionIds(s.amenityOptionIds);
  const customAmenityOptions = sanitizeCustomServiciosAmenityLabels(s.customAmenityOptions);
  const pendingCustomAmenityOption =
    typeof s.pendingCustomAmenityOption === "string"
      ? s.pendingCustomAmenityOption.trim().slice(0, CUSTOM_SERVICIOS_AMENITY_LABEL_MAX)
      : "";

  return {
    ...s,
    selectedServiceIds: sis,
    selectedReasonIds: ris,
    selectedQuickFactIds: qis,
    customServicesOffered: customs,
    customServiceIncluded: false,
    customReasonIncluded: customR,
    customQuickFactIncluded: customQ,
    selectedBusinessHighlightIds: highlightIds,
    customBusinessHighlights: bhCustom,
    customBusinessHighlightLabel,
    paymentMethodIds,
    customPaymentMethods,
    customPaymentMethodLabel,
    amenityOptionIds,
    customAmenityOptions,
    pendingCustomAmenityOption,
  };
}
