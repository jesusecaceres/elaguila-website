/**
 * Saved Search 03 — browser client for the Saved Search 02 API routes
 * (`app/api/saved-search/route.ts`, `app/api/saved-search/[id]/route.ts`).
 *
 * Follows this repo's existing Bearer-token client convention
 * (`app/lib/listingPlans/enableIncludedCapabilityClient.ts`): resolve the real session via
 * `createSupabaseBrowserClient().auth.getSession()`, send its `access_token` as
 * `Authorization: Bearer`, never let the caller supply an owner id. If there is no session, every
 * function here returns `{ ok: false, code: "unauthorized" }` — callers are responsible for
 * routing to the existing `/login` flow themselves (see `AutosSaveSearchButton.tsx`); this module
 * never redirects or fabricates a signed-in result.
 */
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { SavedSearchNormalizedInput, SavedSearchRow } from "./savedSearchTypes";

async function bearerToken(): Promise<string | null> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export type SavedSearchClientResult<T> = { ok: true; data: T } | { ok: false; code: string };

async function callSavedSearchApi<T>(path: string, init: RequestInit = {}): Promise<SavedSearchClientResult<T>> {
  const token = await bearerToken();
  if (!token) return { ok: false, code: "unauthorized" };
  try {
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & Record<string, unknown>;
    if (!res.ok || !json.ok) return { ok: false, code: json.error ?? "unknown_error" };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, code: "network_error" };
  }
}

/** True only when a real session exists — used to decide whether to attempt an owner-scoped call
 * at all, or route straight to sign-in. Never trusts anything other than the live session. */
export async function hasSavedSearchSession(): Promise<boolean> {
  return (await bearerToken()) !== null;
}

export async function listSavedSearchesClient(
  opts: { category?: string; activeOnly?: boolean } = {},
): Promise<SavedSearchClientResult<{ savedSearches: SavedSearchRow[] }>> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.activeOnly) params.set("activeOnly", "true");
  const qs = params.toString();
  return callSavedSearchApi(`/api/saved-search${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function saveSavedSearchClient(
  input: SavedSearchNormalizedInput,
): Promise<SavedSearchClientResult<{ savedSearch: SavedSearchRow; created: boolean; reactivated: boolean }>> {
  return callSavedSearchApi("/api/saved-search", { method: "POST", body: JSON.stringify(input) });
}

export async function setSavedSearchActiveClient(
  id: string,
  active: boolean,
): Promise<SavedSearchClientResult<{ savedSearch: SavedSearchRow }>> {
  return callSavedSearchApi(`/api/saved-search/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: active ? "activate" : "deactivate" }),
  });
}

export async function deleteSavedSearchClient(id: string): Promise<SavedSearchClientResult<Record<string, never>>> {
  return callSavedSearchApi(`/api/saved-search/${encodeURIComponent(id)}`, { method: "DELETE" });
}
