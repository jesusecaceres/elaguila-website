import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";

export const CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY = "leonix.clasificados.servicios.application.v1";

export function readClasificadosServiciosApplicationFromBrowser(): ClasificadosServiciosApplicationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    return v as ClasificadosServiciosApplicationState;
  } catch {
    return null;
  }
}

export function writeClasificadosServiciosApplicationToBrowser(state: ClasificadosServiciosApplicationState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}
