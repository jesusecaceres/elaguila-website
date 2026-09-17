import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";

/**
 * Gate 8 (REV-001–004) — Business 360 previously had zero imports of `packageEntitlementData.ts`,
 * `promoCodeData.ts`, or `paymentTrackerData.ts`; none of those three tables carry a `business_id`
 * column at all (confirmed by direct schema trace), so there is no direct ID-based join from a
 * business to them. The one real, ID-based path is `business_listing_links` (business_id →
 * listing_id, staff-verified) — every table below is keyed by `listing_id`, so this rolls the
 * three systems up for exactly the listings a staff member has verified as belonging to this
 * business. Deliberately does NOT infer anything from a free-text business-name match — only
 * verified listing ids are used, mirroring the same doctrine already applied to
 * `business_external_links` ("Connected records") on this same page.
 *
 * Forensic audit (post-Gate-20) — the first version of this file returned bare counts only,
 * which is exactly the kind of "partial rollup that omits important canonical benefit sources"
 * the audit warned about: it could not distinguish a comp/partner grant from a paid one, show a
 * package tier or its start/end dates, or show what a promo code actually discounted. Rewritten
 * to surface real rows (bounded, since a business's own verified-listing set is never large) with
 * the fields the gate's own promise (REV-001–004: "grant source," "start/end/status," "promo vs
 * entitlement distinction") actually named.
 */
const ROW_LIMIT = 20;

export type BusinessCommercialBenefitEntitlement = {
  id: string;
  category: string;
  packageTier: string;
  /** stripe_webhook | admin_manual | print_included | comp | partner | manual_cleared_payment | null */
  grantSource: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  revokedAt: string | null;
  listingId: string | null;
};

export type BusinessCommercialBenefitPromoRedemption = {
  id: string;
  status: string;
  discountCents: number | null;
  redeemedAt: string | null;
  packageKey: string | null;
  listingId: string | null;
};

export type BusinessCommercialBenefitPayment = {
  id: string;
  paymentStatus: string;
  amountTotalCents: number | null;
  amountPaidCents: number | null;
  paidAt: string | null;
  packageTier: string | null;
  /** Non-null only when this payment record is itself linked to a promo redemption — lets the
   * UI show the promo-vs-entitlement distinction the gate asked for without re-deriving it. */
  promoCode: string | null;
  listingId: string | null;
};

export type BusinessCommercialBenefitsSummary = {
  entitlements: BusinessCommercialBenefitEntitlement[];
  entitlementCountTruncated: boolean;
  promoRedemptions: BusinessCommercialBenefitPromoRedemption[];
  promoRedemptionCountTruncated: boolean;
  promoRedemptionDiscountCentsTotal: number;
  payments: BusinessCommercialBenefitPayment[];
  paymentCountTruncated: boolean;
  unavailable: boolean;
};

const EMPTY: BusinessCommercialBenefitsSummary = {
  entitlements: [],
  entitlementCountTruncated: false,
  promoRedemptions: [],
  promoRedemptionCountTruncated: false,
  promoRedemptionDiscountCentsTotal: 0,
  payments: [],
  paymentCountTruncated: false,
  unavailable: false,
};

export async function fetchBusinessCommercialBenefits(
  verifiedListingIds: string[],
): Promise<BusinessCommercialBenefitsSummary> {
  const ids = [...new Set(verifiedListingIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return EMPTY;
  }

  try {
    const supabase = getAdminSupabase();
    const [entitlementsRes, redemptionsRes, paymentsRes] = await Promise.all([
      supabase
        .from("listing_package_entitlements")
        .select("id, category, package_tier, grant_source, status, starts_at, ends_at, revoked_at, listing_id")
        .in("listing_id", ids)
        .order("starts_at", { ascending: false })
        .limit(ROW_LIMIT + 1),
      supabase
        .from("leonix_promo_code_redemptions")
        .select("id, status, discount_cents, redeemed_at, package_key, listing_id")
        .in("listing_id", ids)
        .order("redeemed_at", { ascending: false })
        .limit(ROW_LIMIT + 1),
      supabase
        .from("leonix_payment_records")
        .select("id, payment_status, amount_total_cents, amount_paid_cents, paid_at, package_tier, promo_code, listing_id")
        .in("listing_id", ids)
        .order("paid_at", { ascending: false, nullsFirst: false })
        .limit(ROW_LIMIT + 1),
    ]);

    if (entitlementsRes.error || redemptionsRes.error || paymentsRes.error) {
      return { ...EMPTY, unavailable: true };
    }

    const entitlementRows = (entitlementsRes.data ?? []) as {
      id: string;
      category: string;
      package_tier: string;
      grant_source: string | null;
      status: string;
      starts_at: string;
      ends_at: string;
      revoked_at: string | null;
      listing_id: string | null;
    }[];
    const redemptionRows = (redemptionsRes.data ?? []) as {
      id: string;
      status: string;
      discount_cents: number | null;
      redeemed_at: string | null;
      package_key: string | null;
      listing_id: string | null;
    }[];
    const paymentRows = (paymentsRes.data ?? []) as {
      id: string;
      payment_status: string;
      amount_total_cents: number | null;
      amount_paid_cents: number | null;
      paid_at: string | null;
      package_tier: string | null;
      promo_code: string | null;
      listing_id: string | null;
    }[];

    // The discount total must reflect every redemption tied to this business, not just the
    // bounded preview rows shown in the UI — sum before truncating for display.
    const promoRedemptionDiscountCentsTotal = redemptionRows.reduce(
      (sum, r) => sum + (typeof r.discount_cents === "number" ? r.discount_cents : 0),
      0,
    );

    return {
      entitlements: entitlementRows.slice(0, ROW_LIMIT).map((r) => ({
        id: r.id,
        category: r.category,
        packageTier: r.package_tier,
        grantSource: r.grant_source,
        status: r.status,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        revokedAt: r.revoked_at,
        listingId: r.listing_id,
      })),
      entitlementCountTruncated: entitlementRows.length > ROW_LIMIT,
      promoRedemptions: redemptionRows.slice(0, ROW_LIMIT).map((r) => ({
        id: r.id,
        status: r.status,
        discountCents: r.discount_cents,
        redeemedAt: r.redeemed_at,
        packageKey: r.package_key,
        listingId: r.listing_id,
      })),
      promoRedemptionCountTruncated: redemptionRows.length > ROW_LIMIT,
      promoRedemptionDiscountCentsTotal,
      payments: paymentRows.slice(0, ROW_LIMIT).map((r) => ({
        id: r.id,
        paymentStatus: r.payment_status,
        amountTotalCents: r.amount_total_cents,
        amountPaidCents: r.amount_paid_cents,
        paidAt: r.paid_at,
        packageTier: r.package_tier,
        promoCode: r.promo_code,
        listingId: r.listing_id,
      })),
      paymentCountTruncated: paymentRows.length > ROW_LIMIT,
      unavailable: false,
    };
  } catch {
    return { ...EMPTY, unavailable: true };
  }
}
