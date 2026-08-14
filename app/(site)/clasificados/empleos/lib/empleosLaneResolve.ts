/**
 * Gate I.5.4C — single deterministic Empleos lane resolver.
 *
 * Confirmed root cause: the public route falls back to the lane-unaware
 * `EmpleoPublicDetailClient` whenever `job.publicationLane` and `envelope?.lane` are both absent
 * — even though `empleos_public_listings.lane` is a schema-enforced `not null check (lane in
 * ('quick','premium','feria'))` column (`supabase/migrations/20260410210000_empleos_public_listings.sql`)
 * that the sole writer (`upsertEmpleosListingFromEnvelope` → `mapCanonicalToRow`) always sets on
 * every insert and update. A live read-only audit (`scripts/empleos-lane-metadata-audit.mts`)
 * found 0 rows lacking `jobRecord.publicationLane` and 0 conflicts with the `lane` column, so this
 * resolver's DB-column tier is not a guess — it is the same value the row was published with.
 *
 * Evidence order (strongest → weakest); classification never uses title/description/company/
 * salary/visual-label text:
 *   1. explicit `job.publicationLane` (job record, when already resolved);
 *   2. explicit envelope lane (`listing_snapshot.envelope.lane`);
 *   3. the canonical `lane` DB column — the most reliable source for any row that has ever gone
 *      through the current writer, regardless of how old or malformed its JSON snapshot is;
 *   4. Feria-exclusive persisted fields (`feriaDateLine` / `feriaTimeLine` / `feriaVenue`) — the
 *      only lane with a field that cannot reasonably belong to Quick or Premium (verified against
 *      `empleosEnvelopeToJobRecord.ts`: only the feria branch ever sets these). No equivalent
 *      Quick-only or Premium-only exclusive field exists in the current data model, so this tier
 *      can only ever resolve to "feria", never "quick" or "premium" — anything else stays
 *      `unknown` rather than guessing.
 */

export type EmpleosResolvedLane = "quick" | "premium" | "feria" | "unknown";

const VALID_LANES = new Set<string>(["quick", "premium", "feria"]);

function normalizeLane(raw: unknown): EmpleosResolvedLane | null {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return VALID_LANES.has(v) ? (v as EmpleosResolvedLane) : null;
}

export type ResolveEmpleosPublicationLaneInput = {
  /** `job.publicationLane` when already present on a resolved `EmpleosJobRecord`. */
  jobPublicationLane?: string | null;
  /** `listing_snapshot.envelope.lane`. */
  envelopeLane?: string | null;
  /** The canonical `empleos_public_listings.lane` DB column, when available. */
  rowLane?: string | null;
  /** Feria-exclusive persisted fields — any one present is sufficient. */
  feriaDateLine?: string | null;
  feriaTimeLine?: string | null;
  feriaVenue?: string | null;
};

export function resolveEmpleosPublicationLane(input: ResolveEmpleosPublicationLaneInput): EmpleosResolvedLane {
  const explicit = normalizeLane(input.jobPublicationLane);
  if (explicit) return explicit;

  const envelope = normalizeLane(input.envelopeLane);
  if (envelope) return envelope;

  const canonical = normalizeLane(input.rowLane);
  if (canonical) return canonical;

  if (input.feriaDateLine?.trim() || input.feriaTimeLine?.trim() || input.feriaVenue?.trim()) {
    return "feria";
  }

  return "unknown";
}
