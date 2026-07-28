import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { listServiciosPublicListingsForOwner } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_OFFERS_ADDON_PACKAGE_KEY } from "@/app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { fetchAddonEntitlementsForListings } from "@/app/lib/listingPlans/addonEntitlementReader";

export const runtime = "nodejs";

/**
 * Gate E.3.3 — replaces the previous bespoke `listing_package_entitlements` query (which filtered
 * on a legacy dual `listing_source` value and matched by canonical id OR slug OR leonix_ad_id)
 * with the shared Gate E.2.1 lifecycle reader. The shared reader never filters by
 * `listing_source` and matches only the real `servicios_public_listings.id` — see
 * addonEntitlementReader.ts for why (that column has been written inconsistently across
 * categories, and identity must be the canonical row UUID, never a mutable slug or ad id).
 * Response shape (`offers_addon_active`) is unchanged; only the truth source is.
 */
async function fetchActiveServiciosOffersEntitlementKeys(
  rows: Awaited<ReturnType<typeof listServiciosPublicListingsForOwner>>,
): Promise<Set<string>> {
  const canonicalIds = rows
    .map((row) => row.id?.trim())
    .filter((id): id is string => Boolean(id));
  if (canonicalIds.length === 0) return new Set();

  const entitlements = await fetchAddonEntitlementsForListings({
    category: "servicios",
    packageKey: SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
    listingIds: canonicalIds,
  });

  const active = new Set<string>();
  for (const id of canonicalIds) {
    if (entitlements.get(id)?.status === "active") active.add(id);
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
      // Gate E.3.3 — canonical `id` only; slug/leonix_ad_id are never entitlement identity.
      offers_addon_active: Boolean(r.id?.trim() && activeOffersEntitlementKeys.has(r.id.trim())),
    })),
  });
}
