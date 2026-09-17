/**
 * Gate SERVICIOS-2 — makes Servicios public-results eligibility a type-enforced precondition of
 * the matcher, not merely a documented one. Mirrors the Autos/Bienes Raíces/Rentas precedent.
 *
 * The real eligibility gate for a Servicios listing to appear in public discovery is a single
 * status check: `listing_status === "published"`. That is exactly what
 * `listServiciosPublicListingsFromDb` / `listServiciosPublicListingsRaw` enforce (an
 * `.ilike("listing_status", …)` DB filter plus an in-code re-check) and what
 * `getServiciosPublicListingBySlugForDiscovery` enforces for the detail page. Servicios has no
 * expiry column, no availability toggle and no parent/child visibility gate — confirmed absent
 * from `serviciosListingLifecycle.ts` and `serviciosPublicListingsServer.ts`.
 *
 * Paused (`paused_unpublished`), pending review, pending payment, rejected and suspended rows are
 * all excluded by that same single check, so no second interpretation of visibility is introduced
 * here. This module performs no I/O — the caller supplies the row.
 */
import type { ServiciosPublicListingRow } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/(site)/clasificados/servicios/lib/serviciosListingLifecycle";

/** Branded/nominal type — a plain `ServiciosPublicListingRow` is NOT assignable without an
 * explicit unsafe cast. The only legitimate way to obtain one is
 * `certifyServiciosPublicEligibleListing`. */
export type ServiciosPublicEligibleListing = ServiciosPublicListingRow & {
  readonly __serviciosPublicEligible: true;
};

/**
 * The sole constructor. Applies the exact same published-status truth the live public Servicios
 * pipeline uses. Returns `null` for any ineligible/malformed row.
 */
export function certifyServiciosPublicEligibleListing(
  row: ServiciosPublicListingRow | null | undefined,
): ServiciosPublicEligibleListing | null {
  if (!row) return null;
  if (!row.slug?.trim()) return null;
  if (!row.profile_json) return null;
  if (row.listing_status !== SERVICIOS_LISTING_STATUS_PUBLISHED) return null;
  return { ...row, __serviciosPublicEligible: true };
}
