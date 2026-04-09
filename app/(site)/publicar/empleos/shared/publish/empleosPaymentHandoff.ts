/**
 * Payment / publish handoff — placeholders for Stripe checkout wiring (Phase next).
 * Preview and session drafts stay separate; this attaches only to staged publish envelopes.
 */
export type EmpleosPaymentState = "none" | "pending" | "paid" | "failed" | "refunded";

export type EmpleosPaymentHandoffPlaceholder = {
  paymentRequired: boolean;
  /** Product/slot identifier when pricing exists (e.g. empleos_quick_standard). */
  paymentPackage: string | null;
  stripeSessionId: string | null;
  paymentState: EmpleosPaymentState;
  /** When true, live listing row is created only after successful payment. */
  publishedAfterPayment: boolean;
};

export function defaultEmpleosPaymentHandoff(): EmpleosPaymentHandoffPlaceholder {
  return {
    paymentRequired: true,
    paymentPackage: null,
    stripeSessionId: null,
    paymentState: "none",
    publishedAfterPayment: true,
  };
}
