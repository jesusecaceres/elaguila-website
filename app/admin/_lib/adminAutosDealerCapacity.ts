/**
 * ADMIN AUTOS DEALER CAPACITY - pure half (golden-survivor port of closeout 2 / final Gate 4).
 *
 * The Autos admin page used to print "active n/10" by counting the active dealer rows of the SAME truncated page it
 * was showing against a hard-coded 10. Both halves were wrong: a group with rows outside the page was under-counted,
 * and 10 is only the PRO limit.
 *
 * Golden's owner-locked capacity model (fff3d53d9): the limit is TOTAL active vehicles with the dealer parent (main)
 * counted as vehicle #1 - BASE (`autos_dealer_quick_monthly`) 5, PRO (`autos_dealer_monthly`) 10, PRO + inventory
 * pack 20. BASE never gets the pack. The limit is resolved ONLY through golden's
 * `resolveDealerActiveVehicleLimit(packActive, { quick })` - the same call the Autos checkout enforces with - so Admin
 * can never show a number enforcement would not apply (no 20 for a BASE dealer, no fabricated pack).
 *
 * PURE: no I/O (the reads live in adminAutosDealerCapacityServer.ts).
 */
import {
  resolveDealerActiveVehicleLimit,
} from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";

export type AutosDealerCapacityRow = {
  id: string;
  lane?: string | null;
  status?: string | null;
  owner_user_id?: string | null;
  dealer_inventory_group_id?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
};

export type AdminDealerCapacityTier = "base" | "pro" | "pro_pack";

export type AdminDealerGroupCapacity =
  | { available: false; reason: string }
  | { available: true; active: number; limit: number; tier: AdminDealerCapacityTier; over: boolean };

/** Dealer group key (Gate 17 + closeout 2): group id, else parent id, else the row's own id. A main and its children
 * always share it (a child carries the group id or points at the main), and two distinct groups of one owner never merge.
 */
export function adminDealerCapacityGroupKey(row: AutosDealerCapacityRow): string | null {
  if (row.lane !== "negocios") return null;
  return String(row.dealer_inventory_group_id ?? "").trim() || String(row.dealer_inventory_parent_listing_id ?? "").trim() || row.id;
}

/** The main (parent) listing id a dealer row belongs to, or null when it cannot be attributed. */
export function adminDealerMainIdForRow(row: AutosDealerCapacityRow): string | null {
  if (row.lane !== "negocios") return null;
  if (row.inventory_role === "main") return row.id;
  const parent = String(row.dealer_inventory_parent_listing_id ?? "").trim();
  if (parent) return parent;
  // Legacy ungrouped standalone dealer row (no role yet): it is its own main.
  if (!row.inventory_role && !String(row.dealer_inventory_group_id ?? "").trim()) return row.id;
  return null;
}

/** TOTAL active dealer vehicles per canonical group key (the main counts as vehicle #1, children count too). */
export function countAdminDealerActiveTotals(rows: readonly AutosDealerCapacityRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (r.lane !== "negocios" || String(r.status ?? "") !== "active") continue;
    const key = adminDealerCapacityGroupKey(r);
    if (!key) continue;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/** Limit + tier from golden's resolver. BASE is capped at 5 even when a stray pack entitlement exists. */
export function resolveAdminDealerCapacityLimit(input: { quick: boolean; packActive: boolean }): {
  limit: number;
  tier: AdminDealerCapacityTier;
} {
  const limit = resolveDealerActiveVehicleLimit(input.packActive, { quick: input.quick });
  if (input.quick) return { limit, tier: "base" };
  return { limit, tier: input.packActive ? "pro_pack" : "pro" };
}

export function adminDealerGroupCapacity(input: {
  active: number | null;
  quick: boolean;
  packActive: boolean;
}): AdminDealerGroupCapacity {
  if (input.active == null || !Number.isFinite(input.active)) return { available: false, reason: "count_unavailable" };
  const { limit, tier } = resolveAdminDealerCapacityLimit(input);
  return { available: true, active: input.active, limit, tier, over: input.active > limit };
}

const TIER_LABEL: Record<AdminDealerCapacityTier, string> = {
  base: "BASE",
  pro: "PRO",
  pro_pack: "PRO + pack",
};

/** "n/5|10|20 total (incl. main)" + the plan tier. "—" when the count could not be read. */
export function describeAdminDealerCapacity(cap: AdminDealerGroupCapacity | null | undefined): {
  text: string;
  over: boolean;
} {
  if (!cap || !cap.available) return { text: "capacity —", over: false };
  const overNote = cap.over ? " · over limit" : "";
  return { text: `${cap.active}/${cap.limit} total (incl. main) · ${TIER_LABEL[cap.tier]}${overNote}`, over: cap.over };
}
