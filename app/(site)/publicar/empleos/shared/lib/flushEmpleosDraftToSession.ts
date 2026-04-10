import { EMPLEOS_SESSION_KEYS } from "../constants/empleosSessionKeys";
import { normalizeEmpleosFeriaDraft, type EmpleosFeriaDraft } from "../types/empleosFeriaDraft";
import { normalizeEmpleosPremiumDraft, type EmpleosPremiumDraft } from "../types/empleosPremiumDraft";
import { normalizeEmpleosQuickDraft } from "../types/empleosQuickDraft";

/** Synchronous flush before preview navigation so the latest edits are always in sessionStorage. */
export function flushEmpleosDraftToSession(storageKey: string, state: object): void {
  if (typeof window === "undefined") return;
  try {
    let payload: object = state;
    if (storageKey === EMPLEOS_SESSION_KEYS.quick) {
      payload = normalizeEmpleosQuickDraft(state as Parameters<typeof normalizeEmpleosQuickDraft>[0]);
    } else if (storageKey === EMPLEOS_SESSION_KEYS.premium) {
      payload = normalizeEmpleosPremiumDraft(state as Partial<EmpleosPremiumDraft>);
    } else if (storageKey === EMPLEOS_SESSION_KEYS.feria) {
      payload = normalizeEmpleosFeriaDraft(state as Partial<EmpleosFeriaDraft>);
    }
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
