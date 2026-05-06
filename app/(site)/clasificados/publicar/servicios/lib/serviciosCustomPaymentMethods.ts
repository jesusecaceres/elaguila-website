import { evaluateAddCustomPaymentLabel } from "@/app/servicios/lib/serviciosPaymentCustom";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";

export function evaluateAddCustomPaymentMethod(
  state: Pick<ClasificadosServiciosApplicationState, "customPaymentMethods">,
  raw: string,
) {
  return evaluateAddCustomPaymentLabel({
    customPaymentMethods: state.customPaymentMethods,
    raw,
  });
}
