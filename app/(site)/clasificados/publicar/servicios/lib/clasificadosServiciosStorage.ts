import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import {
  clearServiciosDraftMediaNamespace,
  inlineServiciosHeavyMediaFromIdb,
  offloadServiciosHeavyMediaToIdb,
  stripUnresolvedServiciosIdbRefs,
  SV_IDB_PREFIX,
} from "./clasificadosServiciosDraftMedia";

export const CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY = "leonix.clasificados.servicios.application.v1";

/** Single browser draft namespace for Servicios (session-scoped JSON + IDB blobs). */
export const SERVICIOS_DRAFT_MEDIA_NAMESPACE = "clasificados-servicios-v1";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Sync read of JSON only (may contain IDB refs or legacy inline data URLs). */
export function readClasificadosServiciosApplicationFromBrowser(): ClasificadosServiciosApplicationState | null {
  if (typeof window === "undefined") return null;
  try {
    const st = storage();
    let raw = st?.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY) ?? null;
    if (!raw) {
      try {
        const legacy = window.localStorage.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY);
        if (legacy) {
          st?.setItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY, legacy);
          window.localStorage.removeItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY);
          raw = legacy;
        }
      } catch {
        /* ignore */
      }
    }
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    return normalizeClasificadosServiciosApplicationState(v);
  } catch {
    return null;
  }
}

/**
 * Full rehydration: session JSON + IndexedDB blobs merged into in-memory state for editor/preview.
 */
export async function loadClasificadosServiciosApplicationResolved(): Promise<ClasificadosServiciosApplicationState | null> {
  const sync = readClasificadosServiciosApplicationFromBrowser();
  if (!sync) return null;
  try {
    const inlined = await inlineServiciosHeavyMediaFromIdb(SERVICIOS_DRAFT_MEDIA_NAMESPACE, sync);
    return normalizeClasificadosServiciosApplicationState(inlined);
  } catch {
    return normalizeClasificadosServiciosApplicationState(stripUnresolvedServiciosIdbRefs(sync));
  }
}

/**
 * Persist: offload heavy `data:` payloads to IndexedDB, then write compact JSON to sessionStorage.
 */
export async function saveClasificadosServiciosApplicationResolved(
  state: ClasificadosServiciosApplicationState,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const normalized = normalizeClasificadosServiciosApplicationState(state);
    const stripped = await offloadServiciosHeavyMediaToIdb(SERVICIOS_DRAFT_MEDIA_NAMESPACE, normalized);
    const st = storage();
    if (!st) return false;
    const payload = JSON.stringify(stripped);
    st.setItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY, payload);
    const round = st.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY);
    return round === payload;
  } catch {
    return false;
  }
}

/** @deprecated Prefer `saveClasificadosServiciosApplicationResolved` — sync write can exceed quota with large media. */
export function writeClasificadosServiciosApplicationToBrowser(state: ClasificadosServiciosApplicationState): boolean {
  if (typeof window === "undefined") return false;
  try {
    const st = storage();
    if (!st) return false;
    const normalized = normalizeClasificadosServiciosApplicationState(state);
    const payload = JSON.stringify(normalized);
    st.setItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY, payload);
    const round = st.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY);
    return round === payload;
  } catch {
    return false;
  }
}

export function clearClasificadosServiciosApplicationFromBrowser(): void {
  if (typeof window === "undefined") return;
  try {
    const st = storage();
    st?.removeItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Removes session JSON + all IDB blobs for the Servicios draft namespace. */
export async function clearServiciosDraftStorageAndIdb(): Promise<void> {
  clearClasificadosServiciosApplicationFromBrowser();
  try {
    window.sessionStorage.removeItem("leonix.clasificados.servicios.previewReturn.v1");
  } catch {
    /* ignore */
  }
  await clearServiciosDraftMediaNamespace(SERVICIOS_DRAFT_MEDIA_NAMESPACE);
}

export function serviciosDraftJsonMayContainIdbRefs(state: ClasificadosServiciosApplicationState): boolean {
  const check = (s: string) => typeof s === "string" && s.startsWith(SV_IDB_PREFIX);
  if (check(state.logoUrl) || check(state.coverUrl) || check(state.offerImageUrl) || check(state.offerPdfUrl)) return true;
  for (const g of state.gallery ?? []) {
    if (check(g.url)) return true;
  }
  for (const v of state.videos ?? []) {
    if (check(v.url)) return true;
  }
  return false;
}
