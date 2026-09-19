/**
 * Work Package I.9B — one small, shared Admin target-row validator closing the confirmed I.9A
 * gap: Admin's Auto Dealer and Bienes Raíces Negocio write routes acted directly on whatever
 * UUID was supplied, with no server-side check that a parent-only action wasn't being applied to
 * an inventory child (or vice versa). This module answers exactly one question per row — "is
 * this action allowed for this row's real, server-resolved inventory role" — and nothing else.
 * It never trusts a client-supplied role/category/parent id; every input here must already be a
 * freshly-fetched row from the database.
 *
 * Reuses the existing, canonical role predicates rather than re-deriving them:
 *   - Autos: `isDealerInventoryMainListing`/`isDealerInventoryVehicle`
 *     (app/lib/clasificados/autos/autosDealerInventoryPolicy.ts)
 *   - Bienes Raíces: `isBrNegocioListing`/`isBrInventoryMainListing`/`isBrInventoryProperty`
 *     (app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts)
 *
 * Deliberately asymmetric between the two pipelines, per real, confirmed evidence of how each
 * one's data is actually populated (not a stylistic choice):
 *   - A standalone Autos Negocios dealer listing (never grouped with a second vehicle) is
 *     confirmed to keep `inventory_role = null` until `promoteNegociosMainInventoryListing()` is
 *     called lazily, only once a second vehicle is added
 *     (autosClassifiedsListingService.ts:448-465). Treating every un-tagged standalone listing
 *     as "ambiguous" would fail-close the common single-vehicle-dealer case, a real regression.
 *     So Autos additionally treats "no parent id at all" as parent — the same, already-proven
 *     convention the owner dashboard uses (`dashboardInventory.ts`'s `isDealerMain`).
 *   - A Bienes Raíces Negocio listing is confirmed to receive `inventory_role: "main"`
 *     proactively at publish time for the default (non-multi-property) case
 *     (`leonixPublishRealEstateListingCore.ts:592-604`, `mainListingInventoryPatchAfterInsert`).
 *     Strict matching (`isBrInventoryMainListing`) is therefore safe here and is used as-is,
 *     matching Objective B's "do not infer parent role merely from missing parent ID."
 */
import {
  getDealerInventoryGroupId,
  getDealerInventoryParentListingId,
  isDealerInventoryMainListing,
  isDealerInventoryVehicle,
} from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  getBrInventoryGroupId,
  getBrInventoryParentListingId,
  isBrInventoryMainListing,
  isBrInventoryProperty,
  isBrNegocioListing,
  type BrPropertyInventoryRowLike,
} from "@/app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy";

export type AdminInventoryRole = "parent" | "child" | "not_applicable" | "ambiguous";

export type AdminInventoryGuardResult =
  | { ok: true; role: AdminInventoryRole }
  | { ok: false; code: "forbidden_role_for_action" | "ambiguous_or_unknown_role" };

/** Deterministic, sanitized error message — never a raw DB error, never role-specific detail
 * that would help probe the system, matching the "fails closed with a deterministic sanitized
 * error" contract already established for owner-facing identity failures (I.6C). */
export const ADMIN_INVENTORY_ACTION_FORBIDDEN_CODE = "admin_inventory_action_forbidden";

export function adminInventoryActionForbiddenMessage(): string {
  return "This action is not available for this listing's current inventory role.";
}

/** Actions that structurally end or restore a listing's public life — reserved for the parent/
 * anchor row of an inventory group. Every other real action (suspend/unsuspend/promote/verify/
 * republish) remains a per-row, reversible flag with no cross-row effect and no evidence
 * restricting it — those stay allowed for both roles, unchanged from current behavior. */
const AUTOS_PARENT_ONLY_ACTIONS = new Set(["archive", "remove_public", "restore_active"]);
const BR_PARENT_ONLY_ACTIONS = new Set(["archive"]);

function resolveAutosDealerRole(row: Pick<AutosClassifiedsListingRow, "lane" | "inventory_role" | "dealer_inventory_parent_listing_id">): AdminInventoryRole {
  if (row.lane !== "negocios") return "not_applicable";
  if (isDealerInventoryVehicle(row)) return "child";
  if (isDealerInventoryMainListing(row)) return "parent";
  // Standalone, never-grouped listing: no parent id at all and not tagged a vehicle — this is
  // the confirmed, proven convention (see file header) for a dealer that hasn't added a second
  // vehicle yet. Anything else (a parent id present but role isn't "inventory_vehicle") is a
  // genuine data inconsistency and must fail closed.
  if (!getDealerInventoryParentListingId(row)) return "parent";
  return "ambiguous";
}

function resolveBrNegocioRole(row: BrPropertyInventoryRowLike): AdminInventoryRole {
  if (!isBrNegocioListing(row)) return "not_applicable";
  if (isBrInventoryProperty(row)) return "child";
  if (isBrInventoryMainListing(row)) return "parent";
  return "ambiguous";
}

/**
 * Autos Negocios guard. `row` must be a freshly server-fetched row (never client-supplied).
 * Privado-lane rows and any action not in the parent-only set are always allowed — this only
 * restricts the specific parent-only actions on a confirmed-or-unresolved child/ambiguous row.
 */
export function assertAutosDealerActionAllowed(
  row: Pick<AutosClassifiedsListingRow, "lane" | "inventory_role" | "dealer_inventory_parent_listing_id">,
  action: string,
): AdminInventoryGuardResult {
  const role = resolveAutosDealerRole(row);
  // Privado-lane rows have no dealer-inventory concept at all — this table genuinely mixes both
  // lanes, unlike the Bienes guard below (which is only ever invoked already-scoped to
  // `category === "bienes-raices"`), so "not_applicable" here must bypass restriction entirely
  // rather than be treated as an unresolved role.
  if (role === "not_applicable") {
    return { ok: true, role };
  }
  if (!AUTOS_PARENT_ONLY_ACTIONS.has(action)) {
    return { ok: true, role };
  }
  if (role === "parent") return { ok: true, role };
  if (role === "child") return { ok: false, code: "forbidden_role_for_action" };
  return { ok: false, code: "ambiguous_or_unknown_role" };
}

/**
 * Bienes Raíces Negocio guard. `row` must be a freshly server-fetched row. Privado rows (or any
 * row `isBrNegocioListing` doesn't confirm as a real negocio row) fail closed for the parent-only
 * action set — a private/personal-seller row can never be treated as a valid inventory parent,
 * regardless of what any other column happens to contain. Every non-parent-only action remains
 * unaffected for every Bienes row (negocio or privado), preserving current behavior exactly.
 */
export function assertBrNegocioActionAllowed(row: BrPropertyInventoryRowLike, action: string): AdminInventoryGuardResult {
  const role = resolveBrNegocioRole(row);
  if (!BR_PARENT_ONLY_ACTIONS.has(action)) {
    return { ok: true, role };
  }
  if (role === "parent") return { ok: true, role };
  if (role === "child") return { ok: false, code: "forbidden_role_for_action" };
  return { ok: false, code: "ambiguous_or_unknown_role" };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Closeout 2 — Admin soft / permanent DELETE safety.
//
// `deleteListingAction` (soft) and `permanentlyDeleteListingsAction` (hard) previously acted on any
// UUID with no inventory-role, parent/child or payment check. Deleting a Bienes Raices Negocio PARENT
// while its child properties were still public orphaned them; hard-deleting a paid / subscribed /
// public-live row destroyed commercial state. These pure predicates answer only "may this row be
// deleted right now" from server-fetched rows — the caller supplies the linked rows / payment evidence.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export type AdminDeleteMode = "soft" | "permanent";

export type AdminDeleteRowLike = BrPropertyInventoryRowLike;

export type AdminDeleteLinkedRow = {
  id: string;
  status?: string | null;
  is_published?: boolean | null;
  inventory_role?: string | null;
};

/** Server-resolved commercial state of the row (never client supplied). */
export type AdminDeletePaymentEvidence = {
  /** A verified paid one-time payment record exists for this listing. */
  hasPaidRecord?: boolean;
  /** A recurring subscription (Stripe) that has not been canceled is attached to this listing. */
  hasActiveSubscription?: boolean;
  /** An admin/Revenue OS package entitlement that is active or scheduled and not yet expired. */
  hasLiveEntitlement?: boolean;
};

export type AdminDeleteGuardCode =
  | "forbidden_role_for_action"
  | "ambiguous_or_unknown_role"
  | "has_public_children"
  | "has_linked_children"
  | "child_role_unconfirmed"
  | "public_live_requires_removal"
  | "active_subscription"
  | "live_entitlement"
  | "paid_record_requires_removal";

export type AdminDeleteGuardResult = { ok: true } | { ok: false; code: AdminDeleteGuardCode };

function lcTrim(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/** Conservative "publicly visible" read: removed/archived is never live; unknown fails toward live. */
export function adminDeleteRowLooksPublicLive(row: { status?: string | null; is_published?: boolean | null }): boolean {
  const st = lcTrim(row.status);
  if (st === "removed" || st === "archived") return false;
  if (st === "active") return row.is_published !== false;
  return row.is_published === true;
}

export function isAdminDeleteRowRemoved(row: { status?: string | null }): boolean {
  return lcTrim(row.status) === "removed";
}

/**
 * Deleting is a parent-level structural action (same doctrine as `archive`): a Bienes Raices Negocio
 * PARENT with any active/public linked child — or a linked live row whose role cannot be confirmed as
 * `inventory_property` — can never be deleted; a confirmed child or an unresolved-role Negocio row is
 * refused (fails closed). FSBO / non-Bienes rows have no inventory concept and are unaffected here.
 * `permanent` adds the payment / public-live rules.
 */
export function assertAdminListingDeleteAllowed(input: {
  row: AdminDeleteRowLike;
  /** Rows linked to this one by `br_inventory_parent_listing_id` / `br_inventory_group_id` (excluding itself). */
  linkedRows?: readonly AdminDeleteLinkedRow[];
  evidence?: AdminDeletePaymentEvidence;
  mode: AdminDeleteMode;
}): AdminDeleteGuardResult {
  const { row, mode } = input;
  const linked = (input.linkedRows ?? []).filter((r) => r.id !== row.id);
  const evidence = input.evidence ?? {};

  if (lcTrim(row.category) === "bienes-raices" && isBrNegocioListing(row)) {
    const role = assertBrNegocioActionAllowed(row, "archive");
    if (!role.ok) return { ok: false, code: role.code };
    for (const child of linked) {
      if (!adminDeleteRowLooksPublicLive(child)) continue;
      if (child.inventory_role !== "inventory_property") return { ok: false, code: "child_role_unconfirmed" };
      return { ok: false, code: "has_public_children" };
    }
    // The parent FK is ON DELETE SET NULL: permanently deleting a parent would orphan every linked child
    // (paused / pending / removed included) into an unresolved-role row. Children go first.
    if (mode === "permanent" && linked.length > 0) return { ok: false, code: "has_linked_children" };
  }

  if (mode === "permanent") {
    if (adminDeleteRowLooksPublicLive(row)) return { ok: false, code: "public_live_requires_removal" };
    // Commercial state blocks a permanent delete until staff has explicitly REMOVED the row (soft delete).
    // A live subscription keeps billing the customer whether or not the row was soft-removed first.
    if (evidence.hasActiveSubscription) return { ok: false, code: "active_subscription" };
    if (!isAdminDeleteRowRemoved(row)) {
      if (evidence.hasLiveEntitlement) return { ok: false, code: "live_entitlement" };
      if (evidence.hasPaidRecord) return { ok: false, code: "paid_record_requires_removal" };
    }
  }
  return { ok: true };
}

export function adminDeleteGuardMessage(code: AdminDeleteGuardCode): string {
  switch (code) {
    case "has_public_children":
      return "This parent still has public child listings. Remove or pause the children first.";
    case "has_linked_children":
      return "This parent still has linked child listings. Permanently delete or resolve the children first.";
    case "child_role_unconfirmed":
      return "A linked listing's inventory role cannot be confirmed. Resolve the group before deleting.";
    case "public_live_requires_removal":
      return "This listing is public. Remove it (soft delete) before permanently deleting it.";
    case "active_subscription":
      return "An active subscription is attached to this listing. Cancel it before permanently deleting.";
    case "live_entitlement":
      return "A live package entitlement is attached to this listing. Revoke it before permanently deleting.";
    case "paid_record_requires_removal":
      return "This listing has a verified payment. Remove it (soft delete) before permanently deleting.";
    default:
      return adminInventoryActionForbiddenMessage();
  }
}

export { getDealerInventoryGroupId, getDealerInventoryParentListingId, getBrInventoryGroupId, getBrInventoryParentListingId };
