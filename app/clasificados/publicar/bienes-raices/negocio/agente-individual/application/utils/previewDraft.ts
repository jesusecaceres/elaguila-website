import {
  createEmptyAgenteIndividualResidencialState,
  mergePartialAgenteIndividualResidencial,
  type AgenteIndividualResidencialFormState,
} from "../../schema/agenteIndividualResidencialFormState";

/** Aislado del borrador genérico Negocio legacy (`br-negocio-preview-draft`). */
export const BR_AGENTE_RES_PREVIEW_DRAFT_KEY = "br-negocio-agente-residencial-preview-draft";
export const BR_AGENTE_RES_RETURN_KEY = "br-negocio-agente-residencial-return-draft";

export type AgenteResPreviewReturnPayload = {
  state: AgenteIndividualResidencialFormState;
  savedAt: number;
};

let previewReturnMemory: AgenteIndividualResidencialFormState | null = null;
let previewReturnTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleClearReturnMemory() {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = setTimeout(() => {
    previewReturnMemory = null;
    previewReturnTimer = null;
  }, 2000);
}

export function clearAgenteIndividualResidencialPublishTempState(): void {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = null;
  previewReturnMemory = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
    sessionStorage.removeItem(BR_AGENTE_RES_RETURN_KEY);
  } catch {
    /* ignore */
  }
}

export function saveAgenteResPreviewDraft(state: AgenteIndividualResidencialFormState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function saveAgenteResPreviewReturnDraft(state: AgenteIndividualResidencialFormState): void {
  if (typeof window === "undefined") return;
  previewReturnMemory = null;
  try {
    const payload: AgenteResPreviewReturnPayload = { state, savedAt: Date.now() };
    sessionStorage.setItem(BR_AGENTE_RES_RETURN_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadAgenteResPreviewDraft(): AgenteIndividualResidencialFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgenteIndividualResidencialFormState>;
    return mergePartialAgenteIndividualResidencial(parsed);
  } catch {
    return null;
  }
}

export function readAgenteResPreviewDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
  } catch {
    return null;
  }
}

/**
 * Bootstrap publicar: memoria Strict Mode → return draft → vacío.
 * No hidratar desde `BR_AGENTE_RES_PREVIEW_DRAFT_KEY` en visita fría (sólo lo lee la ruta preview).
 */
export function bootstrapAgenteIndividualResidencialApplicationState(): AgenteIndividualResidencialFormState {
  if (typeof window === "undefined") return createEmptyAgenteIndividualResidencialState();
  if (previewReturnMemory) {
    scheduleClearReturnMemory();
    return previewReturnMemory;
  }
  try {
    const raw = sessionStorage.getItem(BR_AGENTE_RES_RETURN_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<AgenteResPreviewReturnPayload>;
      if (data.state && typeof data.state === "object") {
        const merged = mergePartialAgenteIndividualResidencial(data.state as Partial<AgenteIndividualResidencialFormState>);
        sessionStorage.removeItem(BR_AGENTE_RES_RETURN_KEY);
        previewReturnMemory = merged;
        scheduleClearReturnMemory();
        return merged;
      }
    }
  } catch {
    /* fall through */
  }
  return createEmptyAgenteIndividualResidencialState();
}
