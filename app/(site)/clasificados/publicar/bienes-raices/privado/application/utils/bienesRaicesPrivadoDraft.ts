import {
  createEmptyBienesRaicesPrivadoFormState,
  mergePartialBienesRaicesPrivadoState,
  type BienesRaicesPrivadoFormState,
} from "../../schema/bienesRaicesPrivadoFormState";

export const BR_PRIVADO_DRAFT_STORAGE_KEY = "br-privado-draft-v1";

/**
 * Session-scoped draft: survives edit ↔ preview in the same tab; cleared when the tab/session ends.
 * One-time migration: if session is empty but legacy localStorage had data, copy then remove local.
 */
function readDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    if (fromSession != null && fromSession !== "") return fromSession;
    const legacy = localStorage.getItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    if (legacy) {
      sessionStorage.setItem(BR_PRIVADO_DRAFT_STORAGE_KEY, legacy);
      localStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadBienesRaicesPrivadoDraft(): BienesRaicesPrivadoFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDraftRaw();
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
    sessionStorage.setItem(BR_PRIVADO_DRAFT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode */
  }
}

export function clearBienesRaicesPrivadoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readBienesRaicesPrivadoDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return readDraftRaw();
  } catch {
    return null;
  }
}

/** First paint on publish route: restore saved draft or empty. */
export function bootstrapBienesRaicesPrivadoApplicationState(): BienesRaicesPrivadoFormState {
  return loadBienesRaicesPrivadoDraft() ?? createEmptyBienesRaicesPrivadoFormState();
}
