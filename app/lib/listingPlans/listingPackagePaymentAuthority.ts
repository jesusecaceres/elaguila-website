/**
 * Canonical publish payment/entitlement decision (pure: no DB, no Stripe, no env).
 *
 * Question this module answers:
 *   Does this exact listing have sufficient authoritative, non-reversed payment/entitlement
 *   for this exact package and amount?
 *
 * Listing-only clearance (`manual_state='cleared'` on any row for the listing) is not sufficient.
 * A cleared Quick $249 / $211.65 payment can never publish Full $399. A Full payment cannot be
 * reinterpreted as Quick by a body or query parameter. Query-string Payment Tracker prefills are
 * not consulted here at all.
 */

import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "./businessAccessLevel";
import { isListingPackageEntitlementRowActive } from "./listingPackageEntitlementPlacement";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";
import {
  DEFAULT_RAIL_MINIMUM_CHARGE_CENTS,
  maxRedeemableForPurchaseCents,
} from "@/app/lib/rewards/rewardsPolicy";

/** Documented first Quick invoice after the 15% verified-intro discount: $211.65. */
export const VERIFIED_INTRO_PERCENT = 15;
export const VERIFIED_INTRO_QUICK_FIRST_INVOICE_CENTS = 21165;
export const QUICK_BUSINESS_LIST_PRICE_CENTS = 24900;
export const FULL_BUSINESS_LIST_PRICE_CENTS = 39900;

export const SETTLED_PAYMENT_STATUSES = ["paid", "succeeded"] as const;
export const FAILED_CLOSED_PAYMENT_STATUSES = [
  "pending",
  "unpaid",
  "requires_action",
  "failed",
  "canceled",
  "refunded",
  "disputed",
  "unknown",
] as const;

export const AUTHORITATIVE_PAYMENT_SOURCES = [
  "admin_manual",
  "stripe_checkout",
  "stripe_webhook",
  "stripe_terminal",
] as const;

export type ListingPackagePaymentAuthorityError =
  | "missing_listing"
  | "missing_package_key"
  | "unknown_package"
  | "no_matching_record"
  | "pending_payment"
  | "rejected_payment"
  | "reversed_payment"
  | "refunded_payment"
  | "disputed_payment"
  | "canceled_payment"
  | "expired_payment"
  | "wrong_package"
  | "wrong_listing"
  | "wrong_source"
  | "wrong_currency"
  | "underpaid"
  | "rewards_not_committed"
  | "rewards_over_redemption"
  | "rewards_replay"
  | "owner_override_not_payment";

export type PaymentAuthorityRecordFacts = {
  id?: string | null;
  listing_source?: string | null;
  listing_id?: string | null;
  category?: string | null;
  package_key?: string | null;
  currency?: string | null;
  source?: string | null;
  payment_status?: string | null;
  manual_state?: string | null;
  amount_cents?: number | null;
  amount_total_cents?: number | null;
  amount_paid_cents?: number | null;
  refunded_at?: string | null;
  canceled_at?: string | null;
  verified_intro_discount_redemption_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type LiveEntitlementFacts = {
  listing_id?: string | null;
  package_key?: string | null;
  status?: string | null;
  revoked_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type RewardsCommitFacts = {
  listing_id?: string | null;
  package_key?: string | null;
  status?: string | null;
  credits_applied_cents?: number | null;
  replayed?: boolean | null;
};

export type ListingPackagePaymentAuthorityInput = {
  listingSource: string;
  listingId: string;
  packageKey: string;
  category?: string | null;
  currency?: string | null;
  records?: readonly PaymentAuthorityRecordFacts[] | null;
  entitlements?: readonly LiveEntitlementFacts[] | null;
  rewards?: readonly RewardsCommitFacts[] | null;
  now?: Date | string | number | null;
};

export type ListingPackagePaymentAuthorityDecision =
  | {
      ok: true;
      reason: "payment_record" | "live_entitlement";
      paymentRecordId: string | null;
      source: string;
      coveredCents: number;
      expectedCents: number;
    }
  | { ok: false; error: ListingPackagePaymentAuthorityError };

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function lower(value: unknown): string {
  return trimmed(value).toLowerCase();
}

function asCents(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n);
}

export function verifiedIntroFirstInvoiceCents(listPriceCents: number): number {
  const list = Math.max(0, Math.floor(listPriceCents));
  return list - Math.floor((list * VERIFIED_INTRO_PERCENT) / 100);
}

/** Quick $249 Simple keys — the only packages eligible for the $211.65 first invoice. */
export function isQuickSimpleBusinessPackageKey(packageKey: string | null | undefined): boolean {
  const key = lower(packageKey);
  if (!key) return false;
  return Object.values(BUSINESS_CATEGORY_PACKAGE_PAIR).some((pair) => pair.simple === key);
}

export function canonicalExpectedAmountCents(input: {
  packageKey: string;
  verifiedIntro?: boolean;
}): { ok: true; expectedCents: number } | { ok: false; error: "unknown_package" } {
  const def = getRevenuePackageDefinition(input.packageKey);
  if (!def) return { ok: false, error: "unknown_package" };
  if (input.verifiedIntro && isQuickSimpleBusinessPackageKey(def.packageKey) && def.priceCents === QUICK_BUSINESS_LIST_PRICE_CENTS) {
    return { ok: true, expectedCents: verifiedIntroFirstInvoiceCents(def.priceCents) };
  }
  return { ok: true, expectedCents: def.priceCents };
}

export function canonicalRecordableAmountsCents(packageKey: string): number[] {
  const def = getRevenuePackageDefinition(packageKey);
  if (!def) return [];
  const amounts = [def.priceCents];
  if (isQuickSimpleBusinessPackageKey(def.packageKey) && def.priceCents === QUICK_BUSINESS_LIST_PRICE_CENTS) {
    const intro = verifiedIntroFirstInvoiceCents(def.priceCents);
    if (!amounts.includes(intro)) amounts.push(intro);
  }
  return amounts;
}

export function isCanonicalRecordedAmountForPackage(packageKey: string, amountCents: number): boolean {
  return canonicalRecordableAmountsCents(packageKey).includes(Math.floor(amountCents));
}

function creditsAppliedFromMetadata(metadata: Record<string, unknown> | null | undefined): {
  creditsCents: number;
  amountIsNetOfCredits: boolean;
} {
  if (!metadata || typeof metadata !== "object") return { creditsCents: 0, amountIsNetOfCredits: false };
  return {
    creditsCents: Math.max(0, asCents(metadata.leonix_credits_applied_cents)),
    amountIsNetOfCredits: metadata.leonix_amount_is_net_of_credits === true,
  };
}

function railPaidCents(record: PaymentAuthorityRecordFacts): number {
  const paid = record.amount_paid_cents;
  if (paid != null && Number.isFinite(Number(paid)) && Number(paid) > 0) return asCents(paid);
  if (record.amount_total_cents != null && Number.isFinite(Number(record.amount_total_cents))) {
    return asCents(record.amount_total_cents);
  }
  return asCents(record.amount_cents);
}

function coveredCents(record: PaymentAuthorityRecordFacts, extraCommittedCredits: number): number {
  const rail = railPaidCents(record);
  const meta = creditsAppliedFromMetadata(record.metadata);
  const credits = Math.max(meta.creditsCents, Math.max(0, extraCommittedCredits));
  if (meta.amountIsNetOfCredits || (credits > 0 && rail < credits + DEFAULT_RAIL_MINIMUM_CHARGE_CENTS)) {
    return rail + credits;
  }
  return Math.max(rail, credits);
}

function recordMatchesListing(
  record: PaymentAuthorityRecordFacts,
  listingSource: string,
  listingId: string,
  category: string,
): ListingPackagePaymentAuthorityError | null {
  if (lower(record.listing_id) !== lower(listingId)) return "wrong_listing";
  const src = lower(record.listing_source);
  if (!src) {
    const recCat = lower(record.category);
    if (recCat && recCat !== lower(category) && recCat !== lower(listingSource)) return "wrong_source";
    return null;
  }
  if (src === lower(listingSource) || src === lower(category)) return null;
  return "wrong_source";
}

function sourceSettledError(record: PaymentAuthorityRecordFacts): ListingPackagePaymentAuthorityError | null {
  const source = lower(record.source);
  const status = lower(record.payment_status);
  const manual = lower(record.manual_state);

  if (record.refunded_at) return "refunded_payment";
  if (status === "refunded") return "refunded_payment";
  if (status === "disputed") return "disputed_payment";
  if (status === "canceled") return "canceled_payment";
  if (status === "failed") return "rejected_payment";
  if (manual === "reversed") return "reversed_payment";
  if (manual === "rejected") return "rejected_payment";

  if (source === "owner_override" || source === "unknown") return "owner_override_not_payment";
  if (!(AUTHORITATIVE_PAYMENT_SOURCES as readonly string[]).includes(source)) {
    return "wrong_source";
  }

  if (source === "admin_manual") {
    if (manual === "pending_verification" || status === "pending" || status === "unpaid" || status === "requires_action") {
      return "pending_payment";
    }
    if (manual !== "cleared") return "pending_payment";
    if (!(SETTLED_PAYMENT_STATUSES as readonly string[]).includes(status) && status !== "") {
      // A cleared manual row is also stamped payment_status=paid by verifyManualPaymentCleared.
      // Empty status on a fixture that only set manual_state=cleared is treated as settled only
      // when manual_state is cleared — still package-bound by the caller.
      if (status && !(SETTLED_PAYMENT_STATUSES as readonly string[]).includes(status)) return "pending_payment";
    }
    return null;
  }

  if (!(SETTLED_PAYMENT_STATUSES as readonly string[]).includes(status)) {
    if (status === "pending" || status === "unpaid" || status === "requires_action" || !status) return "pending_payment";
    return "pending_payment";
  }
  return null;
}

function firstClosedError(errors: ListingPackagePaymentAuthorityError[]): ListingPackagePaymentAuthorityError {
  const rank: ListingPackagePaymentAuthorityError[] = [
    "wrong_listing",
    "wrong_package",
    "wrong_source",
    "wrong_currency",
    "refunded_payment",
    "disputed_payment",
    "reversed_payment",
    "rejected_payment",
    "canceled_payment",
    "expired_payment",
    "owner_override_not_payment",
    "rewards_replay",
    "rewards_not_committed",
    "rewards_over_redemption",
    "underpaid",
    "pending_payment",
    "no_matching_record",
  ];
  for (const code of rank) {
    if (errors.includes(code)) return code;
  }
  return errors[0] ?? "no_matching_record";
}

/**
 * One exact decision for one listing + one required package. Never consults request bodies,
 * query strings, or "any cleared payment on this listing."
 */
export function evaluateListingPackagePaymentAuthority(
  input: ListingPackagePaymentAuthorityInput,
): ListingPackagePaymentAuthorityDecision {
  const listingId = trimmed(input.listingId);
  const listingSource = trimmed(input.listingSource);
  const packageKey = lower(input.packageKey);
  const category = lower(input.category) || lower(listingSource);
  const currency = lower(input.currency) || "usd";

  if (!listingId) return { ok: false, error: "missing_listing" };
  if (!packageKey) return { ok: false, error: "missing_package_key" };

  const expected = canonicalExpectedAmountCents({ packageKey });
  if (!expected.ok) return { ok: false, error: "unknown_package" };

  const entitlements = input.entitlements ?? [];
  for (const row of entitlements) {
    if (lower(row.listing_id) !== lower(listingId)) continue;
    if (lower(row.package_key) !== packageKey) continue;
    const dated = isListingPackageEntitlementRowActive({
      status: row.status,
      revoked_at: row.revoked_at,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      now: input.now ?? null,
    });
    const undatedLive =
      !dated &&
      lower(row.status) === "active" &&
      !row.revoked_at &&
      !row.starts_at &&
      !row.ends_at;
    if (dated || undatedLive) {
      return {
        ok: true,
        reason: "live_entitlement",
        paymentRecordId: null,
        source: "listing_package_entitlements",
        coveredCents: expected.expectedCents,
        expectedCents: expected.expectedCents,
      };
    }
  }

  const rewards = input.rewards ?? [];
  if (rewards.some((row) => row.replayed === true && (!lower(row.package_key) || lower(row.package_key) === packageKey))) {
    return { ok: false, error: "rewards_replay" };
  }
  const committedCredits = rewards.reduce((sum, row) => {
    if (lower(row.listing_id) && lower(row.listing_id) !== lower(listingId)) return sum;
    if (lower(row.package_key) && lower(row.package_key) !== packageKey) return sum;
    if (lower(row.status) !== "committed") return sum;
    return sum + Math.max(0, asCents(row.credits_applied_cents));
  }, 0);
  const reservedUncommitted = rewards.some((row) => {
    if (lower(row.listing_id) && lower(row.listing_id) !== lower(listingId)) return false;
    if (lower(row.package_key) && lower(row.package_key) !== packageKey) return false;
    return lower(row.status) === "reserved";
  }) && committedCredits === 0;

  const records = input.records ?? [];
  const closed: ListingPackagePaymentAuthorityError[] = [];
  let pendingSeen = false;

  for (const record of records) {
    const listingErr = recordMatchesListing(record, listingSource, listingId, category);
    if (listingErr) {
      closed.push(listingErr);
      continue;
    }
    if (lower(record.package_key) !== packageKey) {
      closed.push("wrong_package");
      continue;
    }
    const recCurrency = lower(record.currency) || "usd";
    if (recCurrency !== currency) {
      closed.push("wrong_currency");
      continue;
    }
    const sourceErr = sourceSettledError(record);
    if (sourceErr) {
      if (sourceErr === "pending_payment") pendingSeen = true;
      closed.push(sourceErr);
      continue;
    }

    const intro = Boolean(trimmed(record.verified_intro_discount_redemption_id));
    const expectedForRecord = canonicalExpectedAmountCents({ packageKey, verifiedIntro: intro });
    if (!expectedForRecord.ok) {
      closed.push("unknown_package");
      continue;
    }

    const extraCredits = reservedUncommitted ? 0 : committedCredits;
    if (extraCredits > maxRedeemableForPurchaseCents(expectedForRecord.expectedCents)) {
      closed.push("rewards_over_redemption");
      continue;
    }

    const recordForCover = reservedUncommitted ? { ...record, metadata: null } : record;
    const covered = coveredCents(recordForCover, extraCredits);
    if (covered < expectedForRecord.expectedCents) {
      closed.push(reservedUncommitted ? "rewards_not_committed" : "underpaid");
      continue;
    }

    return {
      ok: true,
      reason: "payment_record",
      paymentRecordId: trimmed(record.id) || null,
      source: lower(record.source) || "unknown",
      coveredCents: covered,
      expectedCents: expectedForRecord.expectedCents,
    };
  }

  if (pendingSeen) return { ok: false, error: "pending_payment" };
  if (!records.length && !entitlements.length) return { ok: false, error: "no_matching_record" };
  return { ok: false, error: firstClosedError(closed) };
}

/**
 * HTTP mapping for assisted publish routes. Unpaid / pending keep the historical
 * `manual_payment_not_cleared` code so existing 402 unpaid tests stay exact. Wrong-package and
 * reversal codes are distinct — a Quick payment must never look like "no payment" when Full is
 * selected.
 */
export function paymentAuthorityHttpError(decision: ListingPackagePaymentAuthorityDecision): {
  status: 402;
  error: string;
  paymentState: string;
} {
  if (decision.ok) {
    return { status: 402, error: "manual_payment_not_cleared", paymentState: "not_cleared" };
  }
  if (decision.error === "wrong_package") {
    return { status: 402, error: "wrong_package_payment", paymentState: "wrong_package" };
  }
  if (
    decision.error === "missing_listing" ||
    decision.error === "missing_package_key" ||
    decision.error === "unknown_package" ||
    decision.error === "no_matching_record" ||
    decision.error === "pending_payment"
  ) {
    return { status: 402, error: "manual_payment_not_cleared", paymentState: decision.error };
  }
  return { status: 402, error: decision.error, paymentState: decision.error };
}
