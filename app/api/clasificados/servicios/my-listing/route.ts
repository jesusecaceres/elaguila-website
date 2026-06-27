import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function authTokenFromRequest(req: NextRequest): string {
  const auth = req.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const token = authTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams;
  const slug = search.get("slug")?.trim() ?? "";
  const id = search.get("id")?.trim() ?? "";
  const leonixAdId = search.get("leonixAdId")?.trim() ?? "";

  if (!slug && !id && !leonixAdId) {
    return NextResponse.json({ ok: false, error: "missing_identity" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  let query = supabase
    .from("servicios_public_listings")
    .select(
      "id, slug, leonix_ad_id, business_name, city, published_at, updated_at, profile_json, leonix_verified, listing_status, owner_user_id",
    )
    .eq("owner_user_id", data.user.id);

  if (id) query = query.eq("id", id);
  else if (slug) query = query.eq("slug", slug);
  else query = query.eq("leonix_ad_id", leonixAdId);

  const { data: row, error: rowError } = await query.maybeSingle();
  if (rowError) {
    return NextResponse.json({ ok: false, error: rowError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const rec = row as Record<string, unknown>;
  return NextResponse.json({
    ok: true,
    listing: {
      id: typeof rec.id === "string" ? rec.id : null,
      slug: typeof rec.slug === "string" ? rec.slug : "",
      leonix_ad_id: typeof rec.leonix_ad_id === "string" ? rec.leonix_ad_id : null,
      business_name: typeof rec.business_name === "string" ? rec.business_name : "",
      city: typeof rec.city === "string" ? rec.city : "",
      published_at: typeof rec.published_at === "string" ? rec.published_at : null,
      updated_at: typeof rec.updated_at === "string" ? rec.updated_at : null,
      listing_status: typeof rec.listing_status === "string" ? rec.listing_status : "published",
      leonix_verified: rec.leonix_verified === true,
      profile_json: (rec.profile_json ?? null) as ServiciosBusinessProfile | null,
    },
  });
}
