/**
 * Global Stripe payment tracking model — pure functions only.
 * Gate G1.6I — no DB, no Stripe SDK, no side effects.
 */

export type PaymentStatus =
  | "pending"
  | "unpaid"
  | "paid"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "disputed"
  | "requires_action"
  | "unknown";

export type CommissionStatus =
  | "not_eligible"
  | "pending_payment"
  | "eligible"
  | "blocked"
  | "paid"
  | "unknown";

export type PaymentSource =
  | "admin_manual"
  | "stripe_checkout"
  | "stripe_webhook"
  | "owner_override"
  | "unknown";

export type PaymentCommissionInput = {
  paymentStatus: string;
  salesRepId?: string | null;
  refundedAt?: string | null;
  canceledAt?: string | null;
};

export type PaymentCommissionResult = {
  commissionEligible: boolean;
  commissionStatus: CommissionStatus;
  warnings: string[];
};

export type PaymentTrackingMetadataInput = {
  packageEntitlementId?: string | null;
  promoCodeId?: string | null;
  promoCode?: string | null;
  category?: string | null;
  listingSource?: string | null;
  listingId?: string | null;
  packageTier?: string | null;
  contractTerm?: string | null;
  salesRepId?: string | null;
  salesRepName?: string | null;
};

export type PaymentRecordSummary = {
  statusLabel: string;
  commissionLabel: string;
  amountLabel: string;
  sourceLabel: string;
  warnings: string[];
};

export type PaymentRecordSummaryInput = {
  paymentStatus: string;
  commissionEligible: boolean;
  commissionStatus: string;
  estimatedCommissionCents?: number | null;
  amountTotalCents?: number | null;
  amountPaidCents?: number | null;
  source: string;
  currency?: string;
};

const CLEARED_STATUSES = new Set<string>(["paid", "succeeded"]);

const VALID_PAYMENT_STATUSES = new Set<string>([
  "pending", "unpaid", "paid", "succeeded", "failed",
  "canceled", "refunded", "disputed", "requires_action", "unknown",
]);

const VALID_COMMISSION_STATUSES = new Set<string>([
  "not_eligible", "pending_payment", "eligible", "blocked", "paid", "unknown",
]);

const VALID_SOURCES = new Set<string>([
  "admin_manual", "stripe_checkout", "stripe_webhook", "owner_override", "unknown",
]);

export function normalizePaymentStatus(value: string | null | undefined): PaymentStatus {
  const raw = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (VALID_PAYMENT_STATUSES.has(raw)) return raw as PaymentStatus;
  return "unknown";
}

export function isPaymentCleared(status: string | null | undefined): boolean {
  const normalized = normalizePaymentStatus(status);
  return CLEARED_STATUSES.has(normalized);
}

export function resolvePaymentCommissionEligibility(
  input: PaymentCommissionInput,
): PaymentCommissionResult {
  const warnings: string[] = [];
  const status = normalizePaymentStatus(input.paymentStatus);
  const salesRepId = String(input.salesRepId ?? "").trim() || null;
  const refunded = !!input.refundedAt;
  const canceled = !!input.canceledAt;

  if (!salesRepId) {
    return {
      commissionEligible: false,
      commissionStatus: "not_eligible",
      warnings: ["No sales_rep_id — commission not applicable."],
    };
  }

  if (refunded) {
    warnings.push("Payment was refunded — commission blocked.");
    return { commissionEligible: false, commissionStatus: "blocked", warnings };
  }

  if (canceled) {
    warnings.push("Payment was canceled — commission blocked.");
    return { commissionEligible: false, commissionStatus: "blocked", warnings };
  }

  if (status === "disputed") {
    warnings.push("Payment disputed — commission blocked until resolved.");
    return { commissionEligible: false, commissionStatus: "blocked", warnings };
  }

  if (isPaymentCleared(status)) {
    return {
      commissionEligible: true,
      commissionStatus: "eligible",
      warnings: ["Commission eligible — payment cleared. Payout is a later gate."],
    };
  }

  if (status === "pending" || status === "unpaid" || status === "requires_action") {
    warnings.push("Payment not yet cleared — commission pending.");
    return { commissionEligible: false, commissionStatus: "pending_payment", warnings };
  }

  if (status === "failed") {
    warnings.push("Payment failed — commission not eligible.");
    return { commissionEligible: false, commissionStatus: "not_eligible", warnings };
  }

  warnings.push("Unknown payment state — commission not eligible.");
  return { commissionEligible: false, commissionStatus: "not_eligible", warnings };
}

export function buildPaymentTrackingMetadata(
  input: PaymentTrackingMetadataInput,
): Record<string, string | null> {
  return {
    package_entitlement_id: input.packageEntitlementId ?? null,
    promo_code_id: input.promoCodeId ?? null,
    promo_code: input.promoCode ?? null,
    category: input.category ?? null,
    listing_source: input.listingSource ?? null,
    listing_id: input.listingId ?? null,
    package_tier: input.packageTier ?? null,
    contract_term: input.contractTerm ?? null,
    sales_rep_id: input.salesRepId ?? null,
    sales_rep_name: input.salesRepName ?? null,
  };
}

function formatCents(cents: number | null | undefined, currency = "usd"): string {
  if (cents == null || !Number.isFinite(cents)) return "—";
  const code = (currency || "usd").toUpperCase();
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(cents / 100);
}

export function formatPaymentStatusLabel(status: string | null | undefined): string {
  const s = normalizePaymentStatus(status);
  const labels: Record<PaymentStatus, string> = {
    pending: "Pending",
    unpaid: "Unpaid",
    paid: "Paid",
    succeeded: "Succeeded",
    failed: "Failed",
    canceled: "Canceled",
    refunded: "Refunded",
    disputed: "Disputed",
    requires_action: "Requires action",
    unknown: "Unknown",
  };
  return labels[s];
}

export function summarizePaymentRecord(
  input: PaymentRecordSummaryInput,
): PaymentRecordSummary {
  const warnings: string[] = [];
  const statusLabel = formatPaymentStatusLabel(input.paymentStatus);

  let commissionLabel: string;
  if (input.commissionEligible) {
    const cents = input.estimatedCommissionCents;
    commissionLabel = cents != null && Number.isFinite(cents)
      ? `Eligible — est. ${formatCents(cents, input.currency)}`
      : "Eligible — estimate pending";
  } else {
    const cs = String(input.commissionStatus || "not_eligible");
    if (cs === "pending_payment") commissionLabel = "Pending payment";
    else if (cs === "blocked") commissionLabel = "Blocked (refund/dispute)";
    else commissionLabel = "Not eligible";
  }

  const amountLabel = input.amountPaidCents != null && Number.isFinite(input.amountPaidCents)
    ? formatCents(input.amountPaidCents, input.currency)
    : input.amountTotalCents != null && Number.isFinite(input.amountTotalCents)
      ? `${formatCents(input.amountTotalCents, input.currency)} (total)`
      : "—";

  const sourceRaw = String(input.source || "unknown").replace(/_/g, " ");
  const sourceLabel = sourceRaw.charAt(0).toUpperCase() + sourceRaw.slice(1);

  if (!isPaymentCleared(input.paymentStatus)) {
    warnings.push("Payment has not cleared — entitlements and commission remain provisional.");
  }

  return { statusLabel, commissionLabel, amountLabel, sourceLabel, warnings };
}
