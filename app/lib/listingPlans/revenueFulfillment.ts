/**
 * Revenue OS Stripe webhook fulfillment orchestration — server-only.
 * Gate STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01
 */

import "server-only";
import type Stripe from "stripe";
import { isPaymentCleared } from "./paymentTracking";
import { activateEntitlementsForPayment } from "./revenueEntitlementFulfillment";
import { writeRevenueAuditLog } from "./revenueAuditLog";
import {
  loadPaymentRecordById,
  loadPaymentRecordByStripeSessionId,
  markPaymentRecordExpiredOrCanceled,
  markPaymentRecordPaid,
  type LeonixPaymentRecordRow,
} from "./revenuePaymentRecords";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";
import {
  markPromoRedemptionExpiredOrCancelled,
  markPromoRedemptionRedeemed,
} from "./revenuePromoRedemptions";
import {
  isRevenueOsCheckoutSession,
  parseCheckoutSessionMetadata,
} from "./revenueWebhook";

export type RevenueFulfillmentResult = {
  ok: boolean;
  idempotent?: boolean;
  code?: string;
  message?: string;
  paymentRecordId?: string | null;
  packageEntitlementId?: string | null;
  placementEntitlementId?: string | null;
  promoRedemptionId?: string | null;
};

function resolveStripePaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (typeof pi === "string") return pi;
  return pi?.id ?? null;
}

function resolveStripeCustomerId(session: Stripe.Checkout.Session): string | null {
  const customer = session.customer;
  if (typeof customer === "string") return customer;
  return customer?.id ?? null;
}

function resolveStripeSubscriptionId(session: Stripe.Checkout.Session): string | null {
  const sub = session.subscription;
  if (typeof sub === "string") return sub;
  return sub?.id ?? null;
}

function isStripeSessionPaid(session: Stripe.Checkout.Session): boolean {
  if (session.payment_status === "paid") return true;
  if (session.mode === "subscription" && session.status === "complete") {
    return Boolean(resolveStripeSubscriptionId(session));
  }
  return false;
}

async function resolvePaymentRecord(input: {
  paymentRecordId: string | null;
  stripeCheckoutSessionId: string;
}): Promise<LeonixPaymentRecordRow | null> {
  if (input.paymentRecordId) {
    const byId = await loadPaymentRecordById(input.paymentRecordId);
    if (byId) return byId;
  }
  return loadPaymentRecordByStripeSessionId(input.stripeCheckoutSessionId);
}

function paymentRecordMatchesMetadata(
  row: LeonixPaymentRecordRow,
  metadata: { category: string; packageKey: string },
): boolean {
  const rowCategory = String(row.category ?? "").trim().toLowerCase();
  const rowPackage = String(row.package_key ?? "").trim().toLowerCase();
  return rowCategory === metadata.category && rowPackage === metadata.packageKey;
}

export async function fulfillCheckoutSessionCompleted(input: {
  session: Stripe.Checkout.Session;
  eventId: string;
  eventType: string;
}): Promise<RevenueFulfillmentResult> {
  const { session, eventId, eventType } = input;

  if (!isRevenueOsCheckoutSession(session)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { reason: "not_revenue_os_session", stripe_event_id: eventId, stripe_event_type: eventType },
    });
    return { ok: true, code: "ignored_non_revenue_os", message: "Not a Revenue OS checkout session." };
  }

  const parsed = parseCheckoutSessionMetadata(session);
  if (!parsed.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: {
        code: parsed.code,
        stripe_event_id: eventId,
        stripe_event_type: eventType,
      },
    });
    return { ok: false, code: parsed.code, message: parsed.message };
  }

  const { metadata } = parsed;
  const packageDef = getRevenuePackageDefinition(metadata.packageKey);
  if (!packageDef) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { code: "package_unknown", stripe_event_id: eventId },
    });
    return { ok: false, code: "package_unknown", message: "Unknown package key." };
  }

  if (!isStripeSessionPaid(session)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: {
        code: "payment_not_paid",
        payment_status: session.payment_status,
        stripe_event_id: eventId,
      },
    });
    return { ok: false, code: "payment_not_paid", message: "Stripe session is not paid." };
  }

  const paymentRecord = await resolvePaymentRecord({
    paymentRecordId: metadata.paymentRecordId,
    stripeCheckoutSessionId: session.id,
  });

  if (!paymentRecord) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { code: "payment_record_not_found", stripe_event_id: eventId },
    });
    return { ok: false, code: "payment_record_not_found", message: "Matching payment record not found." };
  }

  if (!paymentRecordMatchesMetadata(paymentRecord, metadata)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "leonix_payment_records",
      targetId: paymentRecord.id,
      meta: { code: "payment_record_metadata_mismatch", stripe_event_id: eventId },
    });
    return {
      ok: false,
      code: "payment_record_metadata_mismatch",
      message: "Payment record does not match checkout metadata.",
    };
  }

  const expectedAmount = paymentRecord.amount_total_cents ?? paymentRecord.amount_cents ?? packageDef.priceCents;
  if (session.amount_total != null && expectedAmount > 0 && session.amount_total !== expectedAmount) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "leonix_payment_records",
      targetId: paymentRecord.id,
      meta: {
        code: "amount_mismatch",
        expected_amount_cents: expectedAmount,
        stripe_amount_total: session.amount_total,
        stripe_event_id: eventId,
      },
    });
    return { ok: false, code: "amount_mismatch", message: "Stripe amount does not match payment record." };
  }

  const webhookMeta = {
    stripe_event_id: eventId,
    stripe_event_type: eventType,
    stripe_checkout_session_id: session.id,
    stripe_payment_status: session.payment_status,
  };

  if (isPaymentCleared(paymentRecord.payment_status)) {
    const entitlementResult = await activateEntitlementsForPayment({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeEventType: eventType,
      stripeCheckoutSessionId: session.id,
    });

    if (!entitlementResult.ok) {
      return {
        ok: false,
        code: entitlementResult.code,
        message: entitlementResult.message,
        paymentRecordId: paymentRecord.id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    return {
      ok: true,
      idempotent: true,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
      placementEntitlementId:
        entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
      promoRedemptionId: paymentRecord.promo_redemption_id,
    };
  }

  const paidResult = await markPaymentRecordPaid({
    paymentRecordId: paymentRecord.id,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
    stripeCustomerId: resolveStripeCustomerId(session),
    stripeSubscriptionId: resolveStripeSubscriptionId(session),
    amountPaidCents: session.amount_total ?? expectedAmount,
    webhookMeta,
    existingMetadata: paymentRecord.metadata,
  });

  if (!paidResult.ok) {
    return {
      ok: false,
      code: paidResult.code,
      message: paidResult.message,
      paymentRecordId: paymentRecord.id,
    };
  }

  await writeRevenueAuditLog({
    action: "revenue_payment_completed",
    targetType: "leonix_payment_records",
    targetId: paymentRecord.id,
    meta: {
      stripe_checkout_session_id: session.id,
      package_key: metadata.packageKey,
      category: metadata.category,
      idempotent: paidResult.idempotent === true,
      stripe_event_id: eventId,
    },
  });

  let promoRedemptionId = paymentRecord.promo_redemption_id ?? metadata.promoRedemptionId;
  if (promoRedemptionId) {
    const promoResult = await markPromoRedemptionRedeemed({
      redemptionId: promoRedemptionId,
      stripeCheckoutSessionId: session.id,
      paymentRecordId: paymentRecord.id,
      webhookMeta,
    });

    if (promoResult.ok) {
      await writeRevenueAuditLog({
        action: "revenue_promo_redeemed",
        targetType: "leonix_promo_code_redemptions",
        targetId: promoRedemptionId,
        meta: {
          payment_record_id: paymentRecord.id,
          idempotent: promoResult.idempotent === true,
          stripe_event_id: eventId,
        },
      });
    }
  }

  const refreshed = (await loadPaymentRecordById(paymentRecord.id)) ?? paymentRecord;
  const entitlementResult = await activateEntitlementsForPayment({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeEventType: eventType,
    stripeCheckoutSessionId: session.id,
  });

  if (!entitlementResult.ok) {
    return {
      ok: false,
      code: entitlementResult.code,
      message: entitlementResult.message,
      paymentRecordId: paymentRecord.id,
      promoRedemptionId,
    };
  }

  await writeRevenueAuditLog({
    action: "revenue_entitlement_activated",
    targetType: "listing_package_entitlements",
    targetId: entitlementResult.packageEntitlementId ?? null,
    meta: {
      payment_record_id: paymentRecord.id,
      placement_entitlement_id: entitlementResult.placementEntitlementId ?? null,
      package_key: metadata.packageKey,
      category: metadata.category,
      idempotent: entitlementResult.idempotent === true,
      stripe_event_id: eventId,
    },
  });

  return {
    ok: true,
    idempotent: paidResult.idempotent === true && entitlementResult.idempotent === true,
    paymentRecordId: paymentRecord.id,
    packageEntitlementId: entitlementResult.packageEntitlementId,
    placementEntitlementId: entitlementResult.placementEntitlementId,
    promoRedemptionId,
  };
}

export async function markCheckoutSessionExpired(input: {
  session: Stripe.Checkout.Session;
  eventId: string;
  eventType: string;
}): Promise<RevenueFulfillmentResult> {
  const { session, eventId, eventType } = input;

  if (!isRevenueOsCheckoutSession(session)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { reason: "not_revenue_os_session", stripe_event_id: eventId },
    });
    return { ok: true, code: "ignored_non_revenue_os", message: "Not a Revenue OS checkout session." };
  }

  const parsed = parseCheckoutSessionMetadata(session);
  if (!parsed.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { code: parsed.code, stripe_event_id: eventId },
    });
    return { ok: false, code: parsed.code, message: parsed.message };
  }

  const { metadata } = parsed;
  const paymentRecord = await resolvePaymentRecord({
    paymentRecordId: metadata.paymentRecordId,
    stripeCheckoutSessionId: session.id,
  });

  if (!paymentRecord) {
    return { ok: true, code: "payment_record_not_found", message: "No payment record to expire." };
  }

  const webhookMeta = {
    stripe_event_id: eventId,
    stripe_event_type: eventType,
    stripe_checkout_session_id: session.id,
    reason: "checkout_session_expired",
  };

  const expireResult = await markPaymentRecordExpiredOrCanceled({
    paymentRecordId: paymentRecord.id,
    webhookMeta,
    existingMetadata: paymentRecord.metadata,
  });

  if (!expireResult.ok && expireResult.code !== "payment_already_paid") {
    return {
      ok: false,
      code: expireResult.code,
      message: expireResult.message,
      paymentRecordId: paymentRecord.id,
    };
  }

  if (expireResult.ok) {
    await writeRevenueAuditLog({
      action: "revenue_payment_expired",
      targetType: "leonix_payment_records",
      targetId: paymentRecord.id,
      meta: {
        stripe_checkout_session_id: session.id,
        idempotent: expireResult.idempotent === true,
        stripe_event_id: eventId,
      },
    });
  }

  const promoRedemptionId = paymentRecord.promo_redemption_id ?? metadata.promoRedemptionId;
  if (promoRedemptionId) {
    await markPromoRedemptionExpiredOrCancelled({
      redemptionId: promoRedemptionId,
      stripeCheckoutSessionId: session.id,
      webhookMeta,
    });
  }

  return {
    ok: true,
    idempotent: expireResult.idempotent === true,
    paymentRecordId: paymentRecord.id,
    promoRedemptionId,
  };
}
