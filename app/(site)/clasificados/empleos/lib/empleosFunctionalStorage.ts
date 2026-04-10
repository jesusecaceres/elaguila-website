/**
 * Optional browser storage for Empleos UX (functional, not analytics).
 * Leonix does not use this for ad tracking. Keys are device-local.
 */

const SEEN_KEY = "leonix_empleos_functional_notice_v1";
const PREFS_KEY = "leonix_empleos_filter_prefs_v1";

export type EmpleosSavedFilterPrefs = {
  city?: string;
  state?: string;
  modality?: string;
  updatedAt: string;
};

export function hasSeenEmpleosFunctionalNotice(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markEmpleosFunctionalNoticeSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadEmpleosFilterPrefs(): EmpleosSavedFilterPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmpleosSavedFilterPrefs;
  } catch {
    return null;
  }
}

export function saveEmpleosFilterPrefs(partial: Omit<EmpleosSavedFilterPrefs, "updatedAt">): void {
  try {
    const next: EmpleosSavedFilterPrefs = {
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearEmpleosFilterPrefs(): void {
  try {
    window.localStorage.removeItem(PREFS_KEY);
  } catch {
    /* ignore */
  }
}
