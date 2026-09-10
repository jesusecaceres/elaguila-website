import {
  createEmptyBienesRaicesPrivadoFormState,
  mergePartialBienesRaicesPrivadoState,
  type BienesRaicesPrivadoFormState,
} from "../../schema/bienesRaicesPrivadoFormState";
import {
  clearBienesRaicesPrivadoDraftMediaIdb,
  inlineBienesRaicesPrivadoHeavyMediaFromIdb,
  offloadBienesRaicesPrivadoHeavyMediaToIdb,
} from "./bienesRaicesPrivadoDraftMedia";

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

/**
 * BR-INV-WAVE1-GATE3 — resolves any IndexedDB-offloaded photo/seller-photo ref tokens back to
 * real data: URLs. Async because IndexedDB is async; every caller of `loadBienesRaicesPrivadoDraft`
 * must await it (was previously synchronous).
 */
export async function loadBienesRaicesPrivadoDraft(): Promise<BienesRaicesPrivadoFormState | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDraftRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BienesRaicesPrivadoFormState>;
    const merged = mergePartialBienesRaicesPrivadoState(parsed);
    return await inlineBienesRaicesPrivadoHeavyMediaFromIdb(merged);
  } catch {
    return null;
  }
}

/**
 * BR-INV-WAVE1-GATE3 — offloads heavy photo/seller-photo data: URLs to IndexedDB before writing
 * the (now small) JSON to sessionStorage/localStorage, instead of storing them inline. Async
 * because IndexedDB is async — existing fire-and-forget callers (`queueMicrotask(() =>
 * saveBienesRaicesPrivadoDraft(out))`) keep working unchanged since they never awaited the prior
 * synchronous version either.
 */
export async function saveBienesRaicesPrivadoDraft(state: BienesRaicesPrivadoFormState): Promise<void> {
  if (typeof window === "undefined") return;
  // BR-INV-WAVE1-GATE2: device video upload was removed from the live form (external URL only),
  // but a draft saved before this change — or hydrated from a stale tab — can still carry a raw
  // base64 videoLocalDataUrl blob. Strip it before persisting so it never sits inline in
  // sessionStorage/localStorage (matches the pattern already used by rentasPrivadoDraft.ts).
  const stripped: BienesRaicesPrivadoFormState = state.media.videoLocalDataUrl
    ? { ...state, media: { ...state.media, videoLocalDataUrl: "" } }
    : state;
  const toSave = await offloadBienesRaicesPrivadoHeavyMediaToIdb(stripped);
  const raw = JSON.stringify(toSave);
  try {
    sessionStorage.setItem(BR_PRIVADO_DRAFT_STORAGE_KEY, raw);
    try {
      localStorage.setItem(BR_PRIVADO_DRAFT_LS_FALLBACK_KEY, raw);
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

export async function clearBienesRaicesPrivadoDraft(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(BR_PRIVADO_DRAFT_LS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
  await clearBienesRaicesPrivadoDraftMediaIdb();
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
export async function bootstrapBienesRaicesPrivadoApplicationState(): Promise<BienesRaicesPrivadoFormState> {
  return (await loadBienesRaicesPrivadoDraft()) ?? createEmptyBienesRaicesPrivadoFormState();
}
