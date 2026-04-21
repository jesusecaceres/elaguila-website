import { NextRequest, NextResponse } from "next/server";

import { revalidateViajesStagedPublicSurfaces } from "@/app/(site)/clasificados/viajes/lib/viajesRevalidatePublicSurfaces";
import {
  fetchViajesStagedRowById,
  ownerResubmitViajesStagedListing,
  updateViajesStagedListingModeration,
} from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import { viajesGetUserIdFromBearer } from "../_lib/viajesOwnerBearer";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const ownerUserId = await viajesGetUserIdFromBearer(req);
  if (!ownerUserId) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });

  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const row = await fetchViajesStagedRowById(id);
  if (!row || row.owner_user_id !== ownerUserId) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, row });
}

type OwnerAction = "resubmit" | "unpublish";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const ownerUserId = await viajesGetUserIdFromBearer(req);
  if (!ownerUserId) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const id = String(b.id ?? "").trim();
  const action = String(b.action ?? "").trim() as OwnerAction;
  if (!id || !action) return NextResponse.json({ ok: false, error: "missing_id_or_action" }, { status: 400 });

  const row = await fetchViajesStagedRowById(id);
  if (!row || row.owner_user_id !== ownerUserId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const slug = row.slug;

  if (action === "unpublish") {
    if (row.lifecycle_status !== "approved" || !row.is_public) {
      return NextResponse.json({ ok: false, error: "not_public_approved" }, { status: 400 });
    }
    const res = await updateViajesStagedListingModeration({
      id,
      lifecycle_status: "unpublished",
      is_public: false,
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status: 500 });
    revalidateViajesStagedPublicSurfaces(slug);
    return NextResponse.json({ ok: true });
  }

  if (action === "resubmit") {
    const wasPublic = row.lifecycle_status === "approved" && row.is_public;
    const res = await ownerResubmitViajesStagedListing(id, ownerUserId);
    if (!res.ok) {
      const code = res.error === "invalid_state" ? 400 : 500;
      return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status: code });
    }
    if (wasPublic) revalidateViajesStagedPublicSurfaces(slug);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}
