/**
 * TODAY-2 — Entitlement resolution for the personalized DIY Concierge. Never a parallel
 * entitlement system: this module joins the two already-certified tables that exist today --
 * `business_listing_links` (verified business <-> listing relationship, Package BCO-2) and
 * `listing_package_entitlements` (admin-managed, duration-based ad-package tier per listing,
 * Print-to-Digital) -- exactly the "exact verified listing-to-business relationship" the locked
 * commercial model requires. There is currently no other wired connection between a canonical
 * business and a package tier; until a verified link resolves to an active entitlement, this
 * module fails closed with `pending_entitlement_linkage` rather than guessing.
 *
 * `conciergeGuidance` is always false here — no code path in this module can set it true. A
 * future, explicitly separate paid Concierge entitlement would need its own additive linkage;
 * this module only ever proves DIY-tier package access (quarter/half/full/premium).
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { isHalfPagePlusTier as isHalfPagePlusTierPure } from "./logic";

export type ConciergePackageTier = "quarter_page" | "half_page" | "full_page" | "premium";

export type ConciergeEntitlementState =
  | "public_learning_only"
  | "quarter_preview"
  | "personalized_access_active"
  | "pending_entitlement_linkage"
  | "temporarily_unavailable"
  | "emergency_disabled";

export type ResolvedConciergeEntitlement = {
  state: ConciergeEntitlementState;
  packageTier: ConciergePackageTier | null;
  /** Always false in this package — a separate, explicitly paid Concierge entitlement would set this. */
  conciergeGuidance: false;
  /** True only when server-resolved package tier + verified linkage allow personalized tools. */
  personalizedAccess: boolean;
  resolvedListingSource: string | null;
  resolvedListingId: string | null;
};

function isKnownTier(value: string): value is ConciergePackageTier {
  return value === "quarter_page" || value === "half_page" || value === "full_page" || value === "premium";
}

/**
 * Resolves the exact, currently-active package tier for a business by joining its verified
 * listing links against active listing_package_entitlements rows. Returns null (never a guess)
 * when no verified link resolves to a currently-active entitlement.
 */
export async function resolveBusinessPackageTier(businessId: string): Promise<{
  tier: ConciergePackageTier | null;
  listingSource: string | null;
  listingId: string | null;
}> {
  const supabase = getAdminSupabase();

  const { data: links, error: linksError } = await supabase
    .from("business_listing_links")
    .select("listing_source, listing_id")
    .eq("business_id", businessId)
    .eq("status", "verified");
  if (linksError || !links || links.length === 0) {
    return { tier: null, listingSource: null, listingId: null };
  }

  const nowIso = new Date().toISOString();
  for (const link of links as { listing_source: string; listing_id: string }[]) {
    const { data: entitlement, error: entitlementError } = await supabase
      .from("listing_package_entitlements")
      .select("package_tier")
      .eq("listing_source", link.listing_source)
      .eq("listing_id", link.listing_id)
      .eq("status", "active")
      .lte("starts_at", nowIso)
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (entitlementError || !entitlement) continue;
    const tier = String(entitlement.package_tier);
    if (isKnownTier(tier)) {
      return { tier, listingSource: link.listing_source, listingId: link.listing_id };
    }
  }

  return { tier: null, listingSource: null, listingId: null };
}

/**
 * Resolves the full truthful entitlement state for one exact, membership-verified business.
 * `diyConciergeFlagTier` must already be resolved from resolveDiyConciergeFlagTier() by the
 * caller — this function never reads the flag itself, keeping flag/entitlement concerns separate
 * and unit-testable independently.
 */
export async function resolveConciergeEntitlement(params: {
  businessId: string;
  diyConciergeFlagAvailable: boolean;
}): Promise<ResolvedConciergeEntitlement> {
  if (!params.diyConciergeFlagAvailable) {
    return {
      state: "emergency_disabled",
      packageTier: null,
      conciergeGuidance: false,
      personalizedAccess: false,
      resolvedListingSource: null,
      resolvedListingId: null,
    };
  }

  const resolved = await resolveBusinessPackageTier(params.businessId);
  if (!resolved.tier) {
    return {
      state: "pending_entitlement_linkage",
      packageTier: null,
      conciergeGuidance: false,
      personalizedAccess: false,
      resolvedListingSource: null,
      resolvedListingId: null,
    };
  }

  if (resolved.tier === "quarter_page") {
    return {
      state: "quarter_preview",
      packageTier: "quarter_page",
      conciergeGuidance: false,
      personalizedAccess: false,
      resolvedListingSource: resolved.listingSource,
      resolvedListingId: resolved.listingId,
    };
  }

  return {
    state: "personalized_access_active",
    packageTier: resolved.tier,
    conciergeGuidance: false,
    personalizedAccess: true,
    resolvedListingSource: resolved.listingSource,
    resolvedListingId: resolved.listingId,
  };
}

export function isHalfPagePlusTier(tier: ConciergePackageTier | null): boolean {
  return isHalfPagePlusTierPure(tier);
}
