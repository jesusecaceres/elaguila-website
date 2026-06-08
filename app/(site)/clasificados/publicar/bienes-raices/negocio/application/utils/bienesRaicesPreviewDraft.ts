import {
  createEmptyBienesRaicesNegocioFormState,
  mergePartialBienesRaicesNegocioState,
  type BienesRaicesNegocioFormState,
} from "../schema/bienesRaicesNegocioFormState";
import {
  clearChildInventoryMediaBridge,
  mergeChildInventoryWithMediaBridge,
  setChildInventoryMediaBridge,
  stripChildInventoryForSession,
} from "../brNegocioInventoryDraftPersistence";

export const BR_NEGOCIO_PREVIEW_DRAFT_KEY = "br-negocio-preview-draft";
export const BR_NEGOCIO_PREVIEW_RETURN_KEY = "BR_NEGOCIO_PREVIEW_RETURN_DRAFT";

export type BienesRaicesPreviewReturnPayload = {
  state: BienesRaicesNegocioFormState;
  savedAt: number;
};

let previewReturnMemory: BienesRaicesNegocioFormState | null = null;
let previewDraftMemory: BienesRaicesNegocioFormState | null = null;
let previewReturnTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleClearReturnMemory() {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = setTimeout(() => {
    previewReturnMemory = null;
    previewReturnTimer = null;
  }, 2000);
}

/** Drop BRT Negocio preview handoff keys + in-memory Strict Mode cache (leaving flow / logout). */
export function clearBienesRaicesNegocioPublishTempState(): void {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = null;
  previewReturnMemory = null;
  previewDraftMemory = null;
  clearChildInventoryMediaBridge();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_NEGOCIO_PREVIEW_DRAFT_KEY);
    sessionStorage.removeItem(BR_NEGOCIO_PREVIEW_RETURN_KEY);
  } catch {
    /* ignore */
  }
}

function stripNegocioStateForSession(state: BienesRaicesNegocioFormState): BienesRaicesNegocioFormState {
  const j = JSON.parse(JSON.stringify(state)) as BienesRaicesNegocioFormState;
  if (Array.isArray(j.media?.photoUrls)) {
    j.media.photoUrls = j.media.photoUrls.filter((u) => typeof u === "string" && !u.startsWith("data:"));
  }
  if (Array.isArray(j.additionalInventoryProperties)) {
    j.additionalInventoryProperties = stripChildInventoryForSession(j.additionalInventoryProperties);
  }
  return j;
}

export function saveBienesRaicesNegocioPreviewDraft(state: BienesRaicesNegocioFormState): void {
  if (typeof window === "undefined") return;
  previewDraftMemory = state;
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);
  try {
    sessionStorage.setItem(BR_NEGOCIO_PREVIEW_DRAFT_KEY, JSON.stringify(stripNegocioStateForSession(state)));
  } catch {
    /* sessionStorage quota — in-memory draft still available for preview in this tab */
  }
}

export function saveBienesRaicesNegocioPreviewReturnDraft(state: BienesRaicesNegocioFormState): void {
  if (typeof window === "undefined") return;
  previewReturnMemory = null;
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);
  try {
    const payload: BienesRaicesPreviewReturnPayload = { state: stripNegocioStateForSession(state), savedAt: Date.now() };
    sessionStorage.setItem(BR_NEGOCIO_PREVIEW_RETURN_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadBienesRaicesNegocioPreviewDraft(): BienesRaicesNegocioFormState | null {
  if (typeof window === "undefined") return null;
  if (previewDraftMemory) return previewDraftMemory;
  try {
    const raw = sessionStorage.getItem(BR_NEGOCIO_PREVIEW_DRAFT_KEY);
    if (!raw) return previewDraftMemory;
    const parsed = JSON.parse(raw) as Partial<BienesRaicesNegocioFormState>;
    const mergedBase = mergePartialBienesRaicesNegocioState(parsed);
    const merged = mergePartialBienesRaicesNegocioState({
      ...mergedBase,
      additionalInventoryProperties: mergeChildInventoryWithMediaBridge(
        mergedBase.additionalInventoryProperties ?? [],
      ),
    });
    previewDraftMemory = merged;
    return merged;
  } catch {
    return previewDraftMemory;
  }
}

/** Raw sessionStorage value for preview handoff (detect missing vs corrupt without conflating). */
export function readBienesRaicesNegocioPreviewDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(BR_NEGOCIO_PREVIEW_DRAFT_KEY);
  } catch {
    return null;
  }
}

/**
 * BRT Negocio — bootstrap for the publish application (in-flow preview handoff only).
 *
 * Contract: this is NOT a general draft restore. `br-negocio-preview-draft` is written for the
 * preview route to read only; it must never hydrate the application on a cold visit.
 *
 * Order:
 * 1. In-memory return payload (React Strict Mode double-mount)
 * 2. Else session `BR_NEGOCIO_PREVIEW_RETURN_DRAFT` (set when opening preview; consumed on “Volver a editar”)
 * 3. Else empty form state
 */
export function bootstrapBienesRaicesNegocioApplicationState(): BienesRaicesNegocioFormState {
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
        const mergedBase = mergePartialBienesRaicesNegocioState(data.state as Partial<BienesRaicesNegocioFormState>);
        const merged = mergePartialBienesRaicesNegocioState({
          ...mergedBase,
          additionalInventoryProperties: mergeChildInventoryWithMediaBridge(
            mergedBase.additionalInventoryProperties ?? [],
          ),
        });
        sessionStorage.removeItem(BR_NEGOCIO_PREVIEW_RETURN_KEY);
        previewReturnMemory = merged;
        scheduleClearReturnMemory();
        return merged;
      }
    }
  } catch {
    /* fall through */
  }
  return createEmptyBienesRaicesNegocioFormState();
}

/** @deprecated Use `bootstrapBienesRaicesNegocioApplicationState` (same implementation). */
export function takeBienesRaicesNegocioPreviewReturnInitialState(): BienesRaicesNegocioFormState {
  return bootstrapBienesRaicesNegocioApplicationState();
}
