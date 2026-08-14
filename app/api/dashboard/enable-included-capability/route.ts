/**
 * Package C Build 3 (C5/C6) — dashboard "enable included capability" mutation. Server-only.
 *
 * Replaces the retired $79 dashboard add-on checkout for Restaurantes/Servicios coupons: the
 * owner already holds the $399/mo base package (or the narrow historical print-included
 * equivalent), so no Stripe purchase is ever required here. This route verifies bearer auth +
 * listing ownership (same pattern as listing-package-entitlements/route.ts), then verifies real
 * commercial capability server-side via resolveBusinessToolsAccess() before writing anything —
 * never trusts a client-supplied "I have the base package" claim.
 */

import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveOwnedListingIdentityKeys } from "@/app/lib/listingPlans/listingEntitlementOwnership";
import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";
import { enableRestauranteCouponModuleFromCapability } from "@/app/lib/listingPlans/revenueRestaurantFulfillment";

const SUPPORTED_CATEGORIES = new Set(["restaurantes", "servicios"]);
const CATEGORY_LISTING_SOURCE: Record<string, string> = {
  restaurantes: "restaurantes_public_listings",
  servicios: "servicios_public_listings",
};

export async function POST(req: NextRequest) {
  const userId = await getBearerUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }

  let body: { category?: string; listingId?: string; capability?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }

  const category = String(body.category ?? "").trim().toLowerCase();
  const listingId = String(body.listingId ?? "").trim();
  const capability = String(body.capability ?? "coupons_offers").trim();

  if (!SUPPORTED_CATEGORIES.has(category) || !listingId) {
    return NextResponse.json({ ok: false, code: "invalid_request" }, { status: 400 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, code: "supabase_not_configured" }, { status: 500 });
  }

  const listingSource = CATEGORY_LISTING_SOURCE[category];
  const supabase = getAdminSupabase();
  const owned = await resolveOwnedListingIdentityKeys(supabase, listingSource, [listingId], userId);
  if (!owned.has(listingId)) {
    return NextResponse.json({ ok: false, code: "not_owned" }, { status: 403 });
  }

  const access = await resolveBusinessToolsAccess({ category, listingSource, listingId, capability });
  if (!access.allowed) {
    return NextResponse.json({ ok: false, code: access.reasonCode }, { status: 403 });
  }

  if (category === "restaurantes") {
    const result = await enableRestauranteCouponModuleFromCapability({ listingId });
    if (!result.ok) {
      return NextResponse.json({ ok: false, code: result.outcome, message: result.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Servicios has no couponUpgradeEnabled-equivalent stored flag (content presence is the only
  // signal — see serviciosDashboardOffersAddonCheckout.ts) — capability is already verified above,
  // nothing else to write.
  return NextResponse.json({ ok: true });
}
