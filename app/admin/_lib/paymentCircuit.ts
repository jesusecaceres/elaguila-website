/**
 * Payment → publication CIRCUIT diagnosis (Gate 2 / Gate 12) — pure, read-only, never invents state.
 *
 * The Payment Tracker used to show one word for a row that has not paid: "Pending". That single word
 * hides four different situations. This makes the four links explicit and separate:
 *
 *   CHECKOUT CREATED  ≠  PAID  ≠  ENTITLEMENT ACTIVE  ≠  LISTING LIVE
 *
 * Every input is something already stored (payment record, entitlement, subscription record, the
 * category's own listing row, the webhook ledger). Nothing here writes, marks paid, or activates.
 */
import type { PublicationTruth } from "./publicationSemantics";

export type CircuitStep = "done" | "waiting" | "missing" | "blocked" | "na";

export type PaymentCircuitInput = {
  paymentStatus: string;
  source: string;
  hasCheckoutSession: boolean;
  hasListingId: boolean;
  billingMode: string | null;
  packageEntitlementId: string | null;
  entitlementStatus: string | null;
  subscriptionStatus: string | null;
  /** null = no safe canonical lookup exists for this category/row (never guessed). */
  listing: PublicationTruth | null;
  /** Most recent ledger row linked to THIS payment record, if any. */
  webhook: { status: string; resultCode: string | null; receivedAt: string | null } | null;
};

export type PaymentCircuit = {
  checkout: CircuitStep;
  paid: CircuitStep;
  entitlement: CircuitStep;
  listing: CircuitStep;
  /** attention = something is wrong/incomplete and needs a human; waiting = normal in-flight; ok = complete. */
  severity: "ok" | "waiting" | "attention";
  headline: string;
  detail: string;
};

const CLEARED = new Set(["paid", "succeeded"]);
const IN_FLIGHT = new Set(["pending", "unpaid", "requires_action"]);

export function derivePaymentCircuit(i: PaymentCircuitInput): PaymentCircuit {
  const status = i.paymentStatus.trim().toLowerCase();
  const manual = i.source === "admin_manual";
  const cleared = CLEARED.has(status);
  const requiresSub = (i.billingMode ?? "").toLowerCase() === "subscription";

  const checkout: CircuitStep = manual ? "na" : i.hasCheckoutSession ? "done" : "missing";
  const paid: CircuitStep = cleared ? "done" : IN_FLIGHT.has(status) ? "waiting" : "blocked";
  const entitlement: CircuitStep =
    i.packageEntitlementId && (i.entitlementStatus ?? "").toLowerCase() === "active"
      ? "done"
      : i.packageEntitlementId
        ? "blocked"
        : cleared
          ? "missing"
          : "waiting";
  const listing: CircuitStep = !i.listing ? "na" : i.listing.semantic === "PUBLIC" ? "done" : cleared ? "blocked" : "waiting";
  const base = { checkout, paid, entitlement, listing };

  if (cleared) {
    if (!i.packageEntitlementId || (i.entitlementStatus ?? "").toLowerCase() === "missing") {
      return { ...base, severity: "attention", headline: "Paid, but fulfilment did not finish", detail: "The payment is recorded as paid, but no entitlement is linked. Activation runs entitlement first, so the listing cannot have gone live from this payment." };
    }
    if (requiresSub && !i.subscriptionStatus) {
      return { ...base, severity: "attention", headline: "Paid, but no subscription record is linked", detail: "This is a subscription package but no subscription record is attached, so renewal / grace / suspension tracking is missing." };
    }
    if (!i.listing) {
      return { ...base, severity: "ok", headline: "Paid and entitled", detail: "Listing state cannot be checked automatically for this category or row — open the listing to confirm it is live." };
    }
    if (i.listing.semantic === "PUBLIC") {
      return { ...base, severity: "ok", headline: "Complete: paid → entitled → live", detail: i.listing.reason };
    }
    return { ...base, severity: "attention", headline: `Paid, but the listing is not live (${i.listing.semantic.replace(/_/g, " ").toLowerCase()})`, detail: `${i.listing.reason} Payment truth is separate from listing status: the payment is fine; the listing's own lifecycle is what is holding it back.` };
  }

  if (status === "canceled") {
    return { ...base, severity: "waiting", headline: "Checkout canceled or expired — no money taken", detail: "The customer left Stripe Checkout (or the session expired). The listing stays unpublished until a new checkout is paid." };
  }
  if (status === "failed") {
    return { ...base, severity: "attention", headline: "Payment failed", detail: "Stripe reported a failed payment. The listing stays unpublished." };
  }
  if (status === "refunded" || status === "disputed") {
    return { ...base, severity: "attention", headline: `Payment ${status}`, detail: "Money was returned or is contested. Check the listing and subscription state before relying on its visibility." };
  }

  if (IN_FLIGHT.has(status)) {
    if (manual) {
      return { ...base, severity: "waiting", headline: "Manual payment not yet cleared", detail: "A staff-recorded payment is awaiting clearance; it activates nothing until cleared." };
    }
    if (!i.hasCheckoutSession) {
      return { ...base, severity: "waiting", headline: "Checkout not started", detail: "No Stripe Checkout session exists for this attempt (the customer never reached Stripe, or session creation failed). Nothing has been charged." };
    }
    if (i.webhook && i.webhook.status !== "completed") {
      return { ...base, severity: "attention", headline: "Stripe confirmation reached Leonix but fulfilment failed", detail: `Last webhook for this payment: ${i.webhook.status}${i.webhook.resultCode ? ` (${i.webhook.resultCode})` : ""}. Stripe will retry retryable failures.` };
    }
    return {
      ...base,
      severity: "attention",
      headline: "Checkout created — no paid confirmation recorded",
      detail:
        "A Stripe Checkout session exists but Leonix has recorded no paid confirmation. Either the customer has not finished paying, OR Stripe's confirmation never got through. If the Stripe dashboard shows this session as paid, the webhook circuit is broken — see System Health → “Revenue OS webhook”. Payments become 'paid' only from the verified webhook, never from the success page.",
    };
  }

  return { ...base, severity: "attention", headline: `Status “${i.paymentStatus}”`, detail: "Unrecognized payment status." };
}
