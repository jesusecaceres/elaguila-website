/**
 * Autos-only gated test publish (no Stripe). **TEMPORARY** until global paid publishing
 * replaces per-vertical checkout.
 *
 * ## Enable (non-production only)
 * Set server env: `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true`
 *
 * ## Safety
 * - Never active on the Vercel production tier (`VERCEL_ENV === "production"`), matching
 *   `isAutosInternalPublishPaymentBypassEnabled` so `next start` (NODE_ENV=production) can still
 *   run gated local/staging QA without silently enabling this on live Vercel prod.
 * - Does not change Stripe SDK usage elsewhere; only Autos checkout may short-circuit to activation.
 */
export function isAutosAllowTestPublishBypassEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.AUTOS_ALLOW_TEST_PUBLISH_BYPASS === "true";
}
