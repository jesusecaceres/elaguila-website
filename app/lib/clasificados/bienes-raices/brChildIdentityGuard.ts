/**
 * Gate BIENES-NEGOCIO-1 — server-side canonical-identity guard for Bienes Raíces Negocio rows
 * (parent `main` and inventory children alike; both go through the same `updateOneListing` in
 * `app/api/clasificados/bienes-raices/listing-edit/route.ts`).
 *
 * Forward-ports the semantics of sealed Globalization commit `651abd4e` ("protect child listing
 * identity integrity") and extends them with the explicit resolution/fail-closed rules this gate
 * requires. There is no second child-identity engine here: the route already owns the canonical
 * `br-db-child-<uuid>` draft-id convention and the group-scoped child read — this module only
 * decides, purely, whether a given (draft -> row) pairing is legitimate.
 *
 * Two distinct protections:
 *   1. RESOLUTION — a child draft may only ever write to the exact row it claims, owned by the
 *      same owner, in the same category, under the same canonical parent. Anything ambiguous fails
 *      CLOSED with a named reason instead of silently skipping or silently writing elsewhere.
 *   2. SUBSTITUTION — even a correctly-resolved row must not be wholesale retyped into a different
 *      property while keeping its UUID / Leonix Ad ID / analytics / history.
 *
 * Scope note (unchanged from the sealed original, re-verified against THIS branch's
 * `buildEditablePatch`): the edit route only ever persists
 * title/description/city/state/zip/price/business_name/business_meta/detail_pairs(merged)/
 * contact/images. It never writes street-address JSON, and BR's `detail_pairs` carries no flat
 * street-address label. City/state/ZIP are therefore the only genuinely persisted,
 * identity-relevant fields this update path can change — this guard covers exactly those, not raw
 * street text the route cannot alter.
 *
 * Pure: no I/O, no Supabase, no framework imports.
 */

export const BR_CHILD_IDENTITY_ERRORS = {
  /** The draft named a child row that is not in this parent's group. */
  UNRESOLVED: "child_identity_unresolved",
  /** The resolved row belongs to a different owner. */
  OWNER_MISMATCH: "child_identity_owner_mismatch",
  /** The resolved row is not a bienes-raices row. */
  CATEGORY_MISMATCH: "child_identity_category_mismatch",
  /** The resolved row's canonical parent is not the parent being edited. */
  PARENT_MISMATCH: "child_identity_parent_mismatch",
  /** Two drafts in one request claimed the same child row. */
  DUPLICATE_CLAIM: "child_identity_duplicate_claim",
  /** The incoming content describes a different property than the stored row. */
  SUBSTITUTION: "child_identity_substitution",
} as const;

export type BrChildIdentityError =
  (typeof BR_CHILD_IDENTITY_ERRORS)[keyof typeof BR_CHILD_IDENTITY_ERRORS];

export type BrChildIdentityRowLike = {
  id: string;
  owner_id?: string | null;
  category?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
  leonix_ad_id?: string | null;
};

export type BrChildIdentityResolution =
  | { ok: true; row: BrChildIdentityRowLike }
  | { ok: false; error: BrChildIdentityError };

function trim(raw: unknown): string {
  return raw == null ? "" : typeof raw === "string" ? raw.trim() : String(raw).trim();
}

/**
 * The canonical draft-id convention the edit route already uses. A draft id WITHOUT this prefix is
 * a brand-new child that has no row yet — the caller must treat that as "cannot be edited here",
 * never as "create one".
 */
export const BR_DB_CHILD_DRAFT_ID_PREFIX = "br-db-child-";

export function brChildListingIdFromDraftId(draftId: unknown): string | null {
  const id = trim(draftId);
  if (!id.startsWith(BR_DB_CHILD_DRAFT_ID_PREFIX)) return null;
  return id.slice(BR_DB_CHILD_DRAFT_ID_PREFIX.length).trim() || null;
}

/**
 * Resolve one child draft to exactly one real row, or fail closed.
 *
 * `alreadyClaimed` is the set of child listing ids already resolved earlier in the SAME request —
 * two drafts claiming one row is precisely the "one child draft silently mutates a different
 * child" shape this guard exists to stop, and the last writer would otherwise win invisibly.
 */
export function resolveBrChildIdentity(input: {
  childListingId: string;
  childrenById: ReadonlyMap<string, BrChildIdentityRowLike>;
  expectedParentListingId: string;
  expectedOwnerId: string;
  alreadyClaimed: ReadonlySet<string>;
}): BrChildIdentityResolution {
  const childId = trim(input.childListingId);
  if (!childId) return { ok: false, error: BR_CHILD_IDENTITY_ERRORS.UNRESOLVED };
  if (input.alreadyClaimed.has(childId)) {
    return { ok: false, error: BR_CHILD_IDENTITY_ERRORS.DUPLICATE_CLAIM };
  }

  const row = input.childrenById.get(childId);
  if (!row) return { ok: false, error: BR_CHILD_IDENTITY_ERRORS.UNRESOLVED };

  if (trim(row.category).toLowerCase() !== "bienes-raices") {
    return { ok: false, error: BR_CHILD_IDENTITY_ERRORS.CATEGORY_MISMATCH };
  }
  const expectedOwner = trim(input.expectedOwnerId);
  if (!expectedOwner || trim(row.owner_id) !== expectedOwner) {
    return { ok: false, error: BR_CHILD_IDENTITY_ERRORS.OWNER_MISMATCH };
  }
  const expectedParent = trim(input.expectedParentListingId);
  if (!expectedParent || trim(row.br_inventory_parent_listing_id) !== expectedParent) {
    return { ok: false, error: BR_CHILD_IDENTITY_ERRORS.PARENT_MISMATCH };
  }

  return { ok: true, row };
}

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
 * Requires AT LEAST TWO of city, state and ZIP to differ (after normalization) simultaneously. A
 * same-state cross-city move (this platform's own example: San Jose -> Santa Clara) changes city
 * and ZIP while state coincidentally stays "CA" on both sides, so requiring all three would miss
 * that real case; two-of-three is the right bar. A single-field edit (a ZIP typo fix, a
 * re-normalized state, a capitalization/punctuation difference) changes only one of the three and
 * is exactly the harmless correction this guard must ALLOW. Incomplete data on either side is
 * never treated as proof of substitution — it fails open toward "allow" when it cannot be certain,
 * because blocking a legitimate correction is also a real harm.
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

/** Owner-safe explanation for each guard rejection. Never leaks row ids or internal state. */
export function brChildIdentityOwnerMessage(error: BrChildIdentityError, lang: "es" | "en"): string {
  const es = lang !== "en";
  switch (error) {
    case BR_CHILD_IDENTITY_ERRORS.SUBSTITUTION:
      return es
        ? "Esta propiedad parece ser una propiedad distinta, no una corrección de la actual. Para publicar otra propiedad usa «Agregar propiedad» — así conserva su propio anuncio, su ID de Leonix y sus estadísticas."
        : "This looks like a different property, not a correction to the current one. To publish another property use “Add property” — that way it keeps its own listing, Leonix ID and analytics.";
    case BR_CHILD_IDENTITY_ERRORS.DUPLICATE_CLAIM:
      return es
        ? "Dos propiedades de tu formulario apuntan al mismo anuncio publicado. Vuelve a abrir la edición desde tu panel para recargar tu inventario."
        : "Two properties in your form point at the same published listing. Reopen the edit from your dashboard to reload your inventory.";
    default:
      return es
        ? "No pudimos confirmar a qué propiedad publicada corresponde este cambio, así que no guardamos nada. Vuelve a abrir la edición desde tu panel."
        : "We couldn't confirm which published property this change belongs to, so nothing was saved. Reopen the edit from your dashboard.";
  }
}
