/**
 * Gate I.13B — public visibility rule for Auto Dealers inventory children: a child
 * (`inventory_role === "inventory_vehicle"`) must never be publicly discoverable unless its
 * canonical main parent is itself an active, same-owner, correctly-roled negocios row. Mirrors
 * Bienes Raíces Negocio's proven `isBrChildParentGateSatisfied`
 * (app/(site)/clasificados/lib/brPublicChildParentVisibility.ts), which closed the identical
 * class of bug for BR — I.13B's own research confirmed Autos never had an equivalent gate: a
 * suspended/removed dealer's `inventory_vehicle` children stayed publicly listed and directly
 * reachable at their own detail URL.
 *
 * Pure, no I/O — callers are responsible for querying Supabase and building the parent map this
 * file only evaluates.
 */

export type AutosPublicParentCandidate = {
  id: string;
  lane?: string | null;
  inventory_role?: string | null;
  owner_user_id?: string | null;
  status?: string | null;
};

export type AutosPublicChildCandidate = {
  id: string;
  inventory_role?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
  owner_user_id?: string | null;
};

function isAutosRowActive(row: { status?: string | null }): boolean {
  return row.status === "active";
}

/**
 * Whether `child` (already known to be its own active self, per the caller's existing
 * `status === "active"` check) additionally satisfies the canonical-parent gate. Non-child rows
 * (any `inventory_role` other than `"inventory_vehicle"`, including `"main"` and `null`) always
 * pass — the parent gate applies only to inventory children.
 */
export function isAutosChildParentGateSatisfied(
  child: AutosPublicChildCandidate,
  parentsById: ReadonlyMap<string, AutosPublicParentCandidate>,
): boolean {
  if (child.inventory_role !== "inventory_vehicle") return true;

  const parentId = String(child.dealer_inventory_parent_listing_id ?? "").trim();
  if (!parentId) return false;

  const parent = parentsById.get(parentId);
  if (!parent) return false;

  const childOwnerId = String(child.owner_user_id ?? "").trim();
  const parentOwnerId = String(parent.owner_user_id ?? "").trim();

  return (
    parent.lane === "negocios" &&
    parent.inventory_role === "main" &&
    Boolean(parentOwnerId) &&
    childOwnerId === parentOwnerId &&
    isAutosRowActive(parent)
  );
}

/**
 * Batch form: removes any row that fails `isAutosChildParentGateSatisfied`, preserving input
 * order. Callers must have already filtered rows down to their own active-status rule — this
 * function only adds the parent gate on top.
 */
export function filterAutosRowsByActiveParent<T extends AutosPublicChildCandidate>(
  rows: readonly T[],
  parentsById: ReadonlyMap<string, AutosPublicParentCandidate>,
): T[] {
  return rows.filter((row) => isAutosChildParentGateSatisfied(row, parentsById));
}
