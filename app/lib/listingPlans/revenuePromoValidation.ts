/**
 * Revenue OS promo validation for publish checkout UI (read-only preview).
 * Gate PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01
 */

import "server-only";
import { resolveEffectivePromoCodeStatus } from "./promoCodeLifecycle";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";
import { validatePromoEligibility } from "./promoCodeRules";
import {
  calculatePromoDiscountCents,
  loadPromoByCode,
  resolvePromoAmountOffCents,
  resolvePromoCategoryScope,
  resolvePromoPercentOff,
  resolveRevenuePromoTypeFromRow,
  resolveWebsiteLaunch25Rejection,
} from "./revenuePromoRedemptions";

export type PromoPublishValidationInput = {
  code: string;
  category: string;
  packageKey: string;
  subtotalCents: number;
  listingId?: string | null;
  customerEmail?: string | null;
  locale?: "es" | "en";
};

export type PromoPublishValidationSuccess = {
  ok: true;
  code: string;
  promoCodeId: string;
  discountType: string;
  discountLabel: string;
  discountCents: number;
  subtotalCents: number;
  totalCents: number;
  redemptionPolicy: string;
};

export type PromoPublishValidationFailure = {
  ok: false;
  userMessage: string;
};

export type PromoPublishValidationResult =
  | PromoPublishValidationSuccess
  | PromoPublishValidationFailure;

export const PROMO_CHECKOUT_INVALID_MESSAGE = {
  en: "This promo code is not valid for this checkout.",
  es: "Este código promocional no es válido para este pago.",
} as const;

export const PROMO_REDEMPTION_POLICY =
  "Redemption is recorded only after successful Stripe payment webhook — not on Apply or checkout session creation.";

function buildDiscountLabel(promoType: string, percentOff: number | null, amountOffCents: number | null): string {
  if (promoType === "percent_off" && percentOff != null) {
    return `${percentOff}% off`;
  }
  if (promoType === "amount_off" && amountOffCents != null) {
    return `$${(amountOffCents / 100).toFixed(2)} off`;
  }
  return "Discount";
}

function invalidResult(locale: "es" | "en", detail?: string): PromoPublishValidationFailure {
  const base = locale === "es" ? PROMO_CHECKOUT_INVALID_MESSAGE.es : PROMO_CHECKOUT_INVALID_MESSAGE.en;
  return {
    ok: false,
    userMessage: detail ? `${base} ${detail}` : base,
  };
}

export async function validatePromoForPublishCheckout(
  input: PromoPublishValidationInput,
): Promise<PromoPublishValidationResult> {
  const locale = input.locale === "en" ? "en" : "es";
  const subtotalCents = Math.max(0, Math.floor(Number(input.subtotalCents) || 0));
  const category = String(input.category ?? "").trim().toLowerCase();
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();

  const packageDef = getRevenuePackageDefinition(packageKey);
  if (!packageDef || packageDef.category !== category) {
    return invalidResult(locale);
  }

  const row = await loadPromoByCode(input.code);
  if (!row) {
    return invalidResult(locale);
  }

  const effectiveStatus = resolveEffectivePromoCodeStatus({
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    redemptionCount: row.redemption_count,
    maxRedemptions: row.max_redemptions,
  });

  if (effectiveStatus !== "active") {
    return invalidResult(locale);
  }

  if (resolveWebsiteLaunch25Rejection(row, packageKey)) {
    return invalidResult(locale);
  }

  const promoType = resolveRevenuePromoTypeFromRow(row);
  if (!promoType) {
    return invalidResult(
      locale,
      locale === "es"
        ? "(El código no tiene un descuento configurado en admin.)"
        : "(Code has no discount value configured in admin.)",
    );
  }

  const percentOff = resolvePromoPercentOff(row);
  const amountOffCents = resolvePromoAmountOffCents(row);

  if (promoType === "percent_off" && percentOff == null) {
    return invalidResult(locale);
  }
  if (promoType === "amount_off" && amountOffCents == null) {
    return invalidResult(locale);
  }

  const validation = validatePromoEligibility({
    promoType,
    isActive: row.is_active !== false && row.status !== "revoked",
    categoryScope: resolvePromoCategoryScope(row),
    packageScope: row.package_scope,
    placementScope: row.placement_scope,
    startsAt: row.starts_at,
    expiresAt: row.ends_at,
    maxRedemptions: row.max_redemptions,
    redemptionCount: row.redemption_count,
    perCustomerLimit: row.per_customer_limit,
    category,
    packageKey,
    placementTier: packageDef.placementTierKey,
  });

  if (!validation.eligible) {
    return invalidResult(locale);
  }

  const discountCents = calculatePromoDiscountCents({
    baseAmountCents: subtotalCents,
    promoType,
    percentOff,
    amountOffCents,
  });

  if (discountCents <= 0) {
    return invalidResult(locale);
  }

  const totalCents = Math.max(0, subtotalCents - discountCents);

  return {
    ok: true,
    code: row.code,
    promoCodeId: row.id,
    discountType: promoType,
    discountLabel: buildDiscountLabel(promoType, percentOff, amountOffCents),
    discountCents,
    subtotalCents,
    totalCents,
    redemptionPolicy: PROMO_REDEMPTION_POLICY,
  };
}
