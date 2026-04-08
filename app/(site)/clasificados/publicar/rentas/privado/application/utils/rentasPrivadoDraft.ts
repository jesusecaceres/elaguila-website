import {
  mergePartialRentasPrivadoState,
  type RentasPrivadoFormState,
} from "../../schema/rentasPrivadoFormState";

export const RENTAS_PRIVADO_DRAFT_STORAGE_KEY = "rentas-privado-draft-v1";

export function loadRentasPrivadoDraft(): RentasPrivadoFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return mergePartialRentasPrivadoState(parsed as Partial<RentasPrivadoFormState>);
  } catch {
    return null;
  }
}

export function saveRentasPrivadoDraft(state: RentasPrivadoFormState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode */
  }
}
