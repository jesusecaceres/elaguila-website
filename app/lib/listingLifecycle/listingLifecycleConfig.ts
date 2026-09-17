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

// Owner Command Center Gate 20 — Autos Privado and Bienes Raíces Privado/FSBO fixed-term renewal.
// Both clone the proven Rentas shape exactly; only category/packageKey/duration/price/sourceTable
// differ. Reminders are deliberately not scheduled (reminderScheduleDays: []) — the shared
// `listing_lifecycle_reminder_events` table's category check constraint is locked to Rentas only,
// and widening it is out of scope for this gate (renewal itself has no reminder-email
// requirement in the release bar). Autos Privado has no pause capability today (only
// active/pending_payment/removed), so pausedStatuses is empty for it.
export const AUTOS_PRIVADO_LIFECYCLE_PACKAGE_KEY = "autos_privado_30d" as const;
export const AUTOS_PRIVADO_LIFECYCLE_DURATION_DAYS = 30;
export const BR_FSBO_LIFECYCLE_PACKAGE_KEY = "br_fsbo_45d" as const;
export const BR_FSBO_LIFECYCLE_DURATION_DAYS = 45;
const FIXED_TERM_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS = 7;

export const AUTOS_PRIVADO_LISTING_LIFECYCLE_CONFIG: ListingLifecycleConfig = {
  category: "autos",
  packageKey: AUTOS_PRIVADO_LIFECYCLE_PACKAGE_KEY,
  durationType: "fixed_days",
  durationDays: AUTOS_PRIVADO_LIFECYCLE_DURATION_DAYS,
  renewalPackageKey: AUTOS_PRIVADO_LIFECYCLE_PACKAGE_KEY,
  renewalPriceCents: 2499,
  renewalEligibleBeforeExpiryDays: FIXED_TERM_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS,
  expirationRequired: true,
  hasAddons: false,
  publicVisibilityRequiresActiveLifecycle: true,
  reminderScheduleDays: [],
  sourceTable: "autos_classifieds_listings",
  activeStatuses: ["active"],
  pendingPaymentStatuses: ["pending_payment"],
  pausedStatuses: [],
  suspendedStatuses: ["suspended", "flagged", "removed"],
};

export const BR_FSBO_LISTING_LIFECYCLE_CONFIG: ListingLifecycleConfig = {
  category: "bienes-raices",
  packageKey: BR_FSBO_LIFECYCLE_PACKAGE_KEY,
  durationType: "fixed_days",
  durationDays: BR_FSBO_LIFECYCLE_DURATION_DAYS,
  renewalPackageKey: BR_FSBO_LIFECYCLE_PACKAGE_KEY,
  renewalPriceCents: 4999,
  renewalEligibleBeforeExpiryDays: FIXED_TERM_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS,
  expirationRequired: true,
  hasAddons: false,
  publicVisibilityRequiresActiveLifecycle: true,
  reminderScheduleDays: [],
  sourceTable: "listings",
  activeStatuses: ["active"],
  pendingPaymentStatuses: ["pending"],
  pausedStatuses: ["paused"],
  suspendedStatuses: ["suspended", "flagged", "removed"],
};

export const LISTING_LIFECYCLE_CONFIGS: readonly ListingLifecycleConfig[] = [
  RENTAS_LISTING_LIFECYCLE_CONFIG,
  AUTOS_PRIVADO_LISTING_LIFECYCLE_CONFIG,
  BR_FSBO_LISTING_LIFECYCLE_CONFIG,
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
