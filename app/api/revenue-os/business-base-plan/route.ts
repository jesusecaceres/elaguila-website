import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveBusinessBasePlanOffer } from "@/app/lib/listingPlans/businessBasePlanOffer";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";

/**
 * Read-only: which base package this business listing should be sold right now.
 *
 * The preview asks before deciding what its checkout sells, so a listing that already exists is
 * priced from the entitlement table rather than from whatever marker happens to be in the URL.
 * Nothing here mutates, and the answer is scoped to the authenticated owner of the listing —
 * an unverified caller gets `new`, which offers nothing.
 *
 * The price is included because the caller renders it; it comes from the same server matrix the
 * checkout prices from, so the customer can never be shown one amount and charged another.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, code: "supabase_not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, code: "auth_required" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const category = params.get("category")?.trim().toLowerCase() ?? "";
  const listingId = params.get("listingId")?.trim() ?? "";
  if (!category || !listingId) {
    return NextResponse.json({ ok: false, code: "missing_identity" }, { status: 400 });
  }

  const offer = await resolveBusinessBasePlanOffer({ category, listingId, ownerUserId });
  const sellPriceCents = offer.sellPackageKey
    ? getRevenuePackageDefinition(offer.sellPackageKey)?.priceCents ?? null
    : null;

  return NextResponse.json({ ok: true, offer: { ...offer, sellPriceCents } });
}
