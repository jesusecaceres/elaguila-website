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
};

export type DashboardEntitlementLookupItem = {
  key: string;
  category: string;
  listingSource: string;
  listingId?: string | null;
  slug?: string | null;
  leonixAdId?: string | null;
};

export async function fetchDashboardListingPackageEntitlementBadges(
  items: DashboardEntitlementLookupItem[],
  accessToken: string | null | undefined,
): Promise<Record<string, DashboardEntitlementBadgePayload>> {
  if (items.length === 0 || !accessToken?.trim()) return {};
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
      })),
    }),
  });
  if (!res.ok) return {};
  const json = (await res.json()) as { badges?: Record<string, DashboardEntitlementBadgePayload> };
  return json.badges ?? {};
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
