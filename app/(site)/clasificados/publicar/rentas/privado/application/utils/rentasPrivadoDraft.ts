import {
  mergePartialRentasPrivadoState,
  type RentasPrivadoFormState,
} from "../../schema/rentasPrivadoFormState";

export const RENTAS_PRIVADO_DRAFT_STORAGE_KEY = "rentas-privado-draft-v1";

/** When sessionStorage throws (quota), mirror JSON here so edit ↔ preview still works in-tab. */
export const RENTAS_PRIVADO_DRAFT_LS_FALLBACK_KEY = "rentas-privado-draft-v1-ls-fallback";

function readDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    if (fromSession != null && fromSession !== "") return fromSession;
    const fromFallback = localStorage.getItem(RENTAS_PRIVADO_DRAFT_LS_FALLBACK_KEY);
    if (fromFallback) {
      try {
        sessionStorage.setItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY, fromFallback);
      } catch {
        /* session full */
      }
      return fromFallback;
    }
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
  const raw = JSON.stringify(state);
  try {
    sessionStorage.setItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY, raw);
    try {
      localStorage.removeItem(RENTAS_PRIVADO_DRAFT_LS_FALLBACK_KEY);
    } catch {
      /* ignore */
    }
    return;
  } catch {
    /* quota */
  }
  try {
    localStorage.setItem(RENTAS_PRIVADO_DRAFT_LS_FALLBACK_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function clearRentasPrivadoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(RENTAS_PRIVADO_DRAFT_LS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
}
