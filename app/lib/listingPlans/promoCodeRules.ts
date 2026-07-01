/**
 * Revenue OS promo code validation rules (pure read model).
 * Gate STRIPE-REVENUE-OS-PACKAGE-KEY-ALIGNMENT-01 — no DB, Stripe, or env.
 */

import {
  EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY,
  isPromoEligiblePackageKey,
} from "./revenuePricingMatrix";

export type RevenuePromoType =
  | "percent_off"
  | "amount_off"
  | "free_comp"
  | "print_client"
  | "staff_comp"
  | "newsletter"
  | "sales_rep"
  | "manual";

export const REVENUE_PROMO_TYPES: RevenuePromoType[] = [
  "percent_off",
  "amount_off",
  "free_comp",
  "print_client",
  "staff_comp",
  "newsletter",
  "sales_rep",
  "manual",
];

export type PromoValidationResult = {
  eligible: boolean;
  reason: string;
  warnings: string[];
};

export type PromoEligibilityInput = {
  promoType?: RevenuePromoType | string | null;
  isActive?: boolean | null;
  categoryScope?: string[] | null;
  packageScope?: string[] | null;
  placementScope?: string[] | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  redemptionCount?: number | null;
  perCustomerLimit?: number | null;
  customerRedemptionCount?: number | null;
  category?: string | null;
  packageKey?: string | null;
  placementTier?: string | null;
  now?: Date;
};

function scopeMatches(scope: string[] | null | undefined, value: string | null | undefined): boolean {
  if (!scope?.length) return true;
  const token = String(value ?? "").trim().toLowerCase();
  if (!token) return false;
  return scope.some((s) => String(s).trim().toLowerCase() === token);
}

export function validatePromoEligibility(input: PromoEligibilityInput): PromoValidationResult {
  const warnings: string[] = [];
  const now = input.now ?? new Date();
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();

  if (packageKey === EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY) {
    return {
      eligible: false,
      reason: "Empleos job fair is always free — promo not required or accepted.",
      warnings: ["Publicar feria de empleos does not use promo codes."],
    };
  }

  if (packageKey && !isPromoEligiblePackageKey(packageKey)) {
    return {
      eligible: false,
      reason: "Package is not promo-eligible.",
      warnings: ["Free and non-monetized packages do not require promo redemption."],
    };
  }

  const promoType = String(input.promoType ?? "").trim().toLowerCase() as RevenuePromoType;

  if (!REVENUE_PROMO_TYPES.includes(promoType)) {
    return { eligible: false, reason: "Unknown promo type.", warnings: ["Promo type not in Revenue OS contract."] };
  }

  if (input.isActive === false) {
    return { eligible: false, reason: "Promo code is inactive.", warnings };
  }

  const start = input.startsAt ? new Date(input.startsAt) : null;
  const end = input.expiresAt ? new Date(input.expiresAt) : null;
  if (start && Number.isFinite(start.getTime()) && start.getTime() > now.getTime()) {
    return { eligible: false, reason: "Promo code not yet active.", warnings };
  }
  if (end && Number.isFinite(end.getTime()) && end.getTime() < now.getTime()) {
    return { eligible: false, reason: "Promo code expired.", warnings };
  }

  const max = input.maxRedemptions;
  const count = Number(input.redemptionCount ?? 0);
  if (max != null && Number.isFinite(max) && max >= 1 && count >= max) {
    return { eligible: false, reason: "Promo code redemption limit reached.", warnings };
  }

  const perCustomer = input.perCustomerLimit ?? 1;
  const customerCount = Number(input.customerRedemptionCount ?? 0);
  if (perCustomer >= 1 && customerCount >= perCustomer) {
    return { eligible: false, reason: "Customer redemption limit reached.", warnings };
  }

  if (!scopeMatches(input.categoryScope, input.category)) {
    return { eligible: false, reason: "Promo not valid for this category.", warnings };
  }
  if (!scopeMatches(input.packageScope, input.packageKey)) {
    return { eligible: false, reason: "Promo not valid for this package.", warnings };
  }
  if (!scopeMatches(input.placementScope, input.placementTier)) {
    return { eligible: false, reason: "Promo not valid for this placement tier.", warnings };
  }

  if (promoType === "free_comp" || promoType === "print_client" || promoType === "staff_comp") {
    warnings.push("Comp promo — fulfillment must create entitlement without fake payment.");
  }

  if (promoType === "percent_off" || promoType === "amount_off") {
    warnings.push("Discount promo — Stripe Checkout gate must apply discount server-side.");
  }

  return { eligible: true, reason: "Promo eligible for validation.", warnings };
}

export function promoTypeLabel(type: RevenuePromoType | string): string {
  const raw = String(type).trim().toLowerCase();
  const labels: Record<RevenuePromoType, string> = {
    percent_off: "Percent off",
    amount_off: "Amount off",
    free_comp: "Free comp",
    print_client: "Print client",
    staff_comp: "Staff comp",
    newsletter: "Newsletter",
    sales_rep: "Sales rep",
    manual: "Manual",
  };
  return labels[raw as RevenuePromoType] ?? "Unknown";
}
