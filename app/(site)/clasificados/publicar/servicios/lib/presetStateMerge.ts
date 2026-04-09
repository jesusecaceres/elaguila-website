import { getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { enforceServiciosSelectionCaps } from "./serviciosSelectionCaps";

/**
 * When business type changes, drop selections that no longer exist on the new preset.
 * Preset CTA chip ids are cleared — the shell uses fixed Leonix contact priority.
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
  const gIds = new Set(prev.gallery.map((g) => g.id));

  return enforceServiciosSelectionCaps({
    ...prev,
    businessTypeId: newTypeId,
    selectedServiceIds: prev.selectedServiceIds.filter((id) => sSet.has(id)),
    selectedReasonIds: prev.selectedReasonIds.filter((id) => rSet.has(id)),
    selectedQuickFactIds: prev.selectedQuickFactIds.filter((id) => qSet.has(id)),
    primaryCtaId: "",
    secondaryCtaIds: [],
    featuredGalleryIds: prev.featuredGalleryIds.filter((id) => gIds.has(id)).slice(0, 4),
  });
}
