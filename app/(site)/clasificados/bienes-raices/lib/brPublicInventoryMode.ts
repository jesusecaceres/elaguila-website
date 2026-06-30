/**
 * Public BR browse surfaces (landing + resultados) must not mix editorial demo rows
 * into user-visible inventory unless demo mode is explicitly enabled.
 *
 * Designers and engineers can opt in locally with `NEXT_PUBLIC_BR_INCLUDE_DEMO_POOL=1`.
 */

export function brShouldMergeDemoInventoryWithLive(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_BR_INCLUDE_DEMO_POOL === "1";
}
