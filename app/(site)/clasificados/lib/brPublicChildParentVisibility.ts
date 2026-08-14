/**
 * Gate G.2.3.4 — public visibility rule for Bienes Raíces Negocio inventory children: a child
 * must never be publicly discoverable unless its canonical main parent is itself an active,
 * published, same-owner, correctly-roled Bienes Raíces business row. This closes the orphan-
 * publicity risk the Gate G.2.3A audit confirmed (public browse and public detail both checked
 * only the child row's own status/publication, never its parent's).
 *
 * Pure, no I/O — companion to `listingPublicBrowseEligibility.ts`'s own row-level rule. Callers
 * (the results browse fetch, the detail page) are responsible for actually querying Supabase and
 * building the parent map/row this file only evaluates.
 */

export type BrPublicParentCandidate = {
  id: string;
  category?: string | null;
  seller_type?: string | null;
  inventory_role?: string | null;
  owner_id?: string | null;
  status?: string | null;
  is_published?: boolean | null;
};

export type BrPublicChildCandidate = {
  id: string;
  inventory_role?: string | null;
  br_inventory_parent_listing_id?: string | null;
  owner_id?: string | null;
};

function isBrRowActiveAndPublished(row: { status?: string | null; is_published?: boolean | null }): boolean {
  return row.status === "active" && row.is_published !== false;
}

/**
 * A main BR business-profile row needs no parent — its own existing public rules (already
 * enforced by the caller's own status/publication check) are the whole story. Exposed as a named
 * function only to document that fact explicitly and make it independently testable.
 */
export function isBrMainRowPubliclyEligible(row: { status?: string | null; is_published?: boolean | null }): boolean {
  return isBrRowActiveAndPublished(row);
}

/**
 * Whether `child` (already known to be its own active/published self, per the caller's existing
 * row-level check) additionally satisfies the canonical-parent gate. Non-child rows (any
 * `inventory_role` other than `"inventory_property"`, including `"main"` and `null`) always pass
 * — the parent gate applies only to inventory children. Every condition below is required; the
 * parent must be resolved by real UUID (`br_inventory_parent_listing_id`), never a group id,
 * slug, title, or owner-alone match.
 */
export function isBrChildParentGateSatisfied(
  child: BrPublicChildCandidate,
  parentsById: ReadonlyMap<string, BrPublicParentCandidate>,
): boolean {
  if (child.inventory_role !== "inventory_property") return true;

  const parentId = String(child.br_inventory_parent_listing_id ?? "").trim();
  if (!parentId) return false;

  const parent = parentsById.get(parentId);
  if (!parent) return false;

  const childOwnerId = String(child.owner_id ?? "").trim();
  const parentOwnerId = String(parent.owner_id ?? "").trim();

  return (
    parent.category === "bienes-raices" &&
    parent.seller_type === "business" &&
    parent.inventory_role === "main" &&
    Boolean(parentOwnerId) &&
    childOwnerId === parentOwnerId &&
    isBrRowActiveAndPublished(parent)
  );
}

/**
 * Batch form for a results list: removes any row that fails `isBrChildParentGateSatisfied`,
 * preserving the input order of everything that remains. Callers must have already filtered rows
 * down to their own public-eligibility rule (e.g. `isListingRowActiveAndPublishedForBrowse`) —
 * this function only adds the parent gate on top, it does not re-check status/publication itself.
 */
export function filterBrRowsByActiveParent<T extends BrPublicChildCandidate>(
  rows: readonly T[],
  parentsById: ReadonlyMap<string, BrPublicParentCandidate>,
): T[] {
  return rows.filter((row) => isBrChildParentGateSatisfied(row, parentsById));
}

/** Distinct, non-empty canonical parent UUIDs referenced by any inventory-child row in `rows`. */
export function collectBrChildParentIds(rows: readonly BrPublicChildCandidate[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.inventory_role !== "inventory_property") continue;
    const parentId = String(row.br_inventory_parent_listing_id ?? "").trim();
    if (parentId) ids.add(parentId);
  }
  return [...ids];
}
