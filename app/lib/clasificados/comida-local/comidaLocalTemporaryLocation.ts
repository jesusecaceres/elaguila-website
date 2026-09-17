/**
 * Gate COMIDA-LOCAL-1 — "Encuéntrame Hoy / Find Me Today" temporary-location policy.
 *
 * Before this gate the differentiator was a section HEADING over permanent free text: a
 * `locationNote` written three weeks ago rendered publicly under a title that said "today".
 * There was no timestamp, no expiry and no freshness anywhere in the category (the row's
 * `expires_at` is the SUBSCRIPTION expiry and has nothing to do with today's location).
 *
 * Owner/PM decision implemented here:
 *   - a public temporary location is fresh for 24 hours from its last REAL owner update;
 *   - after 24 hours it fails closed and disappears at read/render time — no scheduler, no
 *     background job, nothing to run and nothing that can silently stop running;
 *   - the public surface shows a concise freshness signal ("Actualizado hace 2 h" /
 *     "Updated 2h ago");
 *   - changing the temporary location note or link refreshes the stamp;
 *   - an ordinary edit that does NOT change the temporary-location payload preserves the
 *     existing stamp and must never falsely refresh it;
 *   - clearing the temporary location clears the stamp (freshness disabled, nothing to expire).
 *
 * The permanent/home address (`businessAddressLine` + `showAddressPublicly`) is a structurally
 * SEPARATE pair of draft fields and is deliberately never read by this module: temporary
 * location can never be populated from, or fall back to, the private address.
 *
 * Zero I/O, zero framework imports, no persistence of its own — safe to import from a server
 * route, a client component and a plain `tsx` self-test alike.
 */

/** Locked: 24 hours, per the owner/PM decision above. */
export const COMIDA_LOCAL_TEMPORARY_LOCATION_FRESH_HOURS = 24;
export const COMIDA_LOCAL_TEMPORARY_LOCATION_FRESH_MS =
  COMIDA_LOCAL_TEMPORARY_LOCATION_FRESH_HOURS * 60 * 60 * 1000;

/**
 * A stamp dated in the future is not trustworthy freshness — only the publish route ever writes
 * one, so a future value means a clock problem or a hand-edited row. A small tolerance absorbs
 * ordinary server clock skew; anything beyond it fails closed (treated as unstamped).
 */
const FUTURE_STAMP_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * The temporary-location payload — exactly the two fields the owner fills under "Encuéntrame
 * Hoy". `availabilityNote` is deliberately NOT part of it: that field states a general,
 * standing availability ("weekends only"), not where the seller is right now, so it neither
 * refreshes the stamp nor expires with it. `businessAddressLine` is likewise never read here.
 */
export type ComidaLocalTemporaryLocationPayload = {
  locationNote: string;
  locationUrl: string;
};

export function readComidaLocalTemporaryLocationPayload(source: {
  locationNote?: unknown;
  locationUrl?: unknown;
}): ComidaLocalTemporaryLocationPayload {
  return {
    locationNote: typeof source.locationNote === "string" ? source.locationNote : "",
    locationUrl: typeof source.locationUrl === "string" ? source.locationUrl : "",
  };
}

/** Whitespace-insensitive so re-indenting a note is not a "material" change. */
function canonicalizeField(raw: string): string {
  return String(raw ?? "").trim().replace(/\s+/g, " ");
}

export function isComidaLocalTemporaryLocationEmpty(
  payload: ComidaLocalTemporaryLocationPayload,
): boolean {
  return !canonicalizeField(payload.locationNote) && !canonicalizeField(payload.locationUrl);
}

/**
 * Order-fixed, whitespace-normalized fingerprint of the temporary-location payload. Equal
 * fingerprints mean the owner did not materially change where they are — the existing stamp
 * must be preserved.
 */
export function comidaLocalTemporaryLocationFingerprint(
  payload: ComidaLocalTemporaryLocationPayload,
): string {
  return JSON.stringify([
    canonicalizeField(payload.locationNote),
    canonicalizeField(payload.locationUrl),
  ]);
}

export function comidaLocalTemporaryLocationChanged(
  previous: ComidaLocalTemporaryLocationPayload,
  next: ComidaLocalTemporaryLocationPayload,
): boolean {
  return (
    comidaLocalTemporaryLocationFingerprint(previous) !==
    comidaLocalTemporaryLocationFingerprint(next)
  );
}

/** Accepts only a parseable ISO-8601 instant; anything else normalizes to "" (no stamp). */
export function normalizeComidaLocalLocationUpdatedAt(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toISOString();
}

/**
 * The single authority for what `locationUpdatedAt` becomes on a save.
 *
 * Called SERVER-SIDE ONLY (the publish route), with `previous*` read from the stored row and
 * never from the request body — so a client cannot forge freshness by posting its own stamp.
 *
 *  - cleared temporary location            -> "" (freshness disabled; nothing to expire)
 *  - no previous row (first save)          -> now
 *  - payload materially changed            -> now
 *  - payload unchanged                     -> the previous stamp, verbatim
 *
 * The unchanged case deliberately returns "" when the previous row had no valid stamp (a row
 * published before this gate). We cannot know when that note was really written, so we refuse
 * to invent a time: the note stays owner-visible and simply is not advertised publicly as
 * "today" until the owner actually updates it. `updated_at`/`published_at` are NOT used as a
 * proxy — `updated_at` would falsely refresh on every unrelated edit, which is exactly what
 * this function exists to prevent.
 */
export function resolveComidaLocalTemporaryLocationStamp(args: {
  previousPayload: ComidaLocalTemporaryLocationPayload | null;
  previousStamp: string;
  nextPayload: ComidaLocalTemporaryLocationPayload;
  nowIso: string;
}): string {
  if (isComidaLocalTemporaryLocationEmpty(args.nextPayload)) return "";
  const now = normalizeComidaLocalLocationUpdatedAt(args.nowIso) || new Date().toISOString();
  if (!args.previousPayload) return now;
  if (comidaLocalTemporaryLocationChanged(args.previousPayload, args.nextPayload)) return now;
  return normalizeComidaLocalLocationUpdatedAt(args.previousStamp);
}

export type ComidaLocalTemporaryLocationState =
  /** The owner has not filled in a temporary location at all. */
  | "absent"
  /** There is content but no trustworthy stamp (legacy row / clock problem) — fails closed. */
  | "unstamped"
  /** Updated within the last 24 hours — publicly truthful as "today". */
  | "fresh"
  /** Older than 24 hours — hidden from the public surface at read time. */
  | "expired";

export type ComidaLocalTemporaryLocationFreshness = {
  state: ComidaLocalTemporaryLocationState;
  updatedAtIso: string;
  /** Null unless `state` is "fresh" or "expired". */
  ageMs: number | null;
};

/** Pure read-time evaluation — this is what makes expiry work with no scheduler. */
export function evaluateComidaLocalTemporaryLocationFreshness(args: {
  payload: ComidaLocalTemporaryLocationPayload;
  stamp: unknown;
  nowMs: number;
}): ComidaLocalTemporaryLocationFreshness {
  if (isComidaLocalTemporaryLocationEmpty(args.payload)) {
    return { state: "absent", updatedAtIso: "", ageMs: null };
  }
  const iso = normalizeComidaLocalLocationUpdatedAt(args.stamp);
  if (!iso) return { state: "unstamped", updatedAtIso: "", ageMs: null };

  const rawAge = args.nowMs - Date.parse(iso);
  if (rawAge < -FUTURE_STAMP_TOLERANCE_MS) {
    // Stamped in the future beyond clock skew — refuse to treat it as fresh.
    return { state: "unstamped", updatedAtIso: "", ageMs: null };
  }
  const ageMs = Math.max(0, rawAge);
  if (ageMs > COMIDA_LOCAL_TEMPORARY_LOCATION_FRESH_MS) {
    return { state: "expired", updatedAtIso: iso, ageMs };
  }
  return { state: "fresh", updatedAtIso: iso, ageMs };
}

/** "Actualizado hace 2 h" / "Updated 2h ago". Empty string when there is no age to report. */
export function formatComidaLocalTemporaryLocationFreshness(
  ageMs: number | null,
  lang: "es" | "en",
): string {
  if (ageMs == null || !Number.isFinite(ageMs) || ageMs < 0) return "";
  const es = lang !== "en";
  if (ageMs < 60_000) return es ? "Actualizado hace un momento" : "Updated just now";
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 60) return es ? `Actualizado hace ${minutes} min` : `Updated ${minutes}m ago`;
  const hours = Math.floor(ageMs / 3_600_000);
  return es ? `Actualizado hace ${hours} h` : `Updated ${hours}h ago`;
}

/**
 * Owner-facing explanation of why a temporary location the owner CAN see is not being shown to
 * the public. Empty for "absent"/"fresh" — nothing to explain.
 */
export function comidaLocalTemporaryLocationOwnerWarning(
  state: ComidaLocalTemporaryLocationState,
  lang: "es" | "en",
): string {
  const es = lang !== "en";
  if (state === "expired") {
    return es
      ? "Esta ubicación tiene más de 24 horas, así que ya no se muestra en tu anuncio público. Actualízala cuando cambies de lugar."
      : "This location is more than 24 hours old, so it no longer shows on your public listing. Update it when you move.";
  }
  if (state === "unstamped") {
    return es
      ? "No sabemos cuándo se escribió esta ubicación, así que no se muestra públicamente. Vuelve a guardarla para publicarla como la de hoy."
      : "We don't know when this location was written, so it isn't shown publicly. Save it again to publish it as today's location.";
  }
  return "";
}
