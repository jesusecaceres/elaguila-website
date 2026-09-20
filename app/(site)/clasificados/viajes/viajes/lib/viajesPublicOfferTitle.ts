/**
 * Public offer-title contract: customer-entered title only.
 * Never promote internal listing IDs, UUIDs, slugs, or QA identity tokens into the headline.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QA_IDENTITY_RE = /\bVJ_(PRI|BUS)_\d+\b/i;

export function isViajesInternalQaInventoryIdentity(...parts: Array<string | null | undefined>): boolean {
  return parts.some((p) => QA_IDENTITY_RE.test(String(p ?? "")));
}

export function isViajesInternalListingIdTitle(title: string | null | undefined): boolean {
  const t = String(title ?? "").trim();
  if (!t) return true;
  if (UUID_RE.test(t)) return true;
  if (/^VJ_(PRI|BUS)_\d+$/i.test(t)) return true;
  if (/^trav-\d{4}-\d+$/i.test(t)) return true;
  return false;
}

export function resolveViajesPublicOfferTitle(
  customerTitle: string | null | undefined,
  fallbackTitle: string | null | undefined = ""
): string {
  const primary = String(customerTitle ?? "").trim();
  if (primary && !isViajesInternalListingIdTitle(primary)) return primary;
  const secondary = String(fallbackTitle ?? "").trim();
  if (secondary && !isViajesInternalListingIdTitle(secondary)) return secondary;
  return "";
}
