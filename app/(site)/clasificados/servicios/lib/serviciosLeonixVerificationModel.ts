/**
 * Leonix Servicios verification model (authoritative in code).
 *
 * - **`leonix_verified` on `servicios_public_listings`** is the only source of truth for the public
 *   “Leonix Verificado” badge on listings. It is **never** derived from advertiser self-serve toggles.
 * - Advertisers may set `profile_json.opsMeta.leonixVerifiedInterest` to request review; ops uses the
 *   admin workspace to flip `leonix_verified` after manual checks.
 * - Resolver injects the hero badge only from the published row flag (`getServiciosPublicListingBySlugForDiscovery`
 *   merges `leonix_verified` into `identity.leonixVerified` before `resolveServiciosProfile`).
 */
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

export function isLeonixVerifiedServiciosListingRow(row: ServiciosPublicListingRow): boolean {
  return row.leonix_verified === true;
}

/** Ranking tie-break: verified listings sort ahead within the same primary sort key. */
export function serviciosVerifiedRankingBias(row: ServiciosPublicListingRow): number {
  return row.leonix_verified === true ? 1 : 0;
}
