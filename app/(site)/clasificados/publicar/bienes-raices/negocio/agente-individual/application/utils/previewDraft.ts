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
import { clearChildInventoryEditorSession } from "../../../application/brNegocioChildInventoryEditorSession";
import {
  BR_AGENTE_DRAFT_MEDIA_NAMESPACE,
  BR_AGENTE_IDB_PREFIX,
  brAgenteDraftMediaNamespaceForApplicationInstance,
  clearBrAgenteResDraftMediaNamespace,
  setActiveBrAgenteDraftMediaNamespace,
  inlineBrAgenteResHeavyMediaFromIdb,
  offloadBrAgenteResHeavyMediaToIdb,
} from "./brAgenteResDraftMedia";

/** Mirrors `LEONIX_RETURNING_TO_EDIT_SESSION_FLAG` — kept local to avoid circular import with publishFlowLifecycleClient. */
const BR_AGENTE_RETURNING_TO_EDIT_FLAG = "leonix-publish-flow-returning-to-edit";

function clearReturningToEditFlagLocal(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_AGENTE_RETURNING_TO_EDIT_FLAG);
  } catch {
    /* ignore */
  }
}

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
export const BR_AGENTE_RES_APPLICATION_INSTANCE_QUERY_PARAM = "applicationInstanceId";
export const BR_AGENTE_RES_APPLICATION_INSTANCE_SESSION_KEY =
  "br-negocio-agente-residencial-application-instance-id";
export const BR_AGENTE_RES_LEGACY_MIGRATION_PREFIX =
  "br-negocio-agente-residencial-legacy-migration";

export type AgenteResApplicationScope = {
  applicationInstanceId?: string | null;
};

export type AgenteResApplicationStorageKeys = {
  applicationInstanceId: string | null;
  previewKey: string;
  returnKey: string;
  fallbackKey: string;
  mediaNamespace: string;
  migrationKey: string | null;
};

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

function trimId(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function createBrAgenteResApplicationInstanceId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `br-agent-app-${suffix}`;
}

function getParam(
  params: URLSearchParams | { get: (key: string) => string | null } | null | undefined,
  key: string,
): string {
  try {
    return trimId(params?.get(key));
  } catch {
    return "";
  }
}

function hasLegacySessionDraftKeys(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(
      sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY) ||
        sessionStorage.getItem(BR_AGENTE_RES_RETURN_KEY),
    );
  } catch {
    return false;
  }
}

function setApplicationInstanceSession(applicationInstanceId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BR_AGENTE_RES_APPLICATION_INSTANCE_SESSION_KEY, applicationInstanceId);
  } catch {
    /* ignore */
  }
}

export function ensureBrAgenteResApplicationInstanceId(
  params?: URLSearchParams | { get: (key: string) => string | null } | null,
): string {
  const fromQuery = getParam(params, BR_AGENTE_RES_APPLICATION_INSTANCE_QUERY_PARAM);
  if (fromQuery) {
    setApplicationInstanceSession(fromQuery);
    return fromQuery;
  }
  if (typeof window !== "undefined") {
    try {
      const existing = trimId(sessionStorage.getItem(BR_AGENTE_RES_APPLICATION_INSTANCE_SESSION_KEY));
      if (existing) return existing;
    } catch {
      /* ignore */
    }
  }
  const next = createBrAgenteResApplicationInstanceId();
  setApplicationInstanceSession(next);
  return next;
}

export function withBrAgenteResApplicationInstanceParam(path: string, applicationInstanceId: string): string {
  const id = trimId(applicationInstanceId);
  if (!id) return path;
  const [base, hash = ""] = path.split("#", 2);
  const [pathname, query = ""] = (base ?? path).split("?", 2);
  const qs = new URLSearchParams(query);
  qs.set(BR_AGENTE_RES_APPLICATION_INSTANCE_QUERY_PARAM, id);
  const next = `${pathname}?${qs.toString()}`;
  return hash ? `${next}#${hash}` : next;
}

export function brAgenteResApplicationStorageKeys(
  scope?: AgenteResApplicationScope | string | null,
): AgenteResApplicationStorageKeys {
  const applicationInstanceId =
    typeof scope === "string" ? trimId(scope) : trimId(scope?.applicationInstanceId);
  if (!applicationInstanceId) {
    return {
      applicationInstanceId: null,
      previewKey: BR_AGENTE_RES_PREVIEW_DRAFT_KEY,
      returnKey: BR_AGENTE_RES_RETURN_KEY,
      fallbackKey: BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY,
      mediaNamespace: BR_AGENTE_DRAFT_MEDIA_NAMESPACE,
      migrationKey: null,
    };
  }
  return {
    applicationInstanceId,
    previewKey: `${BR_AGENTE_RES_PREVIEW_DRAFT_KEY}:${applicationInstanceId}`,
    returnKey: `${BR_AGENTE_RES_RETURN_KEY}:${applicationInstanceId}`,
    fallbackKey: `${BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY}:${applicationInstanceId}`,
    mediaNamespace: brAgenteDraftMediaNamespaceForApplicationInstance(applicationInstanceId),
    migrationKey: `${BR_AGENTE_RES_LEGACY_MIGRATION_PREFIX}:${applicationInstanceId}`,
  };
}

function activateApplicationMediaNamespace(scope?: AgenteResApplicationScope | string | null): AgenteResApplicationStorageKeys {
  const keys = brAgenteResApplicationStorageKeys(scope);
  setActiveBrAgenteDraftMediaNamespace(keys.mediaNamespace);
  return keys;
}

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

export function clearAgenteIndividualResidencialPublishTempState(scope?: AgenteResApplicationScope | string | null): void {
  const keys = brAgenteResApplicationStorageKeys(scope);
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = null;
  previewReturnMemory = null;
  fullDraftMediaBridge = null;
  clearChildInventoryMediaBridge();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(keys.previewKey);
    sessionStorage.removeItem(keys.returnKey);
    localStorage.removeItem(keys.fallbackKey);
  } catch {
    /* ignore */
  }
  void clearBrAgenteResDraftMediaNamespace(keys.mediaNamespace);
}

function clearAgenteResApplicationMemoryOnly(): void {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = null;
  previewReturnMemory = null;
  fullDraftMediaBridge = null;
  clearChildInventoryMediaBridge();
}

function hasPersistedDraftKeys(scope?: AgenteResApplicationScope | string | null): boolean {
  if (typeof window === "undefined") return false;
  const keys = brAgenteResApplicationStorageKeys(scope);
  try {
    return !!(
      sessionStorage.getItem(keys.previewKey) ||
      sessionStorage.getItem(keys.returnKey) ||
      localStorage.getItem(keys.fallbackKey)
    );
  } catch {
    return false;
  }
}

function mirrorDraftToLocalStorage(json: string, scope?: AgenteResApplicationScope | string | null): void {
  if (typeof window === "undefined") return;
  const keys = brAgenteResApplicationStorageKeys(scope);
  try {
    localStorage.setItem(keys.fallbackKey, json);
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

function readDraftFromLocalStorageFallback(scope?: AgenteResApplicationScope | string | null): string | null {
  if (typeof window === "undefined") return null;
  const keys = brAgenteResApplicationStorageKeys(scope);
  try {
    return localStorage.getItem(keys.fallbackKey);
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

function restoreMediaBridgesFromLocalStorageFallback(scope?: AgenteResApplicationScope | string | null): void {
  if (fullDraftMediaBridge) return;
  try {
    const raw = readDraftFromLocalStorageFallback(scope);
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

function writePreviewKey(json: string, scope?: AgenteResApplicationScope | string | null): void {
  const keys = brAgenteResApplicationStorageKeys(scope);
  sessionStorage.setItem(keys.previewKey, json);
}

function writeReturnKey(json: string, scope?: AgenteResApplicationScope | string | null): void {
  const keys = brAgenteResApplicationStorageKeys(scope);
  sessionStorage.setItem(keys.returnKey, json);
}

function savePreviewPayload(
  state: AgenteIndividualResidencialFormState,
  tryStrip: boolean,
  scope?: AgenteResApplicationScope | string | null,
): boolean {
  if (typeof window === "undefined") return false;
  const attempts: AgenteIndividualResidencialFormState[] = [state];
  if (tryStrip) {
    attempts.push(stripHeavyDataUrlsForSession(state), stripAllGalleryPhotos(state));
  }
  for (const payload of attempts) {
    try {
      const json = JSON.stringify(payload);
      writePreviewKey(json, scope);
      mirrorDraftToLocalStorage(json, scope);
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
  mirrorDraftToLocalStorage(JSON.stringify(tryStrip ? stripHeavyDataUrlsForSession(state) : state), scope);
  return false;
}

function saveReturnPayload(
  payload: AgenteResPreviewReturnPayload,
  tryStrip: boolean,
  scope?: AgenteResApplicationScope | string | null,
): boolean {
  if (typeof window === "undefined") return false;
  const attempts: AgenteResPreviewReturnPayload[] = [payload];
  if (tryStrip) {
    attempts.push({ ...payload, state: stripHeavyDataUrlsForSession(payload.state) });
    attempts.push({ ...payload, state: stripAllGalleryPhotos(payload.state), savedAt: payload.savedAt });
  }
  for (const p of attempts) {
    try {
      const json = JSON.stringify(p);
      writeReturnKey(json, scope);
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

export function saveAgenteResPreviewDraft(
  state: AgenteIndividualResidencialFormState,
  scope?: AgenteResApplicationScope | string | null,
): void {
  void persistAgenteResApplicationDraftResolved(state, { ...scopeFrom(scope), writeReturn: true });
}

export function saveAgenteResPreviewReturnDraft(
  state: AgenteIndividualResidencialFormState,
  scope?: AgenteResApplicationScope | string | null,
): void {
  if (typeof window === "undefined") return;
  previewReturnMemory = null;
  void persistAgenteResApplicationDraftResolved(state, { ...scopeFrom(scope), writeReturn: true });
}

/** BR-DRAFT-PERSIST-01 — async persist with IndexedDB media offload (Servicios pattern). */
let draftPersistEpoch = 0;

function scopeFrom(scope?: AgenteResApplicationScope | string | null): AgenteResApplicationScope {
  return typeof scope === "string" ? { applicationInstanceId: scope } : { applicationInstanceId: scope?.applicationInstanceId ?? null };
}

function readPreviousPersistedFormState(
  scope?: AgenteResApplicationScope | string | null,
): AgenteIndividualResidencialFormState | null {
  if (typeof window === "undefined") return null;
  const keys = brAgenteResApplicationStorageKeys(scope);
  try {
    const raw =
      sessionStorage.getItem(keys.previewKey) ??
      sessionStorage.getItem(keys.returnKey) ??
      readDraftFromLocalStorageFallback(scope);
    return raw ? parsePersistedStateFromJson(raw) : null;
  } catch {
    return null;
  }
}

function durablePhotoCount(state: AgenteIndividualResidencialFormState | null | undefined): number {
  if (!state || !Array.isArray(state.fotosDataUrls)) return 0;
  return state.fotosDataUrls.filter((u) => isDurableMediaUrl(String(u ?? ""))).length;
}

function durableChildInventoryPhotoCount(state: AgenteIndividualResidencialFormState | null | undefined): number {
  if (!state || !Array.isArray(state.additionalInventoryProperties)) return 0;
  let n = 0;
  for (const child of state.additionalInventoryProperties) {
    const photos = Array.isArray(child.photoUrls) ? child.photoUrls : [];
    const formPhotos =
      child.propertyForm && Array.isArray(child.propertyForm.fotosDataUrls)
        ? child.propertyForm.fotosDataUrls
        : [];
    n += [...photos, ...formPhotos].filter((u) => isDurableMediaUrl(String(u ?? ""))).length;
  }
  return n;
}

function liveChildInventoryPhotoCount(state: AgenteIndividualResidencialFormState | null | undefined): number {
  if (!state || !Array.isArray(state.additionalInventoryProperties)) return 0;
  let n = 0;
  for (const child of state.additionalInventoryProperties) {
    const photos = Array.isArray(child.photoUrls) ? child.photoUrls : [];
    const formPhotos =
      child.propertyForm && Array.isArray(child.propertyForm.fotosDataUrls)
        ? child.propertyForm.fotosDataUrls
        : [];
    n += [...photos, ...formPhotos].filter((u) => String(u ?? "").trim()).length;
  }
  return n;
}

/**
 * Never let a late/failed compact write erase IDB/http gallery refs already on disk.
 */
function mergeCompactAvoidEmptyMediaOverwrite(
  compact: AgenteIndividualResidencialFormState,
  scope?: AgenteResApplicationScope | string | null,
): AgenteIndividualResidencialFormState {
  const previous = readPreviousPersistedFormState(scope);
  if (!previous) return compact;
  return preserveDurableMediaOnSyncFlush(compact, compact, previous);
}

export type PersistAgenteResDraftOptions = {
  /** When true, always write the Preview→Volver return key (openPreview / explicit return). */
  writeReturn?: boolean;
  applicationInstanceId?: string | null;
};

export async function persistAgenteResApplicationDraftResolved(
  state: AgenteIndividualResidencialFormState,
  opts?: PersistAgenteResDraftOptions,
): Promise<void> {
  if (typeof window === "undefined") return;
  const keys = activateApplicationMediaNamespace(opts);
  if (!draftHasPersistableProgress(state) && hasPersistedDraftKeys(opts)) return;
  const epoch = ++draftPersistEpoch;
  setFullDraftMediaBridge(state);
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);
  let compact = state;
  try {
    compact = await offloadBrAgenteResHeavyMediaToIdb(keys.mediaNamespace, state);
  } catch {
    compact = stripHeavyDataUrlsForSession(state);
  }
  if (epoch !== draftPersistEpoch) return;
  compact = mergeCompactAvoidEmptyMediaOverwrite(compact, opts);
  if (epoch !== draftPersistEpoch) return;
  // Refuse to persist a zero-photo compact when live still has photos and nothing durable is on disk yet.
  const livePhotoCount = (state.fotosDataUrls ?? []).filter((u) => String(u ?? "").trim()).length;
  const liveChildPhotos = liveChildInventoryPhotoCount(state);
  if (
    (livePhotoCount > 0 && durablePhotoCount(compact) === 0) ||
    (liveChildPhotos > 0 && durableChildInventoryPhotoCount(compact) === 0)
  ) {
    const previous = readPreviousPersistedFormState(opts);
    if (
      previous &&
      (durablePhotoCount(previous) > 0 || durableChildInventoryPhotoCount(previous) > 0)
    ) {
      compact = preserveDurableMediaOnSyncFlush(stripHeavyDataUrlsForSession(state), state, previous);
    } else {
      // Offload failed / race — do not write an empty gallery draft that would clobber a later success.
      return;
    }
  }
  if (epoch !== draftPersistEpoch) return;
  savePreviewPayload(compact, true, opts);
  const shouldWriteReturn =
    Boolean(opts?.writeReturn) ||
    (() => {
      try {
        return Boolean(sessionStorage.getItem(keys.returnKey));
      } catch {
        return false;
      }
    })();
  if (shouldWriteReturn) {
    saveReturnPayload({ state: compact, savedAt: Date.now() }, true, opts);
  }
}

/** True when in-memory state still holds raw data: gallery blobs that must be offloaded now. */
export function agenteResStateHasUnpersistedDataUrlPhotos(state: AgenteIndividualResidencialFormState): boolean {
  return (state.fotosDataUrls ?? []).some((u) => typeof u === "string" && u.startsWith("data:"));
}

/** BR-INV-FIX-01D — debounced autosave without clearing in-memory return bridge. */
export function persistAgenteResApplicationDraftQuiet(
  state: AgenteIndividualResidencialFormState,
  scope?: AgenteResApplicationScope | string | null,
): void {
  void persistAgenteResApplicationDraftResolved(state, scopeFrom(scope));
}

/**
 * Sync flush for hard refresh / pagehide — updates text/schedule without wiping durable media.
 * Always kicks urgent async IDB offload when raw data: photos remain (best-effort before unload ends).
 */
export function flushAgenteResDraftSyncForUnload(
  state: AgenteIndividualResidencialFormState,
  scope?: AgenteResApplicationScope | string | null,
): void {
  if (typeof window === "undefined") return;
  activateApplicationMediaNamespace(scope);
  if (!draftHasPersistableProgress(state) && hasPersistedDraftKeys(scope)) return;
  if (!draftHasPersistableProgress(state)) return;
  setFullDraftMediaBridge(state);
  setChildInventoryMediaBridge(state.additionalInventoryProperties ?? []);

  if (agenteResStateHasUnpersistedDataUrlPhotos(state)) {
    // Fire async offload; also avoid writing a stripped empty gallery if no prior durable refs exist.
    void persistAgenteResApplicationDraftResolved(state, scopeFrom(scope));
  }

  const previous = readPreviousPersistedFormState(scope);
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
      savePreviewPayload(textOverlay, false, scope);
      saveReturnPayload({ state: textOverlay, savedAt: Date.now() }, false, scope);
    }
    return;
  }

  savePreviewPayload(compact, false, scope);
  saveReturnPayload({ state: compact, savedAt: Date.now() }, false, scope);
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
  scope?: AgenteResApplicationScope | string | null,
): Promise<AgenteIndividualResidencialFormState> {
  const keys = activateApplicationMediaNamespace(scope);
  try {
    const inlined = await inlineBrAgenteResHeavyMediaFromIdb(keys.mediaNamespace, state);
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

export async function loadAgenteResPreviewDraftResolved(
  scope?: AgenteResApplicationScope | string | null,
): Promise<AgenteIndividualResidencialFormState | null> {
  const sync = loadAgenteResPreviewDraft(scope);
  if (!sync) return null;
  return rehydrateAgenteResDraftMediaFromIdb(sync, scope);
}

export function loadAgenteResPreviewDraft(
  scope?: AgenteResApplicationScope | string | null,
): AgenteIndividualResidencialFormState | null {
  if (typeof window === "undefined") return null;
  const keys = activateApplicationMediaNamespace(scope);
  restoreMediaBridgesFromLocalStorageFallback(scope);
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
    const raw = sessionStorage.getItem(keys.previewKey);
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
  return readAgenteResPreviewDraftRawForApplication();
}

export function readAgenteResPreviewDraftRawForApplication(
  scope?: AgenteResApplicationScope | string | null,
): string | null {
  if (typeof window === "undefined") return null;
  const keys = brAgenteResApplicationStorageKeys(scope);
  try {
    return sessionStorage.getItem(keys.previewKey);
  } catch {
    return null;
  }
}

/**
 * Bootstrap publicar intents (isolated):
 * A. Resume/return — in-memory Strict Mode bridge, OR explicit Volver (`LEONIX_RETURNING_TO_EDIT` + return key)
 * B. Hard refresh of an active application — preview draft only when navigation type is reload
 * C. Brand-new application — empty state; never auto-hydrate stale Preview/Return/LS as a new visit
 *
 * Preview route still reads `BR_AGENTE_RES_PREVIEW_DRAFT_KEY` via `loadAgenteResPreviewDraftResolved`.
 */
async function migrateLegacyAgenteResDraftIntoApplicationNamespace(
  applicationInstanceId: string,
): Promise<AgenteIndividualResidencialFormState | null> {
  if (typeof window === "undefined" || !applicationInstanceId || !hasLegacySessionDraftKeys()) return null;
  const keys = brAgenteResApplicationStorageKeys(applicationInstanceId);
  try {
    if (
      sessionStorage.getItem(keys.previewKey) ||
      sessionStorage.getItem(keys.returnKey) ||
      localStorage.getItem(keys.fallbackKey)
    ) {
      return null;
    }
    const legacyRaw =
      sessionStorage.getItem(BR_AGENTE_RES_RETURN_KEY) ??
      sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
    const legacyState = legacyRaw ? parsePersistedStateFromJson(legacyRaw) : null;
    if (!legacyState) return null;
    const inlined = await inlineBrAgenteResHeavyMediaFromIdb(BR_AGENTE_DRAFT_MEDIA_NAMESPACE, legacyState);
    const merged = hydrateBootStateFromPersisted(inlined);
    await persistAgenteResApplicationDraftResolved(merged, {
      applicationInstanceId,
      writeReturn: Boolean(sessionStorage.getItem(BR_AGENTE_RES_RETURN_KEY)),
    });
    if (keys.migrationKey) {
      localStorage.setItem(
        keys.migrationKey,
        JSON.stringify({ migratedAt: Date.now(), from: BR_AGENTE_DRAFT_MEDIA_NAMESPACE }),
      );
    }
    return merged;
  } catch {
    return null;
  }
}

export async function bootstrapAgenteIndividualResidencialApplicationStateResolved(
  scope?: AgenteResApplicationScope | string | null,
): Promise<AgenteIndividualResidencialFormState> {
  const keys = activateApplicationMediaNamespace(scope);
  const migrated = keys.applicationInstanceId
    ? await migrateLegacyAgenteResDraftIntoApplicationNamespace(keys.applicationInstanceId)
    : null;
  const boot = migrated ?? bootstrapAgenteIndividualResidencialApplicationState(scope);
  return rehydrateAgenteResDraftMediaFromIdb(boot, scope);
}

function isBrowserHardReload(): boolean {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && typeof nav.type === "string") return nav.type === "reload";
  } catch {
    /* ignore */
  }
  return false;
}

function isExplicitReturningToEditIntent(): boolean {
  try {
    return sessionStorage.getItem(BR_AGENTE_RETURNING_TO_EDIT_FLAG) === "1";
  } catch {
    return false;
  }
}

function hydrateBootStateFromPersisted(
  rawState: AgenteIndividualResidencialFormState,
): AgenteIndividualResidencialFormState {
  const bridged = resolveFullDraftMediaBridgeState();
  const mergedBase = bridged
    ? mergePartialAgenteIndividualResidencial(
        bridged as Partial<AgenteIndividualResidencialFormState> & Record<string, unknown>,
      )
    : mergePartialAgenteIndividualResidencial(rawState as Partial<AgenteIndividualResidencialFormState>);
  return mergePartialAgenteIndividualResidencial({
    ...mergedBase,
    additionalInventoryProperties: mergeChildInventoryWithMediaBridge(
      mergedBase.additionalInventoryProperties ?? [],
    ),
  });
}

export function bootstrapAgenteIndividualResidencialApplicationState(
  scope?: AgenteResApplicationScope | string | null,
): AgenteIndividualResidencialFormState {
  if (typeof window === "undefined") return createEmptyAgenteIndividualResidencialState();
  const keys = activateApplicationMediaNamespace(scope);
  if (previewReturnMemory) {
    scheduleClearReturnMemory();
    return previewReturnMemory;
  }

  const returningIntent = isExplicitReturningToEditIntent();
  const hardReload = isBrowserHardReload();
  let hasReturnKey = false;
  try {
    hasReturnKey = Boolean(sessionStorage.getItem(keys.returnKey));
  } catch {
    hasReturnKey = false;
  }

  try {
    // A — Resume / Volver / preview browser-back (return draft key written only when opening Preview)
    if (returningIntent || hasReturnKey) {
      restoreMediaBridgesFromLocalStorageFallback(scope);
      const raw = sessionStorage.getItem(keys.returnKey);
      const returnState = raw ? parsePersistedStateFromJson(raw) : null;
      if (returnState) {
        try {
          const merged = hydrateBootStateFromPersisted(returnState);
          // Strict Mode: stash before consuming keys so remount can reuse memory.
          previewReturnMemory = merged;
          scheduleClearReturnMemory();
          sessionStorage.removeItem(keys.returnKey);
          clearReturningToEditFlagLocal();
          syncDraftMediaBridgesFromState(merged);
          return merged;
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[agente-res preview] merge return draft failed", e);
          }
          sessionStorage.removeItem(keys.returnKey);
          clearReturningToEditFlagLocal();
        }
      } else {
        clearReturningToEditFlagLocal();
      }
    }

    // B — Hard refresh of an in-progress application (preview draft / LS mirror)
    if (hardReload) {
      restoreMediaBridgesFromLocalStorageFallback(scope);
      const previewRaw =
        sessionStorage.getItem(keys.previewKey) ?? readDraftFromLocalStorageFallback(scope);
      const previewState = previewRaw ? parsePersistedStateFromJson(previewRaw) : null;
      if (previewState) {
        try {
          const merged = hydrateBootStateFromPersisted(previewState);
          previewReturnMemory = merged;
          scheduleClearReturnMemory();
          syncDraftMediaBridgesFromState(merged);
          return merged;
        } catch {
          /* keep going — still a hard reload, so do not wipe IDB/child sessions */
        }
      }
      // Reload without a parent preview yet (e.g. child editor mid-upload) — preserve IDB media.
      return createEmptyAgenteIndividualResidencialState();
    }
  } catch {
    /* fall through */
  }

  // C — Brand-new application: ignore stale Preview/Return/LS; start clean
  clearAgenteResApplicationMemoryOnly();
  clearChildInventoryEditorSession();
  return createEmptyAgenteIndividualResidencialState();
}
