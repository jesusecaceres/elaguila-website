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

/** The ONLY status the public reader shows (`comida_local_public_listings.status = 'published'`). */
export const COMIDA_LOCAL_PUBLIC_STATUS = "published" as const;

/**
 * Public detail must not be offered for a row that is not public.
 *
 * Gate 2 (2026-09 dashboard state machine): this used to be a DENY-list (`!== pending_payment && !== draft`), so a
 * `paused`, `suspended` or unknown-status row still showed "View public" and the link 404'd. It is now an
 * ALLOW-list that matches the public reader and Admin Live (`isComidaLocalRowPubliclyLive`): only `published`.
 */
export function comidaLocalRowHasPublicPage(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toLowerCase() === COMIDA_LOCAL_PUBLIC_STATUS;
}

/** Value the payment engine writes to `suspended_reason` (grace expired / chargeback). */
export const COMIDA_LOCAL_PAYMENT_SUSPENSION_REASON_VALUE = "payment" as const;

export type ComidaLocalOwnerReason =
  | "published"
  | "payment_pending"
  | "draft"
  | "paused_by_owner"
  | "paused_staff_hold"
  | "suspended_moderation"
  | "suspended_payment"
  | "unknown";

export type ComidaLocalOwnerActionPlan = {
  /** The row is on the public site right now (status `published`). */
  publicLive: boolean;
  /** "View public" may be shown - identical to `publicLive` (never a dead link). */
  viewPublic: boolean;
  /** The listing-bound editor may be opened (an unknown / empty status fails closed, like the owner edit route). */
  edit: boolean;
  /** "Complete payment": only a `pending_payment` row, resumed into the SAME row's checkout checkpoint. */
  completePayment: boolean;
  /** Owner Pause: only a `published` row. */
  pause: boolean;
  /** Owner Resume: only a `paused` row that carries NO staff hold marker. Suspended rows are never owner-resumable. */
  resume: boolean;
  reason: ComidaLocalOwnerReason;
};

/**
 * Owner state machine for one Comida Local row (pure). Vocabulary is the table's own status CHECK:
 * draft, published, paused, suspended, pending_payment - there is no `archived` / `rejected` / `expired`.
 *
 * ARCHIVE MARKER (Gate 2 item 8): staff `archive` writes `paused` (the table has no `archived` status), which is
 * indistinguishable from an owner pause. `suspended_reason` is the only marker column: `paused` + a non-empty
 * `suspended_reason` is a STAFF HOLD (the owner may edit but never self-resume it); `paused` with no reason is an
 * owner pause (or a legacy staff archive written before the marker existed - see the state-machine doc, residual).
 */
export function comidaLocalOwnerActionPlan(input: {
  status: string | null | undefined;
  suspendedReason?: string | null;
}): ComidaLocalOwnerActionPlan {
  const status = String(input.status ?? "").trim().toLowerCase();
  const reason = String(input.suspendedReason ?? "").trim().toLowerCase();
  const base = { publicLive: false, viewPublic: false, edit: true, completePayment: false, pause: false, resume: false };
  switch (status) {
    case "published":
      return { ...base, publicLive: true, viewPublic: true, pause: true, reason: "published" };
    case "pending_payment":
      return { ...base, completePayment: true, reason: "payment_pending" };
    case "draft":
      return { ...base, reason: "draft" };
    case "paused":
      return reason
        ? { ...base, reason: "paused_staff_hold" }
        : { ...base, resume: true, reason: "paused_by_owner" };
    case "suspended":
      return {
        ...base,
        reason: reason === COMIDA_LOCAL_PAYMENT_SUSPENSION_REASON_VALUE ? "suspended_payment" : "suspended_moderation",
      };
    default:
      return { ...base, edit: false, reason: "unknown" };
  }
}

/** Owner-facing reason line for a non-live Comida Local row (null when nothing needs saying). */
export function comidaLocalOwnerReasonNote(reason: ComidaLocalOwnerReason, lang: "es" | "en"): string | null {
  const es = lang === "es";
  switch (reason) {
    case "payment_pending":
      return es
        ? "Tu ficha está guardada pero aún no está publicada. Completa el pago para publicarla; se usa este mismo anuncio."
        : "Your listing is saved but not published yet. Complete payment to publish it; this same listing is used.";
    case "draft":
      return es ? "Borrador: aún no está publicado." : "Draft: not published yet.";
    case "paused_by_owner":
      return es
        ? "Pausado: no es visible al público. Puedes reactivarlo cuando quieras."
        : "Paused: not visible to the public. You can reactivate it any time.";
    case "paused_staff_hold":
      return es
        ? "Leonix archivó o retiró este anuncio del público. Puedes editarlo, pero solo Leonix puede reactivarlo."
        : "Leonix archived or removed this listing from public view. You can edit it, but only Leonix can reactivate it.";
    case "suspended_moderation":
      return es
        ? "Suspendido por Leonix (moderación): no es visible al público. Contacta a Leonix para revisarlo."
        : "Suspended by Leonix (moderation): not visible to the public. Contact Leonix to review it.";
    case "suspended_payment":
      return es
        ? "Suspendido por un problema de pago: se restaura automáticamente cuando el pago se regulariza. Contacta a Leonix si ya lo resolviste."
        : "Suspended for a payment problem: it is restored automatically once the payment is resolved. Contact Leonix if you already fixed it.";
    case "unknown":
      return es
        ? "Este anuncio tiene un estado que no reconocemos. Contacta a Leonix."
        : "This listing has a status we do not recognize. Contact Leonix.";
    default:
      return null;
  }
}
