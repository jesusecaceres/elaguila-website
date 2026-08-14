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

export { getDealerInventoryGroupId, getDealerInventoryParentListingId, getBrInventoryGroupId, getBrInventoryParentListingId };
