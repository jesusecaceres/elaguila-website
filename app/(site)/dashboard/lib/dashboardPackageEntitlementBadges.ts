import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";

/**
 * Package C Build 4 (C8, Gate 6) — the API route (`/api/dashboard/listing-package-entitlements`)
 * already computes this from `leonix_subscription_records`, independent of plan/entitlement/
 * placement; this wrapper previously discarded it (`return json.badges ?? {}`), so no dashboard
 * surface could ever show grace/suspended/cancel-at-period-end. Shape mirrors the route's own
 * per-listing map exactly — never fabricated or re-derived client-side.
 */
export type DashboardSubscriptionStateEntry = {
  status: string;
  cancelAtPeriodEnd: boolean;
  graceEndsAt: string | null;
  suspensionReason: string | null;
  recoveredAt: string | null;
};

export type DashboardEntitlementBadgePayload = {
  grantsDestacado: boolean;
  grantsResultsPriority: boolean;
  includesNuestrosNegocios: boolean;
  tier: string;
  startsAt?: string | null;
  endsAt?: string | null;
  /** Revenue OS listing/ad plan badge when webhook-backed entitlement exists. */
  revenueAdPlanBadge?: string | null;
  revenuePackageKey?: string | null;
  /** Additive — present only when the lookup item included a `packageKey`. */
  addonStatus?: AddonLifecycleStatus;
  /** Package C Build 3 (C5/C6) — additive, present only for capability-model categories
   * (restaurantes/servicios). Resolved server-side; never trust a client-computed value instead. */
  capabilities?: string[];
};

export type DashboardEntitlementLookupItem = {
  key: string;
  category: string;
  listingSource: string;
  listingId?: string | null;
  slug?: string | null;
  leonixAdId?: string | null;
  /** Optional add-on package key (e.g. "restaurantes_offers_addon") to also resolve lifecycle status. */
  packageKey?: string | null;
};

export type DashboardListingPackageEntitlementBadgesResult = {
  badges: Record<string, DashboardEntitlementBadgePayload>;
  subscriptionStates: Record<string, DashboardSubscriptionStateEntry>;
};

export async function fetchDashboardListingPackageEntitlementBadges(
  items: DashboardEntitlementLookupItem[],
  accessToken: string | null | undefined,
): Promise<DashboardListingPackageEntitlementBadgesResult> {
  if (items.length === 0 || !accessToken?.trim()) return { badges: {}, subscriptionStates: {} };
  const res = await fetch("/api/dashboard/listing-package-entitlements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken.trim()}`,
    },
    body: JSON.stringify({
      items: items.map((i) => ({
        category: i.category,
        listingSource: i.listingSource,
        listingId: i.listingId ?? i.key,
        slug: i.slug ?? undefined,
        leonixAdId: i.leonixAdId ?? undefined,
        packageKey: i.packageKey ?? undefined,
      })),
    }),
  });
  if (!res.ok) return { badges: {}, subscriptionStates: {} };
  const json = (await res.json()) as {
    badges?: Record<string, DashboardEntitlementBadgePayload>;
    subscriptionStates?: Record<string, DashboardSubscriptionStateEntry>;
  };
  return { badges: json.badges ?? {}, subscriptionStates: json.subscriptionStates ?? {} };
}

/** Fails closed to null when no matching key has a resolved subscription state. */
export function dashboardSubscriptionStateForKey(
  subscriptionStates: Record<string, DashboardSubscriptionStateEntry>,
  keys: string[],
): DashboardSubscriptionStateEntry | null {
  for (const k of keys) {
    const t = k.trim();
    if (t && subscriptionStates[t]) return subscriptionStates[t];
  }
  return null;
}

export function dashboardEntitlementBadgeForKey(
  badges: Record<string, DashboardEntitlementBadgePayload>,
  keys: string[],
): DashboardEntitlementBadgePayload | null {
  for (const k of keys) {
    const t = k.trim();
    if (t && badges[t]) return badges[t];
  }
  return null;
}

/** Fails closed to "not_purchased" when no matching key has a resolved add-on status. */
export function dashboardAddonStatusForKey(
  badges: Record<string, DashboardEntitlementBadgePayload>,
  keys: string[],
): AddonLifecycleStatus {
  for (const k of keys) {
    const t = k.trim();
    const badge = t ? badges[t] : null;
    if (badge?.addonStatus) return badge.addonStatus;
  }
  return "not_purchased";
}

/** Package C Build 3 (C5/C6) — fails closed to false when no matching key resolved the
 * capability. Never infers capability from placement/tier/addonStatus. */
export function dashboardHasCapabilityForKey(
  badges: Record<string, DashboardEntitlementBadgePayload>,
  keys: string[],
  capability: string,
): boolean {
  for (const k of keys) {
    const t = k.trim();
    const badge = t ? badges[t] : null;
    if (badge?.capabilities?.includes(capability)) return true;
  }
  return false;
}

export function dashboardRevenueAdPlanBadgeForKey(
  badges: Record<string, DashboardEntitlementBadgePayload>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const t = k.trim();
    const badge = t ? badges[t] : null;
    if (badge?.revenueAdPlanBadge?.trim()) return badge.revenueAdPlanBadge.trim();
  }
  return null;
}
