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
import { resolveDealerInventoryGroupingKey } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";

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

/**
 * Package C Build 4 (C7, Gate 2) — group-scoped, not owner-wide. An owner with two distinct
 * dealer groups/parents must never have one group's active count pool with another's. Fetches
 * the owner's active negocios rows and filters to the exact group the VERIFIED parent belongs to
 * (reusing the same pure `resolveDealerInventoryGroupingKey` grouping logic already proven in
 * `autosDealerInventoryPolicy.ts`), rather than trusting a caller-supplied group id. Preflight/UX
 * only — the atomic RPC (Gate 3) re-derives this independently and is the real financial authority.
 */
async function countActiveAutosDealerGroupInventory(
  ownerUserId: string,
  parent: { lane: "negocios" | "privado"; dealer_inventory_group_id?: string | null; owner_user_id: string },
  excludeListingId?: string,
): Promise<number> {
  const supabase = getAdminSupabase();
  const groupKey = resolveDealerInventoryGroupingKey(parent);
  const { data } = await supabase
    .from("autos_classifieds_listings")
    .select("id, lane, status, dealer_inventory_group_id, owner_user_id")
    .eq("owner_user_id", ownerUserId)
    .eq("lane", "negocios")
    .eq("status", "active");
  return (data ?? []).filter((row) => {
    if (excludeListingId && row.id === excludeListingId) return false;
    return resolveDealerInventoryGroupingKey(row) === groupKey;
  }).length;
}

type AutosChildLookupRow = {
  id: string;
  owner_user_id: string | null;
  lane: string | null;
  inventory_role: string | null;
  dealer_inventory_parent_listing_id: string | null;
};

/**
 * Package C Build 4 (C7, Gate 2) — server-verified child linkage. Previously `childListingId` was
 * accepted and used ONLY as a count-exclusion filter, with no DB lookup at all — a caller could
 * exclude a foreign/sibling id to undercount, or supply a child from a different dealer entirely.
 * Verifies from a fresh DB row: same owner, `inventory_role='inventory_vehicle'`, and its own
 * `dealer_inventory_parent_listing_id` equals the claimed parent — never trusts the caller's claim.
 */
async function verifyAutosChildBelongsToParent(input: {
  childListingId: string;
  ownerUserId: string;
  parentListingId: string;
}): Promise<{ ok: boolean; code?: "child_not_found" | "child_not_owned" | "child_wrong_parent" }> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("autos_classifieds_listings")
    .select("id, owner_user_id, lane, inventory_role, dealer_inventory_parent_listing_id")
    .eq("id", input.childListingId)
    .maybeSingle();
  const child = data as AutosChildLookupRow | null;
  if (!child) return { ok: false, code: "child_not_found" };
  if (String(child.owner_user_id ?? "") !== input.ownerUserId) return { ok: false, code: "child_not_owned" };
  if (
    child.inventory_role !== "inventory_vehicle" ||
    String(child.dealer_inventory_parent_listing_id ?? "") !== input.parentListingId
  ) {
    return { ok: false, code: "child_wrong_parent" };
  }
  return { ok: true };
}

type BrChildLookupRow = {
  id: string;
  owner_id: string | null;
  category: string | null;
  inventory_role: string | null;
  br_inventory_parent_listing_id: string | null;
};

/** Bienes equivalent of `verifyAutosChildBelongsToParent` — same zero-trust shape. */
async function verifyBrChildBelongsToParent(input: {
  childListingId: string;
  ownerUserId: string;
  parentListingId: string;
}): Promise<{ ok: boolean; code?: "child_not_found" | "child_not_owned" | "child_wrong_parent" }> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("listings")
    .select("id, owner_id, category, inventory_role, br_inventory_parent_listing_id")
    .eq("id", input.childListingId)
    .maybeSingle();
  const child = data as BrChildLookupRow | null;
  if (!child) return { ok: false, code: "child_not_found" };
  if (String(child.owner_id ?? "") !== input.ownerUserId) return { ok: false, code: "child_not_owned" };
  if (
    child.category !== "bienes-raices" ||
    child.inventory_role !== "inventory_property" ||
    String(child.br_inventory_parent_listing_id ?? "") !== input.parentListingId
  ) {
    return { ok: false, code: "child_wrong_parent" };
  }
  return { ok: true };
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
      .select("id, owner_user_id, lane, inventory_role, dealer_inventory_group_id")
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
    // Package C Build 4 (C7, Gate 2) — never trust a caller-supplied childListingId as a bare
    // count-exclusion filter; verify it against a fresh DB row first. `childListingId === parentId`
    // is the legitimate self-reference case (restoring the main dealer listing itself, which has
    // no separate child) — already verified above as the parent row, so it's skipped here rather
    // than re-checked against the "must be inventory_vehicle" rule that would wrongly reject it.
    const childListingId = input.childListingId?.trim() || null;
    if (childListingId && childListingId !== parentId) {
      const childCheck = await verifyAutosChildBelongsToParent({ childListingId, ownerUserId: ownerId, parentListingId: parentId });
      if (!childCheck.ok) {
        return {
          allowed: false,
          code: childCheck.code ?? "child_wrong_parent",
          message: "The referenced vehicle does not belong to this dealer.",
          messageEs: "El vehículo referenciado no pertenece a este dealer.",
        };
      }
    }
    const boostActive = await hasActiveAddonEntitlement(parentId, AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY);
    const limit = boostActive ? AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT : AUTOS_DEALER_BASE_INCLUDED_VEHICLES;
    const activeCount = await countActiveAutosDealerGroupInventory(ownerId, parent, childListingId ?? undefined);
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
  const brChildListingId = input.childListingId?.trim() || null;
  if (brChildListingId && brChildListingId !== parentId) {
    const childCheck = await verifyBrChildBelongsToParent({ childListingId: brChildListingId, ownerUserId: ownerId, parentListingId: parentId });
    if (!childCheck.ok) {
      return {
        allowed: false,
        code: childCheck.code ?? "child_wrong_parent",
        message: "The referenced property does not belong to this agent.",
        messageEs: "La propiedad referenciada no pertenece a este agente.",
      };
    }
  }
  const packActive = await hasActiveAddonEntitlement(parentId, BR_INVENTORY_PACK_PACKAGE_KEY);
  const limit = packActive ? BR_TOTAL_ACTIVE_PROPERTY_LIMIT : BR_BASE_INCLUDED_PROPERTIES;
  const activeCount = await countActiveBrInventory(parentId, ownerId);
  const subscriptionStatus = await loadSubscriptionStatusForParent("bienes-raices", parentId);
  return decideCommercialWrite({ operation: input.operation, capacityDelta: input.capacityDelta, activeCount, limit, subscriptionStatus });
}
