/** First-party only: optional discovery hints stored in `localStorage` on this device. */

export const SERVICIOS_DISCOVERY_STORAGE_KEY = "leonix.servicios.discovery.v1";

export type ServiciosDiscoveryPrefs = {
  lastQ?: string;
  lastCity?: string;
  lastGroup?: string;
  updatedAt?: number;
};

export function readServiciosDiscoveryPrefs(): ServiciosDiscoveryPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SERVICIOS_DISCOVERY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ServiciosDiscoveryPrefs;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeServiciosDiscoveryPrefs(next: Partial<ServiciosDiscoveryPrefs>): void {
  if (typeof window === "undefined") return;
  try {
    const prev = readServiciosDiscoveryPrefs();
    const merged: ServiciosDiscoveryPrefs = {
      ...prev,
      ...next,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(SERVICIOS_DISCOVERY_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
}

export function clearServiciosDiscoveryPrefs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SERVICIOS_DISCOVERY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
