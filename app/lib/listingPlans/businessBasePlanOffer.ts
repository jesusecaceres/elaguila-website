/**
 * The server side of "which base package should this EXISTING business listing be sold" — the
 * reads that feed `decideBusinessBasePlanOffer`, which owns the rule itself and lives in
 * `businessBasePlanOfferPolicy.ts`.
 *
 * Imported only by API routes. Both reads below fail closed: the failure mode of this module must
 * be "the customer is shown no upgrade", never "an upgrade is offered for a listing we could not
 * verify".
 */

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { businessBasePackageKeys, businessPackageKeyForLevel, upgradeTargetPackageKey } from "./businessAccessLevel";
import {
  businessBasePlanNothingToSell as NOTHING_TO_SELL,
  businessCategoryListingSource,
  decideBusinessBasePlanOffer,
  type BusinessBasePlanOffer,
} from "./businessBasePlanOfferPolicy";
import { resolveBusinessAccess } from "./categoryCommercialPlan";

export {
  businessCategoryListingSource,
  decideBusinessBasePlanOffer,
  type BusinessBasePlanMode,
  type BusinessBasePlanOffer,
} from "./businessBasePlanOfferPolicy";

/** The most recent UNRESOLVED base checkout for this listing, if any. Ledger truth, not intent. */
async function findUnresolvedBaseCheckoutPackageKey(input: {
  category: string;
  listingId: string;
}): Promise<string | null> {
  const baseKeys = businessBasePackageKeys(input.category);
  if (baseKeys.length === 0 || !isSupabaseAdminConfigured()) return null;
  try {
    const { data } = await getAdminSupabase()
      .from("leonix_payment_records")
      .select("package_key, created_at")
      .eq("category", input.category)
      .eq("listing_id", input.listingId)
      .in("package_key", [...baseKeys])
      .in("payment_status", ["pending", "unpaid", "requires_action"])
      .order("created_at", { ascending: false })
      .limit(1);
    const key = String((data?.[0] as { package_key?: unknown } | undefined)?.package_key ?? "").trim();
    return key || null;
  } catch {
    return null;
  }
}

/** The owner id of `listingId` in `category` (trimmed), or null when unknown. Fails closed to null. */
export async function readBusinessListingOwner(category: string, listingIdRaw: string): Promise<string | null> {
  const listingId = String(listingIdRaw ?? "").trim();
  const source = businessCategoryListingSource(category);
  if (!source || !listingId || !isSupabaseAdminConfigured()) return null;
  try {
    const { data } = await getAdminSupabase()
      .from(source.table)
      .select(`id, ${source.ownerColumn}`)
      .eq("id", listingId)
      .maybeSingle();
    const owner = (data as Record<string, unknown> | null)?.[source.ownerColumn];
    return typeof owner === "string" && owner.trim() ? owner.trim() : null;
  } catch {
    return null;
  }
}

/** True when `listingId` in `category` belongs to `ownerUserId`. Fails closed to false. */
export async function isBusinessListingOwnedBy(input: {
  category: string;
  listingId: string;
  ownerUserId: string;
}): Promise<boolean> {
  const listingId = String(input.listingId ?? "").trim();
  const ownerUserId = String(input.ownerUserId ?? "").trim();
  const source = businessCategoryListingSource(input.category);
  if (!source || !listingId || !ownerUserId || !isSupabaseAdminConfigured()) return false;
  try {
    const { data } = await getAdminSupabase()
      .from(source.table)
      .select(`id, ${source.ownerColumn}`)
      .eq("id", listingId)
      .maybeSingle();
    const owner = (data as Record<string, unknown> | null)?.[source.ownerColumn];
    return typeof owner === "string" && owner.trim() === ownerUserId;
  } catch {
    return false;
  }
}

/**
 * Resolve the offer for one listing, for its verified owner.
 *
 * Fails closed to `new` (offer nothing extra) on every unknown: a wrong owner, an unreadable
 * table, a category outside the split.
 */
export async function resolveBusinessBasePlanOffer(input: {
  category: string;
  listingId: string;
  ownerUserId: string;
}): Promise<BusinessBasePlanOffer> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingId = String(input.listingId ?? "").trim();
  const source = businessCategoryListingSource(category);
  if (!source || !listingId) return NOTHING_TO_SELL(category, "new");

  const owned = await isBusinessListingOwnedBy({ category, listingId, ownerUserId: input.ownerUserId });
  if (!owned) return NOTHING_TO_SELL(category, "new");

  const access = await resolveBusinessAccess({ category, listingSource: source.table, listingId });
  const resumePackageKey =
    access.level === "none" ? await findUnresolvedBaseCheckoutPackageKey({ category, listingId }) : null;

  return decideBusinessBasePlanOffer({
    category,
    accessLevel: access.level,
    heldPackageKey: access.packageKey,
    resumePackageKey,
  });
}

/**
 * The Stripe customer of the AUTHENTICATED owner's live Quick subscription for THIS listing, or
 * null. Used so a Simple->Full upgrade checkout reuses the customer (Stripe `customer`) instead of
 * minting a second one from the email, which the convergence planner would then refuse as a
 * `customer_mismatch` and leave both plans billing.
 *
 * Identity is Leonix's own ledger, never the request: the payment record must match owner +
 * category + Quick package key + LISTING, and its subscription record must be the same listing and
 * still live. Fails closed to null on every unknown (checkout then behaves exactly as before).
 */
export async function resolveQuickUpgradeStripeCustomerId(input: {
  category: string;
  listingId: string;
  ownerUserId: string;
}): Promise<string | null> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingId = String(input.listingId ?? "").trim();
  const ownerUserId = String(input.ownerUserId ?? "").trim();
  const quickKey = businessPackageKeyForLevel(category, "simple");
  if (!quickKey || !listingId || !ownerUserId || !isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("leonix_payment_records")
      .select("owner_user_id, listing_id, stripe_subscription_id, stripe_customer_id")
      .eq("owner_user_id", ownerUserId)
      .eq("category", category)
      .eq("listing_id", listingId)
      .eq("package_key", quickKey)
      .eq("billing_mode", "subscription")
      .eq("payment_status", "paid")
      .not("stripe_subscription_id", "is", null)
      .not("stripe_customer_id", "is", null)
      .order("paid_at", { ascending: false })
      .limit(1);
    const row = (data?.[0] ?? null) as {
      owner_user_id: string | null;
      listing_id: string | null;
      stripe_subscription_id: string | null;
      stripe_customer_id: string | null;
    } | null;
    if (!row?.stripe_customer_id || !row.stripe_subscription_id) return null;
    if (String(row.owner_user_id ?? "") !== ownerUserId || String(row.listing_id ?? "") !== listingId) return null;

    const { data: sub } = await supabase
      .from("leonix_subscription_records")
      .select("owner_user_id, listing_id, status, stripe_customer_id")
      .eq("stripe_subscription_id", row.stripe_subscription_id)
      .maybeSingle();
    const s = sub as {
      owner_user_id: string | null;
      listing_id: string | null;
      status: string | null;
      stripe_customer_id: string | null;
    } | null;
    if (!s) return null;
    if (String(s.listing_id ?? "") !== listingId) return null;
    if (s.owner_user_id && String(s.owner_user_id) !== ownerUserId) return null;
    if (s.stripe_customer_id && s.stripe_customer_id !== row.stripe_customer_id) return null;
    if (s.status !== "active" && s.status !== "grace") return null;
    return String(row.stripe_customer_id);
  } catch {
    return null;
  }
}

/**
 * Is this FULL base checkout an upgrade of a listing that is already live on SIMPLE?
 *
 * Read by the Revenue OS checkout route so an upgrade never runs the first-purchase machinery:
 * a live listing must not be pushed back to `pending_payment` (that would take a paying
 * customer's ad offline in order to charge them more), and a "not payable status" pre-flight
 * written for first purchases must not refuse it. Ownership is NOT re-checked here — the caller
 * already enforces it — and the answer only ever relaxes first-purchase handling for a listing
 * that the entitlement table says is already paid and live.
 */
export async function isBusinessBaseUpgradeInPlace(input: {
  category: string;
  packageKey: string;
  listingId: string;
}): Promise<boolean> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  const listingId = String(input.listingId ?? "").trim();
  const source = businessCategoryListingSource(category);
  if (!source || !listingId) return false;
  if (!packageKey || packageKey !== upgradeTargetPackageKey(category)) return false;

  try {
    const access = await resolveBusinessAccess({
      category,
      listingSource: source.table,
      listingId,
    });
    return access.level === "simple";
  } catch {
    return false;
  }
}
