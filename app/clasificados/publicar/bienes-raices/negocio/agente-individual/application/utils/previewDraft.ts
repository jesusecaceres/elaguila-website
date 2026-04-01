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

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException && (e.name === "QuotaExceededError" || (e as DOMException).code === 22)
  );
}

/**
 * Reduce payload so sessionStorage can persist (data: URLs exceed quota easily).
 * Order: strip all data: blobs → then drop gallery photos if still too large.
 */
function stripHeavyDataUrlsForSession(state: AgenteIndividualResidencialFormState): AgenteIndividualResidencialFormState {
  const j = JSON.parse(JSON.stringify(state)) as AgenteIndividualResidencialFormState;
  const z = (u: string) => (typeof u === "string" && u.startsWith("data:") ? "" : u);
  j.listadoArchivoDataUrl = z(j.listadoArchivoDataUrl);
  j.videoDataUrl = z(j.videoDataUrl);
  j.tourDataUrl = z(j.tourDataUrl);
  j.brochureDataUrl = z(j.brochureDataUrl);
  j.agenteFotoDataUrl = z(j.agenteFotoDataUrl);
  j.marcaLogoDataUrl = z(j.marcaLogoDataUrl);
  if (Array.isArray(j.fotosDataUrls)) {
    j.fotosDataUrls = j.fotosDataUrls.filter((u) => typeof u === "string" && !u.startsWith("data:"));
  }
  return j;
}

function stripAllGalleryPhotos(state: AgenteIndividualResidencialFormState): AgenteIndividualResidencialFormState {
  const j = stripHeavyDataUrlsForSession(state);
  j.fotosDataUrls = [];
  j.fotoPortadaIndex = 0;
  return j;
}

function writePreviewKey(json: string): void {
  sessionStorage.setItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY, json);
}

function writeReturnKey(json: string): void {
  sessionStorage.setItem(BR_AGENTE_RES_RETURN_KEY, json);
}

function savePreviewPayload(state: AgenteIndividualResidencialFormState, tryStrip: boolean): boolean {
  if (typeof window === "undefined") return false;
  const attempts: AgenteIndividualResidencialFormState[] = [state];
  if (tryStrip) {
    attempts.push(stripHeavyDataUrlsForSession(state), stripAllGalleryPhotos(state));
  }
  for (const payload of attempts) {
    try {
      writePreviewKey(JSON.stringify(payload));
      return true;
    } catch (e) {
      if (!isQuotaError(e)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[agente-res preview] save preview draft failed", e);
        }
        return false;
      }
    }
  }
  return false;
}

function saveReturnPayload(payload: AgenteResPreviewReturnPayload, tryStrip: boolean): boolean {
  if (typeof window === "undefined") return false;
  const attempts: AgenteResPreviewReturnPayload[] = [payload];
  if (tryStrip) {
    attempts.push({ ...payload, state: stripHeavyDataUrlsForSession(payload.state) });
    attempts.push({ ...payload, state: stripAllGalleryPhotos(payload.state), savedAt: payload.savedAt });
  }
  for (const p of attempts) {
    try {
      writeReturnKey(JSON.stringify(p));
      return true;
    } catch (e) {
      if (!isQuotaError(e)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[agente-res preview] save return draft failed", e);
        }
        return false;
      }
    }
  }
  return false;
}

export function saveAgenteResPreviewDraft(state: AgenteIndividualResidencialFormState): void {
  savePreviewPayload(state, true);
}

export function saveAgenteResPreviewReturnDraft(state: AgenteIndividualResidencialFormState): void {
  if (typeof window === "undefined") return;
  previewReturnMemory = null;
  saveReturnPayload({ state, savedAt: Date.now() }, true);
}

export function loadAgenteResPreviewDraft(): AgenteIndividualResidencialFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgenteIndividualResidencialFormState> & Record<string, unknown>;
    try {
      return mergePartialAgenteIndividualResidencial(parsed);
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[agente-res preview] merge draft failed", e);
      }
      return null;
    }
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
        try {
          const merged = mergePartialAgenteIndividualResidencial(data.state as Partial<AgenteIndividualResidencialFormState>);
          sessionStorage.removeItem(BR_AGENTE_RES_RETURN_KEY);
          previewReturnMemory = merged;
          scheduleClearReturnMemory();
          return merged;
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[agente-res preview] merge return draft failed", e);
          }
        }
      }
    }
  } catch {
    /* fall through */
  }
  return createEmptyAgenteIndividualResidencialState();
}
