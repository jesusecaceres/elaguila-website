/**
 * Revenue OS entitlement/payment read model types and pure helpers.
 * Gate STRIPE-REVENUE-OS-PACKAGE-KEY-ALIGNMENT-01 — no DB, Stripe SDK, or env.
 */

import {
  EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY,
  EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
  isStripeEligiblePackageKey,
} from "./revenuePricingMatrix";

import {
  formatPaymentStatusLabel,
  isPaymentCleared,
  normalizePaymentStatus,
  type PaymentStatus,
} from "./paymentTracking";
import {
  normalizePlacementTier,
  placementTierRank,
  type PlacementEntitlementStatus,
  type PlacementSource,
  type PlacementTier,
} from "./placementEntitlements";
import { promoTypeLabel, type RevenuePromoType } from "./promoCodeRules";

export type PaymentRecord = {
  id?: string;
  ownerUserId?: string | null;
  listingId?: string | null;
  leonixAdId?: string | null;
  category: string;
  packageKey: string;
  placementTier?: string | null;
  billingMode: string;
  amountCents: number;
  currency: string;
  /** Maps to DB `payment_status`. */
  status: PaymentStatus | string;
  paymentSource: string;
  contractSource?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  promoCodeId?: string | null;
  promoRedemptionId?: string | null;
  placementEntitlementId?: string | null;
  packageEntitlementId?: string | null;
  metadata?: Record<string, unknown>;
};

export type PromoCode = {
  id?: string;
  code: string;
  label?: string | null;
  description?: string | null;
  promoType: RevenuePromoType | string;
  percentOff?: number | null;
  amountOffCents?: number | null;
  currency?: string;
  categoryScope?: string[] | null;
  packageScope?: string[] | null;
  placementScope?: string[] | null;
  isActive?: boolean;
  maxRedemptions?: number | null;
  perCustomerLimit?: number | null;
};

export type PromoRedemption = {
  id?: string;
  promoCodeId: string;
  ownerUserId?: string | null;
  email?: string | null;
  listingId?: string | null;
  category?: string | null;
  packageKey?: string | null;
  status: string;
  discountCents?: number;
  stripeCheckoutSessionId?: string | null;
  paymentRecordId?: string | null;
};

export type PlacementEntitlement = {
  id?: string;
  ownerUserId?: string | null;
  listingId?: string | null;
  leonixAdId?: string | null;
  category: string;
  placementTier: PlacementTier | string;
  placementSource: PlacementSource | string;
  surfaces: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  status: PlacementEntitlementStatus | string;
  includedWithPrint?: boolean;
  stripePaymentRecordId?: string | null;
  promoCodeId?: string | null;
};

export type RevenuePackageEntitlement = {
  id?: string;
  category: string;
  packageKey?: string | null;
  packageTier?: string | null;
  billingMode?: string | null;
  status?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  placementEntitlementId?: string | null;
  paymentRecordId?: string | null;
  promoCodeId?: string | null;
  promoRedemptionId?: string | null;
};

export type StripeCheckoutMetadataInput = {
  paymentRecordId?: string | null;
  ownerUserId?: string | null;
  listingId?: string | null;
  leonixAdId?: string | null;
  category: string;
  packageKey: string;
  placementTier?: string | null;
  billingMode: string;
  promoCodeId?: string | null;
  promoRedemptionId?: string | null;
  packageEntitlementId?: string | null;
  salesRepId?: string | null;
};

export type StripeCheckoutMetadataResult = {
  eligible: boolean;
  payload: Record<string, string>;
  warnings: string[];
};

/** Re-export canonical Empleos Checkout package keys for downstream gates. */
export { EMPLEOS_JOB_POST_PAID_PACKAGE_KEY, EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY };

/** Future Checkout gate must only create Stripe sessions for stripe-eligible package keys. */
export function isStripeCheckoutMetadataEligible(packageKey: string | null | undefined): boolean {
  const key = String(packageKey ?? "").trim().toLowerCase();
  if (key === EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY) return false;
  return isStripeEligiblePackageKey(key);
}

/** Pure metadata payload for future Stripe Checkout session creation. */
export function buildStripeCheckoutMetadataPayload(
  input: StripeCheckoutMetadataInput,
): StripeCheckoutMetadataResult {
  const warnings: string[] = [];
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();

  if (!isStripeCheckoutMetadataEligible(packageKey)) {
    warnings.push(
      packageKey === EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY
        ? "Empleos job fair is free — do not create Stripe Checkout metadata."
        : "Package key is not Stripe Checkout eligible.",
    );
    return { eligible: false, payload: {}, warnings };
  }

  const payload: Record<string, string> = {
    leonix_category: String(input.category),
    leonix_package_key: packageKey,
    leonix_billing_mode: String(input.billingMode),
  };

  const optional: Array<[string, string | null | undefined]> = [
    ["leonix_payment_record_id", input.paymentRecordId],
    ["leonix_owner_user_id", input.ownerUserId],
    ["leonix_listing_id", input.listingId],
    ["leonix_ad_id", input.leonixAdId],
    ["leonix_placement_tier", input.placementTier],
    ["leonix_promo_code_id", input.promoCodeId],
    ["leonix_promo_redemption_id", input.promoRedemptionId],
    ["leonix_package_entitlement_id", input.packageEntitlementId],
    ["leonix_sales_rep_id", input.salesRepId],
  ];

  for (const [key, value] of optional) {
    const v = String(value ?? "").trim();
    if (v) payload[key] = v;
  }

  if (packageKey === EMPLEOS_JOB_POST_PAID_PACKAGE_KEY) {
    warnings.push("Empleos regular job post — Stripe Checkout metadata ready.");
  }

  return { eligible: true, payload, warnings };
}

export type OwnerDashboardBadgeInput = {
  paymentStatus?: string | null;
  placementTier?: string | null;
  placementStatus?: string | null;
  includedWithPrint?: boolean;
  promoType?: string | null;
  packageKey?: string | null;
  endsAt?: string | null;
};

export function resolveOwnerDashboardBadges(input: OwnerDashboardBadgeInput): string[] {
  const badges: string[] = [];
  const payment = normalizePaymentStatus(input.paymentStatus);
  if (isPaymentCleared(payment)) badges.push("Paid");
  else if (payment === "pending" || payment === "requires_action") badges.push("Payment pending");
  else if (payment === "failed") badges.push("Payment failed");

  const tier = normalizePlacementTier(input.placementTier);
  if (tier !== "unknown") badges.push(`Placement: ${tier.replace(/_/g, " ")}`);

  const placementStatus = String(input.placementStatus ?? "").trim().toLowerCase();
  if (placementStatus === "comped") badges.push("Comped");
  if (input.includedWithPrint) badges.push("Included with print");

  if (input.promoType) badges.push(`Promo: ${promoTypeLabel(input.promoType)}`);
  if (input.packageKey) badges.push(`Package: ${input.packageKey}`);

  if (input.endsAt) {
    const end = new Date(input.endsAt);
    if (Number.isFinite(end.getTime()) && end.getTime() < Date.now()) {
      badges.push("Expired");
    }
  }

  return badges;
}

export type AdminStatusLabelInput = {
  paymentStatus?: string | null;
  placementStatus?: string | null;
  placementTier?: string | null;
  promoType?: string | null;
  redemptionStatus?: string | null;
};

export function resolveAdminRevenueStatusLabels(input: AdminStatusLabelInput): {
  paymentLabel: string;
  placementLabel: string;
  promoLabel: string;
  proofLabel: string;
} {
  const paymentLabel = formatPaymentStatusLabel(input.paymentStatus);
  const tier = normalizePlacementTier(input.placementTier);
  const placementStatus = String(input.placementStatus ?? "unknown").replace(/_/g, " ");
  const placementLabel =
    tier !== "unknown"
      ? `${placementStatus} · ${tier} (rank ${placementTierRank(tier)})`
      : placementStatus;

  const promoLabel = input.promoType
    ? `${promoTypeLabel(input.promoType)}${input.redemptionStatus ? ` · ${input.redemptionStatus}` : ""}`
    : "No promo";

  let proofLabel = "NEEDS LIVE PROOF";
  if (isPaymentCleared(input.paymentStatus) && tier !== "unknown") {
    proofLabel = "REAL";
  } else if (input.paymentStatus || input.placementTier) {
    proofLabel = "PARTIAL";
  }

  return { paymentLabel, placementLabel, promoLabel, proofLabel };
}
