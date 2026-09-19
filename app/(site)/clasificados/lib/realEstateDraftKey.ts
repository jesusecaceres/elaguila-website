/**
 * Bienes Raices / Rentas — a STABLE PER-APPLICATION DRAFT KEY (closeout 2, no schema change).
 *
 * ROOT CAUSE: the pending-row reuse in `publishLeonixRealEstateListingCore` was keyed on
 * owner + category + seller type + status + TITLE, so editing the title between two saves minted a
 * SECOND pending row (second UUID, second Leonix Ad ID). Bienes Raices FSBO was not in the server reuse
 * set at all — it relied on a client-only sessionStorage id.
 *
 * The key is generated once per application on the client (per user + category + seller type, kept in
 * sessionStorage) and written onto the row inside `listing_json` under a TOP-LEVEL field. It deliberately
 * does NOT live inside `br_publish` / `rentas_publish`: those objects are rebuilt from a fixed field
 * list by `merge*ListingPaymentMeta` (checkout start, webhook), which would silently drop an unknown
 * marker exactly when a retry needs it. The server lookup order is: draft key -> explicit existing id ->
 * title (last resort). Pure + storage-injectable.
 */

/** Top-level `listing_json` field carrying the draft key (filtered as `listing_json->>leonix_draft_key`). */
export const REAL_ESTATE_DRAFT_KEY_JSON_FIELD = "leonix_draft_key";
/** PostgREST JSON-path column expression for `.eq(...)`. */
export const REAL_ESTATE_DRAFT_KEY_FILTER_COLUMN = `listing_json->>${REAL_ESTATE_DRAFT_KEY_JSON_FIELD}`;

export type RealEstateDraftKeyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const KEY_RE = /^[A-Za-z0-9_-]{16,80}$/;

export function sanitizeRealEstateDraftKey(raw: unknown): string | null {
  return typeof raw === "string" && KEY_RE.test(raw.trim()) ? raw.trim() : null;
}

export function realEstateDraftKeyStorageKey(input: {
  userId: string;
  category: string;
  sellerType: string;
}): string {
  return `leonix.realEstate.publishDraftKey.v1.${input.userId}.${input.category}.${input.sellerType}`;
}

function randomKey(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c?.randomUUID) return `dk_${c.randomUUID().replace(/-/g, "")}`;
  } catch {
    /* fall through */
  }
  let s = "";
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return `dk_${s}`;
}

/** Returns the application's draft key, creating + persisting it on first use. Null only if no storage. */
export function getOrCreateRealEstateDraftKey(
  storage: RealEstateDraftKeyStorage | null | undefined,
  scope: { userId: string; category: string; sellerType: string },
  generate: () => string = randomKey,
): string | null {
  if (!storage) return null;
  const k = realEstateDraftKeyStorageKey(scope);
  try {
    const existing = sanitizeRealEstateDraftKey(storage.getItem(k));
    if (existing) return existing;
  } catch {
    return null;
  }
  const fresh = sanitizeRealEstateDraftKey(generate());
  if (!fresh) return null;
  try {
    storage.setItem(k, fresh);
  } catch {
    /* quota / private mode: a key that cannot persist is still valid for this publish call */
  }
  return fresh;
}

export function clearRealEstateDraftKey(
  storage: RealEstateDraftKeyStorage | null | undefined,
  scope: { userId: string; category: string; sellerType: string },
): void {
  if (!storage) return;
  try {
    storage.removeItem(realEstateDraftKeyStorageKey(scope));
  } catch {
    /* ignore */
  }
}

/** Adds the draft key to a `listing_json` object (top-level; never inside `br_publish`/`rentas_publish`). */
export function withRealEstateDraftKeyInListingJson(
  listingJson: unknown,
  draftKey: string | null | undefined,
): Record<string, unknown> | null {
  const key = sanitizeRealEstateDraftKey(draftKey);
  const base =
    listingJson && typeof listingJson === "object" && !Array.isArray(listingJson)
      ? { ...(listingJson as Record<string, unknown>) }
      : null;
  if (!key) return base;
  return { ...(base ?? {}), [REAL_ESTATE_DRAFT_KEY_JSON_FIELD]: key };
}

export function readRealEstateDraftKeyFromListingJson(listingJson: unknown): string | null {
  if (!listingJson || typeof listingJson !== "object" || Array.isArray(listingJson)) return null;
  return sanitizeRealEstateDraftKey((listingJson as Record<string, unknown>)[REAL_ESTATE_DRAFT_KEY_JSON_FIELD]);
}

/**
 * Which pending-row lookup tiers apply, in order. Draft key first, then an explicit existing id, then the
 * title (only as the LAST fallback). Inventory child properties never use the draft key (many children
 * share one application; each is matched by its own title under its parent).
 */
export function realEstatePendingLookupOrder(input: {
  draftKey?: string | null;
  existingListingId?: string | null;
  isInventoryChild?: boolean;
}): Array<"draft_key" | "existing_id" | "title"> {
  const order: Array<"draft_key" | "existing_id" | "title"> = [];
  if (!input.isInventoryChild && sanitizeRealEstateDraftKey(input.draftKey)) order.push("draft_key");
  if (typeof input.existingListingId === "string" && input.existingListingId.trim()) order.push("existing_id");
  order.push("title");
  return order;
}
