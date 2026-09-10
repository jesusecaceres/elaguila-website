/**
 * Gate COMIDA-LOCAL-2 — makes Comida Local public-results eligibility a type-enforced precondition
 * of the matcher, not merely a documented one. Mirrors the Autos / Bienes Raíces / Rentas /
 * Servicios / Restaurantes precedent.
 *
 * The real eligibility gate is a single status check: `status === "published"`. That is exactly and
 * only what every LIVE public reader enforces — `fetchAllPublishedRows` (landing/results inventory)
 * and `getPublishedComidaLocalListingBySlug` (public detail) both apply
 * `.eq("status", COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED)`, and a non-published slug 404s.
 * `pending_payment`, `draft`, `paused` and `suspended` are all excluded by that same single check.
 *
 * DELIBERATELY NOT USED HERE: `isComidaLocalPublishPubliclyVisible` (comidaLocalPaymentStatus.ts)
 * additionally requires a complete `payment_status`. It reads like the eligibility rule, but a
 * whole-repo search proves it has ZERO runtime consumers — no public reader, route or component
 * calls it. Adopting it here would make Saved Search apply a stricter visibility rule than the
 * pages themselves, i.e. a second interpretation of visibility, which is exactly what this file
 * exists to prevent. It is recorded as BUILT-NOT-WIRED in the wiring map instead. (In practice the
 * two agree: `activatePaidComidaLocalListingFromRevenueOs` writes `status:"published"` and
 * `payment_status:"paid"` in the same patch.)
 *
 * This module performs no I/O.
 */
import type { ComidaLocalPublicListingRow } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED } from "@/app/lib/clasificados/comida-local/comidaLocalPublicFilter";

/** Branded/nominal type — a plain row is NOT assignable without an explicit unsafe cast. The only
 * legitimate way to obtain one is `certifyComidaLocalPublicEligibleListing`. */
export type ComidaLocalPublicEligibleListing = ComidaLocalPublicListingRow & {
  readonly __comidaLocalPublicEligible: true;
};

export function certifyComidaLocalPublicEligibleListing(
  row: ComidaLocalPublicListingRow | null | undefined,
): ComidaLocalPublicEligibleListing | null {
  if (!row) return null;
  if (!row.id?.trim()) return null;
  if (!row.slug?.trim()) return null;
  if (String(row.status ?? "").trim().toLowerCase() !== COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED) {
    return null;
  }
  return { ...row, __comidaLocalPublicEligible: true };
}
