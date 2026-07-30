import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { BUSINESS_IDENTITY_FLAG_KEY } from "./constants";
import { computeFlagTier, type ResolvedFlagTier } from "./featureFlagLogic";
import type { BusinessIdentityFlagRow } from "./types";

export type { ResolvedFlagTier };
export { computeFlagTier };

/**
 * Server-only feature-flag reader for `business_identity_flags`. The table has zero client
 * RLS policies (server-only by design, certified in Package 1) — this is the only supported
 * read path. Never expose the service-role client or the raw row to any client-facing code.
 */

type FlagCacheEntry = { row: BusinessIdentityFlagRow | null; fetchedAt: number };

// No existing cache precedent was found anywhere in this repo for a comparable read
// (confirmed in the BCO-1C.0 preflight). This is a new, narrowly-scoped, short in-memory
// cache — 30s TTL — to avoid a DB round trip on every request without risking a stale flag
// for more than half a minute. The emergency-disable path below always reads fresh,
// bypassing the cache entirely, because a 30s-stale kill switch isn't a real kill switch.
let cache: FlagCacheEntry | null = null;
const CACHE_TTL_MS = 30_000;

function invalidateCache(): void {
  cache = null;
}

/** Exposed for tests and for any future admin write-path that should invalidate immediately after a change. */
export function __invalidateBusinessIdentityFlagCacheForTests(): void {
  invalidateCache();
}

function mapRow(raw: {
  flag_key: string;
  enabled: boolean;
  pilot_user_ids: string[] | null;
  emergency_disabled: boolean;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
}): BusinessIdentityFlagRow {
  return {
    flagKey: raw.flag_key,
    enabled: raw.enabled,
    pilotUserIds: raw.pilot_user_ids ?? [],
    emergencyDisabled: raw.emergency_disabled,
    notes: raw.notes,
    updatedAt: raw.updated_at,
    updatedBy: raw.updated_by,
  };
}

async function fetchFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", BUSINESS_IDENTITY_FLAG_KEY)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data);
  } catch {
    // Fail closed: any error (network, auth, missing table) resolves as "no row" -> unavailable.
    return null;
  }
}

async function getFlagRowCached(): Promise<BusinessIdentityFlagRow | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.row;
  const row = await fetchFlagRow();
  cache = { row, fetchedAt: now };
  return row;
}

/**
 * Resolves the tier for a given (possibly signed-out) user. Always fetches the emergency-disabled
 * state fresh (bypassing cache) — everything else may use the short-lived cache.
 */
export async function resolveBusinessIdentityFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const freshRow = await fetchFlagRow();
  return computeFlagTier(freshRow, userId);
}

/** Cached variant for call sites that don't need the emergency-disable freshness guarantee on its own. */
export async function getBusinessIdentityFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  return getFlagRowCached();
}
