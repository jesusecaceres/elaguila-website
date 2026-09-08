import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { fetchActiveListingPackageEntitlementsForRows } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import {
  packageEntitlementGrantsDestacado,
  packageEntitlementGrantsResultsPriority,
  packageEntitlementIncludesNuestrosNegocios,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { fetchRevenueOsAdPlanProofsForListings } from "@/app/lib/listingPlans/revenuePaymentLookup";
import { fetchAddonEntitlementsForListings } from "@/app/lib/listingPlans/addonEntitlementReader";
import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";
import { resolveOwnedListingIdentityKeys } from "@/app/lib/listingPlans/listingEntitlementOwnership";
import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** Package C Build 3 (C5/C6) — categories with a data-driven capability model. */
const CAPABILITY_CATEGORIES = new Set(["restaurantes", "servicios"]);

type RequestItem = {
  category: string;
  listingSource: string;
  listingId?: string | null;
  slug?: string | null;
  leonixAdId?: string | null;
  /** Optional add-on package key (e.g. "restaurantes_offers_addon") — additive, opt-in per item. */
  packageKey?: string | null;
};

export async function POST(req: NextRequest) {
  const userId = await getBearerUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { items?: RequestItem[] };
  try {
    body = (await req.json()) as { items?: RequestItem[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, 120) : [];
  if (items.length === 0) {
    return NextResponse.json({ badges: {} });
  }

  // Gate I.4.3A — server-side owner authorization. This route uses a service-role/admin
  // Supabase client for every downstream lookup, so RLS is never a safety net here: without this
  // check, any authenticated user could request another owner's package tier, placement flags,
  // add-on status, or Revenue OS payment proof simply by naming a foreign listing's identity.
  // Grouped and batched per `listingSource` (never one query per listing); an unconfigured
  // Supabase environment, an unknown source, or a failed lookup chunk all fail closed to "not
  // owned" rather than granting access.
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ badges: {} });
  }
  const ownershipSupabase = getAdminSupabase();
  const itemsBySourceForOwnership = new Map<string, RequestItem[]>();
  for (const item of items) {
    const listingSource = String(item.listingSource ?? "").trim();
    if (!listingSource) continue;
    const list = itemsBySourceForOwnership.get(listingSource) ?? [];
    list.push(item);
    itemsBySourceForOwnership.set(listingSource, list);
  }
  const ownedGroups = await Promise.all(
    [...itemsBySourceForOwnership.entries()].map(async ([listingSource, group]) => {
      const identityKeys = group
        .map((g) => String(g.listingId ?? g.slug ?? g.leonixAdId ?? "").trim())
        .filter(Boolean);
      const owned = await resolveOwnedListingIdentityKeys(ownershipSupabase, listingSource, identityKeys, userId);
      return group.filter((g) => {
        const key = String(g.listingId ?? g.slug ?? g.leonixAdId ?? "").trim();
        return Boolean(key) && owned.has(key);
      });
    }),
  );
  const authorizedItems = ownedGroups.flat();

  if (authorizedItems.length === 0) {
    return NextResponse.json({ badges: {} });
  }

  const byCategorySource = new Map<string, RequestItem[]>();
  for (const item of authorizedItems) {
    const category = String(item.category ?? "").trim().toLowerCase();
    const listingSource = String(item.listingSource ?? "").trim();
    const listingId = String(item.listingId ?? item.slug ?? item.leonixAdId ?? "").trim();
    if (!category || !listingSource || !listingId) continue;
    const key = `${category}\0${listingSource}`;
    const list = byCategorySource.get(key) ?? [];
    list.push(item);
    byCategorySource.set(key, list);
  }

  const badges: Record<
    string,
    {
      grantsDestacado: boolean;
      grantsResultsPriority: boolean;
      includesNuestrosNegocios: boolean;
      tier: string;
      startsAt?: string | null;
      endsAt?: string | null;
      revenueAdPlanBadge?: string | null;
      revenuePackageKey?: string | null;
      /** Additive — set only when the request item included a `packageKey`. */
      addonStatus?: AddonLifecycleStatus;
      /** Package C Build 3 (C5/C6) — additive, set only for capability-model categories
       * (restaurantes/servicios). Resolved server-side via resolveBusinessToolsAccess(); never
       * inferred from placement, account tier, or a client-supplied claim. */
      capabilities?: string[];
    }
  > = {};

  const revenueLookupItems: Array<{ category: string; listingId: string; listingKey: string }> = [];

  // Gate I.4.3 — placement/category/source groups are independent of each other (each is its own
  // category+listingSource combination), so they run concurrently instead of one-at-a-time. Group
  // count is small and bounded by the request's own distinct category/source combinations (never
  // proportional to catalog size — Gate I.4.2 already scopes each dashboard request to one
  // selected category), so plain `Promise.all` is appropriate. Each group is caught independently
  // so one failed/malformed group can never affect another group's result.
  const placementGroupResults = await Promise.all(
    [...byCategorySource.entries()].map(async ([key, group]) => {
      const [category, listingSource] = key.split("\0");
      const groupBadges: typeof badges = {};
      const groupRevenueItems: typeof revenueLookupItems = [];
      try {
        const rows = group.map((g) => ({
          id: g.listingId ?? null,
          slug: g.slug ?? g.listingId ?? null,
          leonix_ad_id: g.leonixAdId ?? null,
        }));
        const lookup = await fetchActiveListingPackageEntitlementsForRows(rows, {
          category,
          listingSource,
        });
        for (const g of group) {
          const row = {
            id: g.listingId ?? null,
            slug: g.slug ?? null,
            leonix_ad_id: g.leonixAdId ?? null,
            package_entitlement_tier: null as string | null,
            starts_at: null as string | null,
            ends_at: null as string | null,
          };
          const id = String(g.listingId ?? g.slug ?? g.leonixAdId ?? "").trim();
          const ent =
            (g.listingId && lookup.byListingId.get(g.listingId)) ||
            (g.slug && lookup.byListingId.get(g.slug)) ||
            (g.leonixAdId && lookup.byListingId.get(g.leonixAdId)) ||
            null;
          if (ent) {
            row.package_entitlement_tier = ent.tier;
            row.starts_at = ent.startsAt;
            row.ends_at = ent.endsAt;
          }
          const summary = resolveListingPlacementEntitlement({
            category,
            listing: row as Record<string, unknown>,
          });
          groupBadges[id] = {
            tier: summary.tier,
            grantsDestacado: packageEntitlementGrantsDestacado(summary),
            grantsResultsPriority: packageEntitlementGrantsResultsPriority(summary),
            includesNuestrosNegocios: packageEntitlementIncludesNuestrosNegocios(summary),
            startsAt: ent?.startsAt ?? null,
            endsAt: ent?.endsAt ?? null,
          };
          groupRevenueItems.push({ category, listingId: id, listingKey: id });
        }
      } catch (err) {
        console.error("[listing-package-entitlements] placement group failed", {
          category,
          listingSource,
          message: err instanceof Error ? err.message : String(err),
        });
        // Fail closed: this group contributes nothing rather than fabricating eligibility.
        return { badges: {} as typeof badges, revenueItems: [] as typeof revenueLookupItems };
      }
      return { badges: groupBadges, revenueItems: groupRevenueItems };
    }),
  );
  for (const result of placementGroupResults) {
    Object.assign(badges, result.badges);
    revenueLookupItems.push(...result.revenueItems);
  }

  // Package C Build 3 (C5/C6) — additive capability lookup for restaurantes/servicios only.
  // Independent of the placement-tier and add-on-lifecycle stages above; merges onto badges[id].
  // Each item is resolved independently so one failed resolution never affects another.
  const capabilityItems = authorizedItems.filter((item) =>
    CAPABILITY_CATEGORIES.has(String(item.category ?? "").trim().toLowerCase()),
  );
  if (capabilityItems.length > 0) {
    const capabilityResults = await Promise.all(
      capabilityItems.map(async (item) => {
        const category = String(item.category ?? "").trim().toLowerCase();
        const listingSource = String(item.listingSource ?? "").trim();
        const id = String(item.listingId ?? item.slug ?? item.leonixAdId ?? "").trim();
        if (!listingSource || !id) return null;
        try {
          const access = await resolveBusinessToolsAccess({
            category,
            listingSource,
            listingId: id,
            capability: "coupons_offers",
          });
          return { id, capabilities: access.plan.capabilities };
        } catch (err) {
          console.error("[listing-package-entitlements] capability lookup failed", {
            category,
            listingSource,
            message: err instanceof Error ? err.message : String(err),
          });
          // Fail closed: no capability fabricated on error.
          return { id, capabilities: [] as string[] };
        }
      }),
    );
    for (const result of capabilityResults) {
      if (!result) continue;
      badges[result.id] = {
        ...(badges[result.id] ?? {
          tier: "digital_only",
          grantsDestacado: false,
          grantsResultsPriority: false,
          includesNuestrosNegocios: false,
        }),
        capabilities: result.capabilities,
      };
    }
  }

  // Additive add-on lifecycle lookup — only for items that opted in with a `packageKey`.
  // Deliberately independent from the placement-tier loop above: does not alter or replace it.
  // Runs strictly after the placement stage resolves (it merges onto `badges[id]` set there).
  const addonRequestItems = authorizedItems.filter((item) => String(item.packageKey ?? "").trim());
  if (addonRequestItems.length > 0) {
    const byAddonGroup = new Map<string, RequestItem[]>();
    for (const item of addonRequestItems) {
      const category = String(item.category ?? "").trim().toLowerCase();
      const packageKey = String(item.packageKey ?? "").trim();
      const listingId = String(item.listingId ?? item.slug ?? item.leonixAdId ?? "").trim();
      if (!category || !packageKey || !listingId) continue;
      const key = `${category}\0${packageKey}`;
      const list = byAddonGroup.get(key) ?? [];
      list.push(item);
      byAddonGroup.set(key, list);
    }

    // Gate I.4.3 — same independent-group parallelization as the placement stage above.
    const addonGroupResults = await Promise.all(
      [...byAddonGroup.entries()].map(async ([key, group]) => {
        const [category, packageKey] = key.split("\0");
        const groupBadges: typeof badges = {};
        try {
          const listingIds = group.map((g) => String(g.listingId ?? g.slug ?? g.leonixAdId ?? "").trim());
          const statuses = await fetchAddonEntitlementsForListings({ category, packageKey, listingIds });
          for (const g of group) {
            const id = String(g.listingId ?? g.slug ?? g.leonixAdId ?? "").trim();
            const addonStatus = statuses.get(id)?.status ?? "not_purchased";
            groupBadges[id] = {
              ...(badges[id] ?? {
                tier: "digital_only",
                grantsDestacado: false,
                grantsResultsPriority: false,
                includesNuestrosNegocios: false,
              }),
              addonStatus,
            };
          }
        } catch (err) {
          console.error("[listing-package-entitlements] addon group failed", {
            category,
            packageKey,
            message: err instanceof Error ? err.message : String(err),
          });
          return {} as typeof badges;
        }
        return groupBadges;
      }),
    );
    for (const groupBadges of addonGroupResults) {
      Object.assign(badges, groupBadges);
    }
  }

  const revenueProofs = await fetchRevenueOsAdPlanProofsForListings(revenueLookupItems, "es");
  for (const [listingKey, proof] of Object.entries(revenueProofs)) {
    if (!badges[listingKey]) {
      badges[listingKey] = {
        tier: "digital_only",
        grantsDestacado: false,
        grantsResultsPriority: false,
        includesNuestrosNegocios: false,
        revenueAdPlanBadge: proof.adPlanBadge,
        revenuePackageKey: proof.packageKey,
      };
    } else {
      badges[listingKey] = {
        ...badges[listingKey],
        revenueAdPlanBadge: proof.adPlanBadge,
        revenuePackageKey: proof.packageKey,
      };
    }
  }

  // Package C Build 1 (Gate 14) — truthful subscription/grace/suspension state per listing.
  // Read from the canonical subscription records; independent of plan/entitlement/placement.
  const subscriptionStates: Record<
    string,
    { status: string; cancelAtPeriodEnd: boolean; graceEndsAt: string | null; suspensionReason: string | null; recoveredAt: string | null }
  > = {};
  try {
    const listingIds = revenueLookupItems.map((i) => i.listingId).filter(Boolean);
    if (listingIds.length) {
      const supabase = getAdminSupabase();
      const { data: subs } = await supabase
        .from("leonix_subscription_records")
        .select("listing_id, status, cancel_at_period_end, grace_ends_at, suspension_reason, recovered_at, updated_at")
        .in("listing_id", listingIds)
        .order("updated_at", { ascending: false });
      for (const row of subs ?? []) {
        const key = String((row as { listing_id?: string }).listing_id ?? "");
        if (!key || subscriptionStates[key]) continue;
        subscriptionStates[key] = {
          status: String((row as { status?: string }).status ?? ""),
          cancelAtPeriodEnd: Boolean((row as { cancel_at_period_end?: boolean }).cancel_at_period_end),
          graceEndsAt: ((row as { grace_ends_at?: string | null }).grace_ends_at ?? null) as string | null,
          suspensionReason: ((row as { suspension_reason?: string | null }).suspension_reason ?? null) as string | null,
          recoveredAt: ((row as { recovered_at?: string | null }).recovered_at ?? null) as string | null,
        };
      }
    }
  } catch {
    // Fail closed to "no subscription state" — never fabricate commercial truth.
  }

  return NextResponse.json({ badges, subscriptionStates });
}
