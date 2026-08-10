/**
 * Package C Build 3 (C5/C6) — canonical category commercial plan + Business Tools access
 * resolvers. Server-only. The ONLY intended caller outside this module (and its own tests) is
 * the authenticated dashboard entitlement API route (app/api/dashboard/listing-package-
 * entitlements/route.ts) — never a client component, never a "use client" file.
 *
 * Reads `listing_package_entitlements` (the full current row set for a listing — never
 * `.maybeSingle()`, a listing may legitimately hold multiple simultaneously-live entitlements)
 * and, only when the canonical row's provenance is a real Stripe subscription, layers grace/
 * suspended state from `leonix_subscription_records` (same read pattern already proven in
 * commercialWriteGuard.ts's loadSubscriptionStatusForParent and the dashboard entitlement
 * route's subscriptionStates block). Never reads `leonix_placement_entitlements`, account-tier
 * tables, or verification tables — commercial state only.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  decideCategoryListingPlan,
  decideBusinessToolsAccess,
  type EntitlementRowFacts,
  type CategoryListingPlan,
  type BusinessToolsDecision,
} from "./categoryCommercialPlanPolicy";

const ENTITLEMENTS_TABLE = "listing_package_entitlements";
const SUBSCRIPTIONS_TABLE = "leonix_subscription_records";

async function fetchEntitlementRows(input: {
  category: string;
  listingSource: string;
  listingId: string;
}): Promise<EntitlementRowFacts[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from(ENTITLEMENTS_TABLE)
    .select("id, package_key, grant_source, package_tier, status, starts_at, ends_at")
    .eq("category", input.category)
    .eq("listing_source", input.listingSource)
    .eq("listing_id", input.listingId)
    .in("status", ["active", "scheduled", "expired"]);
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      packageKey: r.package_key != null ? String(r.package_key) : null,
      grantSource: r.grant_source != null ? String(r.grant_source) : null,
      packageTier: r.package_tier != null ? String(r.package_tier) : null,
      status: String(r.status ?? ""),
      startsAt: r.starts_at != null ? String(r.starts_at) : null,
      endsAt: r.ends_at != null ? String(r.ends_at) : null,
    };
  });
}

/** Only a real Stripe subscription can be in grace/suspended — admin/comp/partner/print/manual
 * grants have no Stripe subscription behind them and never hit this lookup. Fails closed to "no
 * override" (never fabricates grace/suspension, never blocks on a missing table). */
async function resolveSubscriptionOverride(input: {
  listingId: string;
}): Promise<"grace" | "suspended" | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("status, grace_ends_at")
      .eq("listing_id", input.listingId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const status = data ? String((data as { status?: string }).status ?? "") : "";
    if (status === "suspended") return "suspended";
    if (status === "grace") return "grace";
    return null;
  } catch {
    return null;
  }
}

export type ResolveCategoryListingPlanInput = {
  category: string;
  listingSource: string;
  listingId: string;
};

export async function resolveCategoryListingPlan(
  input: ResolveCategoryListingPlanInput,
): Promise<CategoryListingPlan> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingSource = String(input.listingSource ?? "").trim();
  const listingId = String(input.listingId ?? "").trim();
  if (!category || !listingSource || !listingId) {
    return { packageKey: null, grantSource: null, status: "none", startsAt: null, endsAt: null, capabilities: [], capabilitySource: "none" };
  }

  const rows = await fetchEntitlementRows({ category, listingSource, listingId });
  const nowMs = Date.now();

  // Pre-check: does ANY row look like it could resolve to a real Stripe subscription canonical?
  // Only attempt the subscription lookup then — never for admin/comp/partner/print/manual rows.
  const mightBeStripeSubscription = rows.some(
    (r) => r.grantSource === "stripe_webhook" && isRowLiveForPrecheck(r, nowMs),
  );
  const subscriptionOverride = mightBeStripeSubscription
    ? await resolveSubscriptionOverride({ listingId })
    : null;

  return decideCategoryListingPlan({ category, rows, nowMs, subscriptionOverride });
}

function isRowLiveForPrecheck(row: EntitlementRowFacts, nowMs: number): boolean {
  if (row.status !== "active" && row.status !== "scheduled") return false;
  if (row.endsAt) {
    const end = Date.parse(row.endsAt);
    if (Number.isFinite(end) && end < nowMs) return false;
  }
  return true;
}

export type ResolveBusinessToolsAccessInput = ResolveCategoryListingPlanInput & { capability: string };

export async function resolveBusinessToolsAccess(
  input: ResolveBusinessToolsAccessInput,
): Promise<BusinessToolsDecision> {
  const plan = await resolveCategoryListingPlan(input);
  return decideBusinessToolsAccess({ plan, capability: input.capability });
}
