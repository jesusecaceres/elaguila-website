/**
 * Saved Search 06 — makes BR public-results eligibility a type-enforced precondition of the
 * matcher, not merely a documented one. Mirrors Saved Search 02B's Autos precedent
 * (`autosPublicEligibleListing.ts`) exactly.
 *
 * The real eligibility gate for a listing to appear in public BR results
 * (`fetchBrPublishedListingsForBrowse.ts`) is:
 *   1. `category === "bienes-raices"`
 *   2. `isListingRowActiveAndPublishedForBrowse` — `status === "active" && is_published !== false`
 *   3. for a Negocio inventory child (`inventory_role === "inventory_property"`), its
 *      `br_inventory_parent_listing_id` must resolve to a parent that is itself `category ===
 *      "bienes-raices"`, `seller_type === "business"`, `inventory_role === "main"`, same
 *      `owner_id`, and active/published — enforced by the existing pure predicate
 *      `isBrChildParentGateSatisfied` (Gate G.2.3.4,
 *      `app/(site)/clasificados/lib/brPublicChildParentVisibility.ts`), reused verbatim, never
 *      reimplemented.
 *
 * This module performs no I/O — the caller supplies the raw row and parent map.
 */
import { isListingRowActiveAndPublishedForBrowse } from "@/app/clasificados/lib/listingPublicBrowseEligibility";
import {
  isBrChildParentGateSatisfied,
  type BrPublicParentCandidate,
} from "@/app/clasificados/lib/brPublicChildParentVisibility";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "@/app/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard";
import type { BrNegocioListing } from "@/app/clasificados/bienes-raices/resultados/cards/listingTypes";
import { SAVED_SEARCH_BIENES_RAICES_CATEGORY } from "./savedSearchBienesRaicesAdapter";

export type BienesRaicesListingDbRow = BrListingDbRow & {
  category?: string | null;
  leonix_ad_id?: string | null;
};

/** Branded/nominal type — a plain `BrNegocioListing` is NOT assignable without an explicit unsafe
 * cast. The only legitimate way to obtain one is `certifyBienesRaicesPublicEligibleListing`. */
export type BienesRaicesPublicEligibleListing = BrNegocioListing & {
  readonly __bienesRaicesPublicEligible: true;
};

/**
 * The sole constructor. Re-runs the exact same eligibility gate the live public BR results
 * pipeline uses against the raw row's own fields. Returns `null` when the row fails any check.
 */
export function certifyBienesRaicesPublicEligibleListing(
  row: BienesRaicesListingDbRow,
  parentsById: ReadonlyMap<string, BrPublicParentCandidate>,
  lang: "es" | "en" = "es",
): BienesRaicesPublicEligibleListing | null {
  if (String(row.category ?? "") !== SAVED_SEARCH_BIENES_RAICES_CATEGORY) return null;
  if (!isListingRowActiveAndPublishedForBrowse(row)) return null;

  const gateOk = isBrChildParentGateSatisfied(
    {
      id: row.id,
      inventory_role: row.inventory_role ?? null,
      br_inventory_parent_listing_id: row.br_inventory_parent_listing_id ?? null,
      owner_id: row.owner_id ?? null,
    },
    parentsById,
  );
  if (!gateOk) return null;

  const card = mapBrListingRowToNegocioCard(row, lang);
  return { ...card, __bienesRaicesPublicEligible: true };
}
