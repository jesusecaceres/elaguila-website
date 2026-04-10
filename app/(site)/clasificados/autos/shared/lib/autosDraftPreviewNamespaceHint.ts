/**
 * Same-tab handoff: editor flush writes draft under `namespaceRef`; preview re-resolves auth.
 * If session timing differs, preview could read the wrong namespace and look "empty".
 * We stash the namespace in sessionStorage before save + navigation.
 *
 * **Do not remove the hint on read** — React Strict Mode runs effects twice; removing on first read
 * breaks the second pass and can fall back to a different resolved namespace.
 * Clear via `clearAutosDraftNamespaceHint` on reset / fresh-tab wipe / explicit cleanup only.
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

/** Read handoff namespace without removing (Strict Mode + concurrent refresh safe). */
export function peekAutosDraftNamespaceHint(lane: "negocios" | "privado"): string | null {
  if (typeof window === "undefined") return null;
  const key = lane === "negocios" ? NEG_KEY : PRV_KEY;
  try {
    const v = sessionStorage.getItem(key);
    return v && v.trim().length > 2 ? v.trim() : null;
  } catch {
    return null;
  }
}

/** @deprecated Use peekAutosDraftNamespaceHint — no longer mutates storage. */
export function consumeAutosDraftNamespaceHint(lane: "negocios" | "privado"): string | null {
  return peekAutosDraftNamespaceHint(lane);
}

export function clearAutosDraftNamespaceHint(lane: "negocios" | "privado"): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(lane === "negocios" ? NEG_KEY : PRV_KEY);
  } catch {
    /* ignore */
  }
}
