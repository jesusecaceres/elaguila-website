import {
  mergePartialRentasPrivadoState,
  type RentasPrivadoFormState,
} from "../../schema/rentasPrivadoFormState";

export const RENTAS_PRIVADO_DRAFT_STORAGE_KEY = "rentas-privado-draft-v1";

/** Session-scoped; one-time migration from legacy localStorage. See `bienesRaicesPrivadoDraft.ts`. */
function readDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    if (fromSession != null && fromSession !== "") return fromSession;
    const legacy = localStorage.getItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    if (legacy) {
      sessionStorage.setItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY, legacy);
      localStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadRentasPrivadoDraft(): RentasPrivadoFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDraftRaw();
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
    sessionStorage.setItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode */
  }
}

export function clearRentasPrivadoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
