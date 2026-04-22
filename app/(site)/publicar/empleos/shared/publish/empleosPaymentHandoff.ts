/**
 * Payment / publish handoff metadata on publish envelopes.
 * Launch behavior: listings persist without Stripe; payment fields are inert until checkout is wired.
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
    paymentRequired: false,
    paymentPackage: null,
    stripeSessionId: null,
    paymentState: "none",
    publishedAfterPayment: false,
  };
}
