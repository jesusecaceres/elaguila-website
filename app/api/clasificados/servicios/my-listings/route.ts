import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { listServiciosPublicListingsForOwner } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_OFFERS_ADDON_PACKAGE_KEY } from "@/app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

async function fetchActiveServiciosOffersEntitlementKeys(
  rows: Awaited<ReturnType<typeof listServiciosPublicListingsForOwner>>,
): Promise<Set<string>> {
  const keys = new Set<string>();
  for (const row of rows) {
    if (row.id?.trim()) keys.add(row.id.trim());
    if (row.slug?.trim()) keys.add(row.slug.trim());
    if (row.leonix_ad_id?.trim()) keys.add(row.leonix_ad_id.trim());
  }
  if (keys.size === 0) return new Set();

  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("listing_package_entitlements")
    .select("listing_id, status, starts_at, ends_at, revoked_at")
    .eq("category", "servicios")
    .eq("listing_source", "servicios_public_listings")
    .eq("package_key", SERVICIOS_OFFERS_ADDON_PACKAGE_KEY)
    .eq("status", "active")
    .is("revoked_at", null)
    .in("listing_id", [...keys]);

  const now = Date.now();
  const active = new Set<string>();
  for (const row of data ?? []) {
    const listingId = String(row.listing_id ?? "").trim();
    if (!listingId) continue;
    const starts = row.starts_at ? Date.parse(String(row.starts_at)) : NaN;
    const ends = row.ends_at ? Date.parse(String(row.ends_at)) : NaN;
    if (Number.isFinite(starts) && starts > now) continue;
    if (Number.isFinite(ends) && ends <= now) continue;
    active.add(listingId);
  }
  return active;
}

export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const rows = await listServiciosPublicListingsForOwner(data.user.id, 80);
  const activeOffersEntitlementKeys = await fetchActiveServiciosOffersEntitlementKeys(rows);
  return NextResponse.json({
    ok: true,
    listings: rows.map((r) => ({
      id: r.id ?? null,
      slug: r.slug,
      business_name: r.business_name,
      city: r.city,
      published_at: r.published_at,
      listing_status: r.listing_status,
      leonix_verified: r.leonix_verified,
      leonix_ad_id: r.leonix_ad_id ?? null,
      offers_addon_active:
        Boolean(r.id?.trim() && activeOffersEntitlementKeys.has(r.id.trim())) ||
        Boolean(r.slug?.trim() && activeOffersEntitlementKeys.has(r.slug.trim())) ||
        Boolean(r.leonix_ad_id?.trim() && activeOffersEntitlementKeys.has(r.leonix_ad_id.trim())),
    })),
  });
}
