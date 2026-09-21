/**
 * Package C Build 1 (C3) — subscription lifecycle event handlers.
 *
 * Every handler: validates the object, matches Leonix identity via the leonix_* metadata
 * namespace or the subscription record (events without a Leonix match are IGNORED — this
 * webhook never processes unrelated Stripe traffic), performs an idempotent state transition,
 * and audits. Raw Stripe status is mirrored but never authoritative — the canonical lifecycle
 * lives on leonix_subscription_records (see subscriptionLifecycle.ts).
 *
 * Stripe SDK v22 (post-Basil): current_period_end lives on subscription ITEMS; invoice's
 * subscription pointer moved under parent.subscription_details. Both are read with
 * object-level fallbacks so a pre-Basil account API version degrades safely.
 */

import "server-only";
import Stripe from "stripe";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { writeRevenueAuditLog } from "./revenueAuditLog";
import { attachStripeIdentitiesToConsent } from "./recurringConsent";
import { extendEntitlementForInvoicePaid } from "./revenueEntitlementFulfillment";
import { recordDisputeOnPaymentRecord, recordRefundOnPaymentRecord } from "./refundDisputeFoundations";
import { awardCreditsForSettledPayment, reverseCreditsForRefundOrDispute } from "@/app/lib/rewards/rewardsFulfillment";
import { decideInvoiceRenewalEarn } from "./invoiceRenewalEarnPolicy";
import {
  applyPaymentSuspension,
  computeGraceEndsAt,
  decideSubscriptionTransition,
  isGraceExpired,
  laneSuspensionSpecForCategory,
  liftPaymentSuspension,
  reconcileSubscriptionByStripeId,
  type SubscriptionRecordRow,
} from "./subscriptionLifecycle";

function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return null;
  return new Stripe(secret, { typescript: true });
}

type HandlerResult = { ok: boolean; outcome: "completed" | "ignored" | "failed_retryable" | "failed_terminal"; code?: string };

/** Post-Basil: period end from the first subscription item; object-level fallback for pre-Basil. */
export function readSubscriptionPeriod(subscription: Stripe.Subscription): {
  periodStart: Date | null;
  periodEnd: Date | null;
} {
  const item = subscription.items?.data?.[0] as unknown as Record<string, unknown> | undefined;
  const legacy = subscription as unknown as Record<string, unknown>;
  const startRaw = (item?.current_period_start ?? legacy.current_period_start) as number | undefined;
  const endRaw = (item?.current_period_end ?? legacy.current_period_end) as number | undefined;
  return {
    periodStart: typeof startRaw === "number" ? new Date(startRaw * 1000) : null,
    periodEnd: typeof endRaw === "number" ? new Date(endRaw * 1000) : null,
  };
}

/** Basil moved invoice.subscription under parent.subscription_details; read both. */
export function readInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as Record<string, unknown>).subscription;
  if (typeof legacy === "string" && legacy.trim()) return legacy;
  if (legacy && typeof legacy === "object" && typeof (legacy as { id?: string }).id === "string") {
    return (legacy as { id: string }).id;
  }
  const parent = (invoice as unknown as { parent?: { subscription_details?: { subscription?: unknown } } }).parent;
  const nested = parent?.subscription_details?.subscription;
  if (typeof nested === "string" && nested.trim()) return nested;
  if (nested && typeof nested === "object" && typeof (nested as { id?: string }).id === "string") {
    return (nested as { id: string }).id;
  }
  return null;
}

function isLeonixSubscriptionMetadata(metadata: Record<string, string> | null | undefined): boolean {
  return Boolean(metadata && (metadata.leonix_payment_record_id || metadata.leonix_package_key));
}

async function loadSubscriptionRecord(stripeSubscriptionId: string): Promise<SubscriptionRecordRow | null> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_subscription_records")
    // `owner_user_id` is selected so a renewal invoice can be attributed to a rewards wallet.
    .select("id, status, category, listing_id, package_key, suspension_reason, grace_ends_at, listing_prior_status, listing_suspended_status, package_entitlement_id, metadata, owner_user_id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();
  return (data as SubscriptionRecordRow | null) ?? null;
}

/**
 * checkout.session.completed post-processing for subscription mode: upsert the canonical
 * subscription record, attach Stripe ids to the consent snapshot, and align the entitlement's
 * ends_at to the REAL period end (+7d grace backstop) replacing the fallback +30d if needed.
 */
export async function ensureSubscriptionRecordFromCheckoutSession(input: {
  session: Stripe.Checkout.Session;
  paymentRecordId: string | null;
  packageEntitlementId: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const session = input.session;
  if (session.mode !== "subscription") return;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  if (!stripeSubscriptionId) return;

  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const supabaseEarly = getAdminSupabase();

  // The fulfillment result doesn't expose the entitlement id — resolve it via the payment
  // record linkage (set by the entitlement writer) without reshaping the pinned return type.
  let packageEntitlementId = input.packageEntitlementId;
  if (!packageEntitlementId && input.paymentRecordId) {
    const { data: linked } = await supabaseEarly
      .from("listing_package_entitlements")
      .select("id")
      .eq("payment_record_id", input.paymentRecordId)
      .maybeSingle();
    packageEntitlementId = (linked?.id as string | undefined) ?? null;
  }

  const stripe = getStripeClient();
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  let stripeStatus: string | null = null;
  let priceId: string | null = null;
  if (stripe) {
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ["items"] });
      const period = readSubscriptionPeriod(subscription);
      periodStart = period.periodStart;
      periodEnd = period.periodEnd;
      stripeStatus = subscription.status ?? null;
      priceId = subscription.items?.data?.[0]?.price?.id ?? null;
    } catch {
      // Retrieval failure degrades to the +30d fallback already stamped by the entitlement writer.
    }
  }

  const supabase = getAdminSupabase();
  const { data: upserted } = await supabase
    .from("leonix_subscription_records")
    .upsert(
      {
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
        stripe_checkout_session_id: session.id,
        stripe_price_id: priceId,
        payment_record_id: input.paymentRecordId,
        package_entitlement_id: packageEntitlementId,
        consent_record_id: metadata.leonix_consent_record_id ?? null,
        owner_user_id: metadata.leonix_owner_user_id ?? null,
        category: metadata.leonix_category ?? null,
        listing_source: metadata.leonix_category ?? null,
        listing_id: metadata.leonix_listing_id ?? null,
        package_key: metadata.leonix_package_key ?? null,
        amount_cents: session.amount_total ?? null,
        status: "active",
        stripe_status: stripeStatus,
        current_period_start: periodStart?.toISOString() ?? null,
        current_period_end: periodEnd?.toISOString() ?? null,
        latest_invoice_id: typeof session.invoice === "string" ? session.invoice : session.invoice?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    )
    .select("id")
    .maybeSingle();

  const subscriptionRecordId = (upserted?.id as string | undefined) ?? null;

  if (metadata.leonix_consent_record_id) {
    await attachStripeIdentitiesToConsent(metadata.leonix_consent_record_id, {
      stripeSubscriptionId,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      paymentRecordId: input.paymentRecordId,
    });
  }

  // Align the entitlement with the REAL period end + grace backstop and link the subscription.
  if (packageEntitlementId) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (subscriptionRecordId) patch.subscription_record_id = subscriptionRecordId;
    if (periodEnd) {
      const endsAt = new Date(periodEnd);
      endsAt.setUTCDate(endsAt.getUTCDate() + 7);
      patch.ends_at = endsAt.toISOString();
    }
    await supabase.from("listing_package_entitlements").update(patch).eq("id", packageEntitlementId);
  }
}

/** invoice.paid — advance period, extend the same entitlement, recover grace/suspension. */
export async function handleInvoicePaid(input: {
  invoice: Stripe.Invoice;
  eventId: string;
}): Promise<HandlerResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, outcome: "failed_retryable", code: "supabase_not_configured" };
  const stripeSubscriptionId = readInvoiceSubscriptionId(input.invoice);
  if (!stripeSubscriptionId) return { ok: true, outcome: "ignored", code: "no_subscription" };

  const record = await loadSubscriptionRecord(stripeSubscriptionId);
  if (!record) return { ok: true, outcome: "ignored", code: "not_leonix_subscription" };

  const stripe = getStripeClient();
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  let stripeStatus: string | null = null;
  if (stripe) {
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ["items"] });
      const period = readSubscriptionPeriod(subscription);
      periodStart = period.periodStart;
      periodEnd = period.periodEnd;
      stripeStatus = subscription.status ?? null;
    } catch {
      /* fall through — extension uses invoice line period below if needed */
    }
  }
  if (!periodEnd) {
    const line = input.invoice.lines?.data?.[0];
    const lineEnd = (line as unknown as { period?: { end?: number } })?.period?.end;
    if (typeof lineEnd === "number") periodEnd = new Date(lineEnd * 1000);
  }
  if (!periodEnd) return { ok: false, outcome: "failed_retryable", code: "period_end_unresolvable" };

  const supabase = getAdminSupabase();
  const invoiceId = String(input.invoice.id ?? "");

  // Per-invoice renewal payment record — idempotent via the M5 partial unique index.
  const renewalOwnerUserId = record.owner_user_id ?? null;
  const { data: insertedRenewal, error: invoiceInsertError } = await supabase
    .from("leonix_payment_records")
    .insert({
      category: record.category,
      listing_id: record.listing_id,
      package_key: record.package_key,
      billing_mode: "monthly_subscription",
      amount_cents: input.invoice.amount_paid ?? 0,
      amount_total_cents: input.invoice.amount_paid ?? 0,
      amount_paid_cents: input.invoice.amount_paid ?? 0,
      currency: input.invoice.currency ?? "usd",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      source: "stripe_webhook",
      // Carried onto the renewal row so the rewards wallet resolver has a payer to attribute to.
      // Without it, an eligible renewal earns nothing, which is not the agreed policy.
      owner_user_id: renewalOwnerUserId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_invoice_id: invoiceId,
      stripe_customer_id: typeof input.invoice.customer === "string" ? input.invoice.customer : null,
      metadata: { gate: "PACKAGE-C-BUILD-1-SUBSCRIPTION-LIFECYCLE", stripe_event_id: input.eventId, operation: "subscription_renewal" },
    })
    .select("id")
    .maybeSingle();
  const invoiceReplay = (invoiceInsertError as { code?: string } | null)?.code === "23505";
  if (invoiceInsertError && !invoiceReplay) {
    return { ok: false, outcome: "failed_retryable", code: "invoice_payment_record_failed" };
  }

  // LEONIX IX REWARDS — an eligible recurring renewal earns 9%, exactly like the first payment.
  //
  // The idempotency anchor is the canonical `earn:payment:<paymentRecordId>` key, and the payment
  // record itself is unique per invoice (the M5 partial unique index on stripe_invoice_id). So a
  // redelivered `invoice.paid`, a retried webhook and the overlapping checkout-completion path all
  // converge on the SAME key and award once. On a replay the insert returns no row, so the
  // existing record is read back by invoice id rather than assumed.
  const renewalPaymentRecordId =
    (insertedRenewal as { id?: string } | null)?.id ??
    (invoiceReplay && invoiceId
      ? ((
          await supabase
            .from("leonix_payment_records")
            .select("id")
            .eq("stripe_invoice_id", invoiceId)
            .maybeSingle()
        ).data as { id?: string } | null)?.id ?? null
      : null);

  // A SUBSCRIPTION'S FIRST INVOICE IS NOT A RENEWAL, and it has already earned.
  //
  // Stripe fires `checkout.session.completed` AND `invoice.paid` for a subscription signup. The
  // checkout path awards against ITS payment record; this path creates a SECOND record for the
  // same money (the checkout record carries no stripe_invoice_id, so the M5 unique index cannot
  // collapse them). Awarding here too would earn 9% twice on one payment, every signup.
  //
  // `billing_reason` is Stripe's own name for that first invoice. Anything else — a renewal, a
  // cycle change, a manual invoice — is money the checkout path never saw, and earns normally.
  // FAIL CLOSED WHEN THE SIGNAL IS ABSENT. `billing_reason` is always present on real Stripe
  // subscription invoices, but a replayed, synthesised or older-API-version payload may omit it —
  // and an ABSENT value is not evidence that this is a renewal. Treating it as one would earn 9%
  // a second time on a signup the checkout path already awarded. When we cannot tell, we do not
  // award, and the skip is audited so the gap is visible rather than silent.
  const renewalEarnDecision = decideInvoiceRenewalEarn({
    paymentRecordId: renewalPaymentRecordId,
    billingReason: (input.invoice as unknown as { billing_reason?: string | null }).billing_reason ?? null,
    amountPaidCents: input.invoice.amount_paid ?? 0,
  });

  if (!renewalEarnDecision.earn && renewalEarnDecision.audit && renewalPaymentRecordId) {
    // Not a signup, and not confidently a renewal either. Recorded as retryable so an operator can
    // settle it by hand rather than the customer silently losing credits they were owed.
    await writeRevenueAuditLog({
      action: "revenue_payment_completed",
      targetType: "leonix_rewards_ledger",
      targetId: String(renewalPaymentRecordId),
      meta: {
        rewards_action: "rewards_earn",
        rewards_outcome: "skipped",
        rewards_reason: renewalEarnDecision.reason,
        retryable: true,
        stripe_invoice_id: invoiceId,
      },
    }).catch(() => undefined);
  }

  if (renewalEarnDecision.earn && renewalPaymentRecordId) {
    await awardCreditsForSettledPayment({
      paymentRecordId: String(renewalPaymentRecordId),
      ownerUserId: renewalOwnerUserId,
      amountPaidCents: input.invoice.amount_paid ?? 0,
      // A renewal invoice is charged in full to the card; credits are applied at checkout, not to
      // an automatic renewal, so there is no credit-funded portion to subtract here.
      creditsAppliedCents: 0,
      promoDiscountCents: 0,
      source: "stripe",
      sourceKind: "stripe_payment",
      sourceId: input.eventId,
      // Card money. Pending for the settlement window, exactly like an initial card payment.
      pendingUntilSettlementFinal: true,
    }).catch(() => null);
  }

  // Extend the SAME entitlement row (never duplicate; revive expired; never auto-revive revoked).
  const listingSource = record.category ? String(record.category) : null;
  const extension = await extendEntitlementForInvoicePaid({
    packageEntitlementId: record.package_entitlement_id,
    listingSource,
    listingId: record.listing_id,
    packageKey: record.package_key,
    newPeriodEnd: periodEnd,
    stripeInvoiceId: invoiceId,
    stripeEventId: input.eventId,
  });
  if (!extension.ok && extension.code !== "entitlement_revoked_requires_admin") {
    return { ok: false, outcome: "failed_retryable", code: extension.code };
  }
  // Heal a null pointer discovered via fallback lookup.
  if (extension.ok && extension.entitlementId && extension.entitlementId !== record.package_entitlement_id) {
    await supabase
      .from("leonix_subscription_records")
      .update({ package_entitlement_id: extension.entitlementId })
      .eq("id", record.id);
  }

  const transition = decideSubscriptionTransition(
    (record.status as "active" | "grace" | "suspended" | "pending" | "canceled") ?? "active",
    "invoice_paid",
    { suspensionReason: record.suspension_reason },
  );

  if (transition.effects.includes("restore_visibility") && record.category && record.listing_id) {
    await liftPaymentSuspension(record.category, record.listing_id, record.listing_prior_status);
  }

  await supabase
    .from("leonix_subscription_records")
    .update({
      status: transition.next,
      stripe_status: stripeStatus,
      current_period_start: periodStart?.toISOString() ?? undefined,
      current_period_end: periodEnd.toISOString(),
      last_paid_invoice_id: invoiceId,
      latest_invoice_id: invoiceId,
      ...(transition.effects.includes("record_recovery")
        ? { recovered_at: new Date().toISOString(), grace_started_at: null, grace_ends_at: null, suspended_at: null, suspension_reason: null, listing_prior_status: null, listing_suspended_status: null }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  await writeRevenueAuditLog({
    action: "revenue_entitlement_activated",
    targetType: "subscription",
    targetId: record.id,
    meta: { event: "invoice_paid", stripe_event_id: input.eventId, invoice_id: invoiceId, recovered: transition.effects.includes("record_recovery"), replay: invoiceReplay, revived: extension.ok ? extension.revived === true : false },
  });
  return { ok: true, outcome: "completed" };
}

/** invoice.payment_failed — record delinquency; start the locked 7-day grace on first failure. */
export async function handleInvoicePaymentFailed(input: {
  invoice: Stripe.Invoice;
  eventId: string;
}): Promise<HandlerResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, outcome: "failed_retryable", code: "supabase_not_configured" };
  const stripeSubscriptionId = readInvoiceSubscriptionId(input.invoice);
  if (!stripeSubscriptionId) return { ok: true, outcome: "ignored", code: "no_subscription" };
  const record = await loadSubscriptionRecord(stripeSubscriptionId);
  if (!record) return { ok: true, outcome: "ignored", code: "not_leonix_subscription" };

  const supabase = getAdminSupabase();
  const invoiceId = String(input.invoice.id ?? "");
  const now = new Date();

  if (record.status === "grace" && isGraceExpired(record.grace_ends_at, now.getTime())) {
    // Post-day-7 retry delivery: the natural crank that enforces suspension without cron.
    await reconcileSubscriptionByStripeId(stripeSubscriptionId);
    return { ok: true, outcome: "completed", code: "grace_expired_suspended" };
  }

  if (record.status === "active" || record.status === "pending") {
    const graceEndsAt = computeGraceEndsAt(now);
    await supabase
      .from("leonix_subscription_records")
      .update({
        status: "grace",
        grace_started_at: now.toISOString(),
        grace_ends_at: graceEndsAt.toISOString(),
        last_failed_invoice_id: invoiceId,
        latest_invoice_id: invoiceId,
        updated_at: now.toISOString(),
        // Day-5 contractual-late marker (Agreement v1.2 §15) is REVIEW metadata only —
        // late fees are admin-managed, never auto-charged.
        metadata: { ...(record.metadata ?? {}), contractual_late_after: new Date(now.getTime() + 5 * 86_400_000).toISOString() },
      })
      .eq("id", record.id)
      .in("status", ["active", "pending"]);
    await writeRevenueAuditLog({
      action: "revenue_payment_expired",
      targetType: "subscription",
      targetId: record.id,
      meta: { event: "invoice_payment_failed", stripe_event_id: input.eventId, invoice_id: invoiceId, grace_ends_at: graceEndsAt.toISOString() },
    });
  } else {
    await supabase
      .from("leonix_subscription_records")
      .update({ last_failed_invoice_id: invoiceId, latest_invoice_id: invoiceId, updated_at: now.toISOString() })
      .eq("id", record.id);
  }
  return { ok: true, outcome: "completed" };
}

/** customer.subscription.updated — sync periods/cancel flags; reconcile grace lazily. */
export async function handleSubscriptionUpdated(input: {
  subscription: Stripe.Subscription;
  eventId: string;
}): Promise<HandlerResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, outcome: "failed_retryable", code: "supabase_not_configured" };
  const subscription = input.subscription;
  if (!isLeonixSubscriptionMetadata(subscription.metadata as Record<string, string>)) {
    const record = await loadSubscriptionRecord(subscription.id);
    if (!record) return { ok: true, outcome: "ignored", code: "not_leonix_subscription" };
  }
  const record = await loadSubscriptionRecord(subscription.id);
  if (!record) return { ok: true, outcome: "ignored", code: "not_leonix_subscription" };

  const period = readSubscriptionPeriod(subscription);
  const supabase = getAdminSupabase();
  await supabase
    .from("leonix_subscription_records")
    .update({
      stripe_status: subscription.status ?? null,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      current_period_start: period.periodStart?.toISOString() ?? undefined,
      current_period_end: period.periodEnd?.toISOString() ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  // Package/price changes are NOT auto-applied — approved mapping only; anything else flags review.
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const priorPrice = (record.metadata ?? {})["stripe_price_id_seen"];
  if (priceId && priorPrice && priorPrice !== priceId) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "subscription",
      targetId: record.id,
      meta: { event: "subscription_updated_price_change_requires_admin_review", stripe_event_id: input.eventId, from: priorPrice, to: priceId },
    });
  }
  await supabase
    .from("leonix_subscription_records")
    .update({ metadata: { ...(record.metadata ?? {}), stripe_price_id_seen: priceId } })
    .eq("id", record.id);

  await reconcileSubscriptionByStripeId(subscription.id);
  return { ok: true, outcome: "completed" };
}

/** customer.subscription.deleted — end per effective policy; suspend paid visibility; preserve all content. */
export async function handleSubscriptionDeleted(input: {
  subscription: Stripe.Subscription;
  eventId: string;
}): Promise<HandlerResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, outcome: "failed_retryable", code: "supabase_not_configured" };
  const record = await loadSubscriptionRecord(input.subscription.id);
  if (!record) return { ok: true, outcome: "ignored", code: "not_leonix_subscription" };

  const canceledAtPeriodEnd = Boolean(input.subscription.cancel_at_period_end);
  const endedReason = canceledAtPeriodEnd ? "canceled_at_period_end" : "payment_failure_final";
  const transition = decideSubscriptionTransition(
    (record.status as "active" | "grace" | "suspended" | "pending" | "canceled") ?? "active",
    "subscription_deleted",
    { endedReason },
  );

  let priorStatus: string | null = null;
  let suspendedStatus: string | null = null;
  if (transition.effects.includes("suspend_visibility") && record.category && record.listing_id) {
    const result = await applyPaymentSuspension(record.category, record.listing_id);
    if (result.ok && result.applied) {
      priorStatus = result.priorStatus;
      suspendedStatus = laneSuspensionSpecForCategory(record.category)?.suspendedValue ?? null;
    }
  }
  // Paid-through honored on cancel-at-period-end: entitlement ends_at is NOT shortened; the
  // read-time lapse (period_end + backstop) retires visibility when the paid window ends.

  const supabase = getAdminSupabase();
  await supabase
    .from("leonix_subscription_records")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      ended_reason: endedReason,
      ...(priorStatus ? { listing_prior_status: priorStatus, listing_suspended_status: suspendedStatus, suspension_reason: "payment_failure", suspended_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  await writeRevenueAuditLog({
    action: "revenue_payment_expired",
    targetType: "subscription",
    targetId: record.id,
    meta: { event: "subscription_deleted", stripe_event_id: input.eventId, ended_reason: endedReason, content_preserved: true },
  });
  return { ok: true, outcome: "completed" };
}

async function findPaymentRecordByIntentOrCharge(charge: Stripe.Charge): Promise<{ id: string } | null> {
  const supabase = getAdminSupabase();
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? null;
  if (intentId) {
    const { data } = await supabase
      .from("leonix_payment_records")
      .select("id")
      .eq("stripe_payment_intent_id", intentId)
      .maybeSingle();
    if (data?.id) return { id: data.id as string };
  }
  return null;
}

/**
 * Reverse rewards for every refund object carried on a `charge.refunded` event.
 *
 * `charge.refunds.data` may be absent or truncated on a webhook payload — Stripe caps the embedded
 * list. When no refund object is available, the anchor falls back to the charge id with a
 * `:cum<N>` suffix taken from the CUMULATIVE refunded amount, so a second partial refund still
 * produces a DIFFERENT key and still reverses instead of colliding with the first. That suffix is
 * a fallback for a truncated payload, not the design: a real refund id is always preferred.
 */
async function reverseRewardsForChargeRefunds(input: {
  paymentRecordId: string;
  charge: Stripe.Charge;
}): Promise<void> {
  const cumulativeRefundedCents = input.charge.amount_refunded ?? 0;
  const refunds = (input.charge.refunds?.data ?? []).filter(
    (r): r is Stripe.Refund => Boolean(r) && typeof r.id === "string",
  );

  if (!refunds.length) {
    await reverseCreditsForRefundOrDispute({
      paymentRecordId: input.paymentRecordId,
      refundedCents: cumulativeRefundedCents,
      // The rail's own cumulative position is authoritative when we cannot see the individual
      // refunds, and it is what keeps the running total exact across several such deliveries.
      cumulativeRefundedCents,
      kind: "refund",
      externalId: `${input.charge.id}:cum${cumulativeRefundedCents}`,
    });
    return;
  }

  // Oldest first, so the cumulative position advances in the order the refunds actually happened.
  const ordered = [...refunds].sort((a, b) => (a.created ?? 0) - (b.created ?? 0));
  for (const refund of ordered) {
    await reverseCreditsForRefundOrDispute({
      paymentRecordId: input.paymentRecordId,
      refundedCents: refund.amount ?? 0,
      // Each refund contributes only its OWN amount. Re-asserting the cumulative figure on every
      // iteration would let the last refund in the loop claim the entire position for itself.
      cumulativeRefundedCents: null,
      kind: "refund",
      externalId: refund.id,
    });
  }
}

/** charge.refunded — refund foundation: record on the original payment record; history preserved. */
export async function handleChargeRefunded(input: { charge: Stripe.Charge; eventId: string }): Promise<HandlerResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, outcome: "failed_retryable", code: "supabase_not_configured" };
  const record = await findPaymentRecordByIntentOrCharge(input.charge);
  if (!record) return { ok: true, outcome: "ignored", code: "not_leonix_payment" };
  const result = await recordRefundOnPaymentRecord({
    paymentRecordId: record.id,
    amountRefundedCents: input.charge.amount_refunded ?? 0,
    stripeEventId: input.eventId,
    partial: (input.charge.amount_refunded ?? 0) < (input.charge.amount ?? 0),
  });

  // LEONIX IX REWARDS — money went back to the customer, so the credits it earned come back too.
  //
  // KEYED ON EACH REFUND OBJECT, NOT ON THE CHARGE. Stripe fires `charge.refunded` once per refund
  // against the same charge, and the charge id is identical on every one of those deliveries:
  // keying the reversal on it makes every partial refund after the first dedupe to a no-op and
  // leaves the customer holding credits for money they already got back.
  //
  // Best-effort: a rewards problem must not make a correctly-recorded refund look failed to Stripe.
  await reverseRewardsForChargeRefunds({ paymentRecordId: record.id, charge: input.charge }).catch(() => null);

  return result.ok ? { ok: true, outcome: "completed" } : { ok: false, outcome: "failed_retryable", code: result.message };
}

/** charge.dispute.created — mark disputed + payment-suspend visibility; content preserved. */
export async function handleDisputeCreated(input: { dispute: Stripe.Dispute; eventId: string }): Promise<HandlerResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, outcome: "failed_retryable", code: "supabase_not_configured" };
  const supabase = getAdminSupabase();
  const intentId = typeof input.dispute.payment_intent === "string" ? input.dispute.payment_intent : input.dispute.payment_intent?.id ?? null;
  if (!intentId) return { ok: true, outcome: "ignored", code: "no_payment_intent" };
  const { data: paymentRecord } = await supabase
    .from("leonix_payment_records")
    .select("id, category, listing_id, stripe_subscription_id, owner_user_id")
    .eq("stripe_payment_intent_id", intentId)
    .maybeSingle();
  if (!paymentRecord) return { ok: true, outcome: "ignored", code: "not_leonix_payment" };

  await recordDisputeOnPaymentRecord({ paymentRecordId: paymentRecord.id as string, stripeEventId: input.eventId, disputeId: input.dispute.id });

  // LEONIX IX REWARDS — a chargeback claws back the credits that payment earned, on the same
  // cumulative, idempotent rule as a refund. Keyed on the DISPUTE id, which is already unique per
  // dispute; the dispute's own amount is its contribution to the money-returned position, and it
  // composes with any refunds already reversed against the same payment.
  await reverseCreditsForRefundOrDispute({
    paymentRecordId: String(paymentRecord.id),
    refundedCents: input.dispute.amount ?? 0,
    cumulativeRefundedCents: null,
    kind: "chargeback",
    externalId: input.dispute.id,
  }).catch(() => null);

  const category = String(paymentRecord.category ?? "");
  const listingId = String(paymentRecord.listing_id ?? "");
  let priorStatus: string | null = null;
  if (category && listingId) {
    const suspension = await applyPaymentSuspension(category, listingId);
    if (suspension.ok && suspension.applied) priorStatus = suspension.priorStatus;
  }
  if (paymentRecord.stripe_subscription_id) {
    await supabase
      .from("leonix_subscription_records")
      .update({
        status: "suspended",
        suspended_at: new Date().toISOString(),
        suspension_reason: "chargeback",
        ...(priorStatus ? { listing_prior_status: priorStatus, listing_suspended_status: laneSuspensionSpecForCategory(category)?.suspendedValue ?? null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", String(paymentRecord.stripe_subscription_id));
  }
  await writeRevenueAuditLog({
    action: "revenue_webhook_validation_failed",
    targetType: "payment_record",
    targetId: paymentRecord.id as string,
    meta: { event: "dispute_created_requires_admin_review", stripe_event_id: input.eventId, dispute_id: input.dispute.id, content_preserved: true },
  });
  return { ok: true, outcome: "completed" };
}

/** charge.dispute.closed — won restores chargeback suspension; lost stays suspended for admin. */
export async function handleDisputeClosed(input: { dispute: Stripe.Dispute; eventId: string }): Promise<HandlerResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, outcome: "failed_retryable", code: "supabase_not_configured" };
  const supabase = getAdminSupabase();
  const intentId = typeof input.dispute.payment_intent === "string" ? input.dispute.payment_intent : input.dispute.payment_intent?.id ?? null;
  if (!intentId) return { ok: true, outcome: "ignored", code: "no_payment_intent" };
  const { data: paymentRecord } = await supabase
    .from("leonix_payment_records")
    .select("id, category, listing_id, stripe_subscription_id")
    .eq("stripe_payment_intent_id", intentId)
    .maybeSingle();
  if (!paymentRecord) return { ok: true, outcome: "ignored", code: "not_leonix_payment" };

  const won = input.dispute.status === "won";
  if (won) {
    const subId = paymentRecord.stripe_subscription_id ? String(paymentRecord.stripe_subscription_id) : null;
    if (subId) {
      const record = await loadSubscriptionRecord(subId);
      if (record && record.suspension_reason === "chargeback") {
        if (record.category && record.listing_id) {
          await liftPaymentSuspension(record.category, record.listing_id, record.listing_prior_status);
        }
        await supabase
          .from("leonix_subscription_records")
          .update({ status: "active", suspended_at: null, suspension_reason: null, listing_prior_status: null, listing_suspended_status: null, recovered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", record.id);
      }
    }
  }
  await writeRevenueAuditLog({
    action: won ? "revenue_entitlement_activated" : "revenue_webhook_validation_failed",
    targetType: "payment_record",
    targetId: paymentRecord.id as string,
    meta: { event: won ? "dispute_closed_won_restored" : "dispute_closed_lost_admin_review", stripe_event_id: input.eventId, dispute_id: input.dispute.id },
  });
  return { ok: true, outcome: "completed" };
}
