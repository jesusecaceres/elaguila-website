/**
 * Package C Build 1 (C3) — pure subscription lifecycle policy (no server imports;
 * behaviorally testable). The impure engine in subscriptionLifecycle.ts executes these
 * decisions against the DB and lane tables.
 */

/** Locked: 7 calendar days (Agreement v1.2 late/suspension policy + Bible lock). */
export const SUBSCRIPTION_GRACE_DAYS = 7;
/** Agreement v1.2 §15 — an undisputed amount is contractually late 5 calendar days after due. */
export const CONTRACTUAL_LATE_AFTER_DAYS = 5;

export type LeonixSubscriptionStatus = "pending" | "active" | "grace" | "suspended" | "canceled";

export type SubscriptionEventKind =
  | "checkout_completed"
  | "invoice_paid"
  | "invoice_payment_failed"
  | "subscription_updated"
  | "subscription_deleted"
  | "dispute_created"
  | "dispute_closed_won"
  | "dispute_closed_lost"
  | "grace_expired"
  | "admin_suspend"
  | "admin_restore";

export type SubscriptionTransition = {
  next: LeonixSubscriptionStatus;
  /** Side effects the caller must execute (pure decision — testable). */
  effects: Array<
    | "start_grace"
    | "clear_grace"
    | "suspend_visibility"
    | "restore_visibility"
    | "record_recovery"
    | "record_cancellation"
    | "flag_admin_review"
  >;
};

/**
 * Pure transition table. Callers pass the current status (+ relevant flags) and the event;
 * the returned effects are executed against DB/lane adapters by the impure engine.
 */
export function decideSubscriptionTransition(
  current: LeonixSubscriptionStatus,
  event: SubscriptionEventKind,
  ctx?: { suspensionReason?: string | null; graceExpired?: boolean; endedReason?: string | null },
): SubscriptionTransition {
  switch (event) {
    case "checkout_completed":
      return { next: "active", effects: [] };
    case "invoice_paid":
      if (current === "grace") return { next: "active", effects: ["clear_grace", "record_recovery"] };
      if (current === "suspended" && ctx?.suspensionReason === "payment_failure") {
        return { next: "active", effects: ["clear_grace", "restore_visibility", "record_recovery"] };
      }
      return { next: "active", effects: [] };
    case "invoice_payment_failed":
      if (current === "active" || current === "pending") return { next: "grace", effects: ["start_grace"] };
      if (current === "grace" && ctx?.graceExpired) return { next: "suspended", effects: ["suspend_visibility"] };
      return { next: current, effects: [] };
    case "grace_expired":
      if (current === "grace") return { next: "suspended", effects: ["suspend_visibility"] };
      return { next: current, effects: [] };
    case "subscription_updated":
      return { next: current, effects: [] };
    case "subscription_deleted":
      if (ctx?.endedReason === "canceled_at_period_end") {
        // Paid-through honored: entitlement ends_at untouched; visibility follows entitlement lapse.
        return { next: "canceled", effects: ["record_cancellation"] };
      }
      return { next: "canceled", effects: ["record_cancellation", "suspend_visibility"] };
    case "dispute_created":
      if (current === "canceled") return { next: current, effects: ["flag_admin_review"] };
      return { next: "suspended", effects: ["suspend_visibility", "flag_admin_review"] };
    case "dispute_closed_won":
      if (current === "suspended" && ctx?.suspensionReason === "chargeback") {
        return { next: "active", effects: ["restore_visibility"] };
      }
      return { next: current, effects: [] };
    case "dispute_closed_lost":
      return { next: current === "canceled" ? current : "suspended", effects: ["flag_admin_review"] };
    case "admin_suspend":
      return { next: "suspended", effects: ["suspend_visibility"] };
    case "admin_restore":
      return { next: "active", effects: ["restore_visibility"] };
  }
}

export function computeGraceEndsAt(graceStartedAt: Date): Date {
  const end = new Date(graceStartedAt);
  end.setUTCDate(end.getUTCDate() + SUBSCRIPTION_GRACE_DAYS);
  return end;
}

export function isGraceExpired(graceEndsAt: string | Date | null | undefined, nowMs = Date.now()): boolean {
  if (!graceEndsAt) return false;
  const t = graceEndsAt instanceof Date ? graceEndsAt.getTime() : Date.parse(String(graceEndsAt));
  return Number.isFinite(t) && nowMs > t;
}

/**
 * Subscription entitlements end at the REAL Stripe period end plus the 7-day grace backstop
 * (read-time expiry then honors grace automatically). +30d survives only as an explicit
 * fallback when the period could not be retrieved. One-time products keep durationDays.
 */
export function computeEndsAt(
  startsAt: Date,
  packageDef: { billingMode: string; durationDays: number | null },
  realPeriodEnd?: Date | null,
): Date {
  if (packageDef.billingMode === "monthly_subscription") {
    const base = realPeriodEnd instanceof Date && Number.isFinite(realPeriodEnd.getTime())
      ? new Date(realPeriodEnd)
      : (() => {
          const fallback = new Date(startsAt);
          fallback.setUTCDate(fallback.getUTCDate() + 30);
          return fallback;
        })();
    base.setUTCDate(base.getUTCDate() + SUBSCRIPTION_GRACE_DAYS);
    return base;
  }
  const days = packageDef.durationDays ?? 30;
  const end = new Date(startsAt);
  end.setUTCDate(end.getUTCDate() + days);
  return end;
}

export type LaneSuspensionSpec = {
  table: string;
  statusColumn: string;
  /** Publicly-visible paid states suspension may fire from. */
  visibleStatuses: readonly string[];
  /** The exact value the payment engine writes (existing lane vocabulary — nothing invented). */
  suspendedValue: string;
};

const LANE_SUSPENSION: Record<string, LaneSuspensionSpec> = {
  restaurantes: {
    table: "restaurantes_public_listings",
    statusColumn: "status",
    visibleStatuses: ["published"],
    suspendedValue: "suspended",
  },
  servicios: {
    table: "servicios_public_listings",
    statusColumn: "listing_status",
    visibleStatuses: ["published"],
    suspendedValue: "suspended",
  },
  autos: {
    table: "autos_classifieds_listings",
    statusColumn: "status",
    visibleStatuses: ["active"],
    // Existing lane value — parent leaving "active" also drops children from all public
    // surfaces via the proven I.13B parent-gate, preserving child identity.
    suspendedValue: "payment_failed",
  },
  "bienes-raices": {
    table: "listings",
    statusColumn: "status",
    visibleStatuses: ["active"],
    suspendedValue: "suspended",
  },
};

export function laneSuspensionSpecForCategory(category: string): LaneSuspensionSpec | null {
  return LANE_SUSPENSION[String(category ?? "").trim().toLowerCase()] ?? null;
}
