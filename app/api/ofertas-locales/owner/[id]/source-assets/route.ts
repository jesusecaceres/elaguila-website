import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  createOfertaLocalReplacementSourceVersion,
} from "@/app/lib/ofertas-locales/ofertasLocalesAssetLifecycle";
import type { OfertaLocalPublishedAssetMetadata } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function isAssetMetadata(value: unknown): value is OfertaLocalPublishedAssetMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.url === "string" && typeof o.storagePath === "string";
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const ofertaLocalId = id.trim();
  if (!ofertaLocalId) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const raw = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const assetKind = raw.assetKind === "coupon" ? "coupon" : raw.assetKind === "flyer" ? "flyer" : null;
  if (!assetKind || !isAssetMetadata(raw.asset)) {
    return NextResponse.json({ ok: false, error: "invalid_asset_metadata" }, { status: 422 });
  }

  const supabase = getAdminSupabase();
  const { data: parent, error: parentError } = await supabase
    .from("ofertas_locales")
    .select("id, owner_id, status, leonix_ad_id, payment_status, entitlement_status, published_at, expires_at")
    .eq("id", ofertaLocalId)
    .maybeSingle();

  if (parentError) return NextResponse.json({ ok: false, error: "parent_lookup_failed" }, { status: 500 });
  if (!parent?.id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (parent.owner_id !== ownerId) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (parent.status === "archived") {
    return NextResponse.json({ ok: false, error: "archived_not_replaceable" }, { status: 409 });
  }

  const created = await createOfertaLocalReplacementSourceVersion({
    supabase,
    ofertaLocalId,
    ownerId,
    assetKind,
    asset: raw.asset,
    uploadedBy: ownerId,
    reason: typeof raw.reason === "string" ? raw.reason : null,
  });
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: created.error, detail: created.detail }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("ofertas_locales")
    .update({
      asset_lifecycle_status: "replacement_pending",
      asset_replacement_required_review: true,
      updated_at: now,
    })
    .eq("id", ofertaLocalId)
    .eq("owner_id", ownerId);
  if (updateError) {
    return NextResponse.json({ ok: false, error: "parent_replacement_mark_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    sourceAsset: created.sourceAsset,
    preserved: {
      ofertaLocalId,
      leonixAdId: parent.leonix_ad_id ?? null,
      paymentStatus: parent.payment_status ?? null,
      entitlementStatus: parent.entitlement_status ?? null,
      publishedAt: parent.published_at ?? null,
      expiresAt: parent.expires_at ?? null,
    },
  });
}
