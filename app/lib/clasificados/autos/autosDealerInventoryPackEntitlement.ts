import { AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { isListingPackageEntitlementRowActive } from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** Paid inventory pack entitlement on a specific listing (draft or active). */
export async function listingHasActiveDealerInventoryPack(listingId: string): Promise<boolean> {
  const id = listingId.trim();
  if (!id || !isSupabaseAdminConfigured()) return false;

  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("listing_package_entitlements")
    .select("id, listing_id, package_key, status, ends_at")
    .eq("listing_id", id)
    .eq("package_key", AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY);

  return (data ?? []).some((row) => {
    const status = String(row.status ?? "").trim().toLowerCase();
    if (status !== "active") return false;
    return isListingPackageEntitlementRowActive({
      status: row.status as string,
      ends_at: row.ends_at as string | null,
    });
  });
}
