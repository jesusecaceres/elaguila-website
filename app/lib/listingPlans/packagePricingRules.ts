/**
 * Leonix Print-to-Digital pricing, promo-code rules, sales attribution, and commission estimates.
 * Gate G1.6D — pure functions only; no DB, Stripe, or UI.
 */

import { normalizePackageEntitlementTier, type PackageEntitlementTier } from "./packageEntitlements";

export type LeonixPackageTier = Exclude<PackageEntitlementTier, "none" | "unknown">;

export type LeonixContractTerm =
  | "month_to_month"
  | "3_month"
  | "6_month"
  | "12_month"
  | "founding_partner";

export type LeonixPromoCodeType =
  | "entitlement"
  | "discount"
  | "newsletter"
  | "sms"
  | "sales_rep"
  | "contract"
  | "founding_partner"
  | "owner_override"
  | "unknown";

export type LeonixCodeStatus =
  | "draft"
  | "active"
  | "expired"
  | "revoked"
  | "redeemed"
  | "unknown";

export type PricingRuleSummary = {
  packageTier: LeonixPackageTier;
  contractTerm: LeonixContractTerm;
  baseMonthlyPriceCents: number;
  discountPercent: number;
  discountedMonthlyPriceCents: number;
  termMonths: number;
  estimatedContractTotalCents: number;
  label: string;
  warnings: string[];
};

export type PromoCodeRuleSummary = {
  codeType: LeonixPromoCodeType;
  status: LeonixCodeStatus;
  nonStackable: boolean;
  oneTimeUse: boolean;
  requiresOwnerApproval: boolean;
  requiresSubscriberIdentity: boolean;
  requiresSalesRepAttribution: boolean;
  canCreatePackageEntitlement: boolean;
  canDiscountPayment: boolean;
  warnings: string[];
};

export type SalesAttributionSummary = {
  salesRepId: string | null;
  salesRepName: string | null;
  source: string;
  createdByAdmin: string | null;
  commissionEligible: boolean;
  commissionRuleKey: string | null;
  warnings: string[];
};

export type CommissionEstimateSummary = {
  commissionEligible: boolean;
  commissionRuleKey: string | null;
  /** Informational estimate only — not a payout obligation. */
  estimatedCommissionCents: number | null;
  estimatedCommissionLabel: string;
  warnings: string[];
};

export type PackagePricingInput = {
  packageTier?: string | null;
  contractTerm?: string | null;
  discountPercentOverride?: number | null;
};

export type PromoCodeRuleInput = {
  promoCodeType?: string | null;
  status?: string | null;
};

export type SalesAttributionInput = {
  salesRepId?: string | null;
  salesRepName?: string | null;
  source?: string | null;
  createdByAdmin?: string | null;
};

export type CommissionEstimateInput = {
  packageTier?: string | null;
  contractTerm?: string | null;
  salesRepId?: string | null;
  paymentStatus?: string | null;
  pricing?: PricingRuleSummary | null;
};

const BASE_MONTHLY_PRICE_CENTS: Record<LeonixPackageTier, number> = {
  premium: 199_900,
  full_page: 119_900,
  half_page: 79_900,
  quarter_page: 49_900,
  classified_print: 39_900,
  digital_only: 39_900,
};

const TERM_CONFIG: Record<
  LeonixContractTerm,
  { termMonths: number; discountPercent: number; requiresOwnerApproval: boolean }
> = {
  month_to_month: { termMonths: 1, discountPercent: 0, requiresOwnerApproval: false },
  "3_month": { termMonths: 3, discountPercent: 10, requiresOwnerApproval: false },
  "6_month": { termMonths: 6, discountPercent: 15, requiresOwnerApproval: false },
  "12_month": { termMonths: 12, discountPercent: 20, requiresOwnerApproval: false },
  founding_partner: { termMonths: 12, discountPercent: 25, requiresOwnerApproval: true },
};

const CLEARED_PAYMENT_STATUSES = new Set(["paid", "cleared", "succeeded", "payment_cleared"]);

const PACKAGE_TIER_LABELS: Record<LeonixPackageTier, string> = {
  premium: "Premium",
  full_page: "Full page",
  half_page: "Half page",
  quarter_page: "Quarter page",
  classified_print: "Classified print",
  digital_only: "Digital only",
};

function warn(warnings: string[], message: string) {
  if (!warnings.includes(message)) warnings.push(message);
}

function normalizePackageTier(value: string | null | undefined): LeonixPackageTier | "unknown" {
  const t = normalizePackageEntitlementTier(value);
  if (t === "none" || t === "unknown") return "unknown";
  return t as LeonixPackageTier;
}

function normalizeContractTerm(value: string | null | undefined): LeonixContractTerm | "unknown" {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (raw === "month_to_month" || raw === "monthly" || raw === "m2m") return "month_to_month";
  if (raw === "3_month" || raw === "3mo" || raw === "3_months") return "3_month";
  if (raw === "6_month" || raw === "6mo" || raw === "6_months") return "6_month";
  if (raw === "12_month" || raw === "12mo" || raw === "12_months" || raw === "annual" || raw === "yearly")
    return "12_month";
  if (raw === "founding_partner" || raw === "founding" || raw === "partner") return "founding_partner";
  return "unknown";
}

function normalizePromoCodeType(value: string | null | undefined): LeonixPromoCodeType {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const map: Record<string, LeonixPromoCodeType> = {
    entitlement: "entitlement",
    package_entitlement: "entitlement",
    discount: "discount",
    promo: "discount",
    newsletter: "newsletter",
    newsletter_signup: "newsletter",
    sms: "sms",
    sms_signup: "sms",
    sales_rep: "sales_rep",
    sales: "sales_rep",
    contract: "contract",
    founding_partner: "founding_partner",
    owner_override: "owner_override",
    owner: "owner_override",
    admin_manual: "entitlement",
    stripe_checkout: "discount",
  };
  return map[raw] ?? "unknown";
}

function normalizeCodeStatus(value: string | null | undefined): LeonixCodeStatus {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  const allowed: LeonixCodeStatus[] = ["draft", "active", "expired", "revoked", "redeemed"];
  return (allowed.find((s) => s === raw) ?? "unknown") as LeonixCodeStatus;
}

function normalizeSource(value: string | null | undefined): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!raw) return "unknown";
  return raw;
}

function clampDiscountPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function applyDiscount(monthlyCents: number, discountPercent: number): number {
  const pct = clampDiscountPercent(discountPercent);
  return Math.round(monthlyCents * (1 - pct / 100));
}

export function getPackageBasePriceCents(packageTier: string | LeonixPackageTier): number {
  const tier = normalizePackageTier(packageTier);
  if (tier === "unknown") return 0;
  return BASE_MONTHLY_PRICE_CENTS[tier];
}

export function getContractTermDiscount(contractTerm: string | LeonixContractTerm): {
  termMonths: number;
  discountPercent: number;
  requiresOwnerApproval: boolean;
} {
  const term = normalizeContractTerm(contractTerm);
  if (term === "unknown") {
    return { termMonths: 1, discountPercent: 0, requiresOwnerApproval: false };
  }
  return TERM_CONFIG[term];
}

export function formatMoneyCents(cents: number, locale = "en-US"): string {
  if (!Number.isFinite(cents)) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(cents / 100);
}

export function resolvePackagePricing(input: PackagePricingInput = {}): PricingRuleSummary {
  const warnings: string[] = [];
  const tier = normalizePackageTier(input.packageTier);
  const term = normalizeContractTerm(input.contractTerm ?? "month_to_month");

  if (tier === "unknown") {
    warn(warnings, "Unknown package tier — using digital_only baseline for estimate.");
  }
  const resolvedTier: LeonixPackageTier = tier === "unknown" ? "digital_only" : tier;

  if (term === "unknown") {
    warn(warnings, "Unknown contract term — defaulting to month_to_month.");
  }
  const resolvedTerm: LeonixContractTerm = term === "unknown" ? "month_to_month" : term;

  const baseMonthlyPriceCents = getPackageBasePriceCents(resolvedTier);
  const termCfg = getContractTermDiscount(resolvedTerm);
  let discountPercent = termCfg.discountPercent;

  if (input.discountPercentOverride != null && String(input.discountPercentOverride).trim() !== "") {
    const override = Number(input.discountPercentOverride);
    if (Number.isFinite(override)) {
      discountPercent = clampDiscountPercent(override);
      if (discountPercent > termCfg.discountPercent && resolvedTerm !== "founding_partner") {
        warn(warnings, "Discount override exceeds standard term discount — owner approval may be required.");
      }
    } else {
      warn(warnings, "Invalid discountPercentOverride — using contract term discount.");
    }
  }

  if (resolvedTerm === "founding_partner") {
    warn(warnings, "Founding partner pricing requires owner/admin approval (max 25% off).");
  }

  const discountedMonthlyPriceCents = applyDiscount(baseMonthlyPriceCents, discountPercent);
  const termMonths = termCfg.termMonths;
  const estimatedContractTotalCents = discountedMonthlyPriceCents * termMonths;
  const tierLabel = PACKAGE_TIER_LABELS[resolvedTier];

  const label =
    discountPercent > 0
      ? `${tierLabel} · ${formatMoneyCents(discountedMonthlyPriceCents)}/mo (${discountPercent}% off) · ${termMonths} mo ≈ ${formatMoneyCents(estimatedContractTotalCents)}`
      : `${tierLabel} · ${formatMoneyCents(discountedMonthlyPriceCents)}/mo · ${termMonths} mo ≈ ${formatMoneyCents(estimatedContractTotalCents)}`;

  return {
    packageTier: resolvedTier,
    contractTerm: resolvedTerm,
    baseMonthlyPriceCents,
    discountPercent,
    discountedMonthlyPriceCents,
    termMonths,
    estimatedContractTotalCents,
    label,
    warnings,
  };
}

export function resolvePromoCodeRule(input: PromoCodeRuleInput = {}): PromoCodeRuleSummary {
  const warnings: string[] = [];
  const codeType = normalizePromoCodeType(input.promoCodeType);
  const status = normalizeCodeStatus(input.status ?? "active");

  if (codeType === "unknown") {
    warn(warnings, "Unknown promo code type — applying conservative defaults.");
  }
  if (status === "unknown") {
    warn(warnings, "Unknown code status — treat as inactive until clarified.");
  }

  const nonStackable = true;

  let oneTimeUse = false;
  let requiresOwnerApproval = false;
  let requiresSubscriberIdentity = false;
  let requiresSalesRepAttribution = false;
  let canCreatePackageEntitlement = false;
  let canDiscountPayment = false;

  switch (codeType) {
    case "entitlement":
      canCreatePackageEntitlement = true;
      canDiscountPayment = false;
      break;
    case "discount":
      canDiscountPayment = true;
      break;
    case "newsletter":
    case "sms":
      oneTimeUse = true;
      requiresSubscriberIdentity = true;
      canDiscountPayment = true;
      warn(warnings, `${codeType} codes are one-time and require subscriber identity (future gate).`);
      break;
    case "sales_rep":
      requiresSalesRepAttribution = true;
      canDiscountPayment = true;
      canCreatePackageEntitlement = true;
      break;
    case "contract":
      canDiscountPayment = true;
      canCreatePackageEntitlement = true;
      break;
    case "founding_partner":
      requiresOwnerApproval = true;
      canDiscountPayment = true;
      canCreatePackageEntitlement = true;
      break;
    case "owner_override":
      requiresOwnerApproval = true;
      canDiscountPayment = true;
      canCreatePackageEntitlement = true;
      break;
    default:
      canDiscountPayment = true;
      break;
  }

  warn(warnings, "Promo codes are non-stackable — only one active discount rule should win.");

  if (status === "expired" || status === "revoked" || status === "redeemed") {
    warn(warnings, `Code status is ${status} — not redeemable.`);
  }

  return {
    codeType,
    status,
    nonStackable,
    oneTimeUse,
    requiresOwnerApproval,
    requiresSubscriberIdentity,
    requiresSalesRepAttribution,
    canCreatePackageEntitlement,
    canDiscountPayment,
    warnings,
  };
}

export function resolveSalesAttribution(input: SalesAttributionInput = {}): SalesAttributionSummary {
  const warnings: string[] = [];
  const source = normalizeSource(input.source);
  const salesRepId = String(input.salesRepId ?? "").trim() || null;
  const salesRepName = String(input.salesRepName ?? "").trim() || null;
  const createdByAdmin = String(input.createdByAdmin ?? "").trim() || null;

  const salesSources = new Set(["sales_rep", "admin_manual", "stripe_checkout"]);
  const needsRep =
    source === "sales_rep" || (source === "admin_manual" && Boolean(salesRepId || salesRepName));

  if (needsRep && !salesRepId && !salesRepName) {
    warn(warnings, "Sales rep attribution expected but sales_rep_id/name missing.");
  }

  let commissionEligible = false;
  let commissionRuleKey: string | null = null;

  if (salesRepId || salesRepName) {
    commissionRuleKey = `sales_rep:${salesRepId ?? salesRepName ?? "unknown"}`;
    warn(warnings, "Commission eligibility requires cleared payment (see estimateCommission).");
  } else if (salesSources.has(source) && source !== "sales_rep") {
    warn(warnings, "Source may be sales-related — confirm rep attribution for commission.");
  }

  if (source === "newsletter_signup" || source === "sms_signup") {
    warn(warnings, "Newsletter/SMS attribution — commission typically not applicable.");
  }

  return {
    salesRepId,
    salesRepName,
    source,
    createdByAdmin: createdByAdmin ?? (source === "admin_manual" ? "Admin" : null),
    commissionEligible,
    commissionRuleKey,
    warnings,
  };
}

function isPaymentCleared(paymentStatus: string | null | undefined): boolean {
  const raw = String(paymentStatus ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return CLEARED_PAYMENT_STATUSES.has(raw);
}

/**
 * Informational commission estimate only — not binding payout truth.
 */
export function estimateCommission(input: CommissionEstimateInput = {}): CommissionEstimateSummary {
  const warnings: string[] = [];
  const pricing =
    input.pricing ??
    resolvePackagePricing({
      packageTier: input.packageTier,
      contractTerm: input.contractTerm,
    });

  const salesRepId = String(input.salesRepId ?? "").trim() || null;
  const paymentCleared = isPaymentCleared(input.paymentStatus);

  if (!salesRepId) {
    warn(warnings, "No sales_rep_id — commission estimate not applicable.");
    return {
      commissionEligible: false,
      commissionRuleKey: null,
      estimatedCommissionCents: null,
      estimatedCommissionLabel: "No sales rep — commission estimate N/A",
      warnings,
    };
  }

  if (!paymentCleared) {
    warn(warnings, "Commission is not earned until payment clears (paid/cleared/succeeded).");
    return {
      commissionEligible: false,
      commissionRuleKey: `sales_rep:${salesRepId}`,
      estimatedCommissionCents: null,
      estimatedCommissionLabel: "Pending cleared payment — estimate only after payment",
      warnings,
    };
  }

  const term = pricing.contractTerm;
  let ratePercent = 10;
  if (term === "month_to_month") ratePercent = 8;
  else if (term === "3_month") ratePercent = 10;
  else if (term === "6_month") ratePercent = 12;
  else if (term === "12_month" || term === "founding_partner") ratePercent = 15;

  const estimatedCommissionCents = Math.round(pricing.estimatedContractTotalCents * (ratePercent / 100));
  warn(warnings, "Commission amount is an informational estimate only — not a payout obligation.");

  return {
    commissionEligible: true,
    commissionRuleKey: `sales_rep:${salesRepId}:${term}:${ratePercent}pct_estimate`,
    estimatedCommissionCents,
    estimatedCommissionLabel: `Estimate ~${formatMoneyCents(estimatedCommissionCents)} (${ratePercent}% of contract total, informational)`,
    warnings,
  };
}
