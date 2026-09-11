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
  decideBusinessToolsAccess,
  decideCategoryListingPlansForListings,
  listingIdsNeedingSubscriptionOverride,
  subscriptionOverrideFromRecordStatus,
  type CategoryListingPlan,
  type BusinessToolsDecision,
  type ListingEntitlementRowFacts,
} from "./categoryCommercialPlanPolicy";

const ENTITLEMENTS_TABLE = "listing_package_entitlements";
const SUBSCRIPTIONS_TABLE = "leonix_subscription_records";

/** Keeps each PostgREST `in (...)` list well inside URL limits for a page-sized batch of ids. */
const LISTING_ID_CHUNK = 100;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Gate RESTAURANTES-1 — `listing_source` is deliberately NOT part of this filter.
 *
 * That column has been written inconsistently across the platform: the canonical Stripe
 * fulfillment path writes the bare CATEGORY string (`revenueEntitlementFulfillment.ts:179` —
 * `listing_source: input.category`, e.g. `"restaurantes"`), while callers of this resolver pass
 * the TABLE name (`"restaurantes_public_listings"`). Filtering on it therefore matched **zero
 * rows for a genuinely paid listing**, so `resolveBusinessToolsAccess` reported "no plan" for a
 * real $399/mo subscriber and the included-coupon capability was unreachable.
 *
 * This is the same defect and the same remedy already documented and applied in
 * `addonEntitlementReader.ts` ("Never filters by `listing_source` — Gate E.1 found that column
 * has been written inconsistently"). `category` + `listing_id` is the durable identity; a listing
 * id is globally unique, so dropping the column narrows nothing that matters and stops the
 * resolver silently under-reporting real entitlements. `listingSource` is retained on the input
 * type because callers legitimately identify the listing by its table.
 */
async function fetchEntitlementRows(input: {
  category: string;
  listingIds: readonly string[];
}): Promise<ListingEntitlementRowFacts[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const out: ListingEntitlementRowFacts[] = [];
  for (const ids of chunk(input.listingIds, LISTING_ID_CHUNK)) {
    const { data } = await supabase
      .from(ENTITLEMENTS_TABLE)
      .select("id, listing_id, package_key, grant_source, package_tier, status, starts_at, ends_at")
      .eq("category", input.category)
      .in("listing_id", ids)
      .in("status", ["active", "scheduled", "expired"]);
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      out.push({
        listingId: String(r.listing_id ?? ""),
        facts: {
          id: String(r.id),
          packageKey: r.package_key != null ? String(r.package_key) : null,
          grantSource: r.grant_source != null ? String(r.grant_source) : null,
          packageTier: r.package_tier != null ? String(r.package_tier) : null,
          status: String(r.status ?? ""),
          startsAt: r.starts_at != null ? String(r.starts_at) : null,
          endsAt: r.ends_at != null ? String(r.ends_at) : null,
        },
      });
    }
  }
  return out;
}

/** Only a real Stripe subscription can be in grace/suspended — admin/comp/partner/print/manual
 * grants have no Stripe subscription behind them and never hit this lookup. The newest record per
 * listing wins. Fails closed to "no override" (never fabricates grace/suspension, never blocks on a
 * missing table). */
async function resolveSubscriptionOverrides(
  listingIds: readonly string[],
): Promise<Map<string, "grace" | "suspended" | null>> {
  const overrides = new Map<string, "grace" | "suspended" | null>();
  if (listingIds.length === 0 || !isSupabaseAdminConfigured()) return overrides;
  try {
    const supabase = getAdminSupabase();
    for (const ids of chunk(listingIds, LISTING_ID_CHUNK)) {
      const { data } = await supabase
        .from(SUBSCRIPTIONS_TABLE)
        .select("listing_id, status, updated_at")
        .in("listing_id", ids)
        .order("updated_at", { ascending: false });
      for (const row of data ?? []) {
        const r = row as { listing_id?: string | null; status?: string | null };
        const listingId = String(r.listing_id ?? "");
        if (!listingId || overrides.has(listingId)) continue; // newest first
        overrides.set(listingId, subscriptionOverrideFromRecordStatus(r.status));
      }
    }
  } catch {
    return new Map();
  }
  return overrides;
}

export type ResolveCategoryListingPlanInput = {
  category: string;
  listingSource: string;
  listingId: string;
};

export type ResolveCategoryListingPlansInput = {
  category: string;
  listingSource: string;
  listingIds: readonly string[];
};

const NO_PLAN: CategoryListingPlan = {
  packageKey: null,
  grantSource: null,
  status: "none",
  startsAt: null,
  endsAt: null,
  capabilities: [],
  capabilitySource: "none",
};

/**
 * Gate SERVICIOS-EDIT-ROUNDTRIP-OFFERS-DISCOVERY-1 — the batched resolver. One entitlement query and
 * at most one subscription query per chunk of ids, then the SAME pure per-listing policy
 * (`decideCategoryListingPlansForListings`). Discovery surfaces use this so they read the current
 * commercial truth at read time without a lookup per row; the single-listing resolver below is this
 * with one id, so there is exactly one fetch implementation.
 */
export async function resolveCategoryListingPlans(
  input: ResolveCategoryListingPlansInput,
): Promise<Map<string, CategoryListingPlan>> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingSource = String(input.listingSource ?? "").trim();
  const listingIds = [...new Set((input.listingIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean))];
  if (!category || !listingSource || listingIds.length === 0) {
    return new Map(listingIds.map((id) => [id, { ...NO_PLAN }]));
  }

  const rows = await fetchEntitlementRows({ category, listingIds });
  const nowMs = Date.now();
  const subscriptionOverrideByListingId = await resolveSubscriptionOverrides(
    listingIdsNeedingSubscriptionOverride(rows, nowMs),
  );

  return decideCategoryListingPlansForListings({ category, listingIds, rows, subscriptionOverrideByListingId, nowMs });
}

export async function resolveCategoryListingPlan(
  input: ResolveCategoryListingPlanInput,
): Promise<CategoryListingPlan> {
  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) return { ...NO_PLAN };
  const plans = await resolveCategoryListingPlans({
    category: input.category,
    listingSource: input.listingSource,
    listingIds: [listingId],
  });
  return plans.get(listingId) ?? { ...NO_PLAN };
}

export type ResolveBusinessToolsAccessInput = ResolveCategoryListingPlanInput & { capability: string };

export async function resolveBusinessToolsAccess(
  input: ResolveBusinessToolsAccessInput,
): Promise<BusinessToolsDecision> {
  const plan = await resolveCategoryListingPlan(input);
  return decideBusinessToolsAccess({ plan, capability: input.capability });
}

export type ResolveBusinessToolsAccessForListingsInput = ResolveCategoryListingPlansInput & { capability: string };

/** Batched `resolveBusinessToolsAccess` — same decision per listing, one lookup for the whole set. */
export async function resolveBusinessToolsAccessForListings(
  input: ResolveBusinessToolsAccessForListingsInput,
): Promise<Map<string, BusinessToolsDecision>> {
  const plans = await resolveCategoryListingPlans(input);
  const decisions = new Map<string, BusinessToolsDecision>();
  for (const [listingId, plan] of plans) {
    decisions.set(listingId, decideBusinessToolsAccess({ plan, capability: input.capability }));
  }
  return decisions;
}
