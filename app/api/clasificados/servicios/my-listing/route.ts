import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  mergeServiciosPrivateAddressForOwner,
  serviciosExactAddressIsHidden,
} from "@/app/clasificados/servicios/lib/serviciosAddressPrivacy";
import { readAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import { isListingLinkedToBusiness } from "@/app/lib/business/assistedListingCustody";
import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";

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

  /**
   * LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE (Gate 8 reopen) — a staff actor with a valid,
   * server-verified assisted-publishing cookie may reopen a Leonix-prepared draft it created,
   * WITHOUT a customer bearer token. Never a substitute for the customer bearer check below for a
   * normal request — only unlocks the by-id lookup, and only for a row this route independently
   * re-verifies has no customer owner AND is verified-linked to that exact business.
   */
  const assistedContext = !token ? readAssistedPublishingContext(req.cookies) : null;
  const isAssistedRequest = !token && assistedContext !== null && assistedContext.category === "servicios";
  if (!token && !isAssistedRequest) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let ownerAuthUserId: string | null = null;
  if (token) {
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
    ownerAuthUserId = data.user.id;
  }

  const search = req.nextUrl.searchParams;
  const slug = search.get("slug")?.trim() ?? "";
  const id = search.get("id")?.trim() ?? "";
  const leonixAdId = search.get("leonixAdId")?.trim() ?? "";

  if (!slug && !id && !leonixAdId) {
    return NextResponse.json({ ok: false, error: "missing_identity" }, { status: 400 });
  }
  // Assisted reopen only ever targets the canonical row id — no slug/leonixAdId lookup, matching
  // the same "canonical UUID is the persistence authority" doctrine the publish route enforces.
  if (isAssistedRequest && !id) {
    return NextResponse.json({ ok: false, error: "missing_identity" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  let query = supabase
    .from("servicios_public_listings")
    .select(
      "id, slug, leonix_ad_id, business_name, city, published_at, updated_at, profile_json, leonix_verified, listing_status, owner_user_id",
    );
  if (ownerAuthUserId) query = query.eq("owner_user_id", ownerAuthUserId);

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

  if (isAssistedRequest) {
    const linked =
      rec.owner_user_id == null &&
      typeof rec.id === "string" &&
      (await isListingLinkedToBusiness({
        businessId: assistedContext!.businessId,
        listingSource: "servicios_public_listings",
        listingId: rec.id,
      }));
    if (!linked) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
  }

  // Gate SERVICIOS-P7-BLOCKER-REPAIR-01 (B5) — this route is owner-verified (`owner_user_id` =
  // bearer user) and runs with the service role, so it is the right place to re-attach the PRIVATE
  // exact address the public profile no longer carries. Both the dashboard edit hydration and the
  // listing-bound Preview load through here, so the owner's address round-trips unchanged.
  // Read only for hidden-address listings and best-effort: other listings never touch the column.
  let ownerProfile = (rec.profile_json ?? null) as ServiciosBusinessProfile | null;
  if (serviciosExactAddressIsHidden(ownerProfile) && typeof rec.id === "string") {
    let privateQuery = supabase.from("servicios_public_listings").select("private_contact").eq("id", rec.id);
    if (ownerAuthUserId) privateQuery = privateQuery.eq("owner_user_id", ownerAuthUserId);
    const { data: privateRow } = await privateQuery.maybeSingle();
    ownerProfile = mergeServiciosPrivateAddressForOwner(
      ownerProfile,
      (privateRow as { private_contact?: unknown } | null)?.private_contact,
    );
  }

  // Gate 15 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18) — the SAME
  // server-resolved `coupons_offers` capability the publish route and the public profile page
  // already use, so listing-bound Preview can render coupons/promotions from real entitlement
  // truth instead of inferring intent from stored profile content (which can diverge from what
  // the published page actually shows).
  const offersEntitled =
    typeof rec.id === "string"
      ? await resolveBusinessToolsAccess({
          category: "servicios",
          listingSource: "servicios_public_listings",
          listingId: rec.id,
          capability: "coupons_offers",
        })
          .then((d) => d.allowed === true)
          .catch(() => false)
      : false;

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
      profile_json: ownerProfile,
      offers_entitled: offersEntitled,
    },
  });
}
