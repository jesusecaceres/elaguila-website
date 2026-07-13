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
  BR_AGENTE_IDB_PREFIX,
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
let draftPersistEpoch = 0;

function readPreviousPersistedFormState(): AgenteIndividualResidencialFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY) ??
      sessionStorage.getItem(BR_AGENTE_RES_RETURN_KEY) ??
      readDraftFromLocalStorageFallback();
    return raw ? parsePersistedStateFromJson(raw) : null;
  } catch {
    return null;
  }
}

function durablePhotoCount(state: AgenteIndividualResidencialFormState | null | undefined): number {
  if (!state || !Array.isArray(state.fotosDataUrls)) return 0;
  return state.fotosDataUrls.filter((u) => isDurableMediaUrl(String(u ?? ""))).length;
}

/**
 * Never let a late/failed compact write erase IDB/http gallery refs already on disk.
 */
function mergeCompactAvoidEmptyMediaOverwrite(
  compact: AgenteIndividualResidencialFormState,
): AgenteIndividualResidencialFormState {
  const previous = readPreviousPersistedFormState();
  if (!previous) return compact;
  return preserveDurableMediaOnSyncFlush(compact, compact, previous);
}

export async function persistAgenteResApplicationDraftResolved(
  state: AgenteIndividualResidencialFormState,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!draftHasPersistableProgress(state) && hasPersistedDraftKeys()) return;
  const epoch = ++draftPersistEpoch;
  setFullDraftMediaBridge(state);
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);
  let compact = state;
  try {
    compact = await offloadBrAgenteResHeavyMediaToIdb(BR_AGENTE_DRAFT_MEDIA_NAMESPACE, state);
  } catch {
    compact = stripHeavyDataUrlsForSession(state);
  }
  if (epoch !== draftPersistEpoch) return;
  compact = mergeCompactAvoidEmptyMediaOverwrite(compact);
  if (epoch !== draftPersistEpoch) return;
  // Refuse to persist a zero-photo compact when live still has photos and nothing durable is on disk yet.
  const livePhotoCount = (state.fotosDataUrls ?? []).filter((u) => String(u ?? "").trim()).length;
  if (livePhotoCount > 0 && durablePhotoCount(compact) === 0) {
    const previous = readPreviousPersistedFormState();
    if (previous && durablePhotoCount(previous) > 0) {
      compact = preserveDurableMediaOnSyncFlush(stripHeavyDataUrlsForSession(state), state, previous);
    } else {
      // Offload failed / race — do not write an empty gallery draft that would clobber a later success.
      return;
    }
  }
  if (epoch !== draftPersistEpoch) return;
  savePreviewPayload(compact, true);
  saveReturnPayload({ state: compact, savedAt: Date.now() }, true);
}

/** True when in-memory state still holds raw data: gallery blobs that must be offloaded now. */
export function agenteResStateHasUnpersistedDataUrlPhotos(state: AgenteIndividualResidencialFormState): boolean {
  return (state.fotosDataUrls ?? []).some((u) => typeof u === "string" && u.startsWith("data:"));
}

/** BR-INV-FIX-01D — debounced autosave without clearing in-memory return bridge. */
export function persistAgenteResApplicationDraftQuiet(state: AgenteIndividualResidencialFormState): void {
  void persistAgenteResApplicationDraftResolved(state);
}

/**
 * Sync flush for hard refresh / pagehide — updates text/schedule without wiping durable media.
 * Always kicks urgent async IDB offload when raw data: photos remain (best-effort before unload ends).
 */
export function flushAgenteResDraftSyncForUnload(state: AgenteIndividualResidencialFormState): void {
  if (typeof window === "undefined") return;
  if (!draftHasPersistableProgress(state) && hasPersistedDraftKeys()) return;
  if (!draftHasPersistableProgress(state)) return;
  setFullDraftMediaBridge(state);
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);

  if (agenteResStateHasUnpersistedDataUrlPhotos(state)) {
    // Fire async offload; also avoid writing a stripped empty gallery if no prior durable refs exist.
    void persistAgenteResApplicationDraftResolved(state);
  }

  const previous = readPreviousPersistedFormState();
  const stripped = stripHeavyDataUrlsForSession(state);
  const compact = preserveDurableMediaOnSyncFlush(stripped, state, previous);

  // Do not replace a populated durable gallery with empty when live still only has data: blobs.
  if (
    durablePhotoCount(compact) === 0 &&
    (state.fotosDataUrls ?? []).some((u) => String(u ?? "").startsWith("data:")) &&
    durablePhotoCount(previous) === 0
  ) {
    // Text/open-house only update onto previous shell if any; otherwise skip destructive photo wipe.
    if (previous) {
      const textOverlay = preserveDurableMediaOnSyncFlush(stripped, state, previous);
      savePreviewPayload(textOverlay, false);
      saveReturnPayload({ state: textOverlay, savedAt: Date.now() }, false);
    }
    return;
  }

  savePreviewPayload(compact, false);
  saveReturnPayload({ state: compact, savedAt: Date.now() }, false);
}

function isDurableMediaUrl(url: string): boolean {
  const u = String(url ?? "");
  if (!u) return false;
  if (u.startsWith(BR_AGENTE_IDB_PREFIX)) return true;
  if (u.startsWith("data:")) return false;
  return true;
}

function preferDurableMediaField(current: string, previous: string): string {
  const c = String(current ?? "");
  const p = String(previous ?? "");
  if (isDurableMediaUrl(c)) return c;
  if (isDurableMediaUrl(p)) return p;
  return "";
}

function preservePhotoListForSyncFlush(current: string[], previous: string[] | undefined): string[] {
  const cur = Array.isArray(current) ? current : [];
  const prev = Array.isArray(previous) ? previous : [];
  const durableCurrent = cur.filter((u) => isDurableMediaUrl(String(u ?? "")));
  if (durableCurrent.length > 0 && durableCurrent.length === cur.filter(Boolean).length) {
    return durableCurrent;
  }
  const len = Math.max(cur.length, prev.length);
  if (len === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < len; i++) {
    const chosen = preferDurableMediaField(String(cur[i] ?? ""), String(prev[i] ?? ""));
    if (chosen) out.push(chosen);
  }
  if (out.length > 0) return out;
  return cur.filter((u) => isDurableMediaUrl(String(u ?? "")));
}

function preserveDurableMediaOnSyncFlush(
  stripped: AgenteIndividualResidencialFormState,
  live: AgenteIndividualResidencialFormState,
  previous: AgenteIndividualResidencialFormState | null,
): AgenteIndividualResidencialFormState {
  const prev = previous;
  const fotos = preservePhotoListForSyncFlush(live.fotosDataUrls ?? [], prev?.fotosDataUrls);
  const fotoPortadaIndex = Math.min(
    Math.max(0, live.fotoPortadaIndex ?? 0),
    Math.max(0, fotos.length - 1),
  );
  return {
    ...stripped,
    fotosDataUrls: fotos,
    fotoPortadaIndex,
    agenteFotoDataUrl: preferDurableMediaField(live.agenteFotoDataUrl ?? "", prev?.agenteFotoDataUrl ?? ""),
    agente2FotoDataUrl: preferDurableMediaField(live.agente2FotoDataUrl ?? "", prev?.agente2FotoDataUrl ?? ""),
    marcaLogoDataUrl: preferDurableMediaField(live.marcaLogoDataUrl ?? "", prev?.marcaLogoDataUrl ?? ""),
    videoDataUrl: preferDurableMediaField(live.videoDataUrl ?? "", prev?.videoDataUrl ?? ""),
    tourDataUrl: preferDurableMediaField(live.tourDataUrl ?? "", prev?.tourDataUrl ?? ""),
    brochureDataUrl: preferDurableMediaField(live.brochureDataUrl ?? "", prev?.brochureDataUrl ?? ""),
    listadoArchivoDataUrl: preferDurableMediaField(live.listadoArchivoDataUrl ?? "", prev?.listadoArchivoDataUrl ?? ""),
    additionalInventoryProperties: preserveChildInventoryMediaOnSyncFlush(
      stripped.additionalInventoryProperties ?? [],
      live.additionalInventoryProperties ?? [],
      prev?.additionalInventoryProperties ?? [],
    ),
  };
}

function preserveChildInventoryMediaOnSyncFlush(
  strippedChildren: AgenteIndividualResidencialFormState["additionalInventoryProperties"],
  liveChildren: AgenteIndividualResidencialFormState["additionalInventoryProperties"],
  previousChildren: AgenteIndividualResidencialFormState["additionalInventoryProperties"],
): AgenteIndividualResidencialFormState["additionalInventoryProperties"] {
  const live = Array.isArray(liveChildren) ? liveChildren : [];
  const prev = Array.isArray(previousChildren) ? previousChildren : [];
  const stripped = Array.isArray(strippedChildren) ? strippedChildren : live;
  return stripped.map((child, index) => {
    const liveChild = live.find((c) => c.id === child.id) ?? live[index];
    const prevChild = prev.find((c) => c.id === child.id) ?? prev[index];
    const photoUrls = preservePhotoListForSyncFlush(
      liveChild?.photoUrls ?? child.photoUrls ?? [],
      prevChild?.photoUrls,
    );
    const primaryPhotoIndex = Math.min(
      Math.max(0, liveChild?.primaryPhotoIndex ?? child.primaryPhotoIndex ?? 0),
      Math.max(0, photoUrls.length - 1),
    );
    const liveForm = liveChild?.propertyForm;
    const prevForm = prevChild?.propertyForm;
    const formFotos = preservePhotoListForSyncFlush(
      liveForm?.fotosDataUrls ?? child.propertyForm?.fotosDataUrls ?? [],
      prevForm?.fotosDataUrls,
    );
    return {
      ...child,
      photoUrls,
      primaryPhotoIndex,
      mainPhotoUrl: photoUrls[primaryPhotoIndex] ?? photoUrls[0] ?? "",
      propertyForm: child.propertyForm
        ? {
            ...child.propertyForm,
            fotosDataUrls: formFotos,
            fotoPortadaIndex: Math.min(
              Math.max(0, liveForm?.fotoPortadaIndex ?? child.propertyForm.fotoPortadaIndex ?? 0),
              Math.max(0, formFotos.length - 1),
            ),
            listadoArchivoDataUrl: preferDurableMediaField(
              liveForm?.listadoArchivoDataUrl ?? "",
              prevForm?.listadoArchivoDataUrl ?? "",
            ),
            videoDataUrl: preferDurableMediaField(liveForm?.videoDataUrl ?? "", prevForm?.videoDataUrl ?? ""),
            tourDataUrl: preferDurableMediaField(liveForm?.tourDataUrl ?? "", prevForm?.tourDataUrl ?? ""),
            brochureDataUrl: preferDurableMediaField(
              liveForm?.brochureDataUrl ?? "",
              prevForm?.brochureDataUrl ?? "",
            ),
          }
        : child.propertyForm,
    };
  });
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
