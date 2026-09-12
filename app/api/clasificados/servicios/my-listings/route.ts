import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { listServiciosPublicListingsForOwner } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";
import { safeExternalWebsiteHref } from "@/app/(site)/servicios/lib/serviciosProfileSanitize";

export const runtime = "nodejs";

/**
 * Gate E.3.3 — identity is the canonical `servicios_public_listings.id` only, never a mutable slug
 * or ad id. Response shape (`offers_addon_active`) is unchanged; only the truth source is.
 *
 * Gate SERVICIOS-P7-BLOCKER-REPAIR-01 (B4) — the truth source is now the included `coupons_offers`
 * capability (`resolveBusinessToolsAccess`), the same authority the publish route and the dashboard
 * "enable" route use. It previously read only the RETIRED `servicios_offers_addon` entitlement,
 * which nothing grants any more, so every $399 customer's dashboard hid their included offers. The
 * field name is kept for its consumers; it now means "offers module available", and historical
 * add-on holders still qualify through the plan policy's legacy-add-on branch. Fails closed.
 */
async function fetchActiveServiciosOffersEntitlementKeys(
  rows: Awaited<ReturnType<typeof listServiciosPublicListingsForOwner>>,
): Promise<Set<string>> {
  const canonicalIds = rows
    .map((row) => row.id?.trim())
    .filter((id): id is string => Boolean(id));
  if (canonicalIds.length === 0) return new Set();

  const decisions = await Promise.all(
    canonicalIds.map(async (id) => {
      const access = await resolveBusinessToolsAccess({
        category: "servicios",
        listingSource: "servicios_public_listings",
        listingId: id,
        capability: "coupons_offers",
      }).catch(() => null);
      return [id, access?.allowed === true] as const;
    }),
  );
  return new Set(decisions.filter(([, allowed]) => allowed).map(([id]) => id));
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
      // Owner Actionability Gate — real provider links only, read from the same raw wire fields
      // (profile_json.contact.externalReviewLinks.{googleReviewsUrl,yelpReviewsUrl}) the public
      // Servicios Business Hub resolver (resolveServiciosProfile.ts) reads before reshaping them
      // into its own resolved `google`/`yelp` keys. Never invented; omitted when the owner never
      // entered a real Google/Yelp URL.
      google_review_url: safeExternalWebsiteHref(r.profile_json?.contact?.externalReviewLinks?.googleReviewsUrl),
      yelp_review_url: safeExternalWebsiteHref(r.profile_json?.contact?.externalReviewLinks?.yelpReviewsUrl),
    })),
  });
}
