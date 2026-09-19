/**
 * ADMIN AUTOS — DEALER GROUPS (2026-09 final Admin functional normalization, Gate 4).
 *
 * PURE (no I/O, no React): groups the Autos rows the Admin page is showing into Dealer inventory groups so the
 * operator sees a parent (main) listing with its children (`inventory_vehicle`) together, plus the child->parent
 * public gate, WITHOUT a second data path. Privado rows are independent (never grouped) and keep their order.
 *
 * Grouping key = the shared `autosDealerGroupKey` (dealer_inventory_group_id, else parent listing id, else own id) —
 * the SAME rule capacity counting uses (owned by adminCategorySummary).
 */
import { autosDealerGroupKey } from "@/app/admin/_lib/adminCategorySummary";
import {
  isAutosChildParentGateSatisfied,
  type AutosPublicParentCandidate,
} from "@/app/lib/clasificados/autos/autosPublicChildParentVisibility";

export type AutosDealerGroupRow = {
  id: string;
  lane?: string | null;
  status?: string | null;
  owner_user_id?: string | null;
  inventory_role?: string | null;
  dealer_inventory_group_id?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
};

export type AutosDealerGroup = {
  key: string;
  ownerUserId: string;
  /** The group's main (parent) listing id — from a main row on the page, else from a child's parent pointer. null = unknown. */
  mainId: string | null;
  /** True when the main row itself is on the current page (so its status can be shown without another read). */
  mainOnPage: boolean;
  /** Row ids of the group that are on the current page, main first. */
  rowIds: string[];
};

export type AutosDealerGrouping<T extends AutosDealerGroupRow> = {
  /** Rows in display order: dealer groups contiguous (main first), Privado / other rows in their original slots. */
  ordered: T[];
  groups: Map<string, AutosDealerGroup>;
  /** Row id -> group key, only for dealer (`negocios`) rows. */
  groupKeyByRowId: Map<string, string>;
  /** Row ids that open a group (render the group header above them). */
  groupStartRowIds: Set<string>;
};

function isDealer(r: AutosDealerGroupRow): boolean {
  return r.lane === "negocios";
}

function isMain(r: AutosDealerGroupRow): boolean {
  return isDealer(r) && r.inventory_role === "main";
}

/**
 * Pure: order the page rows so each Dealer group is contiguous with its main listing first and its children after.
 * A group appears where its first row appeared in the input (newest-first order is preserved between groups).
 */
export function groupAutosRowsForAdmin<T extends AutosDealerGroupRow>(rows: readonly T[]): AutosDealerGrouping<T> {
  const groups = new Map<string, AutosDealerGroup>();
  const membersByKey = new Map<string, T[]>();
  const groupKeyByRowId = new Map<string, string>();

  for (const r of rows) {
    if (!isDealer(r)) continue;
    const key = autosDealerGroupKey(r);
    groupKeyByRowId.set(r.id, key);
    const list = membersByKey.get(key);
    if (list) list.push(r);
    else membersByKey.set(key, [r]);
  }

  const emitted = new Set<string>();
  const ordered: T[] = [];
  const groupStartRowIds = new Set<string>();

  for (const r of rows) {
    if (!isDealer(r)) {
      ordered.push(r);
      continue;
    }
    const key = groupKeyByRowId.get(r.id)!;
    if (emitted.has(key)) continue;
    emitted.add(key);
    const members = membersByKey.get(key) ?? [r];
    const mains = members.filter(isMain);
    const children = members.filter((m) => !isMain(m));
    const sorted = [...mains, ...children];
    for (const m of sorted) ordered.push(m);
    groupStartRowIds.add(sorted[0].id);

    const mainRow = mains[0] ?? null;
    const childParentPointer = children
      .map((c) => String(c.dealer_inventory_parent_listing_id ?? "").trim())
      .find(Boolean);
    groups.set(key, {
      key,
      ownerUserId: String(sorted[0].owner_user_id ?? ""),
      mainId: mainRow ? mainRow.id : childParentPointer || null,
      mainOnPage: Boolean(mainRow),
      rowIds: sorted.map((m) => m.id),
    });
  }

  return { ordered, groups, groupKeyByRowId, groupStartRowIds };
}

/** Distinct main-listing ids of the groups (what the inventory-pack entitlement is read for). */
export function dealerGroupMainIds(groups: ReadonlyMap<string, AutosDealerGroup>): string[] {
  return [...new Set([...groups.values()].map((g) => g.mainId).filter((x): x is string => Boolean(x)))];
}

export type AutosChildGateState =
  /** Not an inventory child (main / Privado / other): the parent gate does not apply. */
  | "not_child"
  /** The child's canonical parent is an active, same-owner negocios main — the child can be public. */
  | "satisfied"
  /** The parent could not be found (deleted / not readable) — the child is NOT public. */
  | "parent_not_found"
  /** The parent exists but is not an active same-owner negocios main — the child is NOT public. */
  | "parent_not_live";

/**
 * Pure: the child -> parent public gate, with the reason. Uses the SAME predicate the public reader uses
 * (`isAutosChildParentGateSatisfied`); the reason only distinguishes missing vs present-but-not-live parents.
 */
export function autosChildParentGateState(
  child: AutosDealerGroupRow,
  parentsById: ReadonlyMap<string, AutosPublicParentCandidate>,
): AutosChildGateState {
  if (child.inventory_role !== "inventory_vehicle") return "not_child";
  if (isAutosChildParentGateSatisfied(child, parentsById)) return "satisfied";
  const parentId = String(child.dealer_inventory_parent_listing_id ?? "").trim();
  if (!parentId || !parentsById.get(parentId)) return "parent_not_found";
  return "parent_not_live";
}
