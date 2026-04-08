import {
  mergePartialRentasNegocioState,
  type RentasNegocioFormState,
} from "../../schema/rentasNegocioFormState";

export const RENTAS_NEGOCIO_DRAFT_STORAGE_KEY = "rentas-negocio-draft-v1";

export function loadRentasNegocioDraft(): RentasNegocioFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return mergePartialRentasNegocioState(parsed as Partial<RentasNegocioFormState>);
  } catch {
    return null;
  }
}

export function saveRentasNegocioDraft(state: RentasNegocioFormState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
