/**
 * Revenue OS Stripe Checkout Session helper — server-only.
 * Gate STRIPE-REVENUE-OS-CHECKOUT-SESSION-01
 */

import "server-only";
import Stripe from "stripe";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";
import { buildStripeCheckoutMetadataPayload } from "./revenueEntitlements";

export type CreateRevenueCheckoutSessionInput = {
  packageDef: RevenuePackageDefinition;
  amountCents: number;
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

  const lineItem = {
    quantity: 1,
    price_data: {
      currency: input.currency,
      product_data: {
        name: input.packageDef.label,
        metadata: {
          leonix_category: input.packageDef.category,
          leonix_package_key: input.packageDef.packageKey,
        },
      },
      unit_amount: input.amountCents,
      ...(input.stripeMode === "subscription"
        ? { recurring: { interval: "month" as const } }
        : {}),
    },
  };

  const sessionParams = {
    mode: input.stripeMode,
    line_items: [lineItem],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: metadataResult.payload,
    client_reference_id: input.clientReferenceId,
    allow_promotion_codes: false,
    ...(input.customerEmail?.trim()
      ? { customer_email: input.customerEmail.trim() }
      : {}),
    ...(input.stripeMode === "payment"
      ? { payment_intent_data: { metadata: metadataResult.payload } }
      : { subscription_data: { metadata: metadataResult.payload } }),
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url || !session.id) {
    return {
      ok: false,
      code: "stripe_no_url",
      message: "Stripe did not return a Checkout URL.",
    };
  }

  return { ok: true, sessionId: session.id, checkoutUrl: session.url };
}
