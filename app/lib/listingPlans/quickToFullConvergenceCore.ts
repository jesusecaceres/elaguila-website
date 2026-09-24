/**
 * Gate QB-CONVERGENCE-02 — convergence EXECUTOR with injected ports.
 *
 * Deliberately NOT `server-only`: the real Stripe and Supabase clients arrive through the port
 * interfaces below, so `scripts/verify-quick-convergence-behavior-01.ts` can drive this exact
 * code path with fakes and assert on real outcomes. The `server-only` adapter that supplies the
 * production ports is `quickToFullConvergence.ts`.
 *
 * This is the file that makes the convergence claim provable rather than asserted: every branch
 * an operator cares about (completed, skipped, refused, failed-and-retryable) is reachable from a
 * test without a live Stripe account.
 */
import {
  planQuickToFullConvergence,
  quickPackageKeyForCategory,
  type ConvergenceAuditOutcome,
  type ConvergencePlan,
  type FullPaymentFact,
  type QuickSubscriptionSnapshot,
} from "./quickToFullConvergencePure";

/** What the executor needs from Stripe. Implemented for real in the server-only adapter. */
export type ConvergenceStripePort = {
  retrieveSubscription(subscriptionId: string): Promise<
    | { ok: true; status: string; cancelAtPeriodEnd: boolean; customerId: string | null }
    | { ok: false; error: string }
  >;
  /**
   * Cancel NOW (not at period end), crediting unused paid time via proration.
   * `idempotencyKey` is passed to Stripe so a redelivered webhook cannot double-cancel.
   */
  cancelSubscriptionImmediately(
    subscriptionId: string,
    opts: { prorate: boolean; idempotencyKey: string; metadata: Record<string, string> },
  ): Promise<{ ok: true; status: string } | { ok: false; error: string }>;
};

/** What the executor needs from the payment ledger. */
export type ConvergenceLedgerPort = {
  findPaidQuickSubscription(query: {
    ownerUserId: string;
    category: string;
    quickPackageKey: string;
  }): Promise<
    | {
        ok: true;
        record: {
          ownerUserId: string;
          category: string;
          packageKey: string;
          stripeSubscriptionId: string;
          stripeCustomerId: string | null;
        } | null;
      }
    | { ok: false; error: string }
  >;
};

export type ConvergenceAuditEntry = {
  outcome: ConvergenceAuditOutcome;
  eventId: string;
  ownerUserId: string;
  category: string;
  newPackageKey: string;
  reason?: string;
  quickSubscriptionId?: string;
  error?: string;
};

export type ConvergenceAuditPort = {
  record(entry: ConvergenceAuditEntry): Promise<void>;
};

export type ConvergencePorts = {
  stripe: ConvergenceStripePort;
  ledger: ConvergenceLedgerPort;
  audit: ConvergenceAuditPort;
};

export type ConvergenceExecutionResult =
  | { ok: true; outcome: "completed"; quickSubscriptionId: string }
  | { ok: true; outcome: "skipped"; reason: string }
  | { ok: false; outcome: "refused"; reason: string; retryable: false }
  | { ok: false; outcome: "failed"; reason: string; retryable: true };

/**
 * Stable Stripe idempotency key. Keyed on the Stripe EVENT plus the subscription being
 * cancelled, so a duplicate delivery of the same event reuses the same key (Stripe then
 * replays the original response instead of performing a second cancellation), while a
 * genuinely different event still gets its own key.
 */
export function convergenceIdempotencyKey(eventId: string, subscriptionId: string): string {
  return `leonix_qtf_${eventId}_${subscriptionId}`.slice(0, 255);
}

/**
 * Run convergence for one authoritative Full payment.
 *
 * Ordering is deliberate:
 *  1. A pure pre-check against a null snapshot rules out every decision that does not depend on
 *     the Quick subscription at all — so a non-Full package or an unpaid checkout never touches
 *     Stripe or the database.
 *  2. Only then is the ledger queried, and only then Stripe.
 *  3. The pure planner makes the final call; this function only performs it.
 */
export async function executeQuickToFullConvergence(input: {
  full: FullPaymentFact;
  eventId: string;
  ports: ConvergencePorts;
}): Promise<ConvergenceExecutionResult> {
  const { full, eventId, ports } = input;

  const auditBase = {
    eventId,
    ownerUserId: full.ownerUserId,
    category: full.category,
    newPackageKey: full.packageKey,
  };

  // 1. Snapshot-independent pre-check. Any skip other than "no_quick_subscription" is final here.
  const preCheck = planQuickToFullConvergence(full, null);
  if (preCheck.action === "skip" && preCheck.reason !== "no_quick_subscription") {
    await ports.audit.record({ ...auditBase, outcome: "skipped", reason: preCheck.reason });
    return { ok: true, outcome: "skipped", reason: preCheck.reason };
  }

  // Past this point convergence is genuinely being attempted.
  await ports.audit.record({ ...auditBase, outcome: "attempted" });

  const quickPackageKey = quickPackageKeyForCategory(full.category);
  if (!quickPackageKey) {
    // Unreachable via the pre-check above; kept as a total-function guard.
    await ports.audit.record({ ...auditBase, outcome: "skipped", reason: "no_quick_package_for_category" });
    return { ok: true, outcome: "skipped", reason: "no_quick_package_for_category" };
  }

  // 2. Ledger lookup.
  const found = await ports.ledger.findPaidQuickSubscription({
    ownerUserId: full.ownerUserId,
    category: full.category,
    quickPackageKey,
  });
  if (!found.ok) {
    await ports.audit.record({ ...auditBase, outcome: "failed", reason: "ledger_lookup_failed", error: found.error });
    return { ok: false, outcome: "failed", reason: "ledger_lookup_failed", retryable: true };
  }
  if (!found.record) {
    await ports.audit.record({ ...auditBase, outcome: "skipped", reason: "no_quick_subscription" });
    return { ok: true, outcome: "skipped", reason: "no_quick_subscription" };
  }

  const record = found.record;

  // 3. Live Stripe state for that subscription.
  const retrieved = await ports.stripe.retrieveSubscription(record.stripeSubscriptionId);
  if (!retrieved.ok) {
    await ports.audit.record({
      ...auditBase,
      outcome: "failed",
      reason: "stripe_retrieve_failed",
      quickSubscriptionId: record.stripeSubscriptionId,
      error: retrieved.error,
    });
    return { ok: false, outcome: "failed", reason: "stripe_retrieve_failed", retryable: true };
  }

  const snapshot: QuickSubscriptionSnapshot = {
    ownerUserId: record.ownerUserId,
    category: record.category,
    packageKey: record.packageKey,
    stripeSubscriptionId: record.stripeSubscriptionId,
    // Stripe is authoritative for the customer; fall back to the ledger's copy.
    stripeCustomerId: retrieved.customerId ?? record.stripeCustomerId,
    status: retrieved.status,
    cancelAtPeriodEnd: retrieved.cancelAtPeriodEnd,
  };

  // 4. The decision.
  const plan: ConvergencePlan = planQuickToFullConvergence(full, snapshot);

  if (plan.action === "skip") {
    await ports.audit.record({
      ...auditBase,
      outcome: "skipped",
      reason: plan.reason,
      quickSubscriptionId: record.stripeSubscriptionId,
    });
    return { ok: true, outcome: "skipped", reason: plan.reason };
  }

  if (plan.action === "refuse") {
    await ports.audit.record({
      ...auditBase,
      outcome: "refused",
      reason: plan.reason,
      quickSubscriptionId: record.stripeSubscriptionId,
    });
    return { ok: false, outcome: "refused", reason: plan.reason, retryable: false };
  }

  // 5. Perform the immediate cancellation.
  const cancelled = await ports.stripe.cancelSubscriptionImmediately(plan.quickSubscriptionId, {
    prorate: plan.prorate,
    idempotencyKey: convergenceIdempotencyKey(eventId, plan.quickSubscriptionId),
    metadata: {
      leonix_convergence_event_id: eventId.slice(0, 255),
      leonix_convergence_reason: "quick_to_full_upgrade",
      leonix_new_package_key: full.packageKey.slice(0, 100),
    },
  });

  if (!cancelled.ok) {
    await ports.audit.record({
      ...auditBase,
      outcome: "failed",
      reason: "stripe_cancel_failed",
      quickSubscriptionId: plan.quickSubscriptionId,
      error: cancelled.error,
    });
    return { ok: false, outcome: "failed", reason: "stripe_cancel_failed", retryable: true };
  }

  await ports.audit.record({
    ...auditBase,
    outcome: "completed",
    quickSubscriptionId: plan.quickSubscriptionId,
  });
  return { ok: true, outcome: "completed", quickSubscriptionId: plan.quickSubscriptionId };
}
