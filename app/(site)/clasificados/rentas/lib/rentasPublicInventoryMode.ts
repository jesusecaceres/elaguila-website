/**
 * Go-live inventory mode for Rentas public routes.
 *
 * Demo fixtures must never appear in production unless explicitly enabled
 * (`NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL=1`). Default: live `listings` rows only.
 */
export function rentasPublicIncludeDemoPool(): boolean {
  return process.env.NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL === "1";
}
