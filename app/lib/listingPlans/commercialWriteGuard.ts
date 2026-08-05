/**
 * Package C Build 1 (C2+C3, decision 11) — server-side commercial write guard.
 *
 * Every Autos/Bienes mutation path touched by canonical convergence calls this BEFORE writing.
 * It enforces, server-side and UI-independent:
 *   - locked capacity: Autos 10 base / 20 with boost; Bienes 1 base / 4 with pack;
 *   - grace semantics: existing paid children stay editable and visible during grace, but NO
 *     capacity-increasing operation (new child, restore, republish-that-activates, add-on
 *     activation) is permitted during grace or suspension;
 *   - inline grace-expiry reconciliation, so enforcement never depends on dashboard visits;
 *   - child ownership + correct parent linkage + listing role.
 *
 * C7 later deepens/generalizes the capacity system; this module closes the financial bypasses
 * for the convergence-touched write paths now.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  AUTOS_DEALER_BASE_INCLUDED_VEHICLES,
  AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT,
  BR_BASE_INCLUDED_PROPERTIES,
  BR_TOTAL_ACTIVE_PROPERTY_LIMIT,
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  BR_INVENTORY_PACK_PACKAGE_KEY,
} from "./publishCheckoutCheckpoint";
import { isListingPackageEntitlementRowActive } from "./listingPackageEntitlementPlacement";
import { isGraceExpired, reconcileSubscriptionRow, type SubscriptionRecordRow } from "./subscriptionLifecycle";

export {
  decideCommercialWrite,
  type CommercialWriteDecision,
  type CommercialWriteOperation,
} from "./commercialWriteGuardPolicy";
import { decideCommercialWrite, type CommercialWriteDecision, type CommercialWriteOperation } from "./commercialWriteGuardPolicy";

type GuardCategory = "autos" | "bienes-raices";

async function hasActiveAddonEntitlement(listingId: string, packageKey: string): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("listing_package_entitlements")
    .select("id, status, ends_at")
    .eq("listing_id", listingId)
    .eq("package_key", packageKey)
    .eq("status", "active");
  return (data ?? []).some((row) =>
    isListingPackageEntitlementRowActive({
      status: String(row.status ?? ""),
      ends_at: (row as Record<string, unknown>).ends_at as string | null,
    }),
  );
}

async function loadSubscriptionStatusForParent(
  category: GuardCategory,
  parentListingId: string,
): Promise<"none" | "pending" | "active" | "grace" | "suspended" | "canceled"> {
  const supabase = getAdminSupabase();
  const listingSource = category === "autos" ? "autos_classifieds_listings" : "listings";
  const { data } = await supabase
    .from("leonix_subscription_records")
    .select("id, status, category, listing_id, package_key, suspension_reason, grace_ends_at, listing_prior_status, listing_suspended_status, package_entitlement_id, metadata")
    .eq("listing_id", parentListingId)
    .in("listing_source", [listingSource, category])
    .order("created_at", { ascending: false })
    .limit(1);
  const row = (data ?? [])[0] as SubscriptionRecordRow | undefined;
  if (!row) return "none";
  // Inline grace-expiry reconciliation: a lapsed grace is enforced HERE, at write time,
  // regardless of webhook/dashboard activity.
  if (row.status === "grace" && isGraceExpired(row.grace_ends_at)) {
    await reconcileSubscriptionRow(row);
    return "suspended";
  }
  return (row.status as "pending" | "active" | "grace" | "suspended" | "canceled") ?? "none";
}

async function countActiveAutosDealerInventory(ownerUserId: string, excludeListingId?: string): Promise<number> {
  const supabase = getAdminSupabase();
  let query = supabase
    .from("autos_classifieds_listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", ownerUserId)
    .eq("lane", "negocios")
    .eq("status", "active");
  if (excludeListingId) query = query.neq("id", excludeListingId);
  const { count } = await query;
  return count ?? 0;
}

async function countActiveBrInventory(parentListingId: string, ownerUserId: string): Promise<number> {
  const supabase = getAdminSupabase();
  // Parent counts toward the property limit; children are scoped to the parent.
  const { count: childCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerUserId)
    .eq("br_inventory_parent_listing_id", parentListingId)
    .eq("inventory_role", "inventory_property")
    .eq("status", "active");
  const { data: parent } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", parentListingId)
    .maybeSingle();
  const parentActive = parent && String(parent.status) === "active" ? 1 : 0;
  return (childCount ?? 0) + parentActive;
}

export type CommercialWriteInput = {
  category: GuardCategory;
  parentListingId: string;
  ownerUserId: string;
  operation: CommercialWriteOperation;
  /** How many additional active slots this write consumes (0 for ordinary edits). */
  capacityDelta: number;
  /** For edits scoped to an existing child (excluded from its own count). */
  childListingId?: string | null;
};

/**
 * The guard. Verifies parent existence/ownership/role, resolves entitlement-backed limits,
 * counts active inventory, reconciles grace inline, and applies the pure policy.
 */
export async function assertCommercialCapacityForWrite(
  input: CommercialWriteInput,
): Promise<CommercialWriteDecision> {
  if (!isSupabaseAdminConfigured()) {
    return {
      allowed: false,
      code: "guard_unavailable",
      message: "Commercial verification unavailable. Try again shortly.",
      messageEs: "Verificación comercial no disponible. Intenta de nuevo en unos momentos.",
    };
  }
  const supabase = getAdminSupabase();
  const parentId = String(input.parentListingId ?? "").trim();
  const ownerId = String(input.ownerUserId ?? "").trim();
  const notFound: CommercialWriteDecision = {
    allowed: false,
    code: "parent_not_found",
    message: "Parent listing not found.",
    messageEs: "No se encontró el anuncio principal.",
  };
  if (!parentId || !ownerId) return notFound;

  if (input.category === "autos") {
    const { data: parent } = await supabase
      .from("autos_classifieds_listings")
      .select("id, owner_user_id, lane, inventory_role")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent) return notFound;
    if (String(parent.owner_user_id ?? "") !== ownerId) {
      return { allowed: false, code: "parent_not_owned", message: "You do not own this dealer listing.", messageEs: "No eres el propietario de este anuncio de dealer." };
    }
    const role = String(parent.inventory_role ?? "").trim().toLowerCase();
    if (String(parent.lane ?? "") !== "negocios" || role === "inventory_vehicle") {
      return { allowed: false, code: "parent_wrong_role", message: "Inventory operations require the dealer parent listing.", messageEs: "Las operaciones de inventario requieren el anuncio principal del dealer." };
    }
    const boostActive = await hasActiveAddonEntitlement(parentId, AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY);
    const limit = boostActive ? AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT : AUTOS_DEALER_BASE_INCLUDED_VEHICLES;
    const activeCount = await countActiveAutosDealerInventory(ownerId, input.childListingId ?? undefined);
    const subscriptionStatus = await loadSubscriptionStatusForParent("autos", parentId);
    return decideCommercialWrite({ operation: input.operation, capacityDelta: input.capacityDelta, activeCount, limit, subscriptionStatus });
  }

  // bienes-raices
  const { data: parent } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, inventory_role")
    .eq("id", parentId)
    .maybeSingle();
  if (!parent) return notFound;
  if (String(parent.owner_id ?? "") !== ownerId) {
    return { allowed: false, code: "parent_not_owned", message: "You do not own this agent listing.", messageEs: "No eres el propietario de este anuncio de agente." };
  }
  const role = String((parent as Record<string, unknown>).inventory_role ?? "").trim().toLowerCase();
  if (String(parent.category ?? "") !== "bienes-raices" || role === "inventory_property") {
    return { allowed: false, code: "parent_wrong_role", message: "Inventory operations require the parent agent listing.", messageEs: "Las operaciones de inventario requieren el anuncio principal del agente." };
  }
  const packActive = await hasActiveAddonEntitlement(parentId, BR_INVENTORY_PACK_PACKAGE_KEY);
  const limit = packActive ? BR_TOTAL_ACTIVE_PROPERTY_LIMIT : BR_BASE_INCLUDED_PROPERTIES;
  const activeCount = await countActiveBrInventory(parentId, ownerId);
  const subscriptionStatus = await loadSubscriptionStatusForParent("bienes-raices", parentId);
  return decideCommercialWrite({ operation: input.operation, capacityDelta: input.capacityDelta, activeCount, limit, subscriptionStatus });
}
