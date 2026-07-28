/**
 * BR-FINAL-PUBLISH-STRIPE-ROTATION-05 — server-side listing payment activation on `public.listings`.
 */

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { mainListingInventoryPatchAfterInsert } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  BR_BASE_INCLUDED_PROPERTIES,
  BR_INVENTORY_PACK_MAX_CHILDREN,
  BR_INVENTORY_PACK_PACKAGE_KEY,
  BR_TOTAL_ACTIVE_PROPERTY_LIMIT,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { fetchAddonEntitlementsForListings } from "@/app/lib/listingPlans/addonEntitlementReader";

export type BrListingRowForPayment = {
  id: string;
  owner_id?: string | null;
  category?: string | null;
  seller_type?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  inventory_role?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  published_at?: string | null;
};

export async function getBrListingById(listingId: string): Promise<BrListingRowForPayment | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, owner_id, category, seller_type, status, is_published, inventory_role, br_inventory_group_id, br_inventory_parent_listing_id, published_at",
    )
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return null;
  return data as BrListingRowForPayment;
}

/**
 * Gate F.2.4.4 — server-side active-property capacity gate for Bienes Raíces inventory children.
 * Canonical parent identity is always `br_inventory_parent_listing_id` (never group id, slug, or
 * owner id alone). Entitlement truth comes from the shared lifecycle-backed reader
 * (`addonEntitlementReader.ts`), scoped to `category=bienes-raices` + the inventory pack package
 * key + the canonical parent's own listing id — a child row can never grant itself capacity.
 */
export const BR_ACTIVE_PROPERTY_LIMIT_ERROR = "br_active_property_limit_reached" as const;
/** Distinct from the capacity error: the child's parent reference does not resolve to a valid main parent. */
export const BR_INVENTORY_PARENT_INVALID_ERROR = "br_inventory_parent_invalid" as const;

function isActiveBrRow(row: { status?: string | null; is_published?: boolean | null }): boolean {
  return row.status === "active" && row.is_published !== false;
}

async function resolveBrInventoryEntitlementActive(parentListingId: string): Promise<boolean> {
  const results = await fetchAddonEntitlementsForListings({
    category: "bienes-raices",
    packageKey: BR_INVENTORY_PACK_PACKAGE_KEY,
    listingIds: [parentListingId],
  });
  return results.get(parentListingId)?.status === "active";
}

/**
 * Counts active properties scoped to exactly one canonical main parent: the parent row itself
 * (the one included base property, per existing `leonixBrPropertyInventoryPolicy` product truth)
 * plus its `inventory_property` children referencing it via `br_inventory_parent_listing_id`.
 * Active means status="active" and is_published !== false (mirrors `isActiveBrNegocioInventoryRow`).
 * Never owner-wide; never crosses into another parent's children.
 */
async function countActiveBrPropertiesForParent(
  parent: BrListingRowForPayment,
  parentListingId: string,
  excludeListingId?: string | null,
): Promise<number> {
  let count = 0;
  if (parent.id !== excludeListingId && isActiveBrRow(parent)) {
    count += 1;
  }
  if (!isSupabaseAdminConfigured()) return count;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select("id, status, is_published")
    .eq("category", "bienes-raices")
    .eq("inventory_role", "inventory_property")
    .eq("br_inventory_parent_listing_id", parentListingId);
  if (error || !data) return count;
  for (const row of data as Array<{ id?: string | null; status?: string | null; is_published?: boolean | null }>) {
    const rowId = String(row.id ?? "").trim();
    if (!rowId || rowId === excludeListingId) continue;
    if (isActiveBrRow(row)) count += 1;
  }
  return count;
}

export type BrChildActivationCapacityResult =
  | { ok: true }
  | { ok: false; error: typeof BR_ACTIVE_PROPERTY_LIMIT_ERROR | typeof BR_INVENTORY_PARENT_INVALID_ERROR };

/**
 * Resolves the canonical main parent, its entitlement-derived effective limit, and current
 * active-property count, then decides whether one more active child is allowed. Fails closed
 * (rejects) on a missing/invalid parent — never silently grants base capacity.
 *
 * Exported as of Gate G.2.3.1 for reuse by `brListingLifecycleService.ts`'s Resume mutation —
 * behavior unchanged, this is purely a visibility change (`function` -> `export function`).
 */
export async function checkBrChildActivationCapacity(
  child: BrListingRowForPayment,
  childListingId: string,
): Promise<BrChildActivationCapacityResult> {
  const parentListingId = String(child.br_inventory_parent_listing_id ?? "").trim();
  if (!parentListingId) {
    return { ok: false, error: BR_INVENTORY_PARENT_INVALID_ERROR };
  }

  const parent = await getBrListingById(parentListingId);
  const childOwnerId = String(child.owner_id ?? "").trim();
  const parentOwnerId = String(parent?.owner_id ?? "").trim();
  if (
    !parent ||
    parent.category !== "bienes-raices" ||
    parent.seller_type !== "business" ||
    parent.inventory_role !== "main" ||
    !childOwnerId ||
    parentOwnerId !== childOwnerId
  ) {
    return { ok: false, error: BR_INVENTORY_PARENT_INVALID_ERROR };
  }

  const entitlementActive = await resolveBrInventoryEntitlementActive(parentListingId);
  const effectiveLimit = entitlementActive ? BR_TOTAL_ACTIVE_PROPERTY_LIMIT : BR_BASE_INCLUDED_PROPERTIES;
  const activeCount = await countActiveBrPropertiesForParent(parent, parentListingId, childListingId);

  if (activeCount >= effectiveLimit) {
    return { ok: false, error: BR_ACTIVE_PROPERTY_LIMIT_ERROR };
  }
  return { ok: true };
}

export async function setBrListingPendingPayment(
  listingId: string,
  stripeCheckoutSessionId: string,
  lane: "negocio" | "privado" = "negocio",
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const row = await getBrListingById(listingId);
  if (!row) return false;
  void stripeCheckoutSessionId;
  void lane;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("listings")
    .update({
      status: "pending",
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .in("status", ["pending", "active"]);
  return !error;
}

export type TryActivateBrResult = {
  ok: boolean;
  transitioned: boolean;
  error?: typeof BR_ACTIVE_PROPERTY_LIMIT_ERROR | typeof BR_INVENTORY_PARENT_INVALID_ERROR;
};

/**
 * Idempotent activation after Stripe paid. Only transitions rows with status=pending and unpublished.
 * When a Bienes inventory listing activates, pending siblings in the same group also activate (bundle checkout).
 */
export async function tryActivateBrListingAfterPayment(
  listingId: string,
  opts?: { stripePaymentIntentId?: string | null; activateInventorySiblings?: boolean },
): Promise<TryActivateBrResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, transitioned: false };
  const existing = await getBrListingById(listingId);
  if (!existing) return { ok: false, transitioned: false };
  if (existing.status === "active" && existing.is_published === true) {
    return { ok: true, transitioned: false };
  }
  if (existing.status !== "pending" || existing.is_published !== false) {
    return { ok: false, transitioned: false };
  }

  // Gate F.2.4.4 — only inventory_property children are capacity-gated; main parent activation
  // (and reactivation of the main row) always follows its existing payment/publication rules.
  if (existing.category === "bienes-raices" && existing.inventory_role === "inventory_property") {
    const capacity = await checkBrChildActivationCapacity(existing, listingId);
    if (!capacity.ok) {
      return { ok: false, transitioned: false, error: capacity.error };
    }
  }

  const now = new Date().toISOString();

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("listings")
    .update({
      status: "active",
      is_published: true,
      published_at: existing.published_at ?? now,
      updated_at: now,
    })
    .eq("id", listingId)
    .eq("status", "pending")
    .eq("is_published", false)
    .select("id, inventory_role, br_inventory_group_id")
    .maybeSingle();

  if (error) {
    console.error("tryActivateBrListingAfterPayment", error);
    return { ok: false, transitioned: false };
  }
  if (data) {
    if (existing.category === "bienes-raices" && data.inventory_role === "main") {
      const patch = mainListingInventoryPatchAfterInsert(listingId);
      await supabase.from("listings").update({ ...patch, updated_at: now }).eq("id", listingId);
    }
    const fanOut = opts?.activateInventorySiblings !== false;
    if (fanOut && existing.category === "bienes-raices") {
      const groupId =
        String(data.br_inventory_group_id ?? "").trim() ||
        (data.inventory_role === "main" ? listingId : "");
      if (groupId) {
        const { data: siblings } = await supabase
          .from("listings")
          .select("id, created_at")
          .eq("category", "bienes-raices")
          .eq("br_inventory_group_id", groupId)
          .eq("inventory_role", "inventory_property")
          .eq("status", "pending")
          .eq("is_published", false)
          .neq("id", listingId)
          .order("created_at", { ascending: true })
          .limit(BR_INVENTORY_PACK_MAX_CHILDREN);
        for (const sib of siblings ?? []) {
          const sibId = String((sib as { id?: string }).id ?? "").trim();
          if (!sibId) continue;
          await tryActivateBrListingAfterPayment(sibId, {
            stripePaymentIntentId: opts?.stripePaymentIntentId,
            activateInventorySiblings: false,
          });
        }
      }
    }
    return { ok: true, transitioned: true };
  }
  const again = await getBrListingById(listingId);
  if (again?.status === "active" && again.is_published === true) {
    return { ok: true, transitioned: false };
  }
  return { ok: false, transitioned: false };
}

export async function assertBrListingOwner(
  listingId: string,
  ownerUserId: string,
): Promise<BrListingRowForPayment | null> {
  const row = await getBrListingById(listingId);
  if (!row || String(row.owner_id ?? "") !== ownerUserId) return null;
  return row;
}

export function brListingAwaitingPayment(row: BrListingRowForPayment): boolean {
  if (row.status !== "pending" || row.is_published !== false) return false;
  return true;
}
