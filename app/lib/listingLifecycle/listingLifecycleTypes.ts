export type ListingDurationType = "fixed_days" | "subscription" | "fixed_term_months" | "free";

export type ListingLifecycleState =
  | "pending_payment"
  | "active"
  | "expiring_soon"
  | "expired"
  | "paused"
  | "suspended"
  | "unknown";

export type ListingLifecycleConfig = {
  category: string;
  packageKey: string;
  durationType: ListingDurationType;
  durationDays?: number | null;
  allowedTermMonths?: readonly (1 | 3 | 6 | 12)[];
  renewalPackageKey?: string | null;
  renewalPriceCents?: number | null;
  renewalEligibleBeforeExpiryDays?: number | null;
  expirationRequired: boolean;
  hasAddons: boolean;
  publicVisibilityRequiresActiveLifecycle: boolean;
  reminderScheduleDays: readonly number[];
  sourceTable: string;
  activeStatuses: readonly string[];
  pendingPaymentStatuses: readonly string[];
  pausedStatuses: readonly string[];
  suspendedStatuses: readonly string[];
};

export type ListingLifecycleInput = {
  category: string;
  packageKey?: string | null;
  status?: string | null;
  isPublished?: boolean | null;
  activatedAt?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  paymentStatus?: string | null;
  nowIso?: string | null;
};

export type ListingLifecycleResolved = {
  lifecycleState: ListingLifecycleState;
  isPubliclyVisible: boolean;
  isRenewalEligible: boolean;
  daysRemaining: number | null;
  expiresAtIso: string | null;
  renewalPackageKey: string | null;
  renewalPriceCents: number | null;
  renewalReason: string | null;
};
