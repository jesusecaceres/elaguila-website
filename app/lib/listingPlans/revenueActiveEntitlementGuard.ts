/**
 * Shared, server-authoritative Revenue OS guard: prevents a listing/business that already has an
 * ACTIVE paid base-package entitlement from being sent through Stripe Checkout for that same base
 * package again on an edit/republish.
 *
 * Background (regression fix): `validateRevenueCheckoutRequest` (revenueCheckout.ts) validates
 * category/package/price/Stripe-eligibility only — it never checks whether `listingId` already
 * has this base package active. Individual categories built their own partial protections
 * (Restaurantes' `restauranteOwnerEditStatusAuthority.ts` never lets an owner edit escalate a
 * protected row to `published`; Comida Local's publish route never regresses an already-published
 * row to `pending_payment`), but NONE of these prevented the client from independently calling
 * `/api/revenue-os/checkout` — the actual Stripe-session-creating, money-charging route — for a
 * listingId that already carries a live entitlement. This module is the single server-side check
 * for exactly that gap, read from the same table every grant is written to
 * (`listing_package_entitlements`, see `revenueEntitlementFulfillment.ts`) — never from listing
 * status, UI state, or any client-supplied flag.
 */

// Deliberately NOT `import "server-only"` — matches the precedent set by the checkout validator
// this module extends (revenueCheckout.ts), which also calls getAdminSupabase()/
// isSupabaseAdminConfigured() without that marker. The real enforcement boundary is that this
// module is only ever imported from API routes, never a client component; the marker is
// defense-in-depth, not load-bearing here, and omitting it is what makes
// scripts/verify-revenue-active-entitlement-guard.ts able to import and exercise the real
// exported `requiresBaseCheckout` function directly via plain `tsx` (the `server-only` package
// throws unconditionally on import outside a Next.js/webpack build).
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type RevenueActiveEntitlementGuardReason =
  | "no_active_entitlement"
  | "active_entitlement_edit"
  | "expired"
  | "new_listing";

export type RevenueActiveEntitlementSummary = {
  id: string;
  status: string;
  endsAt: string;
  packageKey: string;
};

export type RequiresBaseCheckoutResult = {
  requiresCheckout: boolean;
  reason: RevenueActiveEntitlementGuardReason;
  activeEntitlement: RevenueActiveEntitlementSummary | null;
};

/**
 * Base ("one live entitlement per listing, recharge must never happen on edit") package keys this
 * guard governs. Deliberately narrow:
 *  - Renewal-style / one-time packages (rentas_30d, ofertas-locales flyer/coupons,
 *    autos_privado_30d, br_fsbo_45d, empleos job post, clases_paid_30d) are NOT included — those
 *    are legitimately re-purchasable per listing/period and already have their own
 *    ownership+expiry validators (validateRentasRenewalCheckoutOwnership,
 *    validateOfertasLocalesCheckoutOwnership) that this guard must never fight with.
 *  - Add-on packages (offers/coupons modules, inventory packs) are excluded — they are
 *    independently billable on top of an active base entitlement and already have their own
 *    `*AddonOwnership` guards (validateServiciosOffersAddonOwnership,
 *    validateAutosDealerInventoryAddonOwnership, validateBienesInventoryAddonOwnership,
 *    validateRestauranteAddonOnlyListingOwnership) which already reject a second purchase of the
 *    SAME add-on via their own `addon_already_active` check. This guard must never block those.
 */
export const REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS: ReadonlySet<string> = new Set([
  "autos_dealer_monthly",
  "br_agent_monthly",
  "restaurantes_base_monthly",
  "servicios_base_monthly",
  "comida_local_base_monthly",
]);

/** True when `packageKey` is one this shared guard applies to. Category is accepted defensively
 * (never trust package_key alone against a mismatched category in a crafted request) — the real
 * category/package pairing is re-verified against the canonical matrix by
 * `validateRevenueCheckoutRequest` regardless, this is just a cheap membership check. */
export function isRevenueBaseEntitlementGuardedPackage(
  category: string | null | undefined,
  packageKey: string | null | undefined,
): boolean {
  const key = String(packageKey ?? "").trim().toLowerCase();
  if (!REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS.has(key)) return false;
  return Boolean(String(category ?? "").trim());
}

/**
 * Server-authoritative: given a listingId + category + base packageKey, determine whether Stripe
 * Checkout is actually required, by reading the REAL entitlement table
 * (`listing_package_entitlements`) — never a client-supplied "isActive" flag, never listing
 * status, never UI state.
 *
 * `ownerId` is accepted for future/defense-in-depth use (e.g. audit logging, or a caller that
 * wants to additionally assert listing ownership before trusting the result) but is NOT part of
 * the entitlement lookup itself: the entitlement's scope is authoritatively
 * (category, listing_id, package_key) — the same key `listing_package_entitlements_live_uniq`
 * enforces at the DB level — and each call site is already responsible for its own listing
 * ownership check (every category's checkout/publish route already does this independently).
 *
 * "Active" here means: a row with status='active' AND ends_at in the future. `ends_at` already
 * bakes in the real Stripe subscription period end plus the 7-day failed-payment grace backstop
 * (see `computeEndsAt`/`extendEntitlementForInvoicePaid` in revenueEntitlementFulfillment.ts /
 * subscriptionLifecyclePolicy.ts), so this is the true "still covered" boundary — not merely
 * whatever the periodic subscription-sweep cron has gotten around to flipping to 'suspended' yet.
 */
export async function requiresBaseCheckout(
  input: {
    listingId: string | null | undefined;
    ownerId?: string | null;
    category: string;
    packageKey: string;
  },
  /**
   * Test-only injection point. Real callers never pass this — `getAdminSupabase()` (the
   * established server-only Supabase client pattern used throughout revenueCheckout.ts /
   * revenueEntitlementFulfillment.ts) is always used in production. Exists so
   * `scripts/verify-revenue-active-entitlement-guard.ts` can exercise this exact exported
   * function against a deterministic in-memory fixture instead of a live Supabase project —
   * no other seam seemed reasonable to fake around a real DB read without ever getting close to
   * "fabricate a pass".
   */
  deps?: { supabase?: Pick<SupabaseClient, "from"> },
): Promise<RequiresBaseCheckoutResult> {
  const listingId = String(input.listingId ?? "").trim();
  const category = String(input.category ?? "").trim().toLowerCase();
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();

  if (!listingId) {
    // No real listing row to check against yet — this is a brand-new listing/business.
    return { requiresCheckout: true, reason: "new_listing", activeEntitlement: null };
  }

  if (!deps?.supabase && !isSupabaseAdminConfigured()) {
    // Fail closed toward "requires checkout" — never silently skip a real Stripe charge decision
    // because the DB is unreachable. (In the real checkout route this branch is unreachable in
    // practice: the route itself already 503s on `!isRevenueSupabaseAdminConfigured()` before
    // this guard is ever called — this default only matters for any other future caller.)
    return { requiresCheckout: true, reason: "no_active_entitlement", activeEntitlement: null };
  }

  const supabase = deps?.supabase ?? getAdminSupabase();
  const { data, error } = await supabase
    .from("listing_package_entitlements")
    .select("id, status, ends_at, package_key")
    .eq("category", category)
    .eq("listing_id", listingId)
    .eq("package_key", packageKey)
    .order("ends_at", { ascending: false })
    .limit(5);

  if (error || !Array.isArray(data) || data.length === 0) {
    return { requiresCheckout: true, reason: "no_active_entitlement", activeEntitlement: null };
  }

  const nowMs = Date.now();
  const activeRow = data.find((row) => {
    const status = String((row as { status?: unknown }).status ?? "").trim().toLowerCase();
    if (status !== "active") return false;
    const endsAtRaw = (row as { ends_at?: unknown }).ends_at;
    const endsAtMs = typeof endsAtRaw === "string" ? new Date(endsAtRaw).getTime() : NaN;
    return Number.isFinite(endsAtMs) && endsAtMs > nowMs;
  });

  if (activeRow) {
    const row = activeRow as { id: unknown; status: unknown; ends_at: unknown; package_key: unknown };
    return {
      requiresCheckout: false,
      reason: "active_entitlement_edit",
      activeEntitlement: {
        id: String(row.id),
        status: String(row.status),
        endsAt: String(row.ends_at),
        packageKey: String(row.package_key),
      },
    };
  }

  // Rows exist for this (category, listing_id, package_key) — e.g. a prior active grant, now
  // past its ends_at, or revoked — but none currently valid: a real re-purchase is required.
  return { requiresCheckout: true, reason: "expired", activeEntitlement: null };
}
