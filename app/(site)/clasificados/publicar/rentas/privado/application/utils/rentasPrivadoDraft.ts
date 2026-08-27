import {
  mergePartialRentasPrivadoState,
  type RentasPrivadoFormState,
} from "../../schema/rentasPrivadoFormState";
import {
  clearRentasPrivadoDraftMediaIdb,
  inlineRentasPrivadoHeavyMediaFromIdb,
  offloadRentasPrivadoHeavyMediaToIdb,
} from "./rentasPrivadoDraftMedia";

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

/** BR-INV-WAVE1-GATE3: now async — resolves IndexedDB-offloaded photo/seller-photo refs. */
export async function loadRentasPrivadoDraft(): Promise<RentasPrivadoFormState | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDraftRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const merged = mergePartialRentasPrivadoState(parsed as Partial<RentasPrivadoFormState>);
    return await inlineRentasPrivadoHeavyMediaFromIdb(merged);
  } catch {
    return null;
  }
}

/** BR-INV-WAVE1-GATE3: now async — offloads heavy photo/seller-photo data: URLs to IndexedDB first. */
export async function saveRentasPrivadoDraft(state: RentasPrivadoFormState): Promise<void> {
  if (typeof window === "undefined") return;
  const stripped: RentasPrivadoFormState = {
    ...state,
    media: {
      ...state.media,
      videoLocalDataUrl: "",
    },
  } satisfies RentasPrivadoFormState;
  const toSave = await offloadRentasPrivadoHeavyMediaToIdb(stripped);
  const raw = JSON.stringify(toSave);
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

export async function clearRentasPrivadoDraft(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(RENTAS_PRIVADO_DRAFT_LS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
  await clearRentasPrivadoDraftMediaIdb();
}
