/**
 * Autos public truth for Admin Live (2026-09 closeout 2) — PURE, tiny import graph.
 * Mirrors `listActiveAutosClassifiedsRows` / `getActiveLiveAutosBundle` and reuses the shared
 * `isAutosChildParentGateSatisfied`. Re-exported from adminLivePredicates.ts.
 */
import {
  isAutosChildParentGateSatisfied,
  type AutosPublicParentCandidate,
} from "@/app/lib/clasificados/autos/autosPublicChildParentVisibility";

export type { AutosPublicParentCandidate };

/** `true` unless `expires_at` is a real instant at or before `nowMs`. */
function notExpiredAt(expiresAt: unknown, nowMs: number): boolean {
  if (typeof expiresAt !== "string" || !expiresAt.trim()) return true;
  const ms = new Date(expiresAt).getTime();
  if (!Number.isFinite(ms)) return true;
  return ms > nowMs;
}

export type AutosLiveRowLike = {
  id?: string | null;
  status?: string | null;
  lane?: string | null;
  expires_at?: string | null;
  inventory_role?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
  owner_user_id?: string | null;
};

/** Parent lookup for the dealer child gate: a prebuilt map or a synchronous resolver. */
export type AutosParentResolver =
  | ReadonlyMap<string, AutosPublicParentCandidate>
  | ((parentId: string) => AutosPublicParentCandidate | null | undefined);

/** Autos public pool rule without the parent gate: `status === "active"` and a Privado term not elapsed. */
export function isAutosRowLiveRowLevel(row: AutosLiveRowLike, nowMs: number = Date.now()): boolean {
  if (row.status !== "active") return false;
  if (row.lane === "privado" && !notExpiredAt(row.expires_at, nowMs)) return false;
  return true;
}

/** Distinct parent ids referenced by `inventory_vehicle` children in `rows`. */
export function collectAutosChildParentIds(rows: readonly AutosLiveRowLike[]): string[] {
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.inventory_role !== "inventory_vehicle") continue;
    const pid = String(r.dealer_inventory_parent_listing_id ?? "").trim();
    if (pid) ids.add(pid);
  }
  return [...ids];
}

/**
 * Autos public truth (`listActiveAutosClassifiedsRows` / `getActiveLiveAutosBundle`): status active,
 * Privado `expires_at` not past, and an `inventory_vehicle` child needs an active, same-owner
 * `negocios` main parent (`isAutosChildParentGateSatisfied`). Omit `parents` to skip only the parent
 * gate (row-level check).
 */
export function isAutosRowPubliclyLive(
  row: AutosLiveRowLike,
  parents?: AutosParentResolver,
  nowMs: number = Date.now(),
): boolean {
  if (!isAutosRowLiveRowLevel(row, nowMs)) return false;
  if (!parents || row.inventory_role !== "inventory_vehicle") return true;
  const pid = String(row.dealer_inventory_parent_listing_id ?? "").trim();
  let map: ReadonlyMap<string, AutosPublicParentCandidate>;
  if (typeof parents === "function") {
    const p = pid ? parents(pid) : null;
    map = p ? new Map([[pid, p]]) : new Map();
  } else {
    map = parents;
  }
  return isAutosChildParentGateSatisfied(
    { id: String(row.id ?? ""), inventory_role: row.inventory_role, dealer_inventory_parent_listing_id: row.dealer_inventory_parent_listing_id, owner_user_id: row.owner_user_id },
    map,
  );
}

