import { NextRequest, NextResponse } from "next/server";

import { insertViajesPublicInquiry } from "@/app/(site)/clasificados/viajes/lib/viajesPublicInquiriesDbServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBearerUserId } from "../../_lib/bearerUser";

export const runtime = "nodejs";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

function looksLikeEmail(s: string): boolean {
  const t = s.trim();
  return t.length >= 3 && t.includes("@") && !/\s/.test(t);
}

async function resolveBuyerProfile(admin: ReturnType<typeof getAdminSupabase>, userId: string): Promise<{ name: string; email: string }> {
  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(userId);
  if (authErr || !authUser.user) {
    return { name: "", email: "" };
  }
  const u = authUser.user;
  const email = (u.email ?? "").trim();
  const meta = u.user_metadata as Record<string, unknown> | undefined;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    "";
  const { data: profile } = await admin.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  const row = profile as { display_name?: string | null } | null;
  const name =
    (row?.display_name?.trim() || "").trim() ||
    fromMeta ||
    (email ? email.split("@")[0] : "");
  return { name, email };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const stagedListingId = String(b.stagedListingId ?? "").trim();
  if (!isUuid(stagedListingId)) {
    return NextResponse.json({ ok: false, error: "invalid_staged_listing_id" }, { status: 400 });
  }
  const messageIn = String(b.message ?? "").trim();
  if (!messageIn) {
    return NextResponse.json({ ok: false, error: "missing_message" }, { status: 400 });
  }

  const buyerUserId = await getBearerUserId(req);
  let buyerName = String(b.buyerName ?? "").trim();
  let buyerEmail = String(b.buyerEmail ?? "").trim();

  const admin = getAdminSupabase();
  if (buyerUserId) {
    const prof = await resolveBuyerProfile(admin, buyerUserId);
    if (!buyerName) buyerName = prof.name;
    if (!buyerEmail) buyerEmail = prof.email;
  }

  if (!buyerName || !looksLikeEmail(buyerEmail)) {
    return NextResponse.json({ ok: false, error: "missing_buyer_identity" }, { status: 400 });
  }

  const { data: listing, error: listErr } = await admin
    .from("viajes_staged_listings")
    .select("id, owner_user_id, lifecycle_status, is_public, title")
    .eq("id", stagedListingId)
    .maybeSingle();

  if (listErr) {
    return NextResponse.json({ ok: false, error: listErr.message }, { status: 500 });
  }
  const row = listing as {
    id?: string;
    owner_user_id?: string | null;
    lifecycle_status?: string;
    is_public?: boolean;
    title?: string;
  } | null;
  if (!row?.id || row.lifecycle_status !== "approved" || !row.is_public) {
    return NextResponse.json({ ok: false, error: "listing_not_inquirable" }, { status: 404 });
  }
  const ownerId = row.owner_user_id ? String(row.owner_user_id) : null;
  if (buyerUserId && ownerId && buyerUserId === ownerId) {
    return NextResponse.json({ ok: false, error: "cannot_inquire_own_listing" }, { status: 400 });
  }

  const res = await insertViajesPublicInquiry({
    stagedListingId,
    buyerUserId,
    buyerName,
    buyerEmail,
    message: messageIn,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: res.id });
}
