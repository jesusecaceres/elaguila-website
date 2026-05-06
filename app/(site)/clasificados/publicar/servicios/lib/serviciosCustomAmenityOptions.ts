import { evaluateAddCustomAmenityLabel } from "@/app/servicios/lib/serviciosAmenitiesCustom";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";

export function evaluateAddCustomAmenityOption(
  state: Pick<ClasificadosServiciosApplicationState, "customAmenityOptions">,
  raw: string,
) {
  return evaluateAddCustomAmenityLabel({
    customAmenityOptions: state.customAmenityOptions,
    raw,
  });
}

