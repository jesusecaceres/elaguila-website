import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { getOfertaLocalCommercialProductForOfferType } from "@/app/lib/ofertas-locales/ofertasLocalesCommercial";
import {
  buildOfertaLocalCouponItemInsertRows,
  findStaleOfertaLocalCouponItemIds,
  type OfertaLocalCouponSyncParentContext,
} from "@/app/lib/ofertas-locales/ofertasLocalesCouponItemSync";
import type { OfertaLocalCouponEntryDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_COUPONS = 200;

function isPlainCouponEntry(v: unknown): v is OfertaLocalCouponEntryDraft {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { id?: unknown }).id === "string" &&
    typeof (v as { title?: unknown }).title === "string"
  );
}

/**
 * Sync individually-authored coupons into the existing, already-searchable
 * oferta_local_items table (Two-Lane Execution — Gap A). This is a narrowly
 * scoped, explicitly authorized new route: it never touches scanner code,
 * never creates a fake scan job, and only ever writes scan_job_id = NULL
 * rows (the existing nullable marker this table already uses). It is the
 * coupon lane's equivalent of the (unrelated, scanner-owned) scan pipeline
 * writing AI-extracted items — same destination table, same public-search
 * eligibility rules, different, non-AI ingestion method.
 */
export async function POST(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "supabase_admin_unconfigured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const ofertaLocalId =
    typeof raw.ofertaLocalId === "string" ? raw.ofertaLocalId.trim() : "";
  const couponsRaw = Array.isArray(raw.coupons) ? raw.coupons : [];

  if (!ofertaLocalId) {
    return NextResponse.json({ ok: false, error: "missing_oferta_local_id" }, { status: 400 });
  }

  const coupons = couponsRaw.filter(isPlainCouponEntry).slice(0, MAX_COUPONS);

  const supabase = getAdminSupabase();

  const { data: parent, error: parentError } = await supabase
    .from("ofertas_locales")
    .select(
      "id, owner_id, offer_type, business_name, address, city, state, zip_code, business_category, market_type, custom_market_type, valid_from, valid_until"
    )
    .eq("id", ofertaLocalId)
    .maybeSingle();

  if (parentError) {
    return NextResponse.json(
      { ok: false, error: "parent_lookup_failed", detail: parentError.message },
      { status: 500 }
    );
  }
  if (!parent) {
    return NextResponse.json({ ok: false, error: "parent_not_found" }, { status: 404 });
  }
  if (parent.owner_id !== ownerId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Defensive lane check — this route only ever writes manual (non-AI)
  // coupon items, so it must never be usable against an AI-included
  // (flyer) listing regardless of what the client sends.
  const product = getOfertaLocalCommercialProductForOfferType(parent.offer_type);
  if (!product || product.aiIncluded) {
    return NextResponse.json(
      { ok: false, error: "not_coupon_lane", detail: "This listing is not the free coupon product." },
      { status: 422 }
    );
  }

  const parentContext: OfertaLocalCouponSyncParentContext = {
    ownerId,
    ofertaLocalId: parent.id,
    businessName: String(parent.business_name ?? ""),
    address: parent.address ?? null,
    city: String(parent.city ?? ""),
    state: parent.state ?? null,
    businessCategory: String(parent.business_category ?? ""),
    marketType: parent.market_type ?? null,
    customMarketType: parent.custom_market_type ?? null,
    zipCode: String(parent.zip_code ?? ""),
    validFrom: String(parent.valid_from ?? ""),
    validUntil: String(parent.valid_until ?? ""),
  };

  const rows = buildOfertaLocalCouponItemInsertRows(coupons, parentContext);

  const { data: existing, error: existingError } = await supabase
    .from("oferta_local_items")
    .select("id")
    .eq("oferta_local_id", ofertaLocalId)
    .eq("owner_id", ownerId)
    .is("scan_job_id", null);

  if (existingError) {
    return NextResponse.json(
      { ok: false, error: "existing_lookup_failed", detail: existingError.message },
      { status: 500 }
    );
  }

  const existingIds = (existing ?? []).map((r: { id: string }) => r.id);
  const staleIds = findStaleOfertaLocalCouponItemIds(
    existingIds,
    rows.map((r) => String(r.id))
  );

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("oferta_local_items")
      .upsert(rows, { onConflict: "id" });
    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: "upsert_failed", detail: upsertError.message },
        { status: 500 }
      );
    }
  }

  if (staleIds.length > 0) {
    const { error: deactivateError } = await supabase
      .from("oferta_local_items")
      .update({ is_active: false })
      .in("id", staleIds)
      .eq("owner_id", ownerId);
    if (deactivateError) {
      return NextResponse.json(
        { ok: false, error: "deactivate_failed", detail: deactivateError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    syncedCount: rows.length,
    removedCount: staleIds.length,
  });
}
