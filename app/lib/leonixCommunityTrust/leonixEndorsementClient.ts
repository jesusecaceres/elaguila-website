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

export async function fetchLeonixEndorsementSummary(
  category: LeonixEndorsementCategory,
  targetId: string,
): Promise<{ ok: true; summary: LeonixEndorsementSummaryEntry[] } | { ok: false }> {
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
