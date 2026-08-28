import { evaluateAddCustomAmenityLabel } from "@/app/servicios/lib/serviciosAmenitiesCustom";
import type { ServiciosAmenityRealGroupId } from "@/app/servicios/lib/serviciosAmenitiesCatalog";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";

/** Owner-QA (section-specific "Otro") — evaluates a custom entry against only its OWN subgroup's
 *  existing custom labels, not the other 4 subgroups, so each keeps an independent bucket. */
export function evaluateAddCustomAmenityOption(
  state: Pick<ClasificadosServiciosApplicationState, "customAmenityOptions">,
  groupId: ServiciosAmenityRealGroupId,
  raw: string,
) {
  const sameGroupLabels = state.customAmenityOptions.filter((e) => e.groupId === groupId).map((e) => e.label);
  return evaluateAddCustomAmenityLabel({
    customAmenityOptions: sameGroupLabels,
    raw,
  });
}
