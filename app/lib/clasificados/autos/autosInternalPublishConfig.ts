/**
 * Internal / staging only: complete Autos publish without Stripe when both flags are set.
 * Never enable in production — bypass is explicitly blocked when `VERCEL_ENV === "production"`.
 *
 * Set for local QA:
 * - `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` (server — checkout activation)
 * - `NEXT_PUBLIC_AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` (client — button label only; optional)
 */
export function isAutosInternalPublishPaymentBypassEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS === "1";
}
