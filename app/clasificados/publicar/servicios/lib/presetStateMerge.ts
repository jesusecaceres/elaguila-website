import { getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";

/**
 * When business type changes, drop selections that no longer exist on the new preset
 * and pick a sensible default primary CTA.
 */
export function mergeStateForBusinessTypeChange(
  prev: ClasificadosServiciosApplicationState,
  newTypeId: string,
): ClasificadosServiciosApplicationState {
  const p = getBusinessTypePreset(newTypeId);
  if (!p) {
    return { ...prev, businessTypeId: newTypeId };
  }
  const sSet = new Set(p.suggestedServices.map((x) => x.id));
  const rSet = new Set(p.reasonsToChoose.map((x) => x.id));
  const qSet = new Set(p.quickFacts.map((x) => x.id));
  const primarySet = new Set(p.primaryCtaOptions.map((x) => x.id));
  const secondarySet = new Set(p.secondaryCtaOptions.map((x) => x.id));

  const primaryCtaId = primarySet.has(prev.primaryCtaId)
    ? prev.primaryCtaId
    : (p.primaryCtaOptions[0]?.id ?? "");

  return {
    ...prev,
    businessTypeId: newTypeId,
    selectedServiceIds: prev.selectedServiceIds.filter((id) => sSet.has(id)),
    selectedReasonIds: prev.selectedReasonIds.filter((id) => rSet.has(id)),
    selectedQuickFactIds: prev.selectedQuickFactIds.filter((id) => qSet.has(id)),
    primaryCtaId,
    secondaryCtaIds: prev.secondaryCtaIds.filter((id) => secondarySet.has(id)),
  };
}
