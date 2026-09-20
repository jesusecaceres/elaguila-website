/**
 * Gate QB-IDENTITY-01 — self-service canonical listing link endpoint.
 *
 * POST { listingSource, listingId } with `Authorization: Bearer <supabase access token>`
 *
 * WHY THIS ROUTE EXISTS: three of the four Quick Business families publish through a server
 * route, which can write the canonical `business_listing_links` row directly. Bienes Raíces
 * Negocio publishes from the BROWSER (`publishLeonixRealEstateListingCore`), and
 * `business_listing_links` deliberately has no authenticated INSERT policy — every write is
 * service-role. This endpoint is therefore the one server seam that lets a browser-published
 * listing acquire the same canonical relationship, without loosening the table's RLS posture.
 *
 * SECURITY POSTURE
 *  - The caller's identity comes from the bearer token, never from the body.
 *  - The business is resolved from the caller's `business_memberships`, never from the body.
 *  - Ownership of the listing is re-proven server-side against the source's canonical owner
 *    column before any row is written. A caller cannot link a listing they do not own.
 *  - Idempotent: repeating the call is success, not a duplicate row.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import {
  isCanonicalListingSource,
  linkSelfServiceListingToBusiness,
} from "@/app/lib/business/canonicalListingLink";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A `listings` row is only a BUSINESS listing when `seller_type = 'business'`. Linking a private
 * (FSBO) row to a business would consume that listing's single verified link — the partial unique
 * index allows exactly one — and block the legitimate link later. So this is refused up front.
 */
async function isEligibleForBusinessLink(listingSource: string, listingId: string): Promise<boolean> {
  if (listingSource !== "listings") return true;
  if (!isSupabaseAdminConfigured()) return false;
  const db = getAdminSupabase();
  const { data } = await db
    .from("listings")
    .select("seller_type")
    .eq("id", listingId)
    .maybeSingle();
  return String((data as { seller_type?: unknown } | null)?.seller_type ?? "") === "business";
}

export async function POST(request: NextRequest) {
  const userId = await getBearerUserId(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: { listingSource?: unknown; listingId?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const listingSource = body.listingSource;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!isCanonicalListingSource(listingSource) || !listingId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!(await isEligibleForBusinessLink(listingSource, listingId))) {
    return NextResponse.json({ ok: false, error: "listing_not_business_scoped" }, { status: 409 });
  }

  const result = await linkSelfServiceListingToBusiness({ userId, listingSource, listingId });

  if (!result.ok) {
    const status =
      result.reason === "not_owner"
        ? 403
        : result.reason === "no_business" || result.reason === "ambiguous_business"
          ? 409
          : result.reason === "conflict_other_business"
            ? 409
            : result.reason === "db_not_configured"
              ? 503
              : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    businessId: result.businessId,
    alreadyLinked: result.alreadyLinked,
  });
}
