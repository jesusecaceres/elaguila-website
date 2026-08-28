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
 * The more-offers URL/label remain draft-level-only (Preview renders them
 * from the local draft) — they have no dedicated column and are cosmetic,
 * not part of the searchable item model. Individually authored coupons
 * themselves ARE now synced into the searchable oferta_local_items table
 * via syncOfertaLocalCouponItems() below (Two-Lane Execution — Gap A
 * closeout) using a narrowly-scoped, explicitly authorized new endpoint —
 * see ofertasLocalesCouponItemSync.ts for the mapping.
 */
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalCouponEntryDraft, OfertaLocalDraft } from "./ofertasLocalesTypes";

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

export type OfertaLocalCouponItemSyncResult =
  | { ok: true; syncedCount: number; removedCount: number }
  | { ok: false; error: string; detail?: string };

export async function syncOfertaLocalCouponItems(
  ofertaLocalId: string,
  coupons: OfertaLocalCouponEntryDraft[]
): Promise<OfertaLocalCouponItemSyncResult> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return { ok: false, error: "unauthorized", detail: "Sign in to save your coupons." };
  }

  const res = await fetch("/api/ofertas-locales/coupons/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ofertaLocalId, coupons }),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "bad_response", detail: `HTTP ${res.status}` };
  }

  if (!res.ok || !body || typeof body !== "object" || !(body as { ok?: boolean }).ok) {
    const err =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: string }).error)
        : "sync_failed";
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: string }).detail)
        : undefined;
    return { ok: false, error: err, detail };
  }

  const parsed = body as { syncedCount?: number; removedCount?: number };
  return {
    ok: true,
    syncedCount: parsed.syncedCount ?? 0,
    removedCount: parsed.removedCount ?? 0,
  };
}
