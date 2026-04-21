const OWNER_KEY = "leonix_empleos_staged_owner_id_v1";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `stg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable pseudo-owner for staged Empleos demo (no production auth). */
export function getEmpleosStagedOwnerId(): string {
  if (typeof window === "undefined") return "server-anonymous";
  try {
    const existing = window.localStorage.getItem(OWNER_KEY);
    if (existing && existing.trim()) return existing.trim();
    const next = randomId();
    window.localStorage.setItem(OWNER_KEY, next);
    return next;
  } catch {
    return "anonymous";
  }
}
