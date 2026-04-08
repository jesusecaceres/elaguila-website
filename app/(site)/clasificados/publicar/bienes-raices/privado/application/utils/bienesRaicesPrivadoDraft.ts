import {
  createEmptyBienesRaicesPrivadoFormState,
  mergePartialBienesRaicesPrivadoState,
  type BienesRaicesPrivadoFormState,
} from "../../schema/bienesRaicesPrivadoFormState";

export const BR_PRIVADO_DRAFT_STORAGE_KEY = "br-privado-draft-v1";

export function loadBienesRaicesPrivadoDraft(): BienesRaicesPrivadoFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BienesRaicesPrivadoFormState>;
    return mergePartialBienesRaicesPrivadoState(parsed);
  } catch {
    return null;
  }
}

export function saveBienesRaicesPrivadoDraft(state: BienesRaicesPrivadoFormState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BR_PRIVADO_DRAFT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode */
  }
}

export function clearBienesRaicesPrivadoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readBienesRaicesPrivadoDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** First paint on publish route: restore saved draft or empty. */
export function bootstrapBienesRaicesPrivadoApplicationState(): BienesRaicesPrivadoFormState {
  return loadBienesRaicesPrivadoDraft() ?? createEmptyBienesRaicesPrivadoFormState();
}
