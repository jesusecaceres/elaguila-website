/**
 * Comida Local - legitimate PAYMENT-RESUME path for a `pending_payment` row (closeout 2).
 *
 * ROOT CAUSE: a listing saved as `pending_payment` (the pre-checkout save) had no way back to payment.
 * The listing-bound preview hid the checkout checkpoint (it only rendered for a brand-new publish), the
 * owner dashboard collapsed `pending_payment` into a generic "draft" chip with only an Edit action, and
 * the only route to pay was to start a NEW application - which mints a new `draft_listing_id` and
 * therefore a duplicate row and a second Leonix Ad ID.
 *
 * This mirrors the Servicios "Gate 8 - Completar pago" pattern: a listing-bound preview of a row whose
 * REAL status is `pending_payment` shows the SAME `COMIDA_LOCAL_BASE_CHECKOUT` checkpoint. It is driven by
 * the same pending save (`saveComidaLocalPendingBeforeCheckout`), which resolves the existing row by its
 * `draft_listing_id` (forced to the row's own value on hydration) - never a second row. No payment truth is
 * ever fabricated: the row only becomes published through the verified Revenue OS webhook.
 *
 * Pure, zero I/O.
 */

export const COMIDA_LOCAL_PENDING_PAYMENT_STATUS = "pending_payment" as const;

export function isComidaLocalAwaitingPayment(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toLowerCase() === COMIDA_LOCAL_PENDING_PAYMENT_STATUS;
}

export type ComidaLocalPreviewCheckoutMode = "fresh_checkout" | "resume_payment" | "none";

/**
 * - not listing-bound (a new application)                      -> fresh_checkout (unchanged)
 * - listing-bound AND the row's real status is pending_payment  -> resume_payment (SAME checkout, SAME row)
 * - listing-bound and any other / unknown status                -> none (an already-paid or unresolved row is
 *   never re-charged; it saves through the form). Unknown fails closed.
 */
export function decideComidaLocalPreviewCheckout(input: {
  listingBound: boolean;
  rowStatus: string | null | undefined;
}): ComidaLocalPreviewCheckoutMode {
  if (!input.listingBound) return "fresh_checkout";
  return isComidaLocalAwaitingPayment(input.rowStatus) ? "resume_payment" : "none";
}

/** Dashboard "Completar pago" doorway: the listing-bound preview, which self-hydrates from the owner's row. */
export function comidaLocalResumePaymentHref(listingId: string, lang: "es" | "en"): string {
  return `/clasificados/comida-local/preview?edit=1&listingId=${encodeURIComponent(listingId)}&source=dashboard&resume=payment&lang=${lang}`;
}

export function comidaLocalResumePaymentLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Completar pago" : "Complete payment";
}

/** Public detail must not be offered for a row that is not yet public. */
export function comidaLocalRowHasPublicPage(status: string | null | undefined): boolean {
  const s = String(status ?? "").trim().toLowerCase();
  return s !== COMIDA_LOCAL_PENDING_PAYMENT_STATUS && s !== "draft";
}
