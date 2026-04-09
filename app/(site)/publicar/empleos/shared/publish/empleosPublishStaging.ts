import type { EmpleosPublishEnvelope } from "./empleosPublishSnapshots";

/** Session-only staged publish (tab lifetime). Not a public listing. */
export const EMPLEOS_STAGED_PUBLISH_SESSION_KEY = "leonix_empleos_staged_publish_v1";

export function writeEmpleosStagedPublish(envelope: EmpleosPublishEnvelope): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(EMPLEOS_STAGED_PUBLISH_SESSION_KEY, JSON.stringify(envelope));
  } catch {
    /* quota / private mode */
  }
}

export function readEmpleosStagedPublish(): EmpleosPublishEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EMPLEOS_STAGED_PUBLISH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmpleosPublishEnvelope;
  } catch {
    return null;
  }
}

export function clearEmpleosStagedPublish(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(EMPLEOS_STAGED_PUBLISH_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
