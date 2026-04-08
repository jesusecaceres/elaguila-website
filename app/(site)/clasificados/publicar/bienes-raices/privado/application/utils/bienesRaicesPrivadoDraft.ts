import {
  createEmptyBienesRaicesPrivadoFormState,
  mergePartialBienesRaicesPrivadoState,
  type BienesRaicesPrivadoFormState,
} from "../../schema/bienesRaicesPrivadoFormState";

export const BR_PRIVADO_DRAFT_STORAGE_KEY = "br-privado-draft-v1";

/**
 * When sessionStorage throws (quota), we mirror the same JSON here so edit ↔ preview still works in-tab.
 * Cleared on successful session save or explicit clear.
 */
export const BR_PRIVADO_DRAFT_LS_FALLBACK_KEY = "br-privado-draft-v1-ls-fallback";

/**
 * Session-scoped draft: survives edit ↔ preview in the same tab; cleared when the tab/session ends.
 * One-time migration: if session is empty but legacy localStorage had data, copy then remove local.
 */
function readDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    if (fromSession != null && fromSession !== "") return fromSession;
    const fromFallback = localStorage.getItem(BR_PRIVADO_DRAFT_LS_FALLBACK_KEY);
    if (fromFallback) {
      try {
        sessionStorage.setItem(BR_PRIVADO_DRAFT_STORAGE_KEY, fromFallback);
      } catch {
        /* session still full — keep using fallback reads */
      }
      return fromFallback;
    }
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
  const raw = JSON.stringify(state);
  try {
    sessionStorage.setItem(BR_PRIVADO_DRAFT_STORAGE_KEY, raw);
    try {
      localStorage.removeItem(BR_PRIVADO_DRAFT_LS_FALLBACK_KEY);
    } catch {
      /* ignore */
    }
    return;
  } catch {
    /* quota or private mode — keep preview handoff working */
  }
  try {
    localStorage.setItem(BR_PRIVADO_DRAFT_LS_FALLBACK_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function clearBienesRaicesPrivadoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(BR_PRIVADO_DRAFT_LS_FALLBACK_KEY);
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
