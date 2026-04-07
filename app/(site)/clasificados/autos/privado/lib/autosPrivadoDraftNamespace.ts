/**
 * User-scoped draft namespaces for Autos Privado (separate from Negocios storage).
 */

import { AUTH_CHECK_TIMEOUT_MS, createSupabaseBrowserClient, withAuthTimeout } from "@/app/lib/supabase/browser";

export const AUTOS_PRIVADO_DRAFT_STORAGE_PREFIX = "autos-privado-draft-v1";

const ANON_INSTALL_ID_KEY = "autos-privado-anon-install-id";

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreatePrivadoAnonInstallId(): string {
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

export function buildAutosPrivadoDraftLocalStorageKey(namespace: string): string {
  return `${AUTOS_PRIVADO_DRAFT_STORAGE_PREFIX}:${namespace}`;
}

export function autosPrivadoDraftNamespaceFromUserId(userId: string | null | undefined): string {
  if (userId && typeof userId === "string" && userId.trim().length > 0) {
    return `u:${userId.trim()}`;
  }
  return `anon:${getOrCreatePrivadoAnonInstallId()}`;
}

export async function resolveAutosPrivadoDraftNamespace(): Promise<string> {
  if (typeof window === "undefined") {
    return `anon:${getOrCreatePrivadoAnonInstallId()}`;
  }
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await withAuthTimeout(supabase.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
    return autosPrivadoDraftNamespaceFromUserId(data?.user?.id);
  } catch {
    return autosPrivadoDraftNamespaceFromUserId(null);
  }
}

export function storageEventAffectsAutosPrivadoDraft(key: string | null): boolean {
  if (key === null) return true;
  return key.startsWith(`${AUTOS_PRIVADO_DRAFT_STORAGE_PREFIX}:`);
}
