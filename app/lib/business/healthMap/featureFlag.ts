import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { HEALTH_MAP_FLAG_KEY } from "./constants";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

/**
 * Gate BCO-6A — server-only feature-flag reader for the `business_health_map` row in the existing
 * `business_identity_flags` table, reusing the same table and computeFlagTier() decision logic as
 * Gate BCO-5A's living_business_book flag rather than a parallel flags system.
 */
async function fetchHealthMapFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", HEALTH_MAP_FLAG_KEY)
      .maybeSingle();
    if (error || !data) return null;
    return {
      flagKey: data.flag_key,
      enabled: data.enabled,
      pilotUserIds: data.pilot_user_ids ?? [],
      emergencyDisabled: data.emergency_disabled,
      notes: data.notes,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
  } catch {
    return null;
  }
}

export async function resolveHealthMapFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchHealthMapFlagRow();
  return computeFlagTier(row, userId);
}
