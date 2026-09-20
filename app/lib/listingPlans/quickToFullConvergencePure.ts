/**
 * Gate QB-CONVERGENCE-02 — PURE Quick→Full convergence classification.
 *
 * IO-free by construction: no Stripe client, no Supabase client, no `server-only`
 * import. Every decision this subsystem makes is expressed here as a total function
 * over two plain snapshots, so `scripts/verify-quick-convergence-behavior-01.ts` can
 * prove the real decision logic without a live Stripe or database.
 *
 * OWNER POLICY (selected):
 *  - Quick stays active until authoritative Full payment confirmation.
 *  - A failed or abandoned Full checkout preserves Quick.
 *  - After authoritative Full fulfillment, converge IMMEDIATELY.
 *  - `cancel_at_period_end` is explicitly NOT a completed convergence state: it leaves
 *    up to a month of overlapping recurring billing. A Quick subscription already
 *    flagged `cancel_at_period_end` is therefore still converged (hard-cancelled) here.
 *
 * WHY IMMEDIATE CANCEL AND NOT AN IN-PLACE PRICE SWAP: in this architecture the Full
 * plan is bought through its own Stripe Checkout session, so by the time fulfillment
 * runs the Full subscription ALREADY EXISTS. Swapping the price on the Quick
 * subscription would leave the customer holding two Full subscriptions. The superseded
 * Quick subscription is therefore cancelled, with proration so unused paid time is
 * credited rather than forfeited.
 */

/** The Quick (SIMPLE) monthly package key for each payment-record category. */
export const QUICK_PACKAGE_KEYS_BY_CATEGORY: Readonly<Record<string, string>> = {
  servicios: "servicios_quick_monthly",
  restaurantes: "restaurantes_quick_monthly",
  autos: "autos_dealer_quick_monthly",
  "bienes-raices": "br_agent_quick_monthly",
};

/** Package-key prefixes that identify a FULL base plan purchase. */
export const FULL_BASE_PACKAGE_PREFIXES: readonly string[] = [
  "servicios_base",
  "restaurantes_base",
  "autos_dealer_base",
  "br_agent_base",
];

/**
 * Stripe subscription statuses from which there is nothing left to cancel.
 * `incomplete_expired` never activated; `canceled` is already terminal.
 */
export const TERMINAL_SUBSCRIPTION_STATUSES: readonly string[] = ["canceled", "incomplete_expired"];

export function isFullBasePackageKey(packageKey: string): boolean {
  return FULL_BASE_PACKAGE_PREFIXES.some((prefix) => packageKey.startsWith(prefix));
}

export function quickPackageKeyForCategory(category: string): string | null {
  return QUICK_PACKAGE_KEYS_BY_CATEGORY[category] ?? null;
}

/** The authoritative Full payment fact that triggers convergence. */
export type FullPaymentFact = {
  ownerUserId: string;
  category: string;
  packageKey: string;
  /** True ONLY when the payment is authoritatively settled. Abandoned/failed checkout = false. */
  paid: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

/** The superseded Quick subscription, as read back from the ledger + Stripe. */
export type QuickSubscriptionSnapshot = {
  ownerUserId: string;
  category: string;
  packageKey: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  /** Stripe `subscription.status`. */
  status: string;
  /** Present state of the period-end flag. NOT treated as converged. */
  cancelAtPeriodEnd: boolean;
};

export type ConvergenceSkipReason =
  | "full_payment_not_authoritative"
  | "not_full_base_package"
  | "no_quick_package_for_category"
  | "no_quick_subscription"
  | "same_subscription"
  | "already_canceled";

/**
 * A refusal is louder than a skip: it means the candidate row failed an identity
 * guard and cancelling it could have touched the wrong customer's subscription.
 */
export type ConvergenceRefusalReason =
  | "owner_mismatch"
  | "category_mismatch"
  | "package_mismatch"
  | "customer_mismatch";

export type ConvergencePlan =
  | { action: "skip"; reason: ConvergenceSkipReason }
  | { action: "refuse"; reason: ConvergenceRefusalReason }
  | { action: "cancel_quick_immediately"; quickSubscriptionId: string; prorate: true };

/**
 * Total function: given the Full payment fact and the candidate Quick subscription
 * (or null when none was found), decide exactly what may be done.
 *
 * Ordering matters. Identity guards run BEFORE terminal-state checks so that a
 * mismatched row is reported as a refusal rather than being quietly skipped.
 */
export function planQuickToFullConvergence(
  full: FullPaymentFact,
  quick: QuickSubscriptionSnapshot | null,
): ConvergencePlan {
  // A failed or abandoned Full checkout preserves Quick.
  if (!full.paid) return { action: "skip", reason: "full_payment_not_authoritative" };

  if (!isFullBasePackageKey(full.packageKey)) {
    return { action: "skip", reason: "not_full_base_package" };
  }

  const expectedQuickKey = quickPackageKeyForCategory(full.category);
  if (!expectedQuickKey) return { action: "skip", reason: "no_quick_package_for_category" };

  // Nothing to supersede: safe no-op.
  if (!quick) return { action: "skip", reason: "no_quick_subscription" };

  // Identity guards — never modify an unrelated subscription.
  if (quick.ownerUserId !== full.ownerUserId) return { action: "refuse", reason: "owner_mismatch" };
  if (quick.category !== full.category) return { action: "refuse", reason: "category_mismatch" };
  if (quick.packageKey !== expectedQuickKey) return { action: "refuse", reason: "package_mismatch" };
  if (
    full.stripeCustomerId &&
    quick.stripeCustomerId &&
    full.stripeCustomerId !== quick.stripeCustomerId
  ) {
    return { action: "refuse", reason: "customer_mismatch" };
  }

  // Never cancel the very subscription that was just purchased.
  if (full.stripeSubscriptionId && quick.stripeSubscriptionId === full.stripeSubscriptionId) {
    return { action: "skip", reason: "same_subscription" };
  }

  // Duplicate/retried webhook against an already-cancelled Quick subscription is harmless.
  if (TERMINAL_SUBSCRIPTION_STATUSES.includes(quick.status)) {
    return { action: "skip", reason: "already_canceled" };
  }

  // `cancelAtPeriodEnd === true` deliberately falls through to an immediate cancel:
  // a scheduled period-end cancellation is NOT a completed convergence.
  return { action: "cancel_quick_immediately", quickSubscriptionId: quick.stripeSubscriptionId, prorate: true };
}

/** Audit outcome vocabulary. Every convergence attempt records exactly one of these. */
export const CONVERGENCE_AUDIT_OUTCOMES = ["attempted", "completed", "skipped", "refused", "failed"] as const;
export type ConvergenceAuditOutcome = (typeof CONVERGENCE_AUDIT_OUTCOMES)[number];

/**
 * True when a failed convergence should be retried by a later webhook or an operator.
 * A refusal is never retryable: the data itself is wrong and retrying would not fix it.
 */
export function isRetryableConvergenceFailure(outcome: ConvergenceAuditOutcome): boolean {
  return outcome === "failed";
}
