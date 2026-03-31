import {
  createEmptyBienesRaicesNegocioFormState,
  mergePartialBienesRaicesNegocioState,
  type BienesRaicesNegocioFormState,
} from "../schema/bienesRaicesNegocioFormState";

export const BR_NEGOCIO_PREVIEW_DRAFT_KEY = "br-negocio-preview-draft";
export const BR_NEGOCIO_PREVIEW_RETURN_KEY = "BR_NEGOCIO_PREVIEW_RETURN_DRAFT";

export type BienesRaicesPreviewReturnPayload = {
  state: BienesRaicesNegocioFormState;
  savedAt: number;
};

let previewReturnMemory: BienesRaicesNegocioFormState | null = null;
let previewReturnTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleClearReturnMemory() {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = setTimeout(() => {
    previewReturnMemory = null;
    previewReturnTimer = null;
  }, 2000);
}

export function saveBienesRaicesNegocioPreviewDraft(state: BienesRaicesNegocioFormState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BR_NEGOCIO_PREVIEW_DRAFT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function saveBienesRaicesNegocioPreviewReturnDraft(state: BienesRaicesNegocioFormState): void {
  if (typeof window === "undefined") return;
  previewReturnMemory = null;
  try {
    const payload: BienesRaicesPreviewReturnPayload = { state, savedAt: Date.now() };
    sessionStorage.setItem(BR_NEGOCIO_PREVIEW_RETURN_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadBienesRaicesNegocioPreviewDraft(): BienesRaicesNegocioFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BR_NEGOCIO_PREVIEW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BienesRaicesNegocioFormState>;
    return mergePartialBienesRaicesNegocioState(parsed);
  } catch {
    return null;
  }
}

/**
 * Restore after preview → "Volver a editar" (return payload), else last preview draft.
 * Draft fallback keeps restore reliable if the return key was already consumed (React Strict Mode, refresh).
 */
export function takeBienesRaicesNegocioPreviewReturnInitialState(): BienesRaicesNegocioFormState {
  if (typeof window === "undefined") return createEmptyBienesRaicesNegocioFormState();
  if (previewReturnMemory) {
    scheduleClearReturnMemory();
    return previewReturnMemory;
  }
  try {
    const raw = sessionStorage.getItem(BR_NEGOCIO_PREVIEW_RETURN_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<BienesRaicesPreviewReturnPayload>;
      if (data.state && typeof data.state === "object") {
        const merged = mergePartialBienesRaicesNegocioState(data.state as Partial<BienesRaicesNegocioFormState>);
        sessionStorage.removeItem(BR_NEGOCIO_PREVIEW_RETURN_KEY);
        previewReturnMemory = merged;
        scheduleClearReturnMemory();
        return merged;
      }
    }
  } catch {
    /* fall through */
  }
  const fromDraft = loadBienesRaicesNegocioPreviewDraft();
  if (fromDraft) return fromDraft;
  return createEmptyBienesRaicesNegocioFormState();
}
