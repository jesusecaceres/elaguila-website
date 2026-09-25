/**
 * ADMIN AUTOS DEALER CAPACITY - server reads (READ-ONLY). See adminAutosDealerCapacity.ts for the model.
 *
 *  - COUNT: every ACTIVE negocios row of the owners visible on the page (not the truncated page itself), grouped by the
 *    canonical key, so the main + every child counts toward the TOTAL.
 *  - PLAN: per group main, golden's own enforcement reads - `resolveQuickBusinessPublishIdentity` (BASE = proven
 *    `autos_dealer_quick_monthly` via live entitlement / settled ledger) + `listingHasActiveDealerInventoryPack`.
 *  - Any count error / scan cap => the group shows "—", never a wrong number. Never writes.
 */
import "server-only";

import {
  adminDealerCapacityGroupKey,
  adminDealerGroupCapacity,
  adminDealerMainIdForRow,
  countAdminDealerActiveTotals,
  type AdminDealerGroupCapacity,
  type AutosDealerCapacityRow,
} from "@/app/admin/_lib/adminAutosDealerCapacity";
import { listingHasActiveDealerInventoryPack } from "@/app/lib/clasificados/autos/autosDealerInventoryPackEntitlement";
import { resolveQuickBusinessPublishIdentity } from "@/app/lib/listingPlans/quickBusinessProductIdentityServer";
import { quickFullOnlyBoundaryApplies } from "@/app/lib/quickBusiness/quickFullOnlyBoundary";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const OWNERS_PER_CALL = 100;
const PAGE_SIZE = 1000;
const SCAN_CAP_ROWS = 10_000;
/** Plan lookups per page render (each group = 1 identity + 1 pack read). */
const MAX_GROUPS_RESOLVED = 60;

const ROW_SELECT = "id, lane, status, owner_user_id, dealer_inventory_group_id, dealer_inventory_parent_listing_id, inventory_role";

async function readActiveDealerRows(owners: string[]): Promise<{ rows: AutosDealerCapacityRow[]; ok: boolean }> {
  const out: AutosDealerCapacityRow[] = [];
  const supabase = getAdminSupabase();
  for (let i = 0; i < owners.length; i += OWNERS_PER_CALL) {
    const chunk = owners.slice(i, i + OWNERS_PER_CALL);
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("autos_classifieds_listings")
        .select(ROW_SELECT)
        .eq("lane", "negocios")
        .eq("status", "active")
        .in("owner_user_id", chunk)
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) return { rows: [], ok: false };
      const page = (data ?? []) as AutosDealerCapacityRow[];
      out.push(...page);
      if (out.length > SCAN_CAP_ROWS) return { rows: [], ok: false };
      if (page.length < PAGE_SIZE) break;
    }
  }
  return { rows: out, ok: true };
}

/**
 * Capacity per canonical group key for the dealer rows visible on the page. Never throws; a group whose count or
 * plan could not be established is `{ available: false }`.
 */
export async function fetchAutosDealerCapacityForRows(
  visibleRows: readonly AutosDealerCapacityRow[],
): Promise<Record<string, AdminDealerGroupCapacity>> {
  const result: Record<string, AdminDealerGroupCapacity> = {};
  const dealerRows = visibleRows.filter((r) => r.lane === "negocios");
  if (dealerRows.length === 0) return result;

  const groups = new Map<string, { owner: string; mainId: string | null }>();
  for (const r of dealerRows) {
    const key = adminDealerCapacityGroupKey(r);
    if (!key) continue;
    const cur = groups.get(key) ?? { owner: String(r.owner_user_id ?? "").trim(), mainId: null };
    if (!cur.mainId) cur.mainId = adminDealerMainIdForRow(r);
    groups.set(key, cur);
  }

  const unavailable = (reason: string) => {
    for (const key of groups.keys()) result[key] = { available: false, reason };
    return result;
  };
  if (!isSupabaseAdminConfigured()) return unavailable("supabase_admin_not_configured");

  try {
    const owners = [...new Set([...groups.values()].map((g) => g.owner).filter(Boolean))];
    const read = owners.length ? await readActiveDealerRows(owners) : { rows: [], ok: true };
    if (!read.ok) return unavailable("count_unavailable");
    const totals = countAdminDealerActiveTotals(read.rows);
    // A group's main is usually visible; otherwise take it from the active rows of that group.
    for (const r of read.rows) {
      const key = adminDealerCapacityGroupKey(r);
      const g = key ? groups.get(key) : undefined;
      if (g && !g.mainId && r.inventory_role === "main") g.mainId = r.id;
    }

    let resolved = 0;
    for (const [key, g] of groups) {
      const active = totals[key] ?? 0;
      if (!g.owner || !g.mainId || resolved >= MAX_GROUPS_RESOLVED) {
        // Without an owner + main the plan cannot be attributed; never guess BASE / PRO / pack.
        result[key] = { available: false, reason: !g.owner ? "owner_missing" : !g.mainId ? "main_unidentified" : "lookup_budget" };
        continue;
      }
      resolved += 1;
      const [identity, packActive] = await Promise.all([
        resolveQuickBusinessPublishIdentity({ category: "autos", ownerUserId: g.owner, listingId: g.mainId }),
        listingHasActiveDealerInventoryPack(g.mainId),
      ]);
      result[key] = adminDealerGroupCapacity({ active, quick: quickFullOnlyBoundaryApplies(identity), packActive });
    }
    return result;
  } catch {
    return unavailable("count_unavailable");
  }
}
