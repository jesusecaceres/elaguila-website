import {
  mergePartialRentasNegocioState,
  type RentasNegocioFormState,
} from "../../schema/rentasNegocioFormState";

export const RENTAS_NEGOCIO_DRAFT_STORAGE_KEY = "rentas-negocio-draft-v1";

export const RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY = "rentas-negocio-draft-v1-ls-fallback";

function readDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
    if (fromSession != null && fromSession !== "") return fromSession;
    const fromFallback = localStorage.getItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY);
    if (fromFallback) {
      try {
        sessionStorage.setItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY, fromFallback);
      } catch {
        /* ignore */
      }
      return fromFallback;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadRentasNegocioDraft(): RentasNegocioFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDraftRaw();
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
  const raw = JSON.stringify(state);
  try {
    sessionStorage.setItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY, raw);
    try {
      localStorage.removeItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY);
    } catch {
      /* ignore */
    }
    return;
  } catch {
    /* quota */
  }
  try {
    localStorage.setItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function clearRentasNegocioDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
}
