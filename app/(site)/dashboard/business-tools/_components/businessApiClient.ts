"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

/**
 * Client-side fetch helper for the Business Identity API routes (Package BCO-2/3). Follows the
 * repository's existing Bearer-token convention (confirmed in app/(site)/dashboard/page.tsx and
 * restaurantes/analytics pages): `supabase.auth.getSession()` -> `session.access_token` ->
 * `Authorization: Bearer` header. Never sends a client-side user id in the request body — the
 * server always re-derives identity from this token.
 */
export async function getBearerToken(): Promise<string | null> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export type BusinessApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; detail?: unknown };

export async function businessApiFetch<T>(path: string, init?: RequestInit): Promise<BusinessApiResult<T>> {
  const token = await getBearerToken();
  if (!token) return { ok: false, status: 401, error: "unauthorized" };

  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, status: res.status, error: typeof json.error === "string" ? json.error : "request_failed", detail: json.detail };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, error: "network_error" };
  }
}
