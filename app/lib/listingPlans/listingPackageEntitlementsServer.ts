import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  isListingPackageEntitlementRowActive,
  mergeActiveEntitlementFieldsIntoListingRow,
  pickStrongestActiveEntitlement,
  type ActiveListingPackageEntitlement,
} from "./listingPackageEntitlementPlacement";
import { resolveMagazinePlacementPriority } from "./magazinePlacementPriority";
import { normalizePackageEntitlementTier, type PackageEntitlementTier } from "./packageEntitlements";

export type ListingPackageEntitlementLookup = {
  byListingId: Map<string, ActiveListingPackageEntitlement>;
};

function listingKeysFromRow(row: {
  id?: string | null;
  slug?: string | null;
  leonix_ad_id?: string | null;
}): string[] {
  const keys: string[] = [];
  if (row.id?.trim()) keys.push(row.id.trim());
  if (row.slug?.trim()) keys.push(row.slug.trim());
  if (row.leonix_ad_id?.trim()) keys.push(row.leonix_ad_id.trim());
  return keys;
}

function publicPlacementFromEntitlementMetadata(
  metadata: unknown,
): Pick<ActiveListingPackageEntitlement, "digitalPlacementPriority" | "printPlacementType"> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { digitalPlacementPriority: null, printPlacementType: null };
  }
  const pp = (metadata as Record<string, unknown>).print_placement;
  if (!pp || typeof pp !== "object" || Array.isArray(pp)) {
    return { digitalPlacementPriority: null, printPlacementType: null };
  }
  const placement = pp as Record<string, unknown>;
  const stored = placement.digital_placement_priority;
  if (typeof stored === "number" && Number.isFinite(stored)) {
    return {
      digitalPlacementPriority: stored,
      printPlacementType:
        typeof placement.print_placement_type === "string" ? placement.print_placement_type : null,
    };
  }
  const resolved = resolveMagazinePlacementPriority({
    print_placement_type:
      typeof placement.print_placement_type === "string" ? placement.print_placement_type : null,
    magazine_page_number: placement.magazine_page_number as number | string | null | undefined,
    magazine_issue: typeof placement.magazine_issue === "string" ? placement.magazine_issue : null,
    reserved_internal: placement.reserved_internal === true,
  });
  return {
    digitalPlacementPriority: resolved.digital_placement_priority,
    printPlacementType: resolved.print_placement_type,
  };
}

function rowToActiveEntitlement(raw: Record<string, unknown>, now: Date): ActiveListingPackageEntitlement | null {
  if (!isListingPackageEntitlementRowActive({ ...raw, now })) return null;
  const listingId = raw.listing_id != null ? String(raw.listing_id).trim() : "";
  if (!listingId) return null;
  const tier = normalizePackageEntitlementTier(raw.package_tier);
  if (tier === "none" || tier === "unknown") return null;
  const placement = publicPlacementFromEntitlementMetadata(raw.metadata);
  return {
    tier,
    startsAt: String(raw.starts_at),
    endsAt: String(raw.ends_at),
    listingId,
    ...placement,
  };
}

/**
 * Load active package entitlements for published listings (service role).
 * Matches `listing_id` to row `id`, `slug`, or `leonix_ad_id`.
 */
export async function fetchActiveListingPackageEntitlementsForRows(
  rows: Array<{ id?: string | null; slug?: string | null; leonix_ad_id?: string | null }>,
  opts: { category: string; listingSource: string; now?: Date },
): Promise<ListingPackageEntitlementLookup> {
  const byListingId = new Map<string, ActiveListingPackageEntitlement>();
  const empty = { byListingId };

  if (!isSupabaseAdminConfigured() || rows.length === 0) return empty;

  const keySet = new Set<string>();
  for (const row of rows) {
    for (const k of listingKeysFromRow(row)) keySet.add(k);
  }
  const keys = [...keySet];
  if (keys.length === 0) return empty;

  const now = opts.now ?? new Date();
  const supabase = getAdminSupabase();
  const chunkSize = 80;
  const rawRows: Record<string, unknown>[] = [];

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("listing_package_entitlements")
      .select("listing_id, package_tier, starts_at, ends_at, status, revoked_at, metadata")
      .eq("category", opts.category)
      .eq("listing_source", opts.listingSource)
      .in("listing_id", chunk)
      .neq("status", "revoked")
      .is("revoked_at", null);

    if (error) {
      if (/does not exist|schema cache|relation/i.test(error.message)) return empty;
      continue;
    }
    if (Array.isArray(data)) rawRows.push(...(data as Record<string, unknown>[]));
  }

  const entitlementsByKey = new Map<string, ActiveListingPackageEntitlement[]>();
  for (const raw of rawRows) {
    const ent = rowToActiveEntitlement(raw, now);
    if (!ent) continue;
    const list = entitlementsByKey.get(ent.listingId) ?? [];
    list.push(ent);
    entitlementsByKey.set(ent.listingId, list);
  }

  for (const key of keys) {
    const best = pickStrongestActiveEntitlement(entitlementsByKey.get(key) ?? []);
    if (best) byListingId.set(key, best);
  }

  return { byListingId };
}

export function resolveActiveEntitlementForPublicRow(
  row: { id?: string | null; slug?: string | null; leonix_ad_id?: string | null },
  lookup: ListingPackageEntitlementLookup,
): ActiveListingPackageEntitlement | null {
  const candidates: ActiveListingPackageEntitlement[] = [];
  for (const k of listingKeysFromRow(row)) {
    const ent = lookup.byListingId.get(k);
    if (ent) candidates.push(ent);
  }
  return pickStrongestActiveEntitlement(candidates);
}

export async function hydratePublicRowsWithActivePackageEntitlements<
  T extends { id?: string | null; slug?: string | null; leonix_ad_id?: string | null } & Record<string, unknown>,
>(rows: T[], opts: { category: string; listingSource: string }): Promise<T[]> {
  const lookup = await fetchActiveListingPackageEntitlementsForRows(rows, opts);
  return rows.map((row) => {
    const ent = resolveActiveEntitlementForPublicRow(row, lookup);
    return mergeActiveEntitlementFieldsIntoListingRow(row, ent);
  });
}

export type DashboardEntitlementBadge = {
  listingKey: string;
  tier: PackageEntitlementTier;
  grantsDestacado: boolean;
  grantsResultsPriority: boolean;
  includesNuestrosNegocios: boolean;
};
