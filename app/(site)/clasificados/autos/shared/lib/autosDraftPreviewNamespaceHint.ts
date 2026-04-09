/**
 * Same-tab handoff: editor flush writes draft under `namespaceRef`; preview re-resolves auth.
 * If `getUser()` / timing differs, preview could read the wrong namespace and look "empty".
 * We stash the namespace in sessionStorage immediately before save + navigation (one-shot consume on preview).
 */

const NEG_KEY = "lx-autos-draft-ns-hint-negocios";
const PRV_KEY = "lx-autos-draft-ns-hint-privado";

export function rememberAutosDraftNamespaceHint(lane: "negocios" | "privado", namespace: string): void {
  if (typeof window === "undefined" || !namespace.trim()) return;
  try {
    sessionStorage.setItem(lane === "negocios" ? NEG_KEY : PRV_KEY, namespace);
  } catch {
    /* quota / private mode */
  }
}

/** Returns the hinted namespace once, then clears it. */
export function consumeAutosDraftNamespaceHint(lane: "negocios" | "privado"): string | null {
  if (typeof window === "undefined") return null;
  const key = lane === "negocios" ? NEG_KEY : PRV_KEY;
  try {
    const v = sessionStorage.getItem(key);
    if (v) sessionStorage.removeItem(key);
    return v && v.trim().length > 2 ? v.trim() : null;
  } catch {
    return null;
  }
}

export function clearAutosDraftNamespaceHint(lane: "negocios" | "privado"): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(lane === "negocios" ? NEG_KEY : PRV_KEY);
  } catch {
    /* ignore */
  }
}
