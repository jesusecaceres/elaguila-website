/**
 * ADMIN AUTOS DEALER CAPACITY — page adapter (closeout 2).
 *
 * The Autos admin page used to print "active n/10" by counting active dealer rows in the SAME
 * truncated page it was showing (50 rows by default) against a hard-coded 10. Both halves were
 * wrong: a dealer group with rows outside the page was under-counted, and 10 is only the STANDARD
 * limit (a paid inventory pack raises it).
 *
 * The canonical grouped count lives in `adminCategorySummary.ts` (`fetchAutosDealerCapacityTruth`,
 * every ACTIVE negocios row, optionally scoped to owners). This adapter only:
 *   1. asks it for the owners visible on the page (≤100 owner ids per call),
 *   2. folds the answer into `available` (false on any error or when its scan cap was hit — the
 *      page then prints "—", never a wrong number),
 *   3. words a group's capacity honestly (`describeDealerCapacity`).
 */
import {
  autosDealerGroupKey,
  fetchAutosDealerCapacityTruth,
  type AutosDealerCapacityTruth,
} from "@/app/admin/_lib/adminCategorySummary";
import {
  BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
} from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";

export { autosDealerGroupKey };

export type AutosDealerCapacityRow = {
  id: string;
  lane?: string | null;
  status?: string | null;
  owner_user_id?: string | null;
  dealer_inventory_group_id?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
};

export type AutosDealerCapacityView = {
  /** false = the counts are NOT trustworthy (query error / scan cap hit) — show "—". */
  available: boolean;
  /** Active dealer vehicles per group key (`autosDealerGroupKey`). Only meaningful when available. */
  activeByGroupKey: Record<string, number>;
  standardLimit: number;
  boostedLimit: number;
  note: string | null;
};

/** Owner ids per capacity call (PostgREST `in()` URL length). */
export const AUTOS_DEALER_CAPACITY_OWNERS_PER_CALL = 100;

/** Pure: unique owners of the DEALER rows visible on the page. */
export function dealerOwnersToRead(visibleRows: readonly AutosDealerCapacityRow[]): string[] {
  return [
    ...new Set(
      visibleRows
        .filter((r) => r.lane === "negocios")
        .map((r) => String(r.owner_user_id ?? "").trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * Pure: fold one or more canonical capacity answers (one per owner chunk — rows are disjoint across
 * chunks, so counts add) into the single view the page uses.
 */
export function foldDealerCapacityTruths(truths: readonly AutosDealerCapacityTruth[]): AutosDealerCapacityView {
  const base = { standardLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT, boostedLimit: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT };
  const bad = truths.find((t) => !t.ok || t.capped);
  if (bad) {
    return {
      ...base,
      available: false,
      activeByGroupKey: {},
      note: !bad.ok ? bad.error ?? "capacity query failed" : "scan cap reached — counts could be short",
    };
  }
  const activeByGroupKey: Record<string, number> = {};
  for (const t of truths) {
    for (const [k, n] of Object.entries(t.activeByGroupKey)) activeByGroupKey[k] = (activeByGroupKey[k] ?? 0) + n;
  }
  return { ...base, available: true, activeByGroupKey, note: null };
}

/**
 * Pure: how to word capacity for one dealer group. `active` null → unavailable ("—").
 * Above the standard limit is NOT an error by itself (a paid inventory pack raises it) but it is
 * flagged so staff verify the entitlement rather than trusting a number that looks too big.
 */
export function describeDealerCapacity(
  active: number | null,
  limits: { standard: number; boosted: number } = {
    standard: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
    boosted: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  },
): { text: string; overStandard: boolean; overBoosted: boolean } {
  if (active == null || !Number.isFinite(active)) return { text: "—", overStandard: false, overBoosted: false };
  return {
    text: `${active}`,
    overStandard: active > limits.standard,
    overBoosted: active > limits.boosted,
  };
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * True active dealer counts for the groups visible on the page. Never throws.
 * `fetchTruth` is injectable for tests; production uses the canonical `fetchAutosDealerCapacityTruth`.
 */
export async function fetchAutosDealerCapacityForRows(
  visibleRows: readonly AutosDealerCapacityRow[],
  opts: { fetchTruth?: (ownerUserIds: string[]) => Promise<AutosDealerCapacityTruth> } = {},
): Promise<AutosDealerCapacityView> {
  const owners = dealerOwnersToRead(visibleRows);
  if (owners.length === 0) {
    return { standardLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT, boostedLimit: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT, available: true, activeByGroupKey: {}, note: null };
  }
  const fetchTruth = opts.fetchTruth ?? fetchAutosDealerCapacityTruth;
  try {
    const truths: AutosDealerCapacityTruth[] = [];
    for (const ownerChunk of chunk(owners, AUTOS_DEALER_CAPACITY_OWNERS_PER_CALL)) {
      truths.push(await fetchTruth(ownerChunk));
    }
    return foldDealerCapacityTruths(truths);
  } catch (e) {
    return {
      standardLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
      boostedLimit: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
      available: false,
      activeByGroupKey: {},
      note: e instanceof Error ? e.message : "capacity query failed",
    };
  }
}
