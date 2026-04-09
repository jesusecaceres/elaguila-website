import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";

export const CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY = "leonix.clasificados.servicios.application.v1";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

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

export function writeClasificadosServiciosApplicationToBrowser(state: ClasificadosServiciosApplicationState): boolean {
  if (typeof window === "undefined") return false;
  try {
    const st = storage();
    if (!st) return false;
    const payload = JSON.stringify(state);
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
