/**
 * Session-scoped editor tabs: `sessionStorage` is empty when a browser tab is new.
 * First mount of the Autos application in that tab treats persisted localStorage/IDB drafts
 * as a previous session and clears them so a full tab close → new tab starts clean.
 *
 * Limitation: opening the same application in two tabs can clear shared localStorage
 * when the second tab mounts (both share one draft namespace).
 */

export const AUTOS_NEGOCIOS_EDITOR_SESSION_KEY = "lx-autos-negocios-editor-session";
export const AUTOS_PRIVADO_EDITOR_SESSION_KEY = "lx-autos-privado-editor-session";

/** @returns true when this tab instance has never mounted the editor before → caller should clear draft storage. */
export function shouldResetAutosDraftForFreshEditorTab(sessionKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(sessionKey)) return false;
    sessionStorage.setItem(sessionKey, "1");
    return true;
  } catch {
    return false;
  }
}
