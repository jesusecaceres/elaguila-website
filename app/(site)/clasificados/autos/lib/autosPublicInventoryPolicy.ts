/**
 * Public Autos inventory policy (launch vs demo).
 *
 * - **Production builds:** demo inventory is never merged, even if `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO` is mis-set.
 * - **Non-production:** set `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO=1` to show blueprint sample listings when the API returns none (UI/QA only).
 */
export function autosPublicDemoInventoryAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO === "1";
}
