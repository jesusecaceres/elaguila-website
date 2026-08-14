import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  fulfillCheckoutSessionCompleted,
  markCheckoutSessionExpired,
} from "@/app/lib/listingPlans/revenueFulfillment";
import {
  REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED,
  REVENUE_WEBHOOK_EVENT_CHECKOUT_EXPIRED,
  REVENUE_WEBHOOK_EVENT_CHARGE_REFUNDED,
  REVENUE_WEBHOOK_EVENT_DISPUTE_CLOSED,
  REVENUE_WEBHOOK_EVENT_DISPUTE_CREATED,
  REVENUE_WEBHOOK_EVENT_INVOICE_PAID,
  REVENUE_WEBHOOK_EVENT_INVOICE_PAYMENT_FAILED,
  REVENUE_WEBHOOK_EVENT_SUBSCRIPTION_DELETED,
  REVENUE_WEBHOOK_EVENT_SUBSCRIPTION_UPDATED,
  verifyStripeWebhookEvent,
} from "@/app/lib/listingPlans/revenueWebhook";
import {
  claimStripeEvent,
  settleStripeEvent,
} from "@/app/lib/listingPlans/stripeEventLedger";
import {
  ensureSubscriptionRecordFromCheckoutSession,
  handleChargeRefunded,
  handleDisputeClosed,
  handleDisputeCreated,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  readInvoiceSubscriptionId,
} from "@/app/lib/listingPlans/revenueSubscriptionEvents";
import { reconcileSubscriptionByStripeId } from "@/app/lib/listingPlans/subscriptionLifecycle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

function eventSubscriptionId(event: Stripe.Event): string | null {
  const object = event.data.object as unknown as Record<string, unknown>;
  if (event.type.startsWith("customer.subscription.")) return String((object as { id?: string }).id ?? "") || null;
  if (event.type.startsWith("invoice.")) return readInvoiceSubscriptionId(object as unknown as Stripe.Invoice);
  if (event.type === REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED) {
    const sub = (object as { subscription?: unknown }).subscription;
    return typeof sub === "string" ? sub : null;
  }
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const verified = verifyStripeWebhookEvent({
    rawBody,
    signature,
    webhookSecret: getStripeWebhookSecret(),
    stripeSecretKey: getStripeSecretKey(),
  });

  if (!verified.ok) {
    return NextResponse.json({ ok: false, code: verified.code }, { status: verified.status });
  }

  const { event } = verified;
  const stripeSubscriptionId = eventSubscriptionId(event);

  // Package C Build 1 — event ledger claim (layer-1 idempotency; row-state guards stay layer 2).
  // Sequential replay: already-completed events return 200 without reprocessing.
  // Concurrent replay: exactly one delivery wins the INSERT/UPDATE claim.
  const claim = await claimStripeEvent({
    stripeEventId: event.id,
    eventType: event.type,
    apiVersion: event.api_version ?? null,
    livemode: event.livemode ?? null,
    stripeCreatedAt: event.created ? new Date(event.created * 1000).toISOString() : null,
    objectId: String((event.data.object as { id?: string }).id ?? "") || null,
    stripeSubscriptionId,
  });
  if (claim.action === "skip") {
    return NextResponse.json({ received: true, ok: true, idempotent: true, reason: claim.reason });
  }
  if (claim.action === "error") {
    // 500 -> Stripe redelivers; the ledger (or its absence) self-heals on the next attempt.
    return NextResponse.json({ received: true, ok: false, code: claim.reason }, { status: 500 });
  }

  // Webhook-driven grace reconciliation: every subscription-scoped delivery is a crank that
  // enforces a lapsed grace window — no cron, no dashboard dependence.
  if (stripeSubscriptionId) {
    await reconcileSubscriptionByStripeId(stripeSubscriptionId);
  }

  try {
    if (event.type === REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED) {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await fulfillCheckoutSessionCompleted({
        session,
        eventId: event.id,
        eventType: event.type,
      });

      if (!result.ok) {
        await settleStripeEvent(event.id, "failed_retryable", { resultCode: result.code, error: result.message });
        return NextResponse.json(
          { received: true, ok: false, code: result.code, message: result.message },
          { status: 422 },
        );
      }

      // Subscription-mode post-processing: canonical subscription record + consent linkage +
      // entitlement aligned to the REAL Stripe period end (+7d grace backstop).
      await ensureSubscriptionRecordFromCheckoutSession({
        session,
        paymentRecordId: result.paymentRecordId ?? null,
        packageEntitlementId:
          (result as { packageEntitlementId?: string | null }).packageEntitlementId ?? null,
      });

      await settleStripeEvent(event.id, "completed", { paymentRecordId: result.paymentRecordId ?? null });
      return NextResponse.json({
        received: true,
        ok: true,
        idempotent: result.idempotent === true,
        paymentRecordId: result.paymentRecordId ?? null,
      });
    }

    if (event.type === REVENUE_WEBHOOK_EVENT_CHECKOUT_EXPIRED) {
      const result = await markCheckoutSessionExpired({
        session: event.data.object,
        eventId: event.id,
        eventType: event.type,
      });
      await settleStripeEvent(event.id, result.ok ? "completed" : "failed_retryable", { resultCode: result.code ?? null });
      return NextResponse.json({
        received: true,
        ok: result.ok,
        code: result.code ?? null,
        idempotent: result.idempotent === true,
      });
    }

    const subscriptionEventResult = await (async () => {
      switch (event.type) {
        case REVENUE_WEBHOOK_EVENT_INVOICE_PAID:
          return handleInvoicePaid({ invoice: event.data.object as Stripe.Invoice, eventId: event.id });
        case REVENUE_WEBHOOK_EVENT_INVOICE_PAYMENT_FAILED:
          return handleInvoicePaymentFailed({ invoice: event.data.object as Stripe.Invoice, eventId: event.id });
        case REVENUE_WEBHOOK_EVENT_SUBSCRIPTION_UPDATED:
          return handleSubscriptionUpdated({ subscription: event.data.object as Stripe.Subscription, eventId: event.id });
        case REVENUE_WEBHOOK_EVENT_SUBSCRIPTION_DELETED:
          return handleSubscriptionDeleted({ subscription: event.data.object as Stripe.Subscription, eventId: event.id });
        case REVENUE_WEBHOOK_EVENT_CHARGE_REFUNDED:
          return handleChargeRefunded({ charge: event.data.object as Stripe.Charge, eventId: event.id });
        case REVENUE_WEBHOOK_EVENT_DISPUTE_CREATED:
          return handleDisputeCreated({ dispute: event.data.object as Stripe.Dispute, eventId: event.id });
        case REVENUE_WEBHOOK_EVENT_DISPUTE_CLOSED:
          return handleDisputeClosed({ dispute: event.data.object as Stripe.Dispute, eventId: event.id });
        default:
          return null;
      }
    })();

    if (subscriptionEventResult) {
      await settleStripeEvent(event.id, subscriptionEventResult.outcome, { resultCode: subscriptionEventResult.code ?? null });
      const httpStatus = subscriptionEventResult.outcome === "failed_retryable" ? 500 : 200;
      return NextResponse.json(
        {
          received: true,
          ok: subscriptionEventResult.ok,
          outcome: subscriptionEventResult.outcome,
          code: subscriptionEventResult.code ?? null,
        },
        { status: httpStatus },
      );
    }

    // Unhandled event types are RECORDED as ignored (never a silent drop).
    await settleStripeEvent(event.id, "ignored", { resultCode: "unhandled_event_type" });
    return NextResponse.json({ received: true, ok: true, ignored: true, eventType: event.type });
  } catch (error) {
    await settleStripeEvent(event.id, "failed_retryable", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ received: true, ok: false, code: "handler_exception" }, { status: 500 });
  }
}
