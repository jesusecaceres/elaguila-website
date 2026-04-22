/**
 * Go-live inventory mode for Rentas public routes.
 *
 * Production never merges demo fixtures. Non-production may opt in with
 * `RENTAS_INCLUDE_DEMO_POOL=1` (server) or legacy `NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL=1` for local UI parity.
 */
export function rentasPublicIncludeDemoPool(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return (
    process.env.RENTAS_INCLUDE_DEMO_POOL === "1" || process.env.NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL === "1"
  );
}
