import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  createEmptyAgenteIndividualResidencialState,
  mergePartialAgenteIndividualResidencial,
  type AgenteIndividualResidencialFormState,
} from "../../schema/agenteIndividualResidencialFormState";
import { agenteResFormHasProgress } from "../formProgress";
import {
  clearChildInventoryMediaBridge,
  mergeChildInventoryWithMediaBridge,
  setChildInventoryMediaBridge,
  stripChildInventoryForSession,
} from "../../../application/brNegocioInventoryDraftPersistence";
import {
  BR_AGENTE_DRAFT_MEDIA_NAMESPACE,
  clearBrAgenteResDraftMediaNamespace,
  inlineBrAgenteResHeavyMediaFromIdb,
  offloadBrAgenteResHeavyMediaToIdb,
} from "./brAgenteResDraftMedia";

/** When JSON merge fails, recover QA routing only if the payload explicitly set a category. */
function explicitCategoriaInPayload(o: unknown): BrNegocioCategoriaPropiedad | null {
  if (!o || typeof o !== "object") return null;
  const v = (o as Record<string, unknown>).categoriaPropiedad;
  if (v === "residencial" || v === "comercial" || v === "terreno_lote") return v;
  return null;
}

/** Aislado del borrador genérico Negocio legacy (`br-negocio-preview-draft`). */
export const BR_AGENTE_RES_PREVIEW_DRAFT_KEY = "br-negocio-agente-residencial-preview-draft";
export const BR_AGENTE_RES_RETURN_KEY = "br-negocio-agente-residencial-return-draft";
/** Rentas-style mirror when sessionStorage quota is tight (metadata + IDB refs). */
export const BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY = "br-negocio-agente-residencial-draft-ls-fallback";

export type AgenteResPreviewReturnPayload = {
  state: AgenteIndividualResidencialFormState;
  savedAt: number;
};

let previewReturnMemory: AgenteIndividualResidencialFormState | null = null;
let previewReturnTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Full in-memory snapshot of the form (including `data:` blobs) for preview + return-from-preview.
 * sessionStorage often strips `data:` on quota; this bridge survives same-tab navigation until consumed in bootstrap.
 */
let fullDraftMediaBridge: AgenteIndividualResidencialFormState | null = null;

function setFullDraftMediaBridge(state: AgenteIndividualResidencialFormState): void {
  try {
    fullDraftMediaBridge = JSON.parse(JSON.stringify(state)) as AgenteIndividualResidencialFormState;
  } catch {
    fullDraftMediaBridge = null;
  }
}

export function clearAgenteResFullDraftMediaBridge(): void {
  fullDraftMediaBridge = null;
}

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
  fullDraftMediaBridge = null;
  clearChildInventoryMediaBridge();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
    sessionStorage.removeItem(BR_AGENTE_RES_RETURN_KEY);
    localStorage.removeItem(BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
  void clearBrAgenteResDraftMediaNamespace(BR_AGENTE_DRAFT_MEDIA_NAMESPACE);
}

function hasPersistedDraftKeys(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!(
      sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY) ||
      sessionStorage.getItem(BR_AGENTE_RES_RETURN_KEY) ||
      localStorage.getItem(BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY)
    );
  } catch {
    return false;
  }
}

function mirrorDraftToLocalStorage(json: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY, json);
  } catch {
    /* ignore */
  }
}

/** After session restore, keep in-memory bridges aligned with compact persisted JSON. */
function syncDraftMediaBridgesFromState(state: AgenteIndividualResidencialFormState): void {
  try {
    setFullDraftMediaBridge(state);
    setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);
  } catch {
    /* ignore */
  }
}

function readDraftFromLocalStorageFallback(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY);
  } catch {
    return null;
  }
}

export function parsePersistedStateFromJson(raw: string): AgenteIndividualResidencialFormState | null {
  try {
    const data = JSON.parse(raw) as Partial<AgenteResPreviewReturnPayload> & Record<string, unknown>;
    if (data.state && typeof data.state === "object") {
      return data.state as AgenteIndividualResidencialFormState;
    }
    if (data && typeof data === "object" && "titulo" in data) {
      return data as AgenteIndividualResidencialFormState;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Unwrap flat form state vs `{ state, savedAt }` return wrapper stored in memory bridges. */
function coercePersistedFormState(candidate: unknown): AgenteIndividualResidencialFormState | null {
  if (!candidate || typeof candidate !== "object") return null;
  if ("titulo" in candidate) {
    return candidate as AgenteIndividualResidencialFormState;
  }
  const wrapped = candidate as Partial<AgenteResPreviewReturnPayload>;
  if (wrapped.state && typeof wrapped.state === "object" && "titulo" in wrapped.state) {
    return wrapped.state as AgenteIndividualResidencialFormState;
  }
  return null;
}

function resolveFullDraftMediaBridgeState(): AgenteIndividualResidencialFormState | null {
  return coercePersistedFormState(fullDraftMediaBridge);
}

function restoreMediaBridgesFromLocalStorageFallback(): void {
  if (fullDraftMediaBridge) return;
  try {
    const raw = readDraftFromLocalStorageFallback();
    if (!raw) return;
    const parsed = parsePersistedStateFromJson(raw);
    if (parsed) {
      setFullDraftMediaBridge(parsed);
      setChildInventoryMediaBridge(parsed.additionalInventoryProperties ?? []);
    }
  } catch {
    /* ignore */
  }
}

function draftHasPersistableProgress(state: AgenteIndividualResidencialFormState): boolean {
  if (agenteResFormHasProgress(state)) return true;
  return (state.additionalInventoryProperties?.length ?? 0) > 0;
}

/** Hard-refresh simulation for hydration proof scripts (clears in-memory bridges only). */
export function resetAgenteResDraftHydrationMemoryForTests(): void {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = null;
  previewReturnMemory = null;
  fullDraftMediaBridge = null;
  clearChildInventoryMediaBridge();
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
  j.agente2FotoDataUrl = z(j.agente2FotoDataUrl);
  j.marcaLogoDataUrl = z(j.marcaLogoDataUrl);
  if (Array.isArray(j.fotosDataUrls)) {
    j.fotosDataUrls = j.fotosDataUrls.filter((u) => typeof u === "string" && !u.startsWith("data:"));
  }
  if (Array.isArray(j.additionalInventoryProperties)) {
    j.additionalInventoryProperties = stripChildInventoryForSession(j.additionalInventoryProperties);
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
      const json = JSON.stringify(payload);
      writePreviewKey(json);
      mirrorDraftToLocalStorage(json);
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
  mirrorDraftToLocalStorage(JSON.stringify(tryStrip ? stripHeavyDataUrlsForSession(state) : state));
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
      const json = JSON.stringify(p);
      writeReturnKey(json);
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
  void persistAgenteResApplicationDraftResolved(state);
}

export function saveAgenteResPreviewReturnDraft(state: AgenteIndividualResidencialFormState): void {
  if (typeof window === "undefined") return;
  previewReturnMemory = null;
  void persistAgenteResApplicationDraftResolved(state);
}

/** BR-DRAFT-PERSIST-01 — async persist with IndexedDB media offload (Servicios pattern). */
export async function persistAgenteResApplicationDraftResolved(
  state: AgenteIndividualResidencialFormState,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!draftHasPersistableProgress(state) && hasPersistedDraftKeys()) return;
  setFullDraftMediaBridge(state);
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);
  let compact = state;
  try {
    compact = await offloadBrAgenteResHeavyMediaToIdb(BR_AGENTE_DRAFT_MEDIA_NAMESPACE, state);
  } catch {
    compact = stripHeavyDataUrlsForSession(state);
  }
  savePreviewPayload(compact, true);
  saveReturnPayload({ state: compact, savedAt: Date.now() }, true);
}

/** BR-INV-FIX-01D — debounced autosave without clearing in-memory return bridge. */
export function persistAgenteResApplicationDraftQuiet(state: AgenteIndividualResidencialFormState): void {
  void persistAgenteResApplicationDraftResolved(state);
}

/**
 * Sync flush for hard refresh / pagehide — skips IndexedDB offload so open-house + text survive
 * an immediate reload before the debounced async autosave finishes.
 */
export function flushAgenteResDraftSyncForUnload(state: AgenteIndividualResidencialFormState): void {
  if (typeof window === "undefined") return;
  if (!draftHasPersistableProgress(state) && hasPersistedDraftKeys()) return;
  if (!draftHasPersistableProgress(state)) return;
  setFullDraftMediaBridge(state);
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);
  const compact = stripHeavyDataUrlsForSession(state);
  savePreviewPayload(compact, false);
  saveReturnPayload({ state: compact, savedAt: Date.now() }, false);
}

/** Rehydrate IndexedDB-backed media after refresh (same tab/session). */
export async function rehydrateAgenteResDraftMediaFromIdb(
  state: AgenteIndividualResidencialFormState,
): Promise<AgenteIndividualResidencialFormState> {
  try {
    const inlined = await inlineBrAgenteResHeavyMediaFromIdb(BR_AGENTE_DRAFT_MEDIA_NAMESPACE, state);
    const merged = mergePartialAgenteIndividualResidencial({
      ...inlined,
      additionalInventoryProperties: mergeChildInventoryWithMediaBridge(
        inlined.additionalInventoryProperties ?? [],
      ),
    });
    syncDraftMediaBridgesFromState(merged);
    return merged;
  } catch {
    return state;
  }
}

export async function loadAgenteResPreviewDraftResolved(): Promise<AgenteIndividualResidencialFormState | null> {
  const sync = loadAgenteResPreviewDraft();
  if (!sync) return null;
  return rehydrateAgenteResDraftMediaFromIdb(sync);
}

export function loadAgenteResPreviewDraft(): AgenteIndividualResidencialFormState | null {
  if (typeof window === "undefined") return null;
  restoreMediaBridgesFromLocalStorageFallback();
  const bridgedPreview = resolveFullDraftMediaBridgeState();
  if (bridgedPreview) {
    try {
      return mergePartialAgenteIndividualResidencial(
        bridgedPreview as Partial<AgenteIndividualResidencialFormState> & Record<string, unknown>,
      );
    } catch {
      const cat = explicitCategoriaInPayload(bridgedPreview);
      if (cat) return mergePartialAgenteIndividualResidencial({ categoriaPropiedad: cat });
    }
  }
  try {
    const raw = sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgenteIndividualResidencialFormState> & Record<string, unknown>;
    try {
      const mergedBase = mergePartialAgenteIndividualResidencial(parsed);
      return mergePartialAgenteIndividualResidencial({
        ...mergedBase,
        additionalInventoryProperties: mergeChildInventoryWithMediaBridge(
          mergedBase.additionalInventoryProperties ?? [],
        ),
      });
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[agente-res preview] merge draft failed", e);
      }
      const cat = explicitCategoriaInPayload(parsed);
      if (cat) return mergePartialAgenteIndividualResidencial({ categoriaPropiedad: cat });
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
export async function bootstrapAgenteIndividualResidencialApplicationStateResolved(): Promise<AgenteIndividualResidencialFormState> {
  const boot = bootstrapAgenteIndividualResidencialApplicationState();
  return rehydrateAgenteResDraftMediaFromIdb(boot);
}

export function bootstrapAgenteIndividualResidencialApplicationState(): AgenteIndividualResidencialFormState {
  if (typeof window === "undefined") return createEmptyAgenteIndividualResidencialState();
  restoreMediaBridgesFromLocalStorageFallback();
  if (previewReturnMemory) {
    scheduleClearReturnMemory();
    return previewReturnMemory;
  }
  try {
    const raw =
      sessionStorage.getItem(BR_AGENTE_RES_RETURN_KEY) ?? readDraftFromLocalStorageFallback();
    const returnState = raw ? parsePersistedStateFromJson(raw) : null;
    if (returnState) {
      try {
          const bridgedReturn = resolveFullDraftMediaBridgeState();
          const mergedBase = bridgedReturn
            ? mergePartialAgenteIndividualResidencial(
                bridgedReturn as Partial<AgenteIndividualResidencialFormState> & Record<string, unknown>,
              )
            : mergePartialAgenteIndividualResidencial(returnState as Partial<AgenteIndividualResidencialFormState>);
          const merged = mergePartialAgenteIndividualResidencial({
            ...mergedBase,
            additionalInventoryProperties: mergeChildInventoryWithMediaBridge(
              mergedBase.additionalInventoryProperties ?? [],
            ),
          });
          sessionStorage.removeItem(BR_AGENTE_RES_RETURN_KEY);
          syncDraftMediaBridgesFromState(merged);
          previewReturnMemory = merged;
          scheduleClearReturnMemory();
          return merged;
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[agente-res preview] merge return draft failed", e);
          }
          const cat =
            explicitCategoriaInPayload(resolveFullDraftMediaBridgeState()) ??
            explicitCategoriaInPayload(returnState as Record<string, unknown>);
          if (cat) {
            const recovered = mergePartialAgenteIndividualResidencial({ categoriaPropiedad: cat });
            sessionStorage.removeItem(BR_AGENTE_RES_RETURN_KEY);
            syncDraftMediaBridgesFromState(recovered);
            previewReturnMemory = recovered;
            scheduleClearReturnMemory();
            return recovered;
          }
        }
    }
    const previewRaw =
      sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY) ?? readDraftFromLocalStorageFallback();
    const previewState = previewRaw ? parsePersistedStateFromJson(previewRaw) : null;
    if (previewState) {
      try {
        const bridgedPreview = resolveFullDraftMediaBridgeState();
        const mergedBase = bridgedPreview
          ? mergePartialAgenteIndividualResidencial(
              bridgedPreview as Partial<AgenteIndividualResidencialFormState> & Record<string, unknown>,
            )
          : mergePartialAgenteIndividualResidencial(previewState as Partial<AgenteIndividualResidencialFormState>);
        const merged = mergePartialAgenteIndividualResidencial({
          ...mergedBase,
          additionalInventoryProperties: mergeChildInventoryWithMediaBridge(
            mergedBase.additionalInventoryProperties ?? [],
          ),
        });
        syncDraftMediaBridgesFromState(merged);
        previewReturnMemory = merged;
        scheduleClearReturnMemory();
        return merged;
      } catch {
        /* fall through to empty */
      }
    }
  } catch {
    /* fall through */
  }
  if (!hasPersistedDraftKeys()) {
    void clearBrAgenteResDraftMediaNamespace(BR_AGENTE_DRAFT_MEDIA_NAMESPACE);
  }
  return createEmptyAgenteIndividualResidencialState();
}
