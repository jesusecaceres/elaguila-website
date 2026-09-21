// LEONIX IX REWARDS — who earns on `invoice.paid`.
//
// PURE. No Stripe client, no Supabase, no `server-only`: the whole decision is a function of three
// facts, so it can be proven by executable truth table rather than by reading the webhook handler.
//
// Stripe fires BOTH `checkout.session.completed` and `invoice.paid` for a subscription signup,
// against two different payment records (the checkout record carries no `stripe_invoice_id`, so the
// partial unique index cannot collapse them). The checkout path already awarded 9% on that money.
// Awarding again here would earn twice on one payment, every signup.

export type InvoiceRenewalEarnDecision =
  | { earn: true; reason: "eligible_renewal"; audit: false }
  | {
      earn: false;
      audit: boolean;
      reason:
        | "no_payment_record"
        | "no_amount_paid"
        | "signup_invoice_earned_at_checkout"
        | "invoice_billing_reason_unknown";
    };

/**
 * Decide whether an `invoice.paid` event may award rewards credits.
 *
 * FAILS CLOSED on an absent `billing_reason`. Real Stripe subscription invoices always carry one,
 * but a replayed, synthesised or older-API-version payload may not — and an absent value is NOT
 * evidence that this is a renewal. When we cannot tell, we do not award, and the caller audits the
 * skip as retryable so the gap is visible rather than silently costing the customer credits.
 */
export function decideInvoiceRenewalEarn(input: {
  paymentRecordId: string | null | undefined;
  billingReason: string | null | undefined;
  amountPaidCents: number | null | undefined;
}): InvoiceRenewalEarnDecision {
  const paymentRecordId = typeof input.paymentRecordId === "string" ? input.paymentRecordId.trim() : "";
  if (!paymentRecordId) return { earn: false, audit: false, reason: "no_payment_record" };

  const amountPaidCents = Math.floor(Number(input.amountPaidCents ?? 0)) || 0;
  if (amountPaidCents <= 0) return { earn: false, audit: false, reason: "no_amount_paid" };

  const billingReason = typeof input.billingReason === "string" ? input.billingReason.trim() : "";
  // The signup invoice. Already earned at checkout; not a gap, so nothing to audit.
  if (billingReason === "subscription_create") {
    return { earn: false, audit: false, reason: "signup_invoice_earned_at_checkout" };
  }
  // Cannot tell. Refuse, and make the refusal visible.
  if (billingReason.length === 0) {
    return { earn: false, audit: true, reason: "invoice_billing_reason_unknown" };
  }
  // A renewal, a cycle change, a manual invoice: money the checkout path never saw.
  return { earn: true, reason: "eligible_renewal", audit: false };
}
