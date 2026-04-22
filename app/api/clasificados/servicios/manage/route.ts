import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getServiciosPublicListingBySlugFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";

const SERVICIOS_LISTING_STATUS_PAUSED_UNPUBLISHED = "paused_unpublished" as const;
import { insertServiciosAnalyticsEvent } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

async function ownerIdFromBearer(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const ownerUserId = await ownerIdFromBearer(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const slug = String(b.slug ?? "").trim();
  const action = b.action === "resume" ? "resume" : "pause";

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) || slug.length > 120) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  const row = await getServiciosPublicListingBySlugFromDb(slug, { visibility: "all" });
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (!row.owner_user_id || row.owner_user_id !== ownerUserId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const nextStatus = action === "pause" ? SERVICIOS_LISTING_STATUS_PAUSED_UNPUBLISHED : SERVICIOS_LISTING_STATUS_PUBLISHED;
  if (action === "pause" && row.listing_status !== SERVICIOS_LISTING_STATUS_PUBLISHED) {
    return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 409 });
  }
  if (action === "resume" && row.listing_status !== SERVICIOS_LISTING_STATUS_PAUSED_UNPUBLISHED) {
    return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 409 });
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("servicios_public_listings")
    .update({ listing_status: nextStatus, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .eq("owner_user_id", ownerUserId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await insertServiciosAnalyticsEvent({
    listingSlug: slug,
    eventType: "provider_manage",
    meta: { action },
  });

  return NextResponse.json({ ok: true, listing_status: nextStatus });
}
