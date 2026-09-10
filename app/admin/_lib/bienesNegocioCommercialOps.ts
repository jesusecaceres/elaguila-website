import "server-only";

/**
 * Gate BIENES-NEGOCIO-2 — READ-ONLY commercial/capacity projection for the Bienes Raíces Negocio
 * Admin ops surface.
 *
 * The Admin OS Book (§10 Direction A, §19, §20) requires Admin to be able to see the operational
 * state of every marketplace lane. Gate Zero found the BR queue showed listings but NO capacity,
 * entitlement or payment truth — on a lane whose entire product IS a capacity contract.
 *
 * This module is a PROJECTION, never a model:
 *  - it creates no second commercial model: every value comes from the SAME canonical readers the
 *    write path uses (`hasActiveAddonEntitlement`, `loadSubscriptionStatusForParent`,
 *    `countActiveBrInventory` — all exported read-only from `commercialWriteGuard.ts`), plus the
 *    category's own pure capacity policy;
 *  - it decides nothing and writes nothing. `br_negocio_activate_listing` remains the atomic
 *    capacity authority and is NOT called here;
 *  - it never infers paid state from listing status, and never infers entitlement from pricing
 *    configuration. Base and boost entitlement are read from `listing_package_entitlements`;
 *    subscription state from `leonix_subscription_records`;
 *  - an unreadable or unavailable source becomes `UNAVAILABLE` / `NEEDS_PROOF`, **never zero**
 *    (Admin OS Book §6: "Never collapse unavailable, unknown, or unreadable data into zero").
 */
import {
  countActiveBrInventory,
  hasActiveAddonEntitlement,
  loadSubscriptionStatusForParent,
} from "@/app/lib/listingPlans/commercialWriteGuard";
import {
  BR_BASE_INCLUDED_PROPERTIES,
  BR_INVENTORY_PACK_MAX_CHILDREN,
  BR_INVENTORY_PACK_PACKAGE_KEY,
  BR_TOTAL_ACTIVE_PROPERTY_LIMIT,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { BIENES_NEGOCIO_BASE_PACKAGE_KEY } from "@/app/lib/listingPlans/revenueBienesNegocioFulfillment";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { adminBienesChildHref as buildAdminBienesChildHref } from "./bienesNegocioAdminHrefs";

/** Admin OS Book §6 truth-state vocabulary. */
export type AdminTruthState = "REAL" | "PARTIAL" | "NEEDS_PROOF" | "BROKEN" | "UNAVAILABLE";

export type AdminBienesEntitlementState = {
  truth: AdminTruthState;
  /** Only meaningful when `truth === "REAL"`. */
  active: boolean | null;
  packageKey: string;
  note: string | null;
};

export type AdminBienesCapacityState = {
  truth: AdminTruthState;
  /** Null when the count could not be read — never 0 as a stand-in. */
  activeCount: number | null;
  includedLimit: number;
  packAddsLimit: number;
  /** Effective limit implied by the entitlement state; null when entitlement is unproven. */
  effectiveLimit: number | null;
  atLimit: boolean | null;
  note: string | null;
};

export type AdminBienesSubscriptionState = {
  truth: AdminTruthState;
  status: "none" | "pending" | "active" | "grace" | "suspended" | "canceled" | null;
  note: string | null;
};

export type AdminBienesChildRow = {
  id: string;
  leonixAdId: string | null;
  title: string | null;
  status: string | null;
  isPublished: boolean | null;
  /** Existing canonical Admin destination — no new route family. */
  adminHref: string;
};

export type AdminBienesNegocioParentOps = {
  parentListingId: string;
  leonixAdId: string | null;
  ownerId: string | null;
  inventoryRole: string | null;
  inventoryGroupId: string | null;
  parentStatus: string | null;
  parentIsPublished: boolean | null;
  baseEntitlement: AdminBienesEntitlementState;
  boostEntitlement: AdminBienesEntitlementState;
  capacity: AdminBienesCapacityState;
  subscription: AdminBienesSubscriptionState;
  children: AdminBienesChildRow[];
  childCountTruth: AdminTruthState;
  /**
   * The atomic capacity authority's own availability. Because the RPC migration is authored but
   * NOT applied, this is expected to be UNAVAILABLE in every current environment — surfaced so
   * Admin never implies the lane is healthy while the authority cannot execute.
   */
  capacityAuthority: { truth: AdminTruthState; note: string };
};

/** Re-exported from the pure href module so callers keep one import surface. */
export { adminBienesChildHref } from "./bienesNegocioAdminHrefs";

type ParentRowLike = {
  id?: unknown;
  owner_id?: unknown;
  leonix_ad_id?: unknown;
  status?: unknown;
  is_published?: unknown;
  inventory_role?: unknown;
  br_inventory_group_id?: unknown;
};

function str(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

async function readEntitlement(
  listingId: string,
  packageKey: string,
): Promise<AdminBienesEntitlementState> {
  if (!isSupabaseAdminConfigured()) {
    return {
      truth: "UNAVAILABLE",
      active: null,
      packageKey,
      note: "Supabase admin is not configured in this environment.",
    };
  }
  try {
    const active = await hasActiveAddonEntitlement(listingId, packageKey);
    return { truth: "REAL", active, packageKey, note: null };
  } catch (e) {
    return {
      truth: "BROKEN",
      active: null,
      packageKey,
      note: `Entitlement read failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

/**
 * Probes whether `br_negocio_activate_listing` exists WITHOUT activating anything: it is called
 * with an all-zero UUID that can never match a row, so the only two outcomes are "the function
 * does not exist" (transport error) or "the function ran and found nothing". No listing is read,
 * locked, or written, and the authority is never bypassed.
 */
async function probeCapacityAuthority(): Promise<{ truth: AdminTruthState; note: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { truth: "UNAVAILABLE", note: "Supabase admin is not configured in this environment." };
  }
  const NIL_UUID = "00000000-0000-0000-0000-000000000000";
  try {
    const { error } = await getAdminSupabase().rpc("br_negocio_activate_listing", {
      p_listing_id: NIL_UUID,
      p_owner_id: NIL_UUID,
      p_from_status: "__admin_probe__",
    });
    if (!error) {
      return {
        truth: "REAL",
        note: "Atomic capacity authority is reachable. Activations are enforced transactionally.",
      };
    }
    return {
      truth: "UNAVAILABLE",
      note:
        "The atomic capacity authority (br_negocio_activate_listing) is not available in this database. " +
        "Its migration (20260810120000) has not been applied. Until it is, paid activation, owner " +
        "resume/reactivate and Admin republish for this lane all refuse and fail closed — no listing " +
        "activates, no capacity is bypassed, and no customer is charged for an activation that did " +
        "not happen.",
    };
  } catch (e) {
    return {
      truth: "BROKEN",
      note: `Could not probe the capacity authority: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

/**
 * Builds the ops projection for one Bienes Negocio parent. Every field degrades to an explicit
 * truth state rather than a fabricated value.
 */
export async function loadBienesNegocioParentOps(
  parent: ParentRowLike,
  capacityAuthority: { truth: AdminTruthState; note: string },
): Promise<AdminBienesNegocioParentOps> {
  const parentListingId = str(parent.id) ?? "";
  const ownerId = str(parent.owner_id);

  const base: AdminBienesNegocioParentOps = {
    parentListingId,
    leonixAdId: str(parent.leonix_ad_id),
    ownerId,
    inventoryRole: str(parent.inventory_role),
    inventoryGroupId: str(parent.br_inventory_group_id),
    parentStatus: str(parent.status),
    parentIsPublished: typeof parent.is_published === "boolean" ? parent.is_published : null,
    baseEntitlement: { truth: "NEEDS_PROOF", active: null, packageKey: BIENES_NEGOCIO_BASE_PACKAGE_KEY, note: null },
    boostEntitlement: { truth: "NEEDS_PROOF", active: null, packageKey: BR_INVENTORY_PACK_PACKAGE_KEY, note: null },
    capacity: {
      truth: "NEEDS_PROOF",
      activeCount: null,
      includedLimit: BR_BASE_INCLUDED_PROPERTIES,
      packAddsLimit: BR_INVENTORY_PACK_MAX_CHILDREN,
      effectiveLimit: null,
      atLimit: null,
      note: null,
    },
    subscription: { truth: "NEEDS_PROOF", status: null, note: null },
    children: [],
    childCountTruth: "NEEDS_PROOF",
    capacityAuthority,
  };

  if (!parentListingId) {
    base.capacity.note = "Parent row has no canonical id.";
    return base;
  }
  if (!isSupabaseAdminConfigured()) {
    const note = "Supabase admin is not configured in this environment.";
    base.baseEntitlement = { truth: "UNAVAILABLE", active: null, packageKey: BIENES_NEGOCIO_BASE_PACKAGE_KEY, note };
    base.boostEntitlement = { truth: "UNAVAILABLE", active: null, packageKey: BR_INVENTORY_PACK_PACKAGE_KEY, note };
    base.capacity = { ...base.capacity, truth: "UNAVAILABLE", note };
    base.subscription = { truth: "UNAVAILABLE", status: null, note };
    base.childCountTruth = "UNAVAILABLE";
    return base;
  }

  base.baseEntitlement = await readEntitlement(parentListingId, BIENES_NEGOCIO_BASE_PACKAGE_KEY);
  base.boostEntitlement = await readEntitlement(parentListingId, BR_INVENTORY_PACK_PACKAGE_KEY);

  // Subscription state — canonical record, never inferred from listing status.
  try {
    const status = await loadSubscriptionStatusForParent("bienes-raices", parentListingId);
    base.subscription =
      status === "none"
        ? {
            truth: "PARTIAL",
            status: "none",
            note: "No subscription record is linked to this parent listing. Payment state cannot be proven from the listing alone.",
          }
        : { truth: "REAL", status, note: null };
  } catch (e) {
    base.subscription = {
      truth: "BROKEN",
      status: null,
      note: `Subscription read failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  // Active capacity count — the same counter the write guard uses (parent counts toward the limit).
  if (!ownerId) {
    base.capacity = {
      ...base.capacity,
      truth: "PARTIAL",
      note: "Parent has no owner_id, so its inventory group cannot be counted.",
    };
  } else {
    try {
      const activeCount = await countActiveBrInventory(parentListingId, ownerId);
      const boostActive = base.boostEntitlement.truth === "REAL" ? base.boostEntitlement.active === true : null;
      const effectiveLimit =
        boostActive === null
          ? null
          : boostActive
            ? BR_TOTAL_ACTIVE_PROPERTY_LIMIT
            : BR_BASE_INCLUDED_PROPERTIES;
      base.capacity = {
        truth: effectiveLimit == null ? "PARTIAL" : "REAL",
        activeCount,
        includedLimit: BR_BASE_INCLUDED_PROPERTIES,
        packAddsLimit: BR_INVENTORY_PACK_MAX_CHILDREN,
        effectiveLimit,
        atLimit: effectiveLimit == null ? null : activeCount >= effectiveLimit,
        note:
          effectiveLimit == null
            ? "Active count is real, but the effective limit cannot be stated because boost entitlement is unproven."
            : null,
      };
    } catch (e) {
      base.capacity = {
        ...base.capacity,
        truth: "BROKEN",
        note: `Capacity count failed: ${e instanceof Error ? e.message : "unknown"}`,
      };
    }
  }

  // Children — canonical rows only, each linking to the EXISTING Admin listing destination.
  try {
    const { data, error } = await getAdminSupabase()
      .from("listings")
      .select("id, leonix_ad_id, title, status, is_published")
      .eq("category", "bienes-raices")
      .eq("br_inventory_parent_listing_id", parentListingId)
      .eq("inventory_role", "inventory_property")
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) throw new Error(error.message);
    base.children = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((c) => ({
      id: String(c.id ?? ""),
      leonixAdId: str(c.leonix_ad_id),
      title: str(c.title),
      status: str(c.status),
      isPublished: typeof c.is_published === "boolean" ? c.is_published : null,
      adminHref: buildAdminBienesChildHref(String(c.id ?? "")),
    }));
    base.childCountTruth = "REAL";
  } catch {
    base.childCountTruth = "BROKEN";
    base.children = [];
  }

  return base;
}

/** One probe per page render, shared by every parent on it. */
export async function loadBienesCapacityAuthorityState(): Promise<{ truth: AdminTruthState; note: string }> {
  return probeCapacityAuthority();
}
