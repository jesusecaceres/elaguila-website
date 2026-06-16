"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

export type OfertaLocalAiScanPersistResult =
  | { ok: true; id: string; status: string; created: boolean }
  | {
      ok: false;
      error: string;
      detail?: string;
      issues?: { field: string; message: string }[];
    };

/**
 * Creates or updates a pending_review server record so AI scan can run before Step 7 submit.
 * Does not publish extracted items or expose anything publicly.
 */
export async function ensureOfertaLocalRecordForAiScan(
  draft: OfertaLocalDraft,
  existingOfertaLocalId?: string | null
): Promise<OfertaLocalAiScanPersistResult> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return { ok: false, error: "unauthorized", detail: "Sign in to scan with AI." };
  }

  const res = await fetch("/api/ofertas-locales/scan-prep", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      draft,
      ofertaLocalId: existingOfertaLocalId?.trim() || undefined,
    }),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "bad_response", detail: `HTTP ${res.status}` };
  }

  if (!res.ok || !body || typeof body !== "object") {
    const err =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: string }).error)
        : "scan_prep_failed";
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: string }).detail)
        : undefined;
    const issues =
      body && typeof body === "object" && Array.isArray((body as { issues?: unknown }).issues)
        ? ((body as { issues: { field: string; message: string }[] }).issues ?? undefined)
        : undefined;
    return { ok: false, error: err, detail, issues };
  }

  const parsed = body as { ok?: boolean; id?: string; status?: string; created?: boolean };
  if (!parsed.ok || !parsed.id) {
    return { ok: false, error: "scan_prep_failed" };
  }

  return {
    ok: true,
    id: parsed.id,
    status: parsed.status ?? "pending_review",
    created: Boolean(parsed.created),
  };
}
