/**
 * Gate I.4.3A — server-side owner authorization for the entitlement endpoint
 * (`app/api/dashboard/listing-package-entitlements/route.ts`).
 *
 * The endpoint uses a service-role/admin Supabase client for every downstream lookup, so RLS is
 * never a safety net here — before this gate, the route trusted the bearer-verified user's
 * identity but never checked whether the LISTINGS the request named actually belonged to that
 * user. Any authenticated owner could request another owner's package tier, placement flags,
 * add-on status, and Revenue OS payment proof by supplying a foreign listing's identity. This
 * file is the single choke point that closes that gap for every category the endpoint accepts.
 *
 * No existing cross-category ownership-verification resolver was found in the repository
 * (`categoryRouteRegistry.ts` maps category -> source table for *routing* only, with no DB
 * calls allowed in that file by its own stated design; `identityBuilders.ts` requires the owner
 * id as an already-known input rather than resolving/verifying it). This is a narrow, dedicated
 * helper for exactly this one endpoint's ownership question — it does not attempt to become a
 * general-purpose identity registry.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const OWNERSHIP_CHUNK_SIZE = 80;

/**
 * The only `listingSource` values this endpoint has ever actually received (confirmed by
 * inspecting every real caller — `mis-anuncios/page.tsx` and `restaurantes/page.tsx`). Any other
 * `listingSource` fails closed: `resolveListingSourceOwnershipContract` returns `null` for it,
 * and the caller must treat that as "never owned" rather than guessing at an unverified table
 * or owner column.
 *
 * `identityColumns` lists every column a request item's identity may legitimately be matched
 * against for that source — mirrors the same id/slug flexibility already relied on elsewhere in
 * this endpoint's own downstream lookups (e.g. `listingKeysFromRow` in
 * `listingPackageEntitlementsServer.ts`). Restricted per-source to columns that source's table
 * actually has (`listings` has no `slug` column; `servicios_public_listings` does, and is the one
 * real source where a request's identity can legitimately be a slug instead of a UUID — see Gate
 * I.4.2's `serviciosRawRows` entitlement-lookup construction, which falls back to `row.slug` when
 * `row.id` is null).
 */
const LISTING_SOURCE_OWNERSHIP_CONTRACT: Record<string, { ownerColumn: string; identityColumns: readonly string[] }> = {
  listings: { ownerColumn: "owner_id", identityColumns: ["id"] },
  restaurantes_public_listings: { ownerColumn: "owner_user_id", identityColumns: ["id"] },
  servicios_public_listings: { ownerColumn: "owner_user_id", identityColumns: ["id", "slug"] },
  autos_classifieds_listings: { ownerColumn: "owner_user_id", identityColumns: ["id"] },
};

export function resolveListingSourceOwnershipContract(
  listingSource: string,
): { ownerColumn: string; identityColumns: readonly string[] } | null {
  return LISTING_SOURCE_OWNERSHIP_CONTRACT[listingSource] ?? null;
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

/**
 * Resolves exactly which of `identityKeys` (each item's `listingId ?? slug ?? leonixAdId`
 * fallback value) are actually owned by `ownerId` in `listingSource`. Batched — one or a small
 * bounded number of chunked queries per source, never one query per listing. An unknown source,
 * a Supabase-not-configured environment, or a failed/errored chunk all fail closed: nothing in
 * that chunk is ever treated as owned.
 */
export async function resolveOwnedListingIdentityKeys(
  supabase: SupabaseClient,
  listingSource: string,
  identityKeys: readonly string[],
  ownerId: string,
): Promise<Set<string>> {
  const owned = new Set<string>();
  const contract = resolveListingSourceOwnershipContract(listingSource);
  if (!contract) return owned;

  const uniqueKeys = [...new Set(identityKeys.map((k) => k.trim()).filter(Boolean))];
  if (uniqueKeys.length === 0 || !ownerId.trim()) return owned;

  for (const identityColumn of contract.identityColumns) {
    for (const keyChunk of chunk(uniqueKeys, OWNERSHIP_CHUNK_SIZE)) {
      const { data, error } = await supabase
        .from(listingSource)
        .select(identityColumn)
        .eq(contract.ownerColumn, ownerId)
        .in(identityColumn, keyChunk);
      if (error || !Array.isArray(data)) continue; // fail closed per chunk
      for (const row of data as unknown as Array<Record<string, unknown>>) {
        const value = row[identityColumn];
        if (typeof value === "string" && value.trim()) owned.add(value.trim());
      }
    }
  }

  return owned;
}
