/**
 * Gate B — pure identity builders.
 *
 * These functions validate and assemble `ListingIdentity` / `ParentChildInventoryIdentity`
 * objects from already-known canonical DB data. They never fetch data, never touch
 * localStorage, never call Supabase, never mutate their input, and never treat a slug or
 * draft_listing_id as canonical `sourceId`.
 */

import type {
  CanonicalCategoryKey,
  CanonicalDbCategory,
  CanonicalSourceTable,
  InventoryChildIdentity,
  InventoryRole,
  ListingIdentity,
  ParentChildInventoryIdentity,
} from "./types";

/**
 * Same UUID (v1–v5) pattern already used for source-id validation elsewhere in the repo —
 * see the private `isUuid()` in app/lib/serviciosSavedListingIdentity.ts:17-18. Duplicated
 * here rather than imported (that helper is module-private, and this module intentionally
 * stays dependency-free) so this file's UUID doctrine matches existing repo convention.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCanonicalUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

function trimmed(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function trimmedOrNull(v: string | null | undefined): string | null {
  const t = trimmed(v);
  return t ? t : null;
}

export type BuildListingIdentityInput = {
  sourceTable: CanonicalSourceTable;
  sourceId: string;
  category: CanonicalDbCategory;
  pipeline: CanonicalCategoryKey;
  leonixAdId: string;
  ownerUserId: string;
  publicUrl: string;
  editUrl?: string | null;
  previewUrl?: string | null;
  dashboardUrl?: string | null;
  parentSourceId?: string | null;
  inventoryGroupId?: string | null;
  inventoryRole?: InventoryRole | null;
};

export type BuildListingIdentityResult =
  | { ok: true; identity: ListingIdentity }
  | { ok: false; error: BuildListingIdentityError };

export type BuildListingIdentityError =
  | "missing_source_id"
  | "source_id_not_uuid"
  | "missing_owner_user_id"
  | "missing_public_url"
  | "parent_source_id_not_uuid";

/**
 * Construct a `ListingIdentity`. Rejects a missing or non-uuid `sourceId` — the real
 * database primary key is the only value this contract accepts as canonical identity.
 */
export function buildListingIdentity(input: BuildListingIdentityInput): BuildListingIdentityResult {
  const sourceId = trimmed(input.sourceId);
  if (!sourceId) {
    return { ok: false, error: "missing_source_id" };
  }
  if (!isCanonicalUuid(sourceId)) {
    return { ok: false, error: "source_id_not_uuid" };
  }

  const ownerUserId = trimmed(input.ownerUserId);
  if (!ownerUserId) {
    return { ok: false, error: "missing_owner_user_id" };
  }

  const publicUrl = trimmed(input.publicUrl);
  if (!publicUrl) {
    return { ok: false, error: "missing_public_url" };
  }

  const parentSourceId = input.parentSourceId != null ? trimmed(input.parentSourceId) : "";
  if (parentSourceId && !isCanonicalUuid(parentSourceId)) {
    return { ok: false, error: "parent_source_id_not_uuid" };
  }

  const identity: ListingIdentity = {
    sourceTable: input.sourceTable,
    sourceId,
    category: input.category,
    pipeline: input.pipeline,
    leonixAdId: trimmed(input.leonixAdId),
    ownerUserId,
    publicUrl,
    editUrl: trimmedOrNull(input.editUrl),
    previewUrl: trimmedOrNull(input.previewUrl),
    dashboardUrl: trimmedOrNull(input.dashboardUrl),
    parentSourceId: parentSourceId || null,
    inventoryGroupId: trimmedOrNull(input.inventoryGroupId),
    inventoryRole: input.inventoryRole ?? null,
  };

  return { ok: true, identity };
}

/** Narrowing helper for callers that already checked `result.ok === true`. */
export function unwrapListingIdentity(result: BuildListingIdentityResult): ListingIdentity {
  if (!result.ok) {
    throw new Error(`unwrapListingIdentity called on a failed result: ${result.error}`);
  }
  return result.identity;
}

export type BuildParentChildInventoryIdentityInput = {
  parent: ListingIdentity;
  inventoryGroupId: string;
  /** Confirmed product cap, or null when no cap is documented for this category. */
  productLimit: number | null;
  children: readonly InventoryChildIdentity[];
};

export type BuildParentChildInventoryIdentityResult =
  | { ok: true; inventory: ParentChildInventoryIdentity }
  | { ok: false; error: BuildParentChildInventoryIdentityError };

export type BuildParentChildInventoryIdentityError = "missing_inventory_group_id" | "child_source_id_not_uuid";

/**
 * Construct a `ParentChildInventoryIdentity`. Never truncates `children` — an over-limit
 * condition is represented via `overLimit`/`overLimitCount`, never a dropped record.
 */
export function buildParentChildInventoryIdentity(
  input: BuildParentChildInventoryIdentityInput,
): BuildParentChildInventoryIdentityResult {
  const inventoryGroupId = trimmed(input.inventoryGroupId);
  if (!inventoryGroupId) {
    return { ok: false, error: "missing_inventory_group_id" };
  }

  for (const child of input.children) {
    if (!isCanonicalUuid(child.identity.sourceId)) {
      return { ok: false, error: "child_source_id_not_uuid" };
    }
  }

  const childCount = input.children.length;
  const overLimit = input.productLimit != null && childCount > input.productLimit;
  const overLimitCount = overLimit ? childCount - (input.productLimit as number) : 0;

  const inventory: ParentChildInventoryIdentity = {
    parent: input.parent,
    inventoryGroupId,
    productLimit: input.productLimit,
    children: input.children,
    overLimit,
    overLimitCount,
  };

  return { ok: true, inventory };
}
