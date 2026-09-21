/**
 * Gate QB-BOUNDARY-01 — the SERVER READS behind `resolveQuickBusinessProduct`.
 *
 * The rule itself is pure and lives in `app/lib/listingPlans/quickBusinessProductIdentity.ts`.
 * This module only fetches the two server-owned records that rule consults, and it fails closed in
 * the SAFE direction for each one:
 *
 *   - an unreadable ENTITLEMENT table yields no rows, so nothing claims `full` on the strength of
 *     a failed read;
 *   - an unreadable CHECKOUT LEDGER yields no key, so nothing claims `quick` either.
 *
 * With both silent the decision falls through to the caller's declaration, which can only ever
 * ADD the Quick contract — never remove it. So a database outage can make this module stricter,
 * never more permissive.
 *
 * Both tables are read with the admin client because both are service-role-written ledgers that a
 * customer session cannot see. Nothing here writes.
 */

import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { businessBasePackageKeys } from "./businessAccessLevel";
import { isListingPackageEntitlementRowActive } from "./listingPackageEntitlementPlacement";
import {
  resolveQuickBusinessProduct,
  quickContractAppliesTo,
  type ProductEntitlementRowFacts,
  type QuickBusinessProductDecision,
} from "@/app/lib/listingPlans/quickBusinessProductIdentity";

/**
 * LIVE entitlement rows for one listing in one category.
 *
 * "Live" is the project's existing doctrine (`isListingPackageEntitlementRowActive`), not merely
 * `status = 'active'`: a stale active row past its own `ends_at` is not live even though nothing
 * has swept it yet. Returns [] on any failure.
 */
async function readLiveEntitlementRows(input: {
  category: string;
  listingId: string;
}): Promise<ProductEntitlementRowFacts[]> {
  if (!isSupabaseAdminConfigured() || !input.listingId) return [];
  try {
    const { data, error } = await getAdminSupabase()
      .from("listing_package_entitlements")
      .select("package_key, package_tier, status, starts_at, ends_at, revoked_at")
      .eq("category", input.category)
      .eq("listing_id", input.listingId)
      .neq("status", "revoked")
      .is("revoked_at", null)
      .limit(25);
    if (error || !data) return [];
    const now = new Date();
    const str = (v: unknown): string | null => (v == null ? null : String(v));
    return (data as Record<string, unknown>[])
      .filter((row) =>
        isListingPackageEntitlementRowActive({
          status: str(row.status),
          revoked_at: str(row.revoked_at),
          starts_at: str(row.starts_at),
          ends_at: str(row.ends_at),
          now,
        }),
      )
      .map((row) => ({
        packageKey: row.package_key == null ? null : String(row.package_key),
        packageTier: row.package_tier == null ? null : String(row.package_tier),
      }));
  } catch {
    return [];
  }
}

/**
 * The base package key on the most recent checkout record this OWNER holds in this category.
 *
 * `leonix_payment_records` is written only by the server's own checkout route, from a package key
 * that route validated — so the key here is server truth about which product the customer is
 * actually transacting, whatever the browser says afterwards. Restricted to the category's two
 * base keys so an add-on purchase (inventory pack, coupons) can never be mistaken for a base
 * product. Paid rows are preferred over open attempts; among equals, the most recent wins.
 */
async function readCheckoutLedgerBasePackageKey(input: {
  category: string;
  ownerUserId: string;
  listingId?: string | null;
}): Promise<string | null> {
  const baseKeys = businessBasePackageKeys(input.category);
  if (!baseKeys.length || !isSupabaseAdminConfigured() || !input.ownerUserId) return null;
  try {
    let query = getAdminSupabase()
      .from("leonix_payment_records")
      .select("package_key, payment_status, created_at")
      .eq("category", input.category)
      .eq("owner_user_id", input.ownerUserId)
      .in("package_key", [...baseKeys])
      .not("payment_status", "in", "(canceled,failed)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (input.listingId) query = query.eq("listing_id", input.listingId);
    const { data, error } = await query;
    if (error || !data?.length) return null;
    const rows = data as { package_key?: unknown; payment_status?: unknown }[];
    const settled = rows.find((r) => {
      const s = String(r.payment_status ?? "").trim().toLowerCase();
      return s === "paid" || s === "succeeded";
    });
    const winner = settled ?? rows[0];
    const key = String(winner?.package_key ?? "").trim();
    return key || null;
  } catch {
    return null;
  }
}

export type QuickBusinessPublishIdentityInput = {
  /** Business category as the package pair names it: `"autos"`, `"bienes-raices"`, … */
  category: string;
  /** The bearer-verified owner. Never taken from a request body. */
  ownerUserId: string;
  /** The listing being published or amended, when it already exists. */
  listingId?: string | null;
  /** Package key named by a verified staff assisted-publishing context, when there is one. */
  assistedPackageKey?: string | null;
  /** True only when called from inside the Quick-only server publish operation. */
  serverCustodyQuick?: boolean;
  /** What the caller said. Read only when it names the category's SIMPLE key. */
  declaredPackageKey?: string | null;
};

export type QuickBusinessPublishIdentity = QuickBusinessProductDecision & {
  /** Whether the Quick Business semantic media contract applies to this publish. */
  enforceQuickContract: boolean;
};

/**
 * Resolve the product for one publish, from server-owned records plus the one-direction
 * declaration rule. The ONLY entry point publish seams call.
 */
export async function resolveQuickBusinessPublishIdentity(
  input: QuickBusinessPublishIdentityInput,
): Promise<QuickBusinessPublishIdentity> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingId = String(input.listingId ?? "").trim();

  const [liveEntitlementRows, checkoutLedgerPackageKey] = await Promise.all([
    listingId ? readLiveEntitlementRows({ category, listingId }) : Promise.resolve([]),
    readCheckoutLedgerBasePackageKey({
      category,
      ownerUserId: String(input.ownerUserId ?? "").trim(),
      listingId: listingId || null,
    }),
  ]);

  const decision = resolveQuickBusinessProduct({
    category,
    assistedPackageKey: input.assistedPackageKey ?? null,
    liveEntitlementRows,
    checkoutLedgerPackageKey,
    serverCustodyQuick: input.serverCustodyQuick === true,
    declaredPackageKey: input.declaredPackageKey ?? null,
  });

  return { ...decision, enforceQuickContract: quickContractAppliesTo(decision.product) };
}
