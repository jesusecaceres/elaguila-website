/**
 * Revenue OS success return -> which browser-held application identities may be released.
 *
 * Doctrine (final identity closeout): the client-side identity memo of an application (Rentas / Bienes draft
 * key, FSBO pending-row hint, Empleos checkout memo) is released ONLY by a verified terminal event:
 * the success return of a payment whose record proves the paid row. Cancel / retry / back / edit never
 * release it. Pure and dependency-free so it is unit-testable; the cleanup component applies it.
 */

export type PaidReturnProofLite = {
  found?: boolean | null;
  paymentState?: string | null;
  listingId?: string | null;
};

/**
 * A success return is "verified" when the payment record was found, names a listing, and the payment is not
 * canceled / expired / missing. `processing` counts: Stripe only redirects to the success URL after checkout
 * completed, and the webhook may still be landing.
 */
export function isVerifiedPaidReturn(proof: PaidReturnProofLite | null | undefined): boolean {
  if (!proof || proof.found !== true) return false;
  if (!String(proof.listingId ?? "").trim()) return false;
  const state = String(proof.paymentState ?? "").trim().toLowerCase();
  return state === "confirmed" || state === "processing";
}

export type PaidReturnCleanupTarget = "real_estate" | "empleos" | "none";

export function paidReturnCleanupTarget(category: string | null | undefined): PaidReturnCleanupTarget {
  const c = String(category ?? "").trim().toLowerCase();
  if (c === "rentas" || c === "bienes-raices") return "real_estate";
  if (c === "empleos") return "empleos";
  return "none";
}
