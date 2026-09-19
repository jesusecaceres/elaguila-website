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
 *
 * FINAL IDENTITY CLOSEOUT (gate 1) - LIFECYCLE OF THE KEY
 * -------------------------------------------------------
 * Canonical identity lives on the SERVER ROW (`listing_json.leonix_draft_key`); sessionStorage is only the
 * client's convenience copy of "which application am I". Two failure modes existed:
 *   (a) the key was NEVER cleared (`clearRealEstateDraftKey` had zero callers), so a SECOND application in
 *       the same tab reused the first application's key and overwrote its abandoned, unpaid pending row;
 *   (b) the title fallback / a stale cached id could adopt a row that belongs to ANOTHER application.
 *
 * The key lives exactly as long as the application draft it belongs to. It is cleared ONLY on:
 *   - `application_draft_cleared`  the lane's form draft was consumed by the checkout hand-off, reset by the
 *                                  user ("delete application" / "reiniciar") or dropped on leaving the flow;
 *   - `explicit_discard`           the user confirmed leaving/discarding, "start over", or logout wiped drafts;
 *   - `payment_success_return`     the Revenue OS success return proved the row bound to THIS key was paid
 *                                  (matched against the row's own key: ownership-safe);
 *   - `key_spent_by_server_truth`  the server shows the row bound to the key is no longer pre-payment
 *                                  (paid / active / removed): that application is over.
 * It is NEVER cleared on back / forward / edit / retry / cancel: those reuse the same row. Every other
 * reason is rejected at runtime (`clearRealEstateDraftKey` is a no-op for an unknown reason).
 */

/** Top-level `listing_json` field carrying the draft key (filtered as `listing_json->>leonix_draft_key`). */
export const REAL_ESTATE_DRAFT_KEY_JSON_FIELD = "leonix_draft_key";
/** PostgREST JSON-path column expression for `.eq(...)`. */
export const REAL_ESTATE_DRAFT_KEY_FILTER_COLUMN = `listing_json->>${REAL_ESTATE_DRAFT_KEY_JSON_FIELD}`;

/** FSBO's convenience cache of the pending row id (sessionStorage). Cleared together with the draft key. */
export const BR_FSBO_PENDING_CHECKOUT_SESSION_KEY = "br-fsbo-pending-checkout-listing-v1";

export type RealEstateDraftKeyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
/** Storage that can also be enumerated (browser Storage, or a Map-backed fake in tests). */
export type RealEstateDraftKeyEnumerableStorage = RealEstateDraftKeyStorage & Partial<Pick<Storage, "key" | "length">>;

export type RealEstateDraftKeyScope = { userId: string; category: string; sellerType: string };
export type RealEstateDraftKeyLane = { category: string; sellerType: string };

/** The ONLY events allowed to clear a draft key (see the lifecycle above). */
export type RealEstateDraftKeyClearReason =
  | "application_draft_cleared"
  | "explicit_discard"
  | "payment_success_return"
  | "key_spent_by_server_truth";

export const REAL_ESTATE_DRAFT_KEY_CLEAR_REASONS: readonly RealEstateDraftKeyClearReason[] = [
  "application_draft_cleared",
  "explicit_discard",
  "payment_success_return",
  "key_spent_by_server_truth",
];

/** Triggers that must NEVER clear the key (documented + asserted by the verifier). */
export const REAL_ESTATE_DRAFT_KEY_NEVER_CLEAR_TRIGGERS = ["back", "forward", "edit", "retry", "cancel"] as const;

export function isRealEstateDraftKeyClearReason(reason: unknown): reason is RealEstateDraftKeyClearReason {
  return typeof reason === "string" && (REAL_ESTATE_DRAFT_KEY_CLEAR_REASONS as readonly string[]).includes(reason);
}

const KEY_RE = /^[A-Za-z0-9_-]{16,80}$/;
const STORAGE_KEY_PREFIX = "leonix.realEstate.publishDraftKey.v1.";

export function sanitizeRealEstateDraftKey(raw: unknown): string | null {
  return typeof raw === "string" && KEY_RE.test(raw.trim()) ? raw.trim() : null;
}

export function realEstateDraftKeyStorageKey(input: RealEstateDraftKeyScope): string {
  return `${STORAGE_KEY_PREFIX}${input.userId}.${input.category}.${input.sellerType}`;
}

/** Fresh application key (crypto UUID when available). */
export function generateRealEstateDraftKey(): string {
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
  scope: RealEstateDraftKeyScope,
  generate: () => string = generateRealEstateDraftKey,
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

/**
 * Clears ONE application's key. Returns true only when the reason is an allowed terminal event AND the
 * storage call did not throw. Any other reason (back / edit / retry / cancel ...) is a strict no-op.
 */
export function clearRealEstateDraftKey(
  storage: RealEstateDraftKeyStorage | null | undefined,
  scope: RealEstateDraftKeyScope,
  reason: RealEstateDraftKeyClearReason,
): boolean {
  if (!storage || !isRealEstateDraftKeyClearReason(reason)) return false;
  try {
    storage.removeItem(realEstateDraftKeyStorageKey(scope));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears every stored key for a lane (any user id in THIS tab's storage) plus, for FSBO, the cached pending
 * row id. Used where the lane's application draft is consumed / discarded and the user id is not at hand.
 * Returns how many storage entries were removed.
 */
export function clearRealEstateDraftLifecycleForLane(
  storage: RealEstateDraftKeyEnumerableStorage | null | undefined,
  lane: RealEstateDraftKeyLane,
  reason: RealEstateDraftKeyClearReason,
): number {
  if (!storage || !isRealEstateDraftKeyClearReason(reason)) return 0;
  const suffix = `.${lane.category}.${lane.sellerType}`;
  let removed = 0;
  try {
    const found: string[] = [];
    const n = typeof storage.length === "number" ? storage.length : 0;
    for (let i = 0; i < n; i++) {
      const k = storage.key ? storage.key(i) : null;
      if (typeof k === "string" && k.startsWith(STORAGE_KEY_PREFIX) && k.endsWith(suffix)) found.push(k);
    }
    for (const k of found) {
      storage.removeItem(k);
      removed += 1;
    }
    if (lane.category === "bienes-raices" && lane.sellerType === "personal") {
      storage.removeItem(BR_FSBO_PENDING_CHECKOUT_SESSION_KEY);
    }
  } catch {
    /* storage unavailable — nothing to clear */
  }
  return removed;
}

/** Browser wrapper: clears the lane's lifecycle state from this tab's sessionStorage (no-op on the server). */
export function clearRealEstateDraftLifecycleForLaneInBrowser(
  lane: RealEstateDraftKeyLane,
  reason: RealEstateDraftKeyClearReason,
): number {
  if (typeof window === "undefined") return 0;
  try {
    return clearRealEstateDraftLifecycleForLane(window.sessionStorage, lane, reason);
  } catch {
    return 0;
  }
}

/** Clears every real-estate lane (Rentas + Bienes, privado + negocio) - "start over" / logout wipe. */
export function clearAllRealEstateDraftLifecycleInBrowser(reason: RealEstateDraftKeyClearReason): number {
  let n = 0;
  for (const category of ["rentas", "bienes-raices"]) {
    for (const sellerType of ["personal", "business"]) {
      n += clearRealEstateDraftLifecycleForLaneInBrowser({ category, sellerType }, reason);
    }
  }
  return n;
}

/**
 * Revenue OS success return: clear the stored key ONLY when it is the very key written on the paid row
 * (ownership-safe - an unrelated in-progress application in this tab keeps its key). Also drops the FSBO
 * cached id when it is the paid row.
 */
export function clearRealEstateDraftKeyIfRowMatches(
  storage: RealEstateDraftKeyStorage | null | undefined,
  scope: RealEstateDraftKeyScope,
  paidRow: { listingId?: string | null; draftKey?: string | null },
): boolean {
  if (!storage) return false;
  let cleared = false;
  const rowKey = sanitizeRealEstateDraftKey(paidRow.draftKey);
  try {
    const stored = sanitizeRealEstateDraftKey(storage.getItem(realEstateDraftKeyStorageKey(scope)));
    if (stored && rowKey && stored === rowKey) {
      cleared = clearRealEstateDraftKey(storage, scope, "payment_success_return");
    }
    if (scope.category === "bienes-raices" && scope.sellerType === "personal") {
      const cached = (storage.getItem(BR_FSBO_PENDING_CHECKOUT_SESSION_KEY) ?? "").trim();
      const paid = (paidRow.listingId ?? "").trim();
      if (cached && paid && cached === paid) storage.removeItem(BR_FSBO_PENDING_CHECKOUT_SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
  return cleared;
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

export type RealEstatePendingLookupTier = "draft_key" | "existing_id" | "title";
export type RealEstatePendingRowLite = {
  id?: string | null;
  leonix_ad_id?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  listing_json?: unknown;
};

/**
 * CANONICAL SERVER IDENTITY WINS. A pending row may be adopted (and overwritten) by a save only when it
 * belongs to THIS application:
 *   - draft_key tier: the row's key equals the application's key;
 *   - existing_id / title tiers (convenience fallbacks): the row carries NO key (a legacy row created before
 *     keys existed, which the patch will stamp) or carries exactly this application's key. A row bound to a
 *     DIFFERENT key is another application's abandoned draft and is never adopted - not by a stale cached
 *     id, and not because the titles happen to match.
 */
export function realEstatePendingRowAdoptable(
  tier: RealEstatePendingLookupTier,
  row: RealEstatePendingRowLite | null | undefined,
  draftKey: string | null | undefined,
): boolean {
  if (!row || typeof row.id !== "string" || !row.id) return false;
  const rowKey = readRealEstateDraftKeyFromListingJson(row.listing_json);
  const ownKey = sanitizeRealEstateDraftKey(draftKey);
  if (tier === "draft_key") return rowKey !== null && ownKey !== null && rowKey === ownKey;
  return rowKey === null || (ownKey !== null && rowKey === ownKey);
}

/** First adoptable row for a tier (title lookups return several candidates, newest first). */
export function pickAdoptableRealEstatePendingRow<T extends RealEstatePendingRowLite>(
  tier: RealEstatePendingLookupTier,
  rows: readonly T[] | null | undefined,
  draftKey: string | null | undefined,
): T | null {
  for (const r of rows ?? []) if (realEstatePendingRowAdoptable(tier, r, draftKey)) return r;
  return null;
}

/**
 * Server-truth state of a draft key, from the rows (any status) that carry it for this owner + lane:
 *   - "unused":   no row carries the key yet (first save of this application);
 *   - "reusable": a row is still pre-payment (pending + unpublished) - the next save updates it;
 *   - "spent":    every row carrying the key is already paid / active / removed - that application is over, so
 *                 the key must be rotated before the next INSERT (a new application must not share its key).
 */
export function realEstateDraftKeyServerState(
  rows: ReadonlyArray<{ status?: string | null; is_published?: boolean | null }> | null | undefined,
): "unused" | "reusable" | "spent" {
  if (!rows || rows.length === 0) return "unused";
  const anyPrePayment = rows.some(
    (r) => String(r.status ?? "").trim().toLowerCase() === "pending" && r.is_published !== true,
  );
  return anyPrePayment ? "reusable" : "spent";
}

/**
 * Server-truth rotation. When every row carrying `currentKey` is already paid / active / removed the
 * application is over: drop the stored key (only the one THIS publish derived from storage - a caller-supplied
 * key is never allowed to wipe an unrelated stored key) and mint a fresh one. Otherwise the key is kept.
 */
export function rotateRealEstateDraftKeyIfSpent(input: {
  storage: RealEstateDraftKeyStorage | null | undefined;
  scope: RealEstateDraftKeyScope;
  currentKey: string;
  /** True when the caller passed the key explicitly (it was not derived from `storage`). */
  callerSuppliedKey: boolean;
  rows: ReadonlyArray<{ status?: string | null; is_published?: boolean | null }> | null | undefined;
  generate?: () => string;
}): { key: string; rotated: boolean } {
  if (realEstateDraftKeyServerState(input.rows) !== "spent") return { key: input.currentKey, rotated: false };
  const generate = input.generate ?? generateRealEstateDraftKey;
  if (!input.callerSuppliedKey) {
    clearRealEstateDraftKey(input.storage, input.scope, "key_spent_by_server_truth");
    const next = getOrCreateRealEstateDraftKey(input.storage, input.scope, generate) ?? sanitizeRealEstateDraftKey(generate());
    return { key: next ?? generateRealEstateDraftKey(), rotated: true };
  }
  return { key: sanitizeRealEstateDraftKey(generate()) ?? generateRealEstateDraftKey(), rotated: true };
}
