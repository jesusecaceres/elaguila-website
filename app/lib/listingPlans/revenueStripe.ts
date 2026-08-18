/**
 * Revenue OS Stripe Checkout Session helper — server-only.
 * Gate STRIPE-REVENUE-OS-CHECKOUT-SESSION-01
 */

import "server-only";
import Stripe from "stripe";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";
import { buildStripeCheckoutMetadataPayload } from "./revenueEntitlements";

export type RevenueStripeCheckoutLineItem = {
  packageDef: RevenuePackageDefinition;
  unitAmountCents: number;
  quantity?: number;
};

export type CreateRevenueCheckoutSessionInput = {
  packageDef: RevenuePackageDefinition;
  amountCents: number;
  /** When omitted, a single line item uses amountCents for the base package. */
  lineItems?: RevenueStripeCheckoutLineItem[];
  currency: "usd";
  stripeMode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  clientReferenceId: string;
  paymentRecordId: string;
  ownerUserId?: string | null;
  listingId: string;
  leonixAdId?: string | null;
  promoCodeId?: string | null;
  promoRedemptionId?: string | null;
  /** Package C Build 1 — stable purchase-attempt identity; Stripe idempotencyKey =
   * `${checkoutAttemptKey}:${attemptGeneration}` (transport retries can never mint a second
   * payable session for the same attempt generation). */
  checkoutAttemptKey?: string | null;
  attemptGeneration?: number | null;
  /** Package C Build 1 — recurring-billing consent evidence id (subscription mode only). */
  consentRecordId?: string | null;
  /**
   * Package C Build 2 (C4) — verified-intro-15% Stripe coupon id, subscription mode only. When
   * set, `unit_amount` in the line items stays FULL price and the discount is applied via
   * Stripe's native `discounts` array with a `duration:"once"` coupon so renewal automatically
   * reverts to full price with no Leonix-side recalculation. Never set together with a
   * Leonix-side unit_amount reduction (one_time mode uses that mechanism instead, with this left
   * null).
   */
  verifiedIntroDiscountStripeCouponId?: string | null;
};

export type CreateRevenueCheckoutSessionResult =
  | { ok: true; sessionId: string; checkoutUrl: string }
  | { ok: false; code: string; message: string };

function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function isRevenueStripeConfigured(): boolean {
  return !!getStripeSecretKey();
}

function getStripeClient(): Stripe | null {
  const secret = getStripeSecretKey();
  if (!secret) return null;
  return new Stripe(secret, { typescript: true });
}

/**
 * Package C Build 1 — open-session reuse for the purchase-attempt identity. Returns the
 * session's status + url so a duplicate click / second tab is handed the SAME payable session
 * instead of a new one. Read-only.
 */
export async function retrieveRevenueCheckoutSessionState(
  sessionId: string,
): Promise<{ status: "open" | "complete" | "expired" | "unknown"; url: string | null }> {
  const stripe = getStripeClient();
  const id = String(sessionId ?? "").trim();
  if (!stripe || !id) return { status: "unknown", url: null };
  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const status =
      session.status === "open" || session.status === "complete" || session.status === "expired"
        ? session.status
        : "unknown";
    return { status, url: session.url ?? null };
  } catch {
    return { status: "unknown", url: null };
  }
}

export async function createRevenueStripeCheckoutSession(
  input: CreateRevenueCheckoutSessionInput,
): Promise<CreateRevenueCheckoutSessionResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      ok: false,
      code: "stripe_not_configured",
      message: "Stripe is not configured on this server.",
    };
  }

  const metadataResult = buildStripeCheckoutMetadataPayload({
    paymentRecordId: input.paymentRecordId,
    ownerUserId: input.ownerUserId,
    listingId: input.listingId,
    leonixAdId: input.leonixAdId,
    category: input.packageDef.category,
    packageKey: input.packageDef.packageKey,
    placementTier: input.packageDef.placementTierKey,
    billingMode: input.packageDef.billingMode,
    amountCents: input.amountCents,
    currency: input.currency,
    durationDays: input.packageDef.durationDays,
    aiIncluded: input.packageDef.category === "ofertas-locales" ? true : null,
    workflow: input.packageDef.category === "ofertas-locales" ? "ofertas_locales_package_5_checkout" : "category_checkout",
    promoCodeId: input.promoCodeId,
    promoRedemptionId: input.promoRedemptionId,
  });

  if (!metadataResult.eligible) {
    return {
      ok: false,
      code: "metadata_not_eligible",
      message: metadataResult.warnings[0] ?? "Checkout metadata not eligible.",
    };
  }

  const lineItemsInput =
    input.lineItems?.length && input.lineItems.length > 0
      ? input.lineItems
      : [{ packageDef: input.packageDef, unitAmountCents: input.amountCents, quantity: 1 }];

  const stripeLineItems = lineItemsInput.map((item) => ({
    quantity: Math.max(1, item.quantity ?? 1),
    price_data: {
      currency: input.currency,
      product_data: {
        name: item.packageDef.label,
        metadata: {
          leonix_category: item.packageDef.category,
          leonix_package_key: item.packageDef.packageKey,
        },
      },
      unit_amount: Math.max(0, Math.floor(item.unitAmountCents)),
      ...(input.stripeMode === "subscription"
        ? { recurring: { interval: "month" as const } }
        : {}),
    },
  }));

  // Package C Build 1 — explicit source namespace + consent linkage. Legacy webhooks reject any
  // session carrying leonix_* keys; the canonical webhook requires leonix_payment_record_id.
  const metadataPayload: Record<string, string> = {
    ...metadataResult.payload,
    leonix_source: "revenue_os",
    ...(input.consentRecordId ? { leonix_consent_record_id: input.consentRecordId } : {}),
  };

  const sessionParams = {
    mode: input.stripeMode,
    line_items: stripeLineItems,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: metadataPayload,
    client_reference_id: input.clientReferenceId,
    allow_promotion_codes: false,
    // Package C Build 2 (C4) — verified-intro-15%, subscription mode only. A server-attached
    // discounts array (never a customer-typed promotion_code — allow_promotion_codes stays
    // false) applying a duration:"once" coupon so the subscription's line-item price remains
    // full and renewal is automatically full price.
    ...(input.verifiedIntroDiscountStripeCouponId
      ? { discounts: [{ coupon: input.verifiedIntroDiscountStripeCouponId }] }
      : {}),
    ...(input.customerEmail?.trim()
      ? { customer_email: input.customerEmail.trim() }
      : {}),
    ...(input.stripeMode === "payment"
      ? { payment_intent_data: { metadata: metadataPayload } }
      : { subscription_data: { metadata: metadataPayload } }),
  };

  // Stable purchase-attempt idempotency (never the per-click row id).
  const attemptKey = input.checkoutAttemptKey?.trim();
  const requestOptions = attemptKey
    ? { idempotencyKey: `${attemptKey}:${Math.max(1, input.attemptGeneration ?? 1)}` }
    : undefined;

  const session = requestOptions
    ? await stripe.checkout.sessions.create(sessionParams, requestOptions)
    : await stripe.checkout.sessions.create(sessionParams);

  if (!session.url || !session.id) {
    return {
      ok: false,
      code: "stripe_no_url",
      message: "Stripe did not return a Checkout URL.",
    };
  }

  return { ok: true, sessionId: session.id, checkoutUrl: session.url };
}
