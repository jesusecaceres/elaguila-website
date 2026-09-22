/**
 * Server read for `evaluateListingPackagePaymentAuthority`.
 *
 * Replaces listing-only `hasClearedManualPaymentForListing`. Publication must call this before
 * any listing status write. Nothing here writes. Nothing here trusts a request body, query
 * string, or a generic mutable verified-state column.
 *
 * Honest runtime contracts:
 * - Query errors from payment, entitlement, or Rewards reads fail closed (`ledger_read_failed`).
 * - An active entitlement is not payment. Only the documented prepaid/included grant
 *   (`grant_source = print_included`) plus exact listing_source/category/package may satisfy
 *   publication without a matching payment record.
 * - `leonix_credits_applied_cents` in payment metadata never counts unless matching committed
 *   `leonix_rewards_redemptions` rows exist.
 * - This reader does not detect `replayed: true`. Database idempotency for Rewards is the unique
 *   index `leonix_rewards_redemptions_idempotency_idx` on `idempotency_key`. There is no
 *   `replayed` column on `leonix_rewards_redemptions`.
 * - `stripe_terminal` is an evaluator-recognized source. Inserts currently fail
 *   `leonix_payment_records_source_chk` until the additive unapplied migration
 *   `20260922190000_leonix_payment_records_source_stripe_terminal.sql` is applied.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  evaluateListingPackagePaymentAuthority,
  paymentAuthorityHttpError,
  type ListingPackagePaymentAuthorityDecision,
  type LiveEntitlementFacts,
  type PaymentAuthorityRecordFacts,
  type RewardsCommitFacts,
} from "./listingPackagePaymentAuthority";

const PAYMENT_SELECT =
  "id, listing_source, listing_id, category, package_key, currency, source, payment_status, manual_state, amount_cents, amount_total_cents, amount_paid_cents, refunded_at, canceled_at, verified_intro_discount_redemption_id, metadata";

const ENTITLEMENT_SELECT =
  "id, listing_id, listing_source, category, package_key, status, revoked_at, starts_at, ends_at, grant_source, payment_record_id, metadata";

export type AuthoritativePaymentQuery = {
  listingSource: string;
  listingId: string;
  packageKey: string;
  category?: string | null;
  currency?: string | null;
};

function asRecord(row: unknown): PaymentAuthorityRecordFacts {
  const r = (row ?? {}) as Record<string, unknown>;
  return {
    id: r.id == null ? null : String(r.id),
    listing_source: r.listing_source == null ? null : String(r.listing_source),
    listing_id: r.listing_id == null ? null : String(r.listing_id),
    category: r.category == null ? null : String(r.category),
    package_key: r.package_key == null ? null : String(r.package_key),
    currency: r.currency == null ? null : String(r.currency),
    source: r.source == null ? null : String(r.source),
    payment_status: r.payment_status == null ? null : String(r.payment_status),
    manual_state: r.manual_state == null ? null : String(r.manual_state),
    amount_cents: r.amount_cents == null ? null : Number(r.amount_cents),
    amount_total_cents: r.amount_total_cents == null ? null : Number(r.amount_total_cents),
    amount_paid_cents: r.amount_paid_cents == null ? null : Number(r.amount_paid_cents),
    refunded_at: r.refunded_at == null ? null : String(r.refunded_at),
    canceled_at: r.canceled_at == null ? null : String(r.canceled_at),
    verified_intro_discount_redemption_id:
      r.verified_intro_discount_redemption_id == null ? null : String(r.verified_intro_discount_redemption_id),
    metadata: r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : null,
  };
}

function asEntitlement(row: unknown): LiveEntitlementFacts {
  const r = (row ?? {}) as Record<string, unknown>;
  return {
    listing_id: r.listing_id == null ? null : String(r.listing_id),
    listing_source: r.listing_source == null ? null : String(r.listing_source),
    category: r.category == null ? null : String(r.category),
    package_key: r.package_key == null ? null : String(r.package_key),
    status: r.status == null ? null : String(r.status),
    revoked_at: r.revoked_at == null ? null : String(r.revoked_at),
    starts_at: r.starts_at == null ? null : String(r.starts_at),
    ends_at: r.ends_at == null ? null : String(r.ends_at),
    grant_source: r.grant_source == null ? null : String(r.grant_source),
    payment_record_id: r.payment_record_id == null ? null : String(r.payment_record_id),
    metadata: r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : null,
  };
}

export async function readListingPackagePaymentAuthority(
  input: AuthoritativePaymentQuery,
): Promise<ListingPackagePaymentAuthorityDecision> {
  const listingId = String(input.listingId ?? "").trim();
  const packageKey = String(input.packageKey ?? "").trim();
  const listingSource = String(input.listingSource ?? "").trim();
  if (!listingId) return { ok: false, error: "missing_listing" };
  if (!packageKey) return { ok: false, error: "missing_package_key" };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "ledger_read_failed" };

  const supabase = getAdminSupabase();
  const [payments, entitlements] = await Promise.all([
    supabase.from("leonix_payment_records").select(PAYMENT_SELECT).eq("listing_id", listingId).limit(25),
    supabase
      .from("listing_package_entitlements")
      .select(ENTITLEMENT_SELECT)
      .eq("listing_id", listingId)
      .eq("package_key", packageKey)
      .limit(25),
  ]);

  if (payments.error) return { ok: false, error: "ledger_read_failed" };
  if (entitlements.error) return { ok: false, error: "ledger_read_failed" };

  const records = ((payments.data ?? []) as unknown[]).map(asRecord);
  const paymentIds = records.map((r) => r.id).filter((id): id is string => Boolean(id));
  let rewards: RewardsCommitFacts[] = [];
  if (paymentIds.length) {
    const redemption = await supabase
      .from("leonix_rewards_redemptions")
      .select("id, payment_record_id, status, amount_cents")
      .in("payment_record_id", paymentIds)
      .limit(25);
    if (redemption.error) return { ok: false, error: "ledger_read_failed" };
    rewards = ((redemption.data ?? []) as Record<string, unknown>[]).map((row) => {
      const payment = records.find((r) => r.id === String(row.payment_record_id ?? ""));
      return {
        listing_id: payment?.listing_id ?? listingId,
        package_key: payment?.package_key ?? packageKey,
        status: row.status == null ? null : String(row.status),
        credits_applied_cents: row.amount_cents == null ? null : Number(row.amount_cents),
      };
    });
  }

  return evaluateListingPackagePaymentAuthority({
    listingSource,
    listingId,
    packageKey,
    category: input.category ?? null,
    currency: input.currency ?? "usd",
    records,
    entitlements: ((entitlements.data ?? []) as unknown[]).map(asEntitlement),
    rewards,
  });
}

export async function hasAuthoritativePaymentForListingPackage(
  input: AuthoritativePaymentQuery,
): Promise<boolean> {
  const decision = await readListingPackagePaymentAuthority(input);
  return decision.ok;
}

export async function refuseUnlessAuthoritativePayment(input: AuthoritativePaymentQuery): Promise<
  | { ok: true; decision: Extract<ListingPackagePaymentAuthorityDecision, { ok: true }> }
  | { ok: false; status: 402; error: string; paymentState: string; decision: ListingPackagePaymentAuthorityDecision }
> {
  const decision = await readListingPackagePaymentAuthority(input);
  if (decision.ok) return { ok: true, decision };
  const http = paymentAuthorityHttpError(decision);
  return { ok: false, status: http.status, error: http.error, paymentState: http.paymentState, decision };
}
