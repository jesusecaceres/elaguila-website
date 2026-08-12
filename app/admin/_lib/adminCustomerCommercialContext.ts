import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { effectiveEntitlementStatus } from "./packageEntitlementData";
import { resolveCommercialStateBadges, type CommercialStateBadge } from "@/app/lib/listingPlans/commercialStateBadges";

/**
 * Package E Build E3, Gate 2 — the one server-side aggregator behind the unified customer
 * support view. It composes existing canonical tables (the same ones paymentTrackerData.ts /
 * packageEntitlementData.ts / commercialStateBadges.ts already read elsewhere) filtered to ONE
 * customer's owned listings, so staff can see payment/package/placement/subscription truth for
 * a person without visiting four separate admin pages. It invents nothing: every field is a
 * direct DB column, and every commercial dimension (payment, package entitlement, placement,
 * subscription/grace, promo/grant source) stays in its own array — never collapsed into a single
 * "tier" or inferred from another dimension.
 */

export type AdminCustomerPaymentRow = {
  id: string;
  category: string | null;
  listingId: string | null;
  packageTier: string | null;
  packageKey: string | null;
  amountTotalCents: number | null;
  currency: string;
  paymentStatus: string;
  source: string;
  promoCode: string | null;
  salesRepName: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type AdminCustomerEntitlementRow = {
  id: string;
  category: string;
  listingId: string | null;
  packageTier: string;
  packageKey: string | null;
  status: string;
  effectiveStatus: string;
  grantSource: string | null;
  startsAt: string;
  endsAt: string;
};

export type AdminCustomerPlacementRow = {
  id: string;
  category: string;
  listingId: string | null;
  placementTier: string;
  placementSource: string;
  status: string;
  includedWithPrint: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export type AdminCustomerSubscriptionRow = {
  id: string;
  category: string | null;
  listingId: string | null;
  packageKey: string | null;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  suspensionReason: string | null;
  badges: CommercialStateBadge[];
};

export type AdminCustomerCommercialContext = {
  unavailable: boolean;
  unavailableNote: string | null;
  payments: AdminCustomerPaymentRow[];
  entitlements: AdminCustomerEntitlementRow[];
  placements: AdminCustomerPlacementRow[];
  subscriptions: AdminCustomerSubscriptionRow[];
};

const EMPTY: AdminCustomerCommercialContext = {
  unavailable: false,
  unavailableNote: null,
  payments: [],
  entitlements: [],
  placements: [],
  subscriptions: [],
};

function isMissingTableError(msg: string): boolean {
  return /does not exist|schema cache|relation/i.test(msg);
}

/**
 * @param ownerUserId real authenticated owner id (profiles.id).
 * @param listingIds every real listing id this owner has across all category tables (from
 *   `fetchAdminUserAdsForUser` — the caller already resolves this for the ownership section, so
 *   this function never re-derives ownership itself, only reads commercial records scoped to it).
 */
export async function fetchAdminCustomerCommercialContext(
  ownerUserId: string,
  listingIds: string[],
): Promise<AdminCustomerCommercialContext> {
  const ids = [...new Set(listingIds.filter((id) => id.trim()))];
  if (!ownerUserId.trim() && ids.length === 0) return EMPTY;

  const supabase = getAdminSupabase();

  const [paymentsRes, entitlementsRes, placementsRes, subscriptionsRes] = await Promise.all([
    ids.length > 0
      ? supabase
          .from("leonix_payment_records")
          .select(
            "id, category, listing_id, package_tier, package_key, amount_total_cents, currency, payment_status, source, promo_code, sales_rep_name, paid_at, created_at",
          )
          .in("listing_id", ids)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    ids.length > 0
      ? supabase
          .from("listing_package_entitlements")
          .select("id, category, listing_id, package_tier, package_key, status, grant_source, starts_at, ends_at, revoked_at")
          .in("listing_id", ids)
          .order("starts_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    // leonix_placement_entitlements carries its own owner_user_id — a more reliable join than
    // enumerating every listing id (a placement can outlive/precede a specific listing row, e.g.
    // print-only placements with no digital listing_id).
    supabase
      .from("leonix_placement_entitlements")
      .select("id, category, listing_id, placement_tier, placement_source, status, included_with_print, starts_at, ends_at")
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false })
      .limit(50),
    // leonix_subscription_records also carries owner_user_id directly (Package C Build 1).
    supabase
      .from("leonix_subscription_records")
      .select(
        "id, category, listing_id, package_key, status, cancel_at_period_end, current_period_end, grace_ends_at, suspension_reason, recovered_at",
      )
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const firstError = [paymentsRes.error, entitlementsRes.error, placementsRes.error, subscriptionsRes.error].find(
    (e) => Boolean(e),
  );
  if (firstError) {
    const message = String((firstError as { message?: unknown }).message ?? "");
    return {
      ...EMPTY,
      unavailable: true,
      unavailableNote: isMissingTableError(message)
        ? "Commercial records table not found — run Supabase migrations."
        : message,
    };
  }

  const payments: AdminCustomerPaymentRow[] = ((paymentsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    category: r.category != null ? String(r.category) : null,
    listingId: r.listing_id != null ? String(r.listing_id) : null,
    packageTier: r.package_tier != null ? String(r.package_tier) : null,
    packageKey: r.package_key != null ? String(r.package_key) : null,
    amountTotalCents: typeof r.amount_total_cents === "number" ? r.amount_total_cents : null,
    currency: String(r.currency ?? "usd"),
    paymentStatus: String(r.payment_status ?? "unknown"),
    source: String(r.source ?? "unknown"),
    promoCode: r.promo_code != null ? String(r.promo_code) : null,
    salesRepName: r.sales_rep_name != null ? String(r.sales_rep_name) : null,
    paidAt: r.paid_at != null ? String(r.paid_at) : null,
    createdAt: String(r.created_at),
  }));

  const entitlements: AdminCustomerEntitlementRow[] = ((entitlementsRes.data ?? []) as Record<string, unknown>[]).map((r) => {
    const row = {
      status: String(r.status ?? "active"),
      starts_at: String(r.starts_at),
      ends_at: String(r.ends_at),
      revoked_at: r.revoked_at != null ? String(r.revoked_at) : null,
    };
    return {
      id: String(r.id),
      category: String(r.category),
      listingId: r.listing_id != null ? String(r.listing_id) : null,
      packageTier: String(r.package_tier),
      packageKey: r.package_key != null ? String(r.package_key) : null,
      status: row.status,
      effectiveStatus: effectiveEntitlementStatus(row),
      grantSource: r.grant_source != null ? String(r.grant_source) : null,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    };
  });

  const placements: AdminCustomerPlacementRow[] = ((placementsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    category: String(r.category),
    listingId: r.listing_id != null ? String(r.listing_id) : null,
    placementTier: String(r.placement_tier),
    placementSource: String(r.placement_source),
    status: String(r.status ?? "scheduled"),
    includedWithPrint: Boolean(r.included_with_print),
    startsAt: r.starts_at != null ? String(r.starts_at) : null,
    endsAt: r.ends_at != null ? String(r.ends_at) : null,
  }));

  const subscriptions: AdminCustomerSubscriptionRow[] = ((subscriptionsRes.data ?? []) as Record<string, unknown>[]).map((r) => {
    const status = String(r.status ?? "pending");
    const cancelAtPeriodEnd = Boolean(r.cancel_at_period_end);
    const graceEndsAt = r.grace_ends_at != null ? String(r.grace_ends_at) : null;
    const suspensionReason = r.suspension_reason != null ? String(r.suspension_reason) : null;
    const badges = resolveCommercialStateBadges({
      subscriptionStatus: status,
      cancelAtPeriodEnd,
      graceEndsAt,
      suspensionReason,
      recoveredAt: r.recovered_at != null ? String(r.recovered_at) : null,
    });
    return {
      id: String(r.id),
      category: r.category != null ? String(r.category) : null,
      listingId: r.listing_id != null ? String(r.listing_id) : null,
      packageKey: r.package_key != null ? String(r.package_key) : null,
      status,
      cancelAtPeriodEnd,
      currentPeriodEnd: r.current_period_end != null ? String(r.current_period_end) : null,
      graceEndsAt,
      suspensionReason,
      badges,
    };
  });

  return { unavailable: false, unavailableNote: null, payments, entitlements, placements, subscriptions };
}
