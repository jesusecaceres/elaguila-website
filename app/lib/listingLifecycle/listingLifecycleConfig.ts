import type { ListingLifecycleConfig } from "./listingLifecycleTypes";

export const RENTAS_LIFECYCLE_PACKAGE_KEY = "rentas_30d" as const;
export const RENTAS_LIFECYCLE_DURATION_DAYS = 30;
export const RENTAS_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS = 7;
export const BUSINESS_FIXED_TERM_MONTHS = [1, 3, 6, 12] as const;

export const RENTAS_LISTING_LIFECYCLE_CONFIG: ListingLifecycleConfig = {
  category: "rentas",
  packageKey: RENTAS_LIFECYCLE_PACKAGE_KEY,
  durationType: "fixed_days",
  durationDays: RENTAS_LIFECYCLE_DURATION_DAYS,
  renewalPackageKey: RENTAS_LIFECYCLE_PACKAGE_KEY,
  renewalPriceCents: 2499,
  renewalEligibleBeforeExpiryDays: RENTAS_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS,
  expirationRequired: true,
  hasAddons: false,
  publicVisibilityRequiresActiveLifecycle: true,
  reminderScheduleDays: [7, 3, 1, 0, -3],
  sourceTable: "listings",
  activeStatuses: ["active"],
  pendingPaymentStatuses: ["pending", "pending_payment"],
  pausedStatuses: ["paused"],
  suspendedStatuses: ["suspended", "flagged", "removed"],
};

export const LISTING_LIFECYCLE_CONFIGS: readonly ListingLifecycleConfig[] = [
  RENTAS_LISTING_LIFECYCLE_CONFIG,
  {
    category: "business_future",
    packageKey: "future_business_term",
    durationType: "fixed_term_months",
    allowedTermMonths: BUSINESS_FIXED_TERM_MONTHS,
    renewalPackageKey: null,
    renewalPriceCents: null,
    renewalEligibleBeforeExpiryDays: 7,
    expirationRequired: true,
    hasAddons: true,
    publicVisibilityRequiresActiveLifecycle: true,
    reminderScheduleDays: [7, 3, 1, 0, -3],
    sourceTable: "category_adapter",
    activeStatuses: ["active", "published"],
    pendingPaymentStatuses: ["pending", "pending_payment"],
    pausedStatuses: ["paused"],
    suspendedStatuses: ["suspended", "flagged", "removed"],
  },
  {
    category: "subscription_future",
    packageKey: "future_subscription",
    durationType: "subscription",
    allowedTermMonths: [1],
    renewalPackageKey: null,
    renewalPriceCents: null,
    renewalEligibleBeforeExpiryDays: null,
    expirationRequired: false,
    hasAddons: true,
    publicVisibilityRequiresActiveLifecycle: true,
    reminderScheduleDays: [],
    sourceTable: "category_adapter",
    activeStatuses: ["active", "published"],
    pendingPaymentStatuses: ["pending", "pending_payment"],
    pausedStatuses: ["paused"],
    suspendedStatuses: ["suspended", "flagged", "removed"],
  },
  {
    category: "free_future",
    packageKey: "future_free",
    durationType: "free",
    renewalPackageKey: null,
    renewalPriceCents: null,
    renewalEligibleBeforeExpiryDays: null,
    expirationRequired: false,
    hasAddons: false,
    publicVisibilityRequiresActiveLifecycle: false,
    reminderScheduleDays: [],
    sourceTable: "category_adapter",
    activeStatuses: ["active", "published"],
    pendingPaymentStatuses: [],
    pausedStatuses: ["paused"],
    suspendedStatuses: ["suspended", "flagged", "removed"],
  },
] as const;

export function getListingLifecycleConfig(category: string, packageKey?: string | null): ListingLifecycleConfig | null {
  const cat = category.trim().toLowerCase();
  const key = (packageKey ?? "").trim().toLowerCase();
  return (
    LISTING_LIFECYCLE_CONFIGS.find(
      (cfg) => cfg.category === cat && (!key || cfg.packageKey === key),
    ) ?? null
  );
}
