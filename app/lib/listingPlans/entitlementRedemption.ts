/**
 * Entitlement redemption / attachment read model (pure helpers).
 * Gate G1.6G — no DB, Stripe, public sorting, or commission.
 */

import {
  getPackageEntitlementBenefits,
  isPackageEntitlementActive,
  normalizePackageEntitlementTier,
  type PackageEntitlementBenefit,
  type PackageEntitlementTier,
} from "./packageEntitlements";
import { resolveEffectivePromoCodeStatus, type LeonixCodeStatus } from "./promoCodeLifecycle";

export type RedemptionStatus =
  | "attachable"
  | "already_attached"
  | "expired"
  | "revoked"
  | "redeemed"
  | "not_found"
  | "not_active"
  | "missing_listing"
  | "category_mismatch"
  | "unknown";

export type PromoCodeRedemptionInput = {
  code?: string | null;
  status?: string | null;
  codeType?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  revokedAt?: string | null;
  redemptionCount?: number | null;
  maxRedemptions?: number | null;
  category?: string | null;
  listingId?: string | null;
  packageEntitlementId?: string | null;
};

export type PromoCodeRedemptionState = {
  effectiveStatus: LeonixCodeStatus;
  redemptionStatus: RedemptionStatus;
  isRedeemable: boolean;
  hasLinkedEntitlement: boolean;
  warnings: string[];
};

export type EntitlementAttachmentInput = {
  entitlementId?: string | null;
  entitlementStatus?: string | null;
  entitlementListingId?: string | null;
  entitlementCategory?: string | null;
  entitlementTier?: string | null;
  entitlementStartsAt?: string | null;
  entitlementEndsAt?: string | null;
  entitlementRevokedAt?: string | null;
  targetListingId?: string | null;
  targetCategory?: string | null;
};

export type EntitlementAttachmentResult = {
  canAttach: boolean;
  reason: RedemptionStatus;
  warnings: string[];
};

export type UserDashboardEntitlementSummary = {
  code: string | null;
  packageTier: string | null;
  category: string | null;
  listingId: string | null;
  businessName: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean | null;
  benefits: string[];
  label: string;
  warnings: string[];
};

export type UserDashboardEntitlementInput = {
  code?: string | null;
  packageTier?: string | null;
  category?: string | null;
  listingId?: string | null;
  businessName?: string | null;
  status?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  revokedAt?: string | null;
  benefits?: Record<string, boolean> | null;
};

export type CanAttachCodeInput = {
  codeStatus?: string | null;
  codeRevokedAt?: string | null;
  codeStartsAt?: string | null;
  codeEndsAt?: string | null;
  codeRedemptionCount?: number | null;
  codeMaxRedemptions?: number | null;
  codeCategory?: string | null;
  codeListingId?: string | null;
  targetListingId?: string | null;
  targetCategory?: string | null;
};

export function normalizeRedemptionCode(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

const BENEFIT_LABELS: Record<PackageEntitlementBenefit, string> = {
  destacados_module: "Destacados",
  results_priority: "Results priority",
  classified_listing: "Classified listing",
  republish_access: "Republish",
  boost_access: "Boost",
  auto_refresh_access: "Auto refresh",
  print_advertiser_badge: "Print badge",
  verified_review_eligible: "Verified review",
  concierge_eligible: "Concierge",
};

function benefitLabelsFromRecord(benefits: Record<string, boolean> | null | undefined): string[] {
  if (!benefits) return [];
  return (Object.keys(BENEFIT_LABELS) as PackageEntitlementBenefit[])
    .filter((k) => benefits[k])
    .map((k) => BENEFIT_LABELS[k]);
}

export function resolvePromoCodeRedemptionState(
  input: PromoCodeRedemptionInput,
  now = new Date(),
): PromoCodeRedemptionState {
  const warnings: string[] = [];
  const code = normalizeRedemptionCode(input.code);

  if (!code) {
    return {
      effectiveStatus: "unknown",
      redemptionStatus: "not_found",
      isRedeemable: false,
      hasLinkedEntitlement: false,
      warnings: ["No code provided."],
    };
  }

  const effectiveStatus = resolveEffectivePromoCodeStatus(
    {
      status: input.status,
      codeType: input.codeType,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      revokedAt: input.revokedAt,
      redemptionCount: input.redemptionCount,
      maxRedemptions: input.maxRedemptions,
    },
    now,
  );

  const hasLinkedEntitlement = Boolean(input.packageEntitlementId);

  if (effectiveStatus === "revoked") {
    return {
      effectiveStatus,
      redemptionStatus: "revoked",
      isRedeemable: false,
      hasLinkedEntitlement,
      warnings: ["Code is revoked — cannot be used for attachment or redemption."],
    };
  }

  if (effectiveStatus === "expired") {
    return {
      effectiveStatus,
      redemptionStatus: "expired",
      isRedeemable: false,
      hasLinkedEntitlement,
      warnings: ["Code is expired."],
    };
  }

  if (effectiveStatus === "redeemed") {
    return {
      effectiveStatus,
      redemptionStatus: "redeemed",
      isRedeemable: false,
      hasLinkedEntitlement,
      warnings: ["Code has been fully redeemed (max redemptions reached)."],
    };
  }

  if (effectiveStatus === "draft") {
    return {
      effectiveStatus,
      redemptionStatus: "not_active",
      isRedeemable: false,
      hasLinkedEntitlement,
      warnings: ["Code is in draft status — not yet active."],
    };
  }

  if (input.listingId) {
    warnings.push("Code already has a listing_id attached.");
    return {
      effectiveStatus,
      redemptionStatus: "already_attached",
      isRedeemable: false,
      hasLinkedEntitlement,
      warnings,
    };
  }

  if (effectiveStatus !== "active") {
    return {
      effectiveStatus,
      redemptionStatus: "not_active",
      isRedeemable: false,
      hasLinkedEntitlement,
      warnings: [`Code status is "${effectiveStatus}" — not attachable.`],
    };
  }

  warnings.push("Code is active and available for attachment.");
  return {
    effectiveStatus,
    redemptionStatus: "attachable",
    isRedeemable: true,
    hasLinkedEntitlement,
    warnings,
  };
}

export function resolveListingEntitlementAttachment(
  input: EntitlementAttachmentInput,
  now = new Date(),
): EntitlementAttachmentResult {
  const warnings: string[] = [];

  if (!input.entitlementId) {
    return { canAttach: false, reason: "not_found", warnings: ["No entitlement ID provided."] };
  }

  if (!input.targetListingId) {
    return { canAttach: false, reason: "missing_listing", warnings: ["No target listing ID provided."] };
  }

  if (input.entitlementRevokedAt || input.entitlementStatus === "revoked") {
    return { canAttach: false, reason: "revoked", warnings: ["Entitlement is revoked."] };
  }

  const isActive = isPackageEntitlementActive({
    startsAt: input.entitlementStartsAt,
    endsAt: input.entitlementEndsAt,
    now,
  });

  if (isActive === false) {
    const start = input.entitlementStartsAt ? new Date(input.entitlementStartsAt) : null;
    if (start && start.getTime() > now.getTime()) {
      warnings.push("Entitlement has not started yet — attachment is allowed but benefits are not active.");
    } else {
      return { canAttach: false, reason: "expired", warnings: ["Entitlement has expired."] };
    }
  }

  if (input.entitlementListingId && input.entitlementListingId !== input.targetListingId) {
    warnings.push(
      `Entitlement is currently attached to listing "${input.entitlementListingId}"; re-attaching to "${input.targetListingId}".`,
    );
  }

  if (
    input.entitlementCategory &&
    input.targetCategory &&
    input.entitlementCategory.toLowerCase() !== input.targetCategory.toLowerCase()
  ) {
    return {
      canAttach: false,
      reason: "category_mismatch",
      warnings: [
        `Entitlement category "${input.entitlementCategory}" does not match listing category "${input.targetCategory}".`,
      ],
    };
  }

  return { canAttach: true, reason: "attachable", warnings };
}

export function buildUserDashboardEntitlementSummary(
  input: UserDashboardEntitlementInput,
): UserDashboardEntitlementSummary {
  const warnings: string[] = [];

  const status = String(input.status ?? "unknown").toLowerCase();
  const isRevoked = status === "revoked" || Boolean(input.revokedAt);
  const effectiveStatus = isRevoked ? "revoked" : status;

  const tier = input.packageTier
    ? normalizePackageEntitlementTier(input.packageTier)
    : ("none" as PackageEntitlementTier);

  const isActive = isPackageEntitlementActive({
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });

  const derivedActive = isRevoked
    ? false
    : effectiveStatus === "expired"
      ? false
      : isActive;

  const def = getPackageEntitlementBenefits(tier);
  const benefits = input.benefits
    ? benefitLabelsFromRecord(input.benefits)
    : benefitLabelsFromRecord(def.benefits);

  if (isRevoked) {
    warnings.push("This package entitlement has been revoked.");
  }
  if (isActive === false && !isRevoked) {
    const start = input.startsAt ? new Date(input.startsAt) : null;
    const now = new Date();
    if (start && start.getTime() > now.getTime()) {
      warnings.push("Entitlement has not started yet.");
    } else {
      warnings.push("Entitlement has expired.");
    }
  }
  if (!input.listingId) {
    warnings.push("No listing attached yet — code was created before listing.");
  }

  return {
    code: input.code?.trim() || null,
    packageTier: tier === "none" || tier === "unknown" ? null : tier,
    category: input.category?.trim().toLowerCase() || null,
    listingId: input.listingId?.trim() || null,
    businessName: input.businessName?.trim() || null,
    status: effectiveStatus,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    isActive: derivedActive,
    benefits,
    label: def.label,
    warnings,
  };
}

export function canAttachCodeToListing(
  input: CanAttachCodeInput,
  now = new Date(),
): { canAttach: boolean; reason: RedemptionStatus; warnings: string[] } {
  const warnings: string[] = [];

  if (!input.targetListingId) {
    return { canAttach: false, reason: "missing_listing", warnings: ["No target listing ID."] };
  }

  const effectiveStatus = resolveEffectivePromoCodeStatus(
    {
      status: input.codeStatus,
      startsAt: input.codeStartsAt,
      endsAt: input.codeEndsAt,
      revokedAt: input.codeRevokedAt,
      redemptionCount: input.codeRedemptionCount,
      maxRedemptions: input.codeMaxRedemptions,
    },
    now,
  );

  if (effectiveStatus === "revoked") {
    return { canAttach: false, reason: "revoked", warnings: ["Code is revoked."] };
  }
  if (effectiveStatus === "expired") {
    return { canAttach: false, reason: "expired", warnings: ["Code is expired."] };
  }
  if (effectiveStatus === "redeemed") {
    return { canAttach: false, reason: "redeemed", warnings: ["Code fully redeemed."] };
  }
  if (effectiveStatus === "draft") {
    return { canAttach: false, reason: "not_active", warnings: ["Code is draft."] };
  }

  if (input.codeListingId && input.codeListingId !== input.targetListingId) {
    warnings.push(`Code already attached to "${input.codeListingId}"; will re-attach.`);
  }

  if (
    input.codeCategory &&
    input.targetCategory &&
    input.codeCategory.toLowerCase() !== input.targetCategory.toLowerCase()
  ) {
    return {
      canAttach: false,
      reason: "category_mismatch",
      warnings: [`Category mismatch: code is "${input.codeCategory}", listing is "${input.targetCategory}".`],
    };
  }

  return { canAttach: true, reason: "attachable", warnings };
}
