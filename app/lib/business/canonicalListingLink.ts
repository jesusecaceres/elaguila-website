import "server-only";

/**
 * Gate QB-IDENTITY-01 — canonical customer↔business↔listing identity.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM `assistedListingCustody.ts`:
 * `scripts/verify-p0-final-assisted-publishing-bridge-01.ts:66` asserts that the assisted
 * custody module never queries or writes ANY listing's `owner_user_id`. That guard is correct
 * and must stay. Self-service linking, by contrast, is defined entirely by proving that the
 * listing's owner column equals the calling user — so it necessarily reads `owner_user_id`.
 * The two therefore live in separate modules on purpose.
 *
 * IDENTITY CONTRACT
 *  - The durable relationship is the EXISTING `business_listing_links` junction. No parallel
 *    "Quick session" universe is introduced.
 *  - A business is resolved for a user through the EXISTING `business_memberships` table
 *    (`businesses` itself has no owner column — ownership lives in memberships).
 *  - `listing_source` is validated against the EXISTING `LISTING_SOURCE_OWNERSHIP_CONTRACT`
 *    rather than a second hard-coded list, so the two can never drift.
 *
 * IDEMPOTENCY
 *  `business_listing_links` carries a PARTIAL unique index:
 *      UNIQUE (listing_source, listing_id) WHERE status = 'verified'
 *  PostgREST/supabase-js `.upsert()` cannot express that predicate, so an `ON CONFLICT` upsert
 *  is not available. Idempotency is therefore select-then-insert PLUS an explicit unique-violation
 *  (23505) catch, which collapses a concurrent double-insert into success instead of an error.
 *
 * AMBIGUITY IS A REFUSAL, NEVER A GUESS
 *  The partial unique index means one verified link per listing GLOBALLY. When the guarded
 *  owner-scan fallback finds more than one candidate listing, this module refuses rather than
 *  picking one — mutating an arbitrary listing is the exact failure mode it exists to prevent.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveListingSourceOwnershipContract } from "@/app/lib/listingPlans/listingEntitlementOwnership";

/** The four listing sources Quick Business can own. Mirrors LISTING_SOURCE_OWNERSHIP_CONTRACT. */
export type CanonicalListingSource =
  | "servicios_public_listings"
  | "restaurantes_public_listings"
  | "autos_classifieds_listings"
  | "listings";

export const CANONICAL_LISTING_SOURCES: readonly CanonicalListingSource[] = [
  "servicios_public_listings",
  "restaurantes_public_listings",
  "autos_classifieds_listings",
  "listings",
];

export function isCanonicalListingSource(value: unknown): value is CanonicalListingSource {
  return typeof value === "string" && (CANONICAL_LISTING_SOURCES as readonly string[]).includes(value);
}

/** Postgres unique-violation. A concurrent insert that lost the race is still a success for us. */
const PG_UNIQUE_VIOLATION = "23505";

/**
 * The business this user acts for, via the canonical `business_memberships` table.
 * Returns null when the user has no active membership, and `ambiguous` when they have
 * several — the caller must then be told which business to act on rather than guessing.
 */
export async function resolveActiveBusinessIdForUser(
  userId: string,
): Promise<{ businessId: string | null; ambiguous: boolean }> {
  if (!isSupabaseAdminConfigured() || !userId) return { businessId: null, ambiguous: false };
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("business_memberships")
    .select("business_id, is_primary_owner")
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .limit(10);
  if (error || !data?.length) return { businessId: null, ambiguous: false };

  const rows = data as { business_id: string; is_primary_owner: boolean | null }[];
  if (rows.length === 1) return { businessId: rows[0]!.business_id, ambiguous: false };

  // Several active memberships: the primary-owner one wins if exactly one such row exists.
  const owned = rows.filter((r) => r.is_primary_owner === true);
  if (owned.length === 1) return { businessId: owned[0]!.business_id, ambiguous: false };
  return { businessId: null, ambiguous: true };
}

/**
 * True only when `listingId` in `listingSource` really is owned by `userId`, read through the
 * source's canonical owner column. This is the whole basis on which a self-service link may be
 * written as `status='verified'` — the same rule the finalize-business RPC already applies.
 */
export async function verifyListingOwnedByUser(input: {
  listingSource: CanonicalListingSource;
  listingId: string;
  userId: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const contract = resolveListingSourceOwnershipContract(input.listingSource);
  if (!contract) return false;
  const db = getAdminSupabase();
  const { data, error } = await db
    .from(input.listingSource)
    .select(`id, ${contract.ownerColumn}`)
    .eq("id", input.listingId)
    .maybeSingle();
  if (error || !data) return false;
  const owner = (data as unknown as Record<string, unknown>)[contract.ownerColumn];
  return typeof owner === "string" && owner.length > 0 && owner === input.userId;
}

export type LinkWriteResult =
  | { ok: true; linked: true; alreadyLinked: boolean; businessId: string }
  | { ok: false; reason: "db_not_configured" | "not_owner" | "no_business" | "ambiguous_business" | "conflict_other_business" | "insert_failed" };

/**
 * Idempotently record that a listing the CUSTOMER published themselves belongs to their business.
 *
 * Converges on the very same row shape the staff-assisted path writes, so both publishing modes
 * produce one identical relationship. `linked_by` is the customer's own auth user id here, which
 * is also what distinguishes a self-published link from a Leonix-prepared one.
 */
export async function linkSelfServiceListingToBusiness(input: {
  userId: string;
  listingSource: CanonicalListingSource;
  listingId: string;
  /** Optional explicit business; resolved from memberships when omitted. */
  businessId?: string;
}): Promise<LinkWriteResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, reason: "db_not_configured" };

  // Ownership is proven server-side; a browser claim is never trusted.
  const owns = await verifyListingOwnedByUser({
    listingSource: input.listingSource,
    listingId: input.listingId,
    userId: input.userId,
  });
  if (!owns) return { ok: false, reason: "not_owner" };

  let businessId = input.businessId?.trim() ?? "";
  if (!businessId) {
    const resolved = await resolveActiveBusinessIdForUser(input.userId);
    if (resolved.businessId) {
      businessId = resolved.businessId;
    } else {
      return { ok: false, reason: resolved.ambiguous ? "ambiguous_business" : "no_business" };
    }
  }

  const db = getAdminSupabase();

  // Already linked? The partial unique index makes the verified link globally unique per listing,
  // so a row found here is THE link — check it points at this same business.
  const { data: existing } = await db
    .from("business_listing_links")
    .select("id, business_id")
    .eq("listing_source", input.listingSource)
    .eq("listing_id", input.listingId)
    .eq("status", "verified")
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    const existingBusinessId = String((existing as { business_id: string }).business_id);
    if (existingBusinessId !== businessId) return { ok: false, reason: "conflict_other_business" };
    return { ok: true, linked: true, alreadyLinked: true, businessId };
  }

  const nowIso = new Date().toISOString();
  const { error } = await db.from("business_listing_links").insert({
    business_id: businessId,
    listing_source: input.listingSource,
    listing_id: input.listingId,
    relationship_role: "primary",
    linked_by: input.userId,
    status: "verified",
    verified_at: nowIso,
  });

  if (error) {
    // Lost a concurrent race against an identical insert: still the desired end state.
    if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) {
      const { data: raced } = await db
        .from("business_listing_links")
        .select("business_id")
        .eq("listing_source", input.listingSource)
        .eq("listing_id", input.listingId)
        .eq("status", "verified")
        .limit(1)
        .maybeSingle();
      const racedBusinessId = raced ? String((raced as { business_id: string }).business_id) : "";
      if (racedBusinessId && racedBusinessId !== businessId) {
        return { ok: false, reason: "conflict_other_business" };
      }
      return { ok: true, linked: true, alreadyLinked: true, businessId };
    }
    return { ok: false, reason: "insert_failed" };
  }

  return { ok: true, linked: true, alreadyLinked: false, businessId };
}

export type CanonicalListingResolution =
  | { found: true; listingId: string; businessId: string | null; via: "link" | "owner_fallback" }
  | { found: false; reason: "db_not_configured" | "none" | "ambiguous" };

/**
 * Resolve THE listing a user manages in a given source.
 *
 * Link-first: the canonical relationship is the primary identity contract. The owner-column scan
 * is only a GUARDED repair fallback for listings published before link write-back existed, and it
 * refuses when it finds more than one candidate rather than mutating an arbitrary row.
 */
export async function resolveCanonicalListingForUser(input: {
  userId: string;
  listingSource: CanonicalListingSource;
  /** Extra equality filters for the fallback scan, e.g. { lane: "negocios", inventory_role: "main" }. */
  fallbackFilters?: Record<string, string>;
}): Promise<CanonicalListingResolution> {
  if (!isSupabaseAdminConfigured()) return { found: false, reason: "db_not_configured" };
  const db = getAdminSupabase();

  // 1. PRIMARY: canonical link, scoped to businesses this user is an active member of.
  const { data: memberships } = await db
    .from("business_memberships")
    .select("business_id")
    .eq("user_id", input.userId)
    .eq("membership_status", "active")
    .limit(50);
  const businessIds = ((memberships ?? []) as { business_id: string }[]).map((m) => m.business_id);

  if (businessIds.length) {
    const { data: links } = await db
      .from("business_listing_links")
      .select("listing_id, business_id")
      .in("business_id", businessIds)
      .eq("listing_source", input.listingSource)
      .eq("status", "verified")
      .limit(10);
    const linkRows = (links ?? []) as { listing_id: string; business_id: string }[];
    if (linkRows.length === 1) {
      return { found: true, listingId: linkRows[0]!.listing_id, businessId: linkRows[0]!.business_id, via: "link" };
    }
    if (linkRows.length > 1) return { found: false, reason: "ambiguous" };
  }

  // 2. GUARDED FALLBACK: owner-column scan for pre-link-era listings.
  const contract = resolveListingSourceOwnershipContract(input.listingSource);
  if (!contract) return { found: false, reason: "none" };
  let query = db
    .from(input.listingSource)
    .select("id")
    .eq(contract.ownerColumn, input.userId);
  for (const [column, value] of Object.entries(input.fallbackFilters ?? {})) {
    query = query.eq(column, value);
  }
  const { data: owned } = await query.limit(5);
  const ownedRows = (owned ?? []) as { id: string }[];
  if (ownedRows.length === 1) {
    return { found: true, listingId: String(ownedRows[0]!.id), businessId: null, via: "owner_fallback" };
  }
  // More than one candidate and no canonical link to disambiguate: refuse rather than guess.
  if (ownedRows.length > 1) return { found: false, reason: "ambiguous" };
  return { found: false, reason: "none" };
}
