import "server-only";

/**
 * Thin server wrapper for `restauranteLinkedOffersVisible` (see that module for the rule).
 *
 * Reads the listing's non-revoked entitlement rows from `listing_package_entitlements` (the same
 * table and `category + listing_id` identity the canonical resolver uses — `listing_source` is
 * deliberately not filtered, per Gate RESTAURANTES-1). Any failure — unconfigured admin client,
 * PostgREST error, thrown exception, blank id — reports `entitlementLookup: "error"`, which the
 * pure rule treats as NOT proven Quick, so existing valid Full content is never hidden by a
 * transient failure. Writes nothing.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  restauranteLinkedOffersVisible,
  type RestauranteLinkedOffersEntitlementRow,
} from "./restauranteLinkedOffersVisibility";

export async function restauranteLinkedOffersVisibleForListing(
  listingId: string | null | undefined,
): Promise<boolean> {
  const id = String(listingId ?? "").trim();
  if (!id || !isSupabaseAdminConfigured()) {
    return restauranteLinkedOffersVisible({ entitlementLookup: "error", rows: [] });
  }
  try {
    const { data, error } = await getAdminSupabase()
      .from("listing_package_entitlements")
      .select("package_key, package_tier, status, ends_at")
      .eq("category", "restaurantes")
      .eq("listing_id", id)
      .in("status", ["active", "scheduled"])
      .is("revoked_at", null)
      .limit(50);
    if (error || !data) return restauranteLinkedOffersVisible({ entitlementLookup: "error", rows: [] });
    const rows: RestauranteLinkedOffersEntitlementRow[] = (data as Record<string, unknown>[]).map((r) => ({
      packageKey: r.package_key == null ? null : String(r.package_key),
      packageTier: r.package_tier == null ? null : String(r.package_tier),
      status: String(r.status ?? ""),
      endsAt: r.ends_at == null ? null : String(r.ends_at),
    }));
    return restauranteLinkedOffersVisible({ entitlementLookup: "ok", rows });
  } catch {
    return restauranteLinkedOffersVisible({ entitlementLookup: "error", rows: [] });
  }
}
