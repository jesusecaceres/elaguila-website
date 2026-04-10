import { EMPLEOS_SESSION_KEYS } from "../constants/empleosSessionKeys";
import { normalizeEmpleosQuickDraft } from "../types/empleosQuickDraft";

/** Synchronous flush before preview navigation so the latest edits are always in sessionStorage. */
export function flushEmpleosDraftToSession(storageKey: string, state: object): void {
  if (typeof window === "undefined") return;
  try {
    const payload =
      storageKey === EMPLEOS_SESSION_KEYS.quick
        ? normalizeEmpleosQuickDraft(state as Parameters<typeof normalizeEmpleosQuickDraft>[0])
        : state;
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
