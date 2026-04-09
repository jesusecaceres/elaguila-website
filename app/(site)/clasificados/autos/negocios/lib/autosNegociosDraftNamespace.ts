/**
 * User-scoped draft namespaces for Autos Negocios local persistence.
 * Authenticated drafts use Supabase `user.id`; anonymous use a stable per-browser install id.
 * Legacy flat key is migrated only into anonymous namespaces (never into a signed-in account).
 */

import { AUTH_CHECK_TIMEOUT_MS, createSupabaseBrowserClient, withAuthTimeout } from "@/app/lib/supabase/browser";

/** Pre–7C single key; kept for migration + storage event detection only. */
export const LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY = "autos-negocios-draft";

/** v1 namespaced keys: `${AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX}:${namespace}` */
export const AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX = "autos-negocios-draft-v1";

const ANON_INSTALL_ID_KEY = "autos-negocios-anon-install-id";

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Stable anonymous profile for this browser profile (local testing / logged-out). */
export function getOrCreateAnonInstallId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(ANON_INSTALL_ID_KEY);
    if (!id || id.length < 8) {
      id = randomId();
      window.localStorage.setItem(ANON_INSTALL_ID_KEY, id);
    }
    return id;
  } catch {
    return `ephemeral-${randomId()}`;
  }
}

export function buildAutosNegociosDraftLocalStorageKey(namespace: string): string {
  return `${AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX}:${namespace}`;
}

export function autosNegociosDraftNamespaceFromUserId(userId: string | null | undefined): string {
  if (userId && typeof userId === "string" && userId.trim().length > 0) {
    return `u:${userId.trim()}`;
  }
  return `anon:${getOrCreateAnonInstallId()}`;
}

/** Resolve namespace from current Supabase session (async). Prefer `getSession()` (local) so preview matches editor writes; fall back to `getUser()`. */
export async function resolveAutosNegociosDraftNamespace(): Promise<string> {
  if (typeof window === "undefined") {
    return `anon:${getOrCreateAnonInstallId()}`;
  }
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUid = sessionData.session?.user?.id;
    if (sessionUid) {
      return autosNegociosDraftNamespaceFromUserId(sessionUid);
    }
    const { data } = await withAuthTimeout(supabase.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
    return autosNegociosDraftNamespaceFromUserId(data?.user?.id);
  } catch {
    return autosNegociosDraftNamespaceFromUserId(null);
  }
}

export function storageEventAffectsAutosNegociosDraft(key: string | null): boolean {
  if (key === null) return true;
  if (key === LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY) return true;
  return key.startsWith(`${AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX}:`);
}

/**
 * One-time: move legacy flat draft JSON into the anonymous namespace only.
 * Signed-in users never inherit an untagged legacy blob from another account.
 */
export function migrateLegacyAutosNegociosDraftJsonToNamespace(namespace: string): void {
  if (typeof window === "undefined") return;
  if (!namespace.startsWith("anon:")) return;
  const dest = buildAutosNegociosDraftLocalStorageKey(namespace);
  try {
    if (window.localStorage.getItem(dest)) return;
    const raw = window.localStorage.getItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
    if (!raw) return;
    window.localStorage.setItem(dest, raw);
    window.localStorage.removeItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
  } catch {
    /* quota / private mode */
  }
}
