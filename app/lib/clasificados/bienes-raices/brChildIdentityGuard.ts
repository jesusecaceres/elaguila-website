/**
 * Globalization Build 2 — server-side integrity guard against wholesale property-identity
 * substitution on an existing Bienes Raíces Negocio listing row (parent or inventory child —
 * both go through the same `updateOneListing` in `app/api/clasificados/bienes-raices/
 * listing-edit/route.ts`). Prevents an owner from silently retyping an unrelated property into
 * an existing row while keeping the same UUID/Leonix Ad ID/analytics/history.
 *
 * Scope note: `buildEditablePatch` (the route's actual write function) only ever persists
 * title/description/city/state/zip/price/business_name/business_meta/detail_pairs(merge)/
 * contact/images for an edit — it never writes the deeper structured street-address JSON
 * (`listing_json`/`profile_json`), and BR's `detail_pairs` carries no flat street-address label
 * either. City/state/ZIP are therefore the only genuinely persisted, identity-relevant fields
 * this specific update path can change — this guard covers exactly those, not raw street text
 * that this route cannot actually alter.
 */

export type BrPropertyLocationIdentity = {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

/** Collapses whitespace/punctuation and lowercases — tolerant of "San Jose" vs "san  jose," etc. */
function normalizeCity(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeState(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

/** First 5 digits only — tolerant of ZIP+4, spacing, and other formatting differences. */
function normalizeZip(raw: string | null | undefined): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.slice(0, 5);
}

/**
 * True only when the incoming location represents a genuinely different property than the one
 * currently stored in this row, not a correction to it.
 *
 * Requires AT LEAST TWO of city, state, and ZIP to differ (after normalization) simultaneously.
 * A same-state cross-city move (this platform's own example: San Jose -> Santa Clara) changes
 * city and ZIP while state coincidentally stays "CA" on both sides — requiring all three to
 * differ would miss that real case, so two-of-three is the right bar. A single-field edit (a
 * ZIP typo fix, a state re-normalized by a provider, a city capitalization/punctuation
 * difference) changes only one of the three and is exactly the "harmless correction" case this
 * guard must allow, not block. Incomplete data on either side (any of the three missing) is
 * never treated as proof of substitution — fails open toward "allow" when it can't be certain.
 */
export function isBienesChildIdentitySubstitution(
  existing: BrPropertyLocationIdentity,
  incoming: BrPropertyLocationIdentity,
): boolean {
  const oldCity = normalizeCity(existing.city);
  const newCity = normalizeCity(incoming.city);
  const oldState = normalizeState(existing.state);
  const newState = normalizeState(incoming.state);
  const oldZip = normalizeZip(existing.zip);
  const newZip = normalizeZip(incoming.zip);

  const haveOld = Boolean(oldCity) && Boolean(oldState) && Boolean(oldZip);
  const haveNew = Boolean(newCity) && Boolean(newState) && Boolean(newZip);
  if (!haveOld || !haveNew) return false;

  const changedCount =
    (oldCity !== newCity ? 1 : 0) + (oldState !== newState ? 1 : 0) + (oldZip !== newZip ? 1 : 0);
  return changedCount >= 2;
}
