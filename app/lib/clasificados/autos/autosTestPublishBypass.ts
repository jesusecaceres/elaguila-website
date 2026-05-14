/**
 * Autos-only gated test publish (no Stripe). **TEMPORARY** until global paid publishing
 * replaces per-vertical checkout.
 *
 * ## Enable (non-production only)
 * Set server env: `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true`
 *
 * ## Safety
 * - Never active when `NODE_ENV === "production"` or `VERCEL_ENV === "production"`.
 * - Does not change Stripe SDK usage elsewhere; only Autos checkout may short-circuit to activation.
 */
export function isAutosAllowTestPublishBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.AUTOS_ALLOW_TEST_PUBLISH_BYPASS === "true";
}
