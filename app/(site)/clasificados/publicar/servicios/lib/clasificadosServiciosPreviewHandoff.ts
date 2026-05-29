import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import { createDefaultClasificadosServiciosState } from "./defaultClasificadosServiciosState";
import { inlineServiciosHeavyMediaFromIdb } from "./clasificadosServiciosDraftMedia";
import {
  loadClasificadosServiciosApplicationResolved,
  readClasificadosServiciosApplicationFromBrowser,
  saveClasificadosServiciosApplicationResolved,
  SERVICIOS_DRAFT_MEDIA_NAMESPACE,
} from "./clasificadosServiciosStorage";

/**
 * One-shot payload when opening preview — consumed when the application remounts after “Volver a editar”.
 * Mirrors Bienes Raíces Negocio `BR_NEGOCIO_PREVIEW_RETURN_DRAFT` behavior.
 */
export const SERVICIOS_PREVIEW_RETURN_KEY = "leonix.clasificados.servicios.previewReturn.v1";

type ServiciosPreviewReturnPayload = {
  state: ClasificadosServiciosApplicationState;
  savedAt: number;
};

let previewReturnMemory: ClasificadosServiciosApplicationState | null = null;
let previewReturnTimer: ReturnType<typeof setTimeout> | null = null;
let consumedPreviewReturnThisMount = false;

function scheduleClearReturnMemory() {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = setTimeout(() => {
    previewReturnMemory = null;
    previewReturnTimer = null;
  }, 30000);
}

function consumePreviewReturnFromSession(): ClasificadosServiciosApplicationState | null {
  if (typeof window === "undefined") return null;
  if (previewReturnMemory) {
    consumedPreviewReturnThisMount = true;
    scheduleClearReturnMemory();
    return previewReturnMemory;
  }
  try {
    const raw = window.sessionStorage.getItem(SERVICIOS_PREVIEW_RETURN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<ServiciosPreviewReturnPayload>;
    if (!data.state || typeof data.state !== "object") return null;
    window.sessionStorage.removeItem(SERVICIOS_PREVIEW_RETURN_KEY);
    const merged = normalizeClasificadosServiciosApplicationState(data.state);
    previewReturnMemory = merged;
    consumedPreviewReturnThisMount = true;
    scheduleClearReturnMemory();
    return merged;
  } catch {
    return null;
  }
}

/**
 * Sync bootstrap (En Venta-style): preview-return payload, else session JSON, else defaults.
 * Does not rehydrate IndexedDB blobs — call `rehydrateServiciosApplicationMedia` after mount.
 */
export function bootstrapServiciosApplicationStateSync(): ClasificadosServiciosApplicationState {
  consumedPreviewReturnThisMount = false;
  if (typeof window === "undefined") return createDefaultClasificadosServiciosState();
  const fromReturn = consumePreviewReturnFromSession();
  if (fromReturn) return fromReturn;
  const sessionDraft = readClasificadosServiciosApplicationFromBrowser();
  if (sessionDraft) return sessionDraft;
  return createDefaultClasificadosServiciosState();
}

/** Merge IDB media refs into in-memory state after sync bootstrap. */
export async function rehydrateServiciosApplicationMedia(
  base: ClasificadosServiciosApplicationState,
): Promise<ClasificadosServiciosApplicationState> {
  try {
    const full = await inlineServiciosHeavyMediaFromIdb(SERVICIOS_DRAFT_MEDIA_NAMESPACE, base);
    return normalizeClasificadosServiciosApplicationState(full);
  } catch {
    return normalizeClasificadosServiciosApplicationState(base);
  }
}

/** Write immediately before navigating to preview (alongside the main session draft). Payload is compact (IDB refs). */
export function saveServiciosPreviewReturnDraft(state: ClasificadosServiciosApplicationState): boolean {
  if (typeof window === "undefined") return false;
  previewReturnMemory = null;
  try {
    const normalized = normalizeClasificadosServiciosApplicationState(state);
    const payload: ServiciosPreviewReturnPayload = { state: normalized, savedAt: Date.now() };
    const raw = JSON.stringify(payload);
    window.sessionStorage.setItem(SERVICIOS_PREVIEW_RETURN_KEY, raw);
    const round = window.sessionStorage.getItem(SERVICIOS_PREVIEW_RETURN_KEY);
    return round === raw;
  } catch {
    return false;
  }
}

/**
 * Dual-write session draft + one-shot return payload before opening preview.
 * Both must succeed; heavy media lives in IndexedDB.
 */
export async function persistServiciosDraftForPreviewNavigation(state: ClasificadosServiciosApplicationState): Promise<boolean> {
  const normalized = normalizeClasificadosServiciosApplicationState(state);
  const sessionOk = await saveClasificadosServiciosApplicationResolved(normalized);
  if (!sessionOk) return false;
  const stripped = readClasificadosServiciosApplicationFromBrowser();
  if (!stripped) return false;
  return saveServiciosPreviewReturnDraft(stripped);
}

export function clearServiciosPreviewReturnHandoff(): void {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = null;
  previewReturnMemory = null;
  consumedPreviewReturnThisMount = false;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SERVICIOS_PREVIEW_RETURN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Application bootstrap order (matches BR Negocio intent):
 * 1. In-memory return payload (React Strict Mode double-mount)
 * 2. Else session `SERVICIOS_PREVIEW_RETURN_KEY` (set when opening preview)
 * 3. Else main session draft (`loadClasificadosServiciosApplicationResolved`)
 * 4. Else empty defaults
 */
export async function bootstrapServiciosApplicationStateAsync(): Promise<ClasificadosServiciosApplicationState> {
  const sync = bootstrapServiciosApplicationStateSync();
  const full = await rehydrateServiciosApplicationMedia(sync);
  if (consumedPreviewReturnThisMount) {
    await saveClasificadosServiciosApplicationResolved(full);
  }
  return full;
}

/** @deprecated Use `bootstrapServiciosApplicationStateAsync` — sync bootstrap cannot rehydrate IndexedDB. */
export function bootstrapServiciosApplicationState(): ClasificadosServiciosApplicationState {
  return bootstrapServiciosApplicationStateSync();
}
