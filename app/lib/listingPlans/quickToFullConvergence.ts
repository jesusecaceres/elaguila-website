/**
 * Gate QB-CONVERGENCE-02 — Quick→Full convergence, production adapter.
 *
 * This file is the THIN server-only edge of the subsystem. It owns no policy:
 *  - every decision lives in `quickToFullConvergencePure.ts` (pure, test-importable)
 *  - the orchestration lives in `quickToFullConvergenceCore.ts` (port-injected, test-importable)
 *  - this file only builds the real Stripe / Supabase / audit ports and delegates.
 *
 * WHAT CHANGED VS THE PREVIOUS IMPLEMENTATION, AND WHY:
 * The prior version set `cancel_at_period_end = true`. That is not convergence — it leaves the
 * customer paying BOTH the Quick and the Full subscription for up to a full month. The owner
 * policy is immediate convergence once the Full payment is authoritative, so this version
 * cancels the superseded Quick subscription now, with proration so the customer is credited for
 * the unused remainder rather than forfeiting it.
 */
import "server-only";

import Stripe from "stripe";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { writeRevenueAuditLog } from "./revenueAuditLog";
import {
  executeQuickToFullConvergence,
  type ConvergenceAuditEntry,
  type ConvergenceAuditPort,
  type ConvergenceExecutionResult,
  type ConvergenceLedgerPort,
  type ConvergenceStripePort,
} from "./quickToFullConvergenceCore";
import type { FullPaymentFact } from "./quickToFullConvergencePure";

// Re-exported so existing importers of these names keep working.
export {
  FULL_BASE_PACKAGE_PREFIXES,
  QUICK_PACKAGE_KEYS_BY_CATEGORY,
  isFullBasePackageKey,
  quickPackageKeyForCategory,
} from "./quickToFullConvergencePure";

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

function buildStripePort(stripe: Stripe): ConvergenceStripePort {
  return {
    async retrieveSubscription(subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const customer = sub.customer;
        const customerId = typeof customer === "string" ? customer : (customer?.id ?? null);
        return {
          ok: true,
          status: String(sub.status),
          cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
          customerId,
        };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "unknown" };
      }
    },
    async cancelSubscriptionImmediately(subscriptionId, opts) {
      try {
        // `subscriptions.cancel` ends the subscription NOW. `prorate` credits the unused
        // remainder of the period the customer already paid for. The idempotency key makes a
        // redelivered webhook replay the original response instead of cancelling twice.
        const cancelled = await stripe.subscriptions.cancel(
          subscriptionId,
          { prorate: opts.prorate },
          { idempotencyKey: opts.idempotencyKey },
        );
        // Metadata is recorded separately: `cancel` does not accept a metadata update, and a
        // failure to annotate must never make a successful cancellation look failed.
        try {
          await stripe.subscriptions.update(subscriptionId, { metadata: opts.metadata });
        } catch {
          /* annotation is best-effort */
        }
        return { ok: true, status: String(cancelled.status) };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "unknown" };
      }
    },
  };
}

function buildLedgerPort(): ConvergenceLedgerPort {
  return {
    async findPaidQuickSubscription(query) {
      if (!isSupabaseAdminConfigured()) return { ok: false, error: "db_not_configured" };
      const db = getAdminSupabase();
      const { data, error } = await db
        .from("leonix_payment_records")
        .select("owner_user_id, category, package_key, listing_id, stripe_subscription_id, stripe_customer_id")
        .eq("owner_user_id", query.ownerUserId)
        .eq("category", query.category)
        // Scoped to the EXACT listing being upgraded: another listing's Quick subscription (same
        // owner, same category, same package key) must never be picked up.
        .eq("listing_id", query.listingId)
        .eq("package_key", query.quickPackageKey)
        .eq("billing_mode", "subscription")
        .eq("payment_status", "paid")
        .not("stripe_subscription_id", "is", null)
        .order("paid_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return { ok: false, error: error.message.slice(0, 300) };
      if (!data?.stripe_subscription_id) return { ok: true, record: null };
      const row = data as {
        owner_user_id: string;
        category: string;
        package_key: string;
        listing_id: string | null;
        stripe_subscription_id: string;
        stripe_customer_id: string | null;
      };
      return {
        ok: true,
        record: {
          ownerUserId: String(row.owner_user_id),
          category: String(row.category),
          packageKey: String(row.package_key),
          listingId: row.listing_id ? String(row.listing_id) : null,
          stripeSubscriptionId: String(row.stripe_subscription_id),
          stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
        },
      };
    },
  };
}

const AUDIT_ACTION_BY_OUTCOME = {
  attempted: "revenue_quick_to_full_convergence_attempted",
  completed: "revenue_quick_to_full_convergence_completed",
  skipped: "revenue_quick_to_full_convergence_skipped",
  refused: "revenue_quick_to_full_convergence_failed",
  failed: "revenue_quick_to_full_convergence_failed",
} as const;

function buildAuditPort(paymentRecordId: string): ConvergenceAuditPort {
  return {
    async record(entry: ConvergenceAuditEntry) {
      await writeRevenueAuditLog({
        action: AUDIT_ACTION_BY_OUTCOME[entry.outcome],
        targetType: "leonix_payment_records",
        targetId: paymentRecordId,
        meta: {
          convergence_outcome: entry.outcome,
          convergence_reason: entry.reason ?? null,
          quick_subscription_id: entry.quickSubscriptionId ?? null,
          new_package_key: entry.newPackageKey,
          owner_user_id: entry.ownerUserId,
          category: entry.category,
          listing_id: entry.listingId ?? null,
          stripe_event_id: entry.eventId,
          error: entry.error ?? null,
          // `failed` is the only retryable state; surfaced explicitly so an operator can query it.
          retryable: entry.outcome === "failed",
        },
      }).catch(() => undefined);
    },
  };
}

/**
 * Converge a customer's superseded Quick subscription after an authoritative Full payment.
 *
 * Returns a structured result rather than throwing: the caller (webhook fulfillment) must never
 * fail a settled payment because convergence had trouble. A `failed` outcome is recorded as
 * retryable in the audit log so it stays visible instead of being silently swallowed.
 */
export async function convergeQuickToFullAfterPayment(input: {
  full: FullPaymentFact;
  eventId: string;
  paymentRecordId: string;
}): Promise<ConvergenceExecutionResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    await buildAuditPort(input.paymentRecordId).record({
      outcome: "failed",
      eventId: input.eventId,
      ownerUserId: input.full.ownerUserId,
      category: input.full.category,
      newPackageKey: input.full.packageKey,
      reason: "stripe_not_configured",
    });
    return { ok: false, outcome: "failed", reason: "stripe_not_configured", retryable: true };
  }

  return executeQuickToFullConvergence({
    full: input.full,
    eventId: input.eventId,
    ports: {
      stripe: buildStripePort(stripe),
      ledger: buildLedgerPort(),
      audit: buildAuditPort(input.paymentRecordId),
    },
  });
}
