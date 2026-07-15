import { getListingLifecycleConfig, RENTAS_LISTING_LIFECYCLE_CONFIG } from "./listingLifecycleConfig";
import type { ListingLifecycleConfig, ListingLifecycleInput, ListingLifecycleResolved } from "./listingLifecycleTypes";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function isoFromMs(ms: number | null): string | null {
  return ms == null || !Number.isFinite(ms) ? null : new Date(ms).toISOString();
}

function norm(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

function daysRemainingUntil(expiresMs: number, nowMs: number): number {
  return Math.ceil((expiresMs - nowMs) / DAY_MS);
}

export function resolveListingLifecycle(
  input: ListingLifecycleInput,
  config: ListingLifecycleConfig | null = getListingLifecycleConfig(input.category, input.packageKey) ??
    (norm(input.category) === "rentas" ? RENTAS_LISTING_LIFECYCLE_CONFIG : null),
): ListingLifecycleResolved {
  const status = norm(input.status);
  const paymentStatus = norm(input.paymentStatus);
  const nowMs = parseMs(input.nowIso) ?? Date.now();

  if (!config) {
    return {
      lifecycleState: "unknown",
      isPubliclyVisible: false,
      isRenewalEligible: false,
      daysRemaining: null,
      expiresAtIso: null,
      renewalPackageKey: null,
      renewalPriceCents: null,
      renewalReason: "missing_lifecycle_config",
    };
  }

  const expiresMs = parseMs(input.expiresAt);
  const published = input.isPublished !== false;

  if (config.pendingPaymentStatuses.includes(status) || paymentStatus === "pending") {
    return {
      lifecycleState: "pending_payment",
      isPubliclyVisible: false,
      isRenewalEligible: false,
      daysRemaining: null,
      expiresAtIso: isoFromMs(expiresMs),
      renewalPackageKey: null,
      renewalPriceCents: null,
      renewalReason: "payment_pending",
    };
  }

  if (config.suspendedStatuses.includes(status)) {
    return {
      lifecycleState: "suspended",
      isPubliclyVisible: false,
      isRenewalEligible: false,
      daysRemaining: null,
      expiresAtIso: isoFromMs(expiresMs),
      renewalPackageKey: null,
      renewalPriceCents: null,
      renewalReason: "listing_suspended",
    };
  }

  if (config.pausedStatuses.includes(status)) {
    return {
      lifecycleState: "paused",
      isPubliclyVisible: false,
      isRenewalEligible: false,
      daysRemaining: expiresMs == null ? null : daysRemainingUntil(expiresMs, nowMs),
      expiresAtIso: isoFromMs(expiresMs),
      renewalPackageKey: null,
      renewalPriceCents: null,
      renewalReason: "listing_paused",
    };
  }

  if (config.expirationRequired && expiresMs == null) {
    return {
      lifecycleState: "unknown",
      isPubliclyVisible: false,
      isRenewalEligible: false,
      daysRemaining: null,
      expiresAtIso: null,
      renewalPackageKey: null,
      renewalPriceCents: null,
      renewalReason: "missing_expires_at",
    };
  }

  const statusActive = config.activeStatuses.includes(status) || (!status && published);
  const remaining = expiresMs == null ? null : daysRemainingUntil(expiresMs, nowMs);
  const expired = expiresMs != null && expiresMs <= nowMs;
  const renewalWindow = Math.max(0, config.renewalEligibleBeforeExpiryDays ?? 0);
  const renewalEligible =
    Boolean(config.renewalPackageKey) &&
    !config.suspendedStatuses.includes(status) &&
    (expired || (remaining != null && remaining <= renewalWindow));

  if (expired) {
    return {
      lifecycleState: "expired",
      isPubliclyVisible: false,
      isRenewalEligible: renewalEligible,
      daysRemaining: 0,
      expiresAtIso: isoFromMs(expiresMs),
      renewalPackageKey: config.renewalPackageKey ?? null,
      renewalPriceCents: config.renewalPriceCents ?? null,
      renewalReason: "expired",
    };
  }

  const state = renewalEligible ? "expiring_soon" : statusActive ? "active" : "unknown";
  return {
    lifecycleState: state,
    isPubliclyVisible: published && statusActive && (!config.publicVisibilityRequiresActiveLifecycle || state === "active" || state === "expiring_soon"),
    isRenewalEligible: renewalEligible,
    daysRemaining: remaining,
    expiresAtIso: isoFromMs(expiresMs),
    renewalPackageKey: renewalEligible ? config.renewalPackageKey ?? null : null,
    renewalPriceCents: renewalEligible ? config.renewalPriceCents ?? null : null,
    renewalReason: renewalEligible ? (state === "expiring_soon" ? "expiring_soon" : "expired") : null,
  };
}

export function addUtcDays(baseIso: string, days: number): string {
  const baseMs = parseMs(baseIso);
  if (baseMs == null) throw new Error("Invalid base date for lifecycle extension.");
  return new Date(baseMs + days * DAY_MS).toISOString();
}

export function computeFixedDayRenewalExpiresAt(input: {
  currentExpiresAtIso?: string | null;
  paymentCompletedAtIso: string;
  durationDays: number;
}): string {
  const paymentMs = parseMs(input.paymentCompletedAtIso);
  if (paymentMs == null) throw new Error("Invalid payment completion date.");
  const currentMs = parseMs(input.currentExpiresAtIso);
  const baseMs = currentMs != null && currentMs > paymentMs ? currentMs : paymentMs;
  return new Date(baseMs + input.durationDays * DAY_MS).toISOString();
}
