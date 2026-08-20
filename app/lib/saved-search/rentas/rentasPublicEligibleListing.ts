/**
 * Saved Search 06 — makes Rentas public-results eligibility a type-enforced precondition of the
 * matcher, not merely a documented one. Mirrors Saved Search 02B's Autos precedent.
 *
 * The real eligibility gate for a Rentas listing to appear in public browse
 * (`fetchRentasPublicListingsForBrowse.ts`) is entirely encoded inside
 * `mapListingRowToRentasPublicListing` itself as `browseActive`:
 *   1. `category === "rentas"` (the mapper returns `null` otherwise)
 *   2. `resolveListingLifecycle(...).isPubliclyVisible` (status/publish/expiry truth, driven by
 *      `RENTAS_LISTING_LIFECYCLE_CONFIG`)
 *   3. `rentasCatalogEligibleFromMachineStatus` — the owner's own "disponible/pendiente/
 *      bajo_contrato/rentado" availability toggle (bajo_contrato/rentado are excluded even when
 *      the DB `status` column is still "active")
 *
 * Unlike Bienes Raíces, Rentas has no dealer/business-inventory parent/child visibility gate
 * (confirmed absent — no code reads `br_inventory_*` columns anywhere in the Rentas mapper/filter/
 * lifecycle files). This module performs no I/O — the caller supplies the raw row.
 */
import { mapListingRowToRentasPublicListing, type ListingRowLike } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

/** Branded/nominal type — a plain `RentasPublicListing` is NOT assignable without an explicit
 * unsafe cast. The only legitimate way to obtain one is `certifyRentasPublicEligibleListing`. */
export type RentasPublicEligibleListing = RentasPublicListing & {
  readonly __rentasPublicEligible: true;
};

/**
 * The sole constructor. Re-runs the exact same mapper the live public Rentas pipeline uses and
 * requires `browseActive === true` — the real eligibility truth the mapper itself already
 * computes. Returns `null` for any ineligible/non-Rentas/malformed row.
 */
export function certifyRentasPublicEligibleListing(
  row: ListingRowLike,
  lang: "es" | "en" = "es",
): RentasPublicEligibleListing | null {
  const mapped = mapListingRowToRentasPublicListing(row, lang);
  if (!mapped) return null;
  if (mapped.browseActive !== true) return null;
  return { ...mapped, __rentasPublicEligible: true };
}
