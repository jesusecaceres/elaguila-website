/**
 * Revenue OS Stripe webhook parsing + verification — server-only.
 * Gate STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01
 */

import "server-only";
import Stripe from "stripe";
import {
  EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY,
  getRevenuePackageDefinition,
  isStripeEligiblePackageKey,
} from "./revenuePricingMatrix";

export const REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED = "checkout.session.completed";
export const REVENUE_WEBHOOK_EVENT_CHECKOUT_EXPIRED = "checkout.session.expired";

export const REVENUE_SUPPORTED_WEBHOOK_EVENTS = [
  REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED,
  REVENUE_WEBHOOK_EVENT_CHECKOUT_EXPIRED,
] as const;

export type RevenueOsCheckoutMetadata = {
  category: string;
  packageKey: string;
  billingMode: string;
  paymentRecordId: string | null;
  ownerUserId: string | null;
  listingId: string | null;
  leonixAdId: string | null;
  placementTier: string | null;
  promoCodeId: string | null;
  promoRedemptionId: string | null;
};

export type ParsedCheckoutMetadataResult =
  | { ok: true; metadata: RevenueOsCheckoutMetadata }
  | { ok: false; code: string; message: string };

export type VerifyWebhookResult =
  | { ok: true; event: Stripe.Event }
  | { ok: false; code: string; status: number };

function readMetadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | null {
  const value = String(metadata?.[key] ?? "").trim();
  return value || null;
}

export function parseCheckoutSessionMetadata(
  session: Stripe.Checkout.Session,
): ParsedCheckoutMetadataResult {
  const metadata = session.metadata ?? {};
  const category = readMetadataValue(metadata, "leonix_category");
  const packageKey = readMetadataValue(metadata, "leonix_package_key")?.toLowerCase() ?? null;
  const billingMode = readMetadataValue(metadata, "leonix_billing_mode");

  if (!category || !packageKey || !billingMode) {
    return {
      ok: false,
      code: "metadata_missing_required",
      message: "Checkout session missing required Leonix Revenue OS metadata.",
    };
  }

  if (packageKey === EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY) {
    return {
      ok: false,
      code: "package_not_stripe_fulfillable",
      message: "Empleos job fair is free — cannot fulfill via Stripe webhook.",
    };
  }

  if (!isStripeEligiblePackageKey(packageKey)) {
    return {
      ok: false,
      code: "package_not_stripe_eligible",
      message: "Package key is not Stripe-eligible for webhook fulfillment.",
    };
  }

  const packageDef = getRevenuePackageDefinition(packageKey);
  if (!packageDef) {
    return {
      ok: false,
      code: "package_unknown",
      message: "Unknown package key in checkout metadata.",
    };
  }

  if (packageDef.category !== category) {
    return {
      ok: false,
      code: "category_package_mismatch",
      message: "Category does not match package key in metadata.",
    };
  }

  if (!packageDef.stripeEligible || packageDef.priceCents <= 0 || packageDef.billingMode === "free") {
    return {
      ok: false,
      code: "package_is_free",
      message: "Free packages cannot be fulfilled via Stripe webhook.",
    };
  }

  const paymentRecordIdRaw =
    readMetadataValue(metadata, "leonix_payment_record_id") ??
    String(session.client_reference_id ?? "").trim();
  const paymentRecordId = paymentRecordIdRaw || null;

  return {
    ok: true,
    metadata: {
      category,
      packageKey,
      billingMode,
      paymentRecordId,
      ownerUserId: readMetadataValue(metadata, "leonix_owner_user_id"),
      listingId: readMetadataValue(metadata, "leonix_listing_id"),
      leonixAdId: readMetadataValue(metadata, "leonix_ad_id"),
      placementTier: readMetadataValue(metadata, "leonix_placement_tier"),
      promoCodeId: readMetadataValue(metadata, "leonix_promo_code_id"),
      promoRedemptionId: readMetadataValue(metadata, "leonix_promo_redemption_id"),
    },
  };
}

export function isRevenueOsCheckoutSession(session: Stripe.Checkout.Session): boolean {
  const metadata = session.metadata ?? {};
  return Boolean(
    readMetadataValue(metadata, "leonix_category") &&
      readMetadataValue(metadata, "leonix_package_key") &&
      readMetadataValue(metadata, "leonix_billing_mode"),
  );
}

export function verifyStripeWebhookEvent(input: {
  rawBody: string;
  signature: string | null;
  webhookSecret: string | null;
  stripeSecretKey: string | null;
}): VerifyWebhookResult {
  if (!input.webhookSecret) {
    return { ok: false, code: "webhook_secret_missing", status: 503 };
  }
  if (!input.stripeSecretKey) {
    return { ok: false, code: "stripe_not_configured", status: 503 };
  }
  if (!input.signature) {
    return { ok: false, code: "signature_missing", status: 400 };
  }

  const stripe = new Stripe(input.stripeSecretKey, { typescript: true });
  try {
    const event = stripe.webhooks.constructEvent(
      input.rawBody,
      input.signature,
      input.webhookSecret,
    );
    return { ok: true, event };
  } catch {
    return { ok: false, code: "signature_invalid", status: 400 };
  }
}
