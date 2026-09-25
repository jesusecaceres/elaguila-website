/**
 * QUICK / FULL FIELD BOUNDARY — the ONE pure gate that keeps Full-only content out of a Quick listing.
 *
 * Product lock (the four business families: Servicios, Restaurantes, Autos Dealer, Bienes Negocio):
 *   QUICK  = ONE primary website. No extra website URLs, no social links, no Google Reviews / Google
 *            Business link, no Yelp link, no additional business/resource links, no video, no coupons.
 *   FULL   = everything the category supports today, unchanged.
 *
 * Quick and Full share the same canonical application, row and public presentation; only entitlement
 * differs. This module is that entitlement difference for FIELDS, expressed as data (dotted paths a
 * category declares) plus one behaviour:
 *
 *   applyQuickFullOnlyBoundary({ incoming, existing, paths })
 *
 * WHY IT RESTORES INSTEAD OF DELETING. A listing may carry Full-only values from an earlier period (a
 * Full subscriber whose access is later resolved as Quick, or an old row). A Quick save must not be able to
 * ADD Full-only content, and it must not silently DESTROY stored history either. So each Full-only path
 * takes the value already STORED on the row when there is one, and is otherwise emptied. A new Quick
 * listing therefore ends up with the field empty; an existing one keeps what it had; and the incoming
 * (browser-supplied) value never wins.
 *
 * WHEN IT MAY RUN. Only for a PROVEN Quick product (`quickFullOnlyBoundaryApplies`). An `unverified`
 * product (the normal case for a first, pre-payment save) is deliberately NOT gated here: it may be a
 * Full customer, and Full content must never be stripped on a guess. Server-owned records (assisted
 * context, live entitlement, checkout ledger, or a declared Simple key, which can only restrict) are what
 * prove Quick.
 *
 * Pure: no IO, no React, safe for server seams, client applications and node:assert verifiers.
 */
import type { QuickBusinessProductDecision } from "@/app/lib/listingPlans/quickBusinessProductIdentity";

type Json = Record<string, unknown>;

/** True only for a PROVEN Quick business product. `unverified` and Full never trigger the boundary. */
export function quickFullOnlyBoundaryApplies(
  decision: Pick<QuickBusinessProductDecision, "product" | "source"> | null | undefined,
): boolean {
  if (!decision) return false;
  if (decision.source === "no_quick_product") return false;
  return decision.product === "quick";
}

function isPlainObject(value: unknown): value is Json {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return true;
}

function emptyLike(value: unknown): unknown {
  if (typeof value === "string") return "";
  if (Array.isArray(value)) return [];
  if (isPlainObject(value)) return {};
  if (typeof value === "boolean") return false;
  return undefined;
}

function getPath(obj: unknown, parts: readonly string[]): unknown {
  let cur: unknown = obj;
  for (const part of parts) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

function setPath(obj: Json, parts: readonly string[], value: unknown): void {
  let cur: Json = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const next = cur[parts[i]!];
    if (!isPlainObject(next)) return; // never invent structure the incoming payload does not have
    cur = next;
  }
  const last = parts[parts.length - 1]!;
  if (value === undefined) delete cur[last];
  else cur[last] = value;
}

export type QuickBoundaryResult<T extends Json> = {
  /** A copy of `incoming` with every Full-only path restored from `existing` or emptied. */
  value: T;
  /** The dotted paths whose incoming value was changed (for an audit line). Empty when nothing was Full-only. */
  changedPaths: string[];
};

/**
 * Apply the Quick boundary to one payload. `paths` are dotted object paths (`contact.socialLinks`);
 * a path that does not exist in `incoming` is left absent (no structure is invented).
 */
export function applyQuickFullOnlyBoundary<T extends Json>(input: {
  incoming: T;
  /** The values already stored on the row being edited, when there is one. */
  existing?: Json | null;
  paths: readonly string[];
}): QuickBoundaryResult<T> {
  const value = structuredClone(input.incoming) as T;
  const changedPaths: string[] = [];
  for (const path of input.paths) {
    const parts = path.split(".").filter(Boolean);
    if (!parts.length) continue;
    const incomingValue = getPath(value, parts);
    if (incomingValue === undefined) continue;
    const storedValue = input.existing ? getPath(input.existing, parts) : undefined;
    const target = hasContent(storedValue) ? structuredClone(storedValue) : emptyLike(incomingValue);
    if (JSON.stringify(incomingValue) === JSON.stringify(target)) continue;
    setPath(value, parts, target);
    changedPaths.push(path);
  }
  return { value, changedPaths };
}
