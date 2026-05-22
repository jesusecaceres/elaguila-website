import {
  estimateCommission,
  formatMoneyCents,
  resolvePackagePricing,
  resolvePromoCodeRule,
  resolveSalesAttribution,
  type LeonixContractTerm,
  type LeonixPromoCodeType,
} from "@/app/lib/listingPlans/packagePricingRules";

export type EntitlementPricingMetadataInput = {
  packageTier: string;
  contractTerm: string;
  promoCodeType: string;
  salesRepId?: string | null;
  salesRepName?: string | null;
  createdByAdmin?: string | null;
};

function attributionSourceForPromo(promoCodeType: string): string {
  const t = String(promoCodeType ?? "").trim().toLowerCase();
  if (t === "sales_rep") return "sales_rep";
  if (t === "founding_partner") return "founding_partner";
  if (t === "owner_override") return "owner_override";
  if (t === "newsletter" || t === "newsletter_signup") return "newsletter_signup";
  if (t === "sms" || t === "sms_signup") return "sms_signup";
  return "admin_manual";
}

export function buildEntitlementPricingMetadata(input: EntitlementPricingMetadataInput) {
  const pricing = resolvePackagePricing({
    packageTier: input.packageTier,
    contractTerm: input.contractTerm,
  });

  const promo = resolvePromoCodeRule({
    promoCodeType: input.promoCodeType,
    status: "active",
  });

  const source = attributionSourceForPromo(input.promoCodeType);
  const sales = resolveSalesAttribution({
    salesRepId: input.salesRepId,
    salesRepName: input.salesRepName,
    source,
    createdByAdmin: input.createdByAdmin ?? "Admin",
  });

  const commission = estimateCommission({
    packageTier: pricing.packageTier,
    contractTerm: pricing.contractTerm,
    salesRepId: input.salesRepId,
    paymentStatus: null,
    pricing,
  });

  const commissionPreviewWarning =
    "Future commission preview — not earned until payment clears (paid/cleared/succeeded). No payout ledger in this gate.";

  return {
    pricing: {
      package_tier: pricing.packageTier,
      contract_term: pricing.contractTerm as LeonixContractTerm,
      base_monthly_price_cents: pricing.baseMonthlyPriceCents,
      discount_percent: pricing.discountPercent,
      discounted_monthly_price_cents: pricing.discountedMonthlyPriceCents,
      term_months: pricing.termMonths,
      estimated_contract_total_cents: pricing.estimatedContractTotalCents,
      label: pricing.label,
    },
    promo_rule: {
      promo_code_type: promo.codeType as LeonixPromoCodeType,
      non_stackable: promo.nonStackable,
      one_time_use: promo.oneTimeUse,
      requires_owner_approval: promo.requiresOwnerApproval,
      requires_subscriber_identity: promo.requiresSubscriberIdentity,
      requires_sales_rep_attribution: promo.requiresSalesRepAttribution,
      can_create_package_entitlement: promo.canCreatePackageEntitlement,
      can_discount_payment: promo.canDiscountPayment,
    },
    sales_attribution: {
      sales_rep_id: sales.salesRepId,
      sales_rep_name: sales.salesRepName,
      source: sales.source,
      created_by_admin: sales.createdByAdmin,
      commission_eligible: commission.commissionEligible,
      commission_rule_key: commission.commissionRuleKey ?? sales.commissionRuleKey,
    },
    commission_preview: {
      payment_status: null as string | null,
      commission_eligible: commission.commissionEligible,
      estimated_commission_cents: commission.estimatedCommissionCents,
      estimated_commission_label: commission.estimatedCommissionLabel,
      warning: commissionPreviewWarning,
    },
    pricingWarnings: pricing.warnings,
    promoWarnings: promo.warnings,
    salesWarnings: sales.warnings,
    commissionWarnings: commission.warnings,
    formatMoneyCents,
  };
}
