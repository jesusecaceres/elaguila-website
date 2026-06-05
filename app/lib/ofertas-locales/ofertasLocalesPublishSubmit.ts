"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

export type OfertaLocalPublishSubmitResult =
  | { ok: true; id: string; status: string }
  | { ok: false; error: string; detail?: string; issues?: { field: string; message: string }[] };

export async function submitOfertaLocalDraftForReview(
  draft: OfertaLocalDraft
): Promise<OfertaLocalPublishSubmitResult> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return { ok: false, error: "unauthorized", detail: "Sign in to submit your offer." };
  }

  const res = await fetch("/api/ofertas-locales/publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ draft }),
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
        : "submit_failed";
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

  const parsed = body as { ok?: boolean; id?: string; status?: string };
  if (!parsed.ok || !parsed.id) {
    return { ok: false, error: "submit_failed" };
  }

  return { ok: true, id: parsed.id, status: parsed.status ?? "pending_review" };
}
