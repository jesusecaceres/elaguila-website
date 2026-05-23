/**
 * Leonix promo code lifecycle helpers (pure / read-only).
 * Gate G1.6F — no DB, Stripe, or public redemption.
 */

import {
  resolvePromoCodeRule,
  type LeonixCodeStatus,
  type LeonixPromoCodeType,
  type PromoCodeRuleSummary,
} from "./packagePricingRules";

export type { LeonixCodeStatus, LeonixPromoCodeType, PromoCodeRuleSummary };

export const LEONIX_PROMO_CODE_STATUSES: LeonixCodeStatus[] = [
  "draft",
  "active",
  "expired",
  "revoked",
  "redeemed",
];

export const LEONIX_PROMO_CODE_TYPES: LeonixPromoCodeType[] = [
  "entitlement",
  "discount",
  "newsletter",
  "sms",
  "sales_rep",
  "contract",
  "founding_partner",
  "owner_override",
  "unknown",
];

export type PromoCodeLifecycleInput = {
  status?: string | null;
  codeType?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  redemptionCount?: number | null;
  maxRedemptions?: number | null;
  revokedAt?: string | null;
};

export function normalizePromoCodeForStorage(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

export function generateLeonixPromoCode(prefix = "LX-PROMO"): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Effective lifecycle status: stored status wins for revoked/redeemed;
 * otherwise derive expired from dates or max redemptions.
 */
export function resolveEffectivePromoCodeStatus(
  input: PromoCodeLifecycleInput,
  now = new Date(),
): LeonixCodeStatus {
  const stored = String(input.status ?? "active")
    .trim()
    .toLowerCase() as LeonixCodeStatus;
  if (stored === "revoked" || input.revokedAt) return "revoked";
  if (stored === "redeemed") return "redeemed";
  if (stored === "draft") return "draft";

  const max = input.maxRedemptions;
  const count = Number(input.redemptionCount ?? 0);
  if (max != null && Number.isFinite(max) && max >= 1 && count >= max) {
    return "redeemed";
  }

  const end = input.endsAt ? new Date(input.endsAt) : null;
  if (end && Number.isFinite(end.getTime()) && end.getTime() < now.getTime()) {
    return "expired";
  }

  const start = input.startsAt ? new Date(input.startsAt) : null;
  if (start && Number.isFinite(start.getTime()) && start.getTime() > now.getTime() && stored !== "active") {
    return "draft";
  }

  if (stored === "expired") return "expired";
  return stored === "active" || stored === "unknown" ? "active" : stored;
}

export function buildPromoCodeRulePreview(input: {
  codeType?: string | null;
  status?: string | null;
}): PromoCodeRuleSummary {
  const effectiveStatus = resolveEffectivePromoCodeStatus({
    status: input.status,
    codeType: input.codeType,
  });
  return resolvePromoCodeRule({
    promoCodeType: input.codeType,
    status: effectiveStatus,
  });
}

export function promoCodeRuleBadges(rule: PromoCodeRuleSummary): string[] {
  const badges: string[] = [];
  if (rule.nonStackable) badges.push("Non-stackable");
  if (rule.oneTimeUse) badges.push("One-time");
  if (rule.requiresOwnerApproval) badges.push("Owner approval");
  if (rule.requiresSubscriberIdentity) badges.push("Subscriber identity");
  if (rule.requiresSalesRepAttribution) badges.push("Sales rep");
  if (rule.canDiscountPayment) badges.push("Can discount payment");
  if (rule.canCreatePackageEntitlement) badges.push("Can create entitlement");
  return badges;
}
