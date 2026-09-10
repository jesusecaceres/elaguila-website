/**
 * Gate RESTAURANTES-2 — makes Restaurantes public-results eligibility a type-enforced precondition
 * of the matcher, not merely a documented one. Mirrors the Autos / Bienes Raíces / Rentas /
 * Servicios precedent.
 *
 * The real eligibility gate for a Restaurantes listing to appear on any public surface is a single
 * status check: `status === "published"`. That is exactly what every live public reader enforces —
 * `tryListRestaurantesPublicListingsFromDb` (results/landing inventory) and
 * `getRestaurantePublicListingBySlugFromDb` (public detail) both apply `.eq("status","published")`,
 * and a non-published slug 404s. Restaurantes has no expiry column, no availability toggle and no
 * parent/child visibility gate — confirmed absent from `restaurantesPublicListingsServer.ts`.
 *
 * `pending_payment`, `archived` and `suspended` are all excluded by that same single check, so no
 * second interpretation of visibility is introduced here. This module performs no I/O.
 */
import type { RestaurantesPublicListingDbRow } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer";

/** The one published status, mirroring the string every live reader filters on. */
export const RESTAURANTES_PUBLISHED_STATUS = "published" as const;

/** Branded/nominal type — a plain row is NOT assignable without an explicit unsafe cast. The only
 * legitimate way to obtain one is `certifyRestaurantesPublicEligibleListing`. */
export type RestaurantesPublicEligibleListing = RestaurantesPublicListingDbRow & {
  readonly __restaurantesPublicEligible: true;
};

export function certifyRestaurantesPublicEligibleListing(
  row: RestaurantesPublicListingDbRow | null | undefined,
): RestaurantesPublicEligibleListing | null {
  if (!row) return null;
  if (!row.id?.trim()) return null;
  if (!row.slug?.trim()) return null;
  if (String(row.status ?? "").trim().toLowerCase() !== RESTAURANTES_PUBLISHED_STATUS) return null;
  return { ...row, __restaurantesPublicEligible: true };
}
