"use client";

/**
 * Canonical-row persistence for the free Cupones y promociones lane.
 *
 * The flyer lane's canonical `ofertas_locales` row is created/updated via
 * `/api/ofertas-locales/scan-prep`, triggered from the (scanner-protected)
 * AI scan panel before a scan runs. That endpoint's own row-building logic
 * is generic — it persists whatever the draft already carries (business
 * info, location, contact, extras, coupon_text, coupon_assets) regardless
 * of whether a scan ever happens — but the coupon lane has no scan panel to
 * trigger it now that AI is correctly excluded from this free product.
 *
 * This reuses the SAME existing endpoint/request-response contract (no new
 * API, no scanner code touched) from a coupon-lane-specific call site, so
 * the coupon lane gets a real, persisted, hard-refresh-safe canonical row
 * for every field the endpoint already knows how to map.
 *
 * Known gap (see OFERTAS_QA_UX_FINAL_CERTIFICATION.md): individually
 * authored coupon entries, the more-offers URL/label are new draft fields
 * this endpoint's protected row-builder does not yet know about, so they
 * persist at the local-draft level (survives hard refresh in this browser,
 * renders fully in Preview) but do not yet reach the canonical DB row.
 */
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

export type OfertaLocalCouponRecordPersistResult =
  | { ok: true; id: string; status: string; created: boolean }
  | { ok: false; error: string; detail?: string };

export async function ensureOfertaLocalCouponRecord(
  draft: OfertaLocalDraft,
  ofertaLocalId: string | null
): Promise<OfertaLocalCouponRecordPersistResult> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return { ok: false, error: "unauthorized", detail: "Sign in to save your coupons." };
  }

  const res = await fetch("/api/ofertas-locales/scan-prep", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ draft, ofertaLocalId }),
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
        : "save_failed";
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: string }).detail)
        : undefined;
    return { ok: false, error: err, detail };
  }

  const parsed = body as { ok?: boolean; id?: string; status?: string; created?: boolean };
  if (!parsed.ok || !parsed.id) {
    return { ok: false, error: "save_failed" };
  }

  return { ok: true, id: parsed.id, status: parsed.status ?? "draft", created: Boolean(parsed.created) };
}
