/**
 * Public BR browse surfaces (landing + resultados) must not mix editorial demo rows
 * into user-visible inventory on production builds.
 *
 * `next dev` keeps demo merge so designers and engineers can exercise filters without DB.
 */

export function brShouldMergeDemoInventoryWithLive(): boolean {
  return process.env.NODE_ENV !== "production";
}
