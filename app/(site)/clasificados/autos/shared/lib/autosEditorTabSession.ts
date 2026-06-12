/**
 * Session-scoped Autos editor tabs.
 * Active draft JSON lives in `sessionStorage` (v2 keys in `autosSessionDraftKeys.ts`).
 * **Page refresh keeps sessionStorage** — drafts restore on reload in the same tab.
 * **Closing the tab clears sessionStorage** — new tab starts clean without explicit wipe logic.
 *
 * Limitation: two tabs share one user namespace; last write wins.
 */

export const AUTOS_NEGOCIOS_EDITOR_SESSION_KEY = "lx-autos-negocios-editor-session";
export const AUTOS_PRIVADO_EDITOR_SESSION_KEY = "lx-autos-privado-editor-session";

/** Marks this tab as an active Autos editor session (diagnostics / legacy audits). */
export function markAutosEditorSessionActive(sessionKey: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(sessionKey, "1");
  } catch {
    /* ignore */
  }
}

/**
 * @deprecated Restore-first bootstrap — never clears draft on mount.
 * Kept for A5.1 audit string compatibility; always returns false.
 */
export function shouldResetAutosDraftForFreshEditorTab(sessionKey: string): boolean {
  markAutosEditorSessionActive(sessionKey);
  return false;
}
