import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import { createDefaultClasificadosServiciosState } from "./defaultClasificadosServiciosState";
import {
  readClasificadosServiciosApplicationFromBrowser,
  writeClasificadosServiciosApplicationToBrowser,
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

function scheduleClearReturnMemory() {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = setTimeout(() => {
    previewReturnMemory = null;
    previewReturnTimer = null;
  }, 30000);
}

/** Write immediately before navigating to preview (alongside the main session draft). */
export function saveServiciosPreviewReturnDraft(state: ClasificadosServiciosApplicationState): boolean {
  if (typeof window === "undefined") return false;
  previewReturnMemory = null;
  try {
    const payload: ServiciosPreviewReturnPayload = { state, savedAt: Date.now() };
    window.sessionStorage.setItem(SERVICIOS_PREVIEW_RETURN_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Dual-write session draft + one-shot return payload before opening preview.
 * Both must succeed; otherwise the in-session roundtrip can lose large media payloads.
 */
export function persistServiciosDraftForPreviewNavigation(state: ClasificadosServiciosApplicationState): boolean {
  const sessionOk = writeClasificadosServiciosApplicationToBrowser(state);
  const returnOk = saveServiciosPreviewReturnDraft(state);
  return sessionOk && returnOk;
}

export function clearServiciosPreviewReturnHandoff(): void {
  if (previewReturnTimer) clearTimeout(previewReturnTimer);
  previewReturnTimer = null;
  previewReturnMemory = null;
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
 * 3. Else main session draft (`readClasificadosServiciosApplicationFromBrowser`)
 * 4. Else empty defaults
 */
export function bootstrapServiciosApplicationState(): ClasificadosServiciosApplicationState {
  if (typeof window === "undefined") return createDefaultClasificadosServiciosState();
  if (previewReturnMemory) {
    scheduleClearReturnMemory();
    return previewReturnMemory;
  }
  try {
    const raw = window.sessionStorage.getItem(SERVICIOS_PREVIEW_RETURN_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<ServiciosPreviewReturnPayload>;
      if (data.state && typeof data.state === "object") {
        const merged = normalizeClasificadosServiciosApplicationState(data.state);
        window.sessionStorage.removeItem(SERVICIOS_PREVIEW_RETURN_KEY);
        previewReturnMemory = merged;
        scheduleClearReturnMemory();
        return merged;
      }
    }
  } catch {
    /* fall through */
  }
  const sessionDraft = readClasificadosServiciosApplicationFromBrowser();
  if (sessionDraft) return sessionDraft;
  return createDefaultClasificadosServiciosState();
}
