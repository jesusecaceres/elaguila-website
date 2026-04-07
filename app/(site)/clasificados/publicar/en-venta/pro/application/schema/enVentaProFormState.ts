import {
  createEmptyEnVentaFreeState,
  type EnVentaFreeApplicationState,
} from "../../../free/application/schema/enVentaFreeFormState";

/**
 * Pro lane — premium listing upgrade (more media, video, polish).
 * Same core fields as Free; business/storefront identity lives in the Storefront lane.
 */
export type EnVentaProApplicationState = EnVentaFreeApplicationState;

export function createEmptyEnVentaProState(): EnVentaProApplicationState {
  return createEmptyEnVentaFreeState();
}
