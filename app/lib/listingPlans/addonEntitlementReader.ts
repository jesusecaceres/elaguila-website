/**
 * Gate E.2.1 — reusable, server-only, package-key-scoped `listing_package_entitlements` reader.
 *
 * Deliberately independent from `fetchActiveListingPackageEntitlementsForRows`
 * (listingPackageEntitlementsServer.ts): that reader picks the single strongest *placement tier*
 * across all of a listing's entitlement rows and discards `package_key` entirely — it would
 * silently drop a coupon/offers add-on row whenever a stronger placement-tier entitlement also
 * exists on the same listing. This reader instead filters by an exact `package_key` and never
 * looks at tier at all.
 *
 * Never filters by `listing_source` — Gate E.1 found that column has been written inconsistently
 * across categories (Servicios' dashboard-direct purchase wrote the wrong value for months).
 * `category` + `package_key` + `listing_id` is the durable identity this reader relies on.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  pickPreferredAddonEntitlement,
  type AddonEntitlementSnapshot,
  type AddonLifecycleResult,
} from "./addonLifecycle";

type EntitlementRow = {
  id: string;
  listing_id: string | null;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  revoked_at: string | null;
  listing_source: string | null;
};

/**
 * Fetches the current lifecycle status of one add-on package for a batch of listings.
 *
 * Always returns exactly one result per unique, non-empty requested listing id — a listing with
 * no matching row resolves to `not_purchased`. Fails closed (every requested id resolves to
 * `not_purchased`) on missing Supabase configuration or any query error, rather than throwing —
 * callers must never need their own try/catch to stay safe.
 */
export async function fetchAddonEntitlementsForListings(input: {
  category: string;
  packageKey: string;
  listingIds: readonly (string | null | undefined)[];
  now?: Date;
}): Promise<Map<string, AddonLifecycleResult>> {
  const now = input.now ?? new Date();
  const category = input.category.trim();
  const packageKey = input.packageKey.trim();

  const uniqueIds = [
    ...new Set(
      input.listingIds
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const results = new Map<string, AddonLifecycleResult>();
  for (const id of uniqueIds) {
    results.set(id, { status: "not_purchased", entitlement: null });
  }

  if (uniqueIds.length === 0 || !category || !packageKey) {
    return results;
  }
  if (!isSupabaseAdminConfigured()) {
    return results;
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("listing_package_entitlements")
      .select("id, listing_id, status, starts_at, ends_at, revoked_at, listing_source")
      .eq("category", category)
      .eq("package_key", packageKey)
      .in("listing_id", uniqueIds);

    if (error) {
      console.error("[addonEntitlementReader] query failed", {
        category,
        packageKey,
        message: error.message,
      });
      return results;
    }

    const rowsByListingId = new Map<string, AddonEntitlementSnapshot[]>();
    for (const raw of (data ?? []) as EntitlementRow[]) {
      const listingId = raw.listing_id?.trim();
      if (!listingId || !uniqueIds.includes(listingId)) continue;
      const snapshot: AddonEntitlementSnapshot = {
        id: raw.id,
        status: raw.status ?? "",
        startsAt: raw.starts_at,
        endsAt: raw.ends_at,
        revokedAt: raw.revoked_at,
        listingSource: raw.listing_source ?? "",
      };
      const list = rowsByListingId.get(listingId) ?? [];
      list.push(snapshot);
      rowsByListingId.set(listingId, list);
    }

    for (const id of uniqueIds) {
      results.set(id, pickPreferredAddonEntitlement(rowsByListingId.get(id) ?? [], now));
    }
  } catch (err) {
    console.error("[addonEntitlementReader] unexpected error", {
      category,
      packageKey,
      message: err instanceof Error ? err.message : String(err),
    });
    // Fail closed: every requested id already defaults to not_purchased above.
  }

  return results;
}
