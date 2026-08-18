/**
 * Package D Build D2, Gate 1 — canonical placement-resolution reader.
 *
 * Reads real `leonix_placement_entitlements` rows and resolves the single, deterministic active
 * placement signal for a given (category, listingId, surface). This is the ONE place in the repo
 * that turns contractual placement entitlement truth into a normalized runtime ranking signal.
 *
 * Reuses (never duplicates) the enums/pure functions already defined in `placementEntitlements.ts`:
 * PlacementTier/Source/Surface/Status, placementTierRank, isPlacementEntitlementActive,
 * isSurfaceEligible, placementCategoryMatches.
 *
 * Source of truth is exclusively `leonix_placement_entitlements`. No UI label, membership_tier, or
 * account plan is ever treated as entitlement. A documented legacy-listing-row fallback is provided
 * separately (see `resolveLegacyPlacementFallback`) and must never override a valid canonical
 * entitlement — callers decide precedence explicitly, this module never blends them silently.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  isPlacementEntitlementActive,
  isSurfaceEligible,
  placementCategoryMatches,
  placementTierRank,
  type PlacementEntitlementRow,
  type PlacementEntitlementStatus,
  type PlacementSource,
  type PlacementSurface,
  type PlacementTier,
} from "./placementEntitlements";

export type ResolvedPlacementSignal = {
  entitlementId: string | null;
  category: string;
  tier: PlacementTier | string;
  source: PlacementSource | string | null;
  surface: PlacementSurface | string;
  status: PlacementEntitlementStatus | string | null;
  startsAt: string | null;
  endsAt: string | null;
  manualPriority: number;
  rotationWeight: number;
  rankWeight: number;
  listingId: string | null;
  leonixAdId: string | null;
};

function rowToPlacementRow(row: Record<string, unknown>): PlacementEntitlementRow {
  return {
    id: row.id != null ? String(row.id) : undefined,
    category: String(row.category ?? ""),
    placementTier: String(row.placement_tier ?? ""),
    placementSource: row.placement_source != null ? String(row.placement_source) : null,
    surfaces: Array.isArray(row.surfaces) ? row.surfaces.map((s) => String(s)) : [],
    startsAt: row.starts_at != null ? String(row.starts_at) : null,
    endsAt: row.ends_at != null ? String(row.ends_at) : null,
    status: row.status != null ? String(row.status) : null,
    manualPriority: typeof row.manual_priority === "number" ? row.manual_priority : null,
    rotationWeight: typeof row.rotation_weight === "number" ? row.rotation_weight : null,
    listingId: row.listing_id != null ? String(row.listing_id) : null,
    leonixAdId: row.leonix_ad_id != null ? String(row.leonix_ad_id) : null,
  };
}

/** Deterministic tie-break: tier rank desc, then manual priority desc, then rotation weight desc,
 * then entitlement id asc (stable, never "most recently inserted wins" — avoids flapping). */
function compareResolvedCandidates(a: PlacementEntitlementRow, b: PlacementEntitlementRow): number {
  const tierDiff = placementTierRank(b.placementTier) - placementTierRank(a.placementTier);
  if (tierDiff !== 0) return tierDiff;
  const priorityDiff = (b.manualPriority ?? 100) - (a.manualPriority ?? 100);
  if (priorityDiff !== 0) return priorityDiff;
  const rotationDiff = (b.rotationWeight ?? 1) - (a.rotationWeight ?? 1);
  if (rotationDiff !== 0) return rotationDiff;
  return String(a.id ?? "").localeCompare(String(b.id ?? ""));
}

export type ResolveActivePlacementInput = {
  category: string;
  listingId: string;
  surface: PlacementSurface | string;
  now?: Date;
};

/**
 * Fetch every `leonix_placement_entitlements` row for this exact listingId, then keep only rows
 * that are genuinely active AND category-matched AND surface-eligible right now. Wrong
 * category/surface never grants a ranking benefit — filtered out here, not weighted down.
 */
export async function resolveActivePlacementEntitlements(
  input: ResolveActivePlacementInput,
): Promise<PlacementEntitlementRow[]> {
  const listingId = input.listingId.trim();
  if (!listingId || !isSupabaseAdminConfigured()) return [];

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_placement_entitlements")
    .select("*")
    .eq("listing_id", listingId)
    .in("status", ["active", "scheduled", "comped"]);

  if (error || !data) return [];

  const now = input.now ?? new Date();
  return data
    .map((row) => rowToPlacementRow(row as Record<string, unknown>))
    .filter(
      (row) =>
        placementCategoryMatches(row.category, input.category) &&
        isSurfaceEligible(row, input.surface) &&
        isPlacementEntitlementActive(row, now),
    );
}

/**
 * Resolve the single, deterministic canonical placement signal for a listing on a surface.
 * Returns null when no active, category- and surface-matched entitlement exists — callers must
 * treat null as "no placement benefit," never fabricate a default tier.
 */
export async function resolveCanonicalPlacementSignal(
  input: ResolveActivePlacementInput,
): Promise<ResolvedPlacementSignal | null> {
  const candidates = await resolveActivePlacementEntitlements(input);
  if (candidates.length === 0) return null;

  const winner = [...candidates].sort(compareResolvedCandidates)[0];
  return {
    entitlementId: winner.id ?? null,
    category: winner.category,
    tier: winner.placementTier,
    source: winner.placementSource ?? null,
    surface: input.surface,
    status: winner.status ?? null,
    startsAt: winner.startsAt ?? null,
    endsAt: winner.endsAt ?? null,
    manualPriority: winner.manualPriority ?? 100,
    rotationWeight: winner.rotationWeight ?? 1,
    rankWeight: placementTierRank(winner.placementTier),
    listingId: winner.listingId ?? null,
    leonixAdId: winner.leonixAdId ?? null,
  };
}

/**
 * Batch variant — resolve canonical signals for many listings in one query (avoids N+1 reads on a
 * results page). Returns a map keyed by listingId; a listing with no active entitlement is simply
 * absent from the map (never present with a fabricated "free" default).
 */
export async function resolveCanonicalPlacementSignalsForListings(
  input: { category: string; listingIds: string[]; surface: PlacementSurface | string; now?: Date },
): Promise<Map<string, ResolvedPlacementSignal>> {
  const ids = [...new Set(input.listingIds.map((id) => id.trim()).filter(Boolean))];
  const result = new Map<string, ResolvedPlacementSignal>();
  if (ids.length === 0 || !isSupabaseAdminConfigured()) return result;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_placement_entitlements")
    .select("*")
    .in("listing_id", ids)
    .in("status", ["active", "scheduled", "comped"]);

  if (error || !data) return result;

  const now = input.now ?? new Date();
  const byListing = new Map<string, PlacementEntitlementRow[]>();
  for (const raw of data) {
    const row = rowToPlacementRow(raw as Record<string, unknown>);
    if (
      !placementCategoryMatches(row.category, input.category) ||
      !isSurfaceEligible(row, input.surface) ||
      !isPlacementEntitlementActive(row, now) ||
      !row.listingId
    ) {
      continue;
    }
    const list = byListing.get(row.listingId) ?? [];
    list.push(row);
    byListing.set(row.listingId, list);
  }

  for (const [listingId, candidates] of byListing) {
    const winner = [...candidates].sort(compareResolvedCandidates)[0];
    result.set(listingId, {
      entitlementId: winner.id ?? null,
      category: winner.category,
      tier: winner.placementTier,
      source: winner.placementSource ?? null,
      surface: input.surface,
      status: winner.status ?? null,
      startsAt: winner.startsAt ?? null,
      endsAt: winner.endsAt ?? null,
      manualPriority: winner.manualPriority ?? 100,
      rotationWeight: winner.rotationWeight ?? 1,
      rankWeight: placementTierRank(winner.placementTier),
      listingId: winner.listingId ?? null,
      leonixAdId: winner.leonixAdId ?? null,
    });
  }

  return result;
}
