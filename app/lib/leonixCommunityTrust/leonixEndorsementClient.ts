/**
 * Globalization Build 03 — browser client for `/api/leonix-endorsements`. Follows this repo's
 * established Bearer-token client convention (mirrors `savedSearchClient.ts`): resolve the real
 * session via `createSupabaseBrowserClient().auth.getSession()`, send its `access_token` as
 * `Authorization: Bearer` when present, never let the caller supply an owner id. The GET summary
 * call works signed-out too (an absent token is simply omitted).
 */
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { LeonixEndorsementCategory } from "./leonixEndorsementRegistry";

async function bearerToken(): Promise<string | null> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function hasLeonixEndorsementSession(): Promise<boolean> {
  return (await bearerToken()) !== null;
}

export type LeonixEndorsementSummaryEntry = {
  key: string;
  es: string;
  en: string;
  count: number;
  userVoted: boolean;
};

type LeonixEndorsementSummaryResult = { ok: true; summary: LeonixEndorsementSummaryEntry[] } | { ok: false };

/**
 * Servicios Golden UI Closeout (2026-09-16) — a published listing now shows a Community Trust
 * summary in two places on the same page render (the profile header's compact row and the full
 * section further down), both requesting the exact same `(category, targetId)` pair moments
 * apart. Rather than lifting state or duplicating the fetch, in-flight requests for the same key
 * are shared here — the safest, most contained way to satisfy "no duplicate fetch" without
 * changing this function's signature or any existing caller's behavior for a single request.
 * Cleared as soon as the shared request settles, so a later, genuinely new request (e.g. after a
 * vote toggle) is never served a stale result.
 */
const inFlightSummaryRequests = new Map<string, Promise<LeonixEndorsementSummaryResult>>();

export async function fetchLeonixEndorsementSummary(
  category: LeonixEndorsementCategory,
  targetId: string,
): Promise<LeonixEndorsementSummaryResult> {
  const key = `${category}:${targetId}`;
  const existing = inFlightSummaryRequests.get(key);
  if (existing) return existing;

  const request = (async (): Promise<LeonixEndorsementSummaryResult> => {
    try {
      const token = await bearerToken();
      const res = await fetch(`/api/leonix-endorsements?category=${encodeURIComponent(category)}&targetId=${encodeURIComponent(targetId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; summary?: LeonixEndorsementSummaryEntry[] };
      if (!res.ok || !json.ok || !json.summary) return { ok: false };
      return { ok: true, summary: json.summary };
    } catch {
      return { ok: false };
    }
  })();

  inFlightSummaryRequests.set(key, request);
  try {
    return await request;
  } finally {
    inFlightSummaryRequests.delete(key);
  }
}

export type LeonixEndorsementToggleClientResult =
  | { ok: true; active: boolean; count: number }
  | { ok: false; code: string };

export async function toggleLeonixEndorsementVoteClient(input: {
  category: LeonixEndorsementCategory;
  targetId: string;
  endorsementKey: string;
  ownerUserId?: string | null;
}): Promise<LeonixEndorsementToggleClientResult> {
  const token = await bearerToken();
  if (!token) return { ok: false, code: "unauthorized" };
  try {
    const res = await fetch("/api/leonix-endorsements", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        category: input.category,
        targetId: input.targetId,
        endorsementKey: input.endorsementKey,
        ownerUserId: input.ownerUserId ?? null,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; active?: boolean; count?: number; error?: string };
    if (!res.ok || !json.ok) return { ok: false, code: json.error ?? "unknown_error" };
    return { ok: true, active: Boolean(json.active), count: json.count ?? 0 };
  } catch {
    return { ok: false, code: "network_error" };
  }
}
