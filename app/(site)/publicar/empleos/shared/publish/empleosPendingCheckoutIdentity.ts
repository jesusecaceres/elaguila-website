/**
 * Empleos paid job post — "one application, one listing" across repeated checkout attempts.
 *
 * Proven defect (2026-09-18 publication-circuit audit): `buildEmpleosPublishEnvelope` hard-codes
 * `listingId: null` and `saveEmpleosDraftAndStartPaidJobCheckout` never sent one, so EVERY click on
 * "continue to payment" (Stripe cancel → retry, back-button, double submit) INSERTed a brand-new
 * `draft` row with a new slug — the same duplicate mechanism as the Servicios Plomería rows.
 *
 * The server already fails closed on a declared-but-missing id, so the missing piece is purely
 * client-side: remember the row this application already created and send its id next time.
 * Session-scoped (a new tab is a new application), keyed by lane + normalized title so a genuinely
 * different job post never reuses another post's row. Pure (storage is injected) so it is testable.
 */

export const EMPLEOS_PENDING_CHECKOUT_LISTING_KEY = "leonix.empleos.pending_checkout_listing.v1";

type MinimalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type Stored = { lane: string; titleKey: string; listingId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeEmpleosTitleKey(title: string | null | undefined): string {
  return String(title ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function readEmpleosPendingCheckoutListingId(
  storage: MinimalStorage | null | undefined,
  key: { lane: string; title: string },
): string | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(EMPLEOS_PENDING_CHECKOUT_LISTING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored> | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (String(parsed.lane ?? "") !== key.lane) return null;
    if (String(parsed.titleKey ?? "") !== normalizeEmpleosTitleKey(key.title)) return null;
    const id = String(parsed.listingId ?? "").trim();
    return UUID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function rememberEmpleosPendingCheckoutListingId(
  storage: MinimalStorage | null | undefined,
  input: { lane: string; title: string; listingId: string },
): void {
  if (!storage || !UUID_RE.test(input.listingId.trim())) return;
  try {
    const value: Stored = {
      lane: input.lane,
      titleKey: normalizeEmpleosTitleKey(input.title),
      listingId: input.listingId.trim(),
    };
    storage.setItem(EMPLEOS_PENDING_CHECKOUT_LISTING_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable — falls back to the pre-fix behaviour (a new row), never blocks checkout */
  }
}

export function clearEmpleosPendingCheckoutListingId(storage: MinimalStorage | null | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(EMPLEOS_PENDING_CHECKOUT_LISTING_KEY);
  } catch {
    /* ignore */
  }
}
