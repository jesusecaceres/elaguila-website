/**
 * Program 5 — Meeting Studio feature flag. Reuses the existing business_identity_flags
 * table and computeFlagTier() decision logic, matching the Program 4 pattern exactly.
 * Starts disabled via the migration's seed row.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import { MEETING_STUDIO_FLAG_KEY } from "./constants";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

async function fetchMeetingStudioFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", MEETING_STUDIO_FLAG_KEY)
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

export async function resolveMeetingStudioFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchMeetingStudioFlagRow();
  return computeFlagTier(row, userId);
}

export async function isMeetingStudioEnabled(): Promise<boolean> {
  const tier = await resolveMeetingStudioFlagTier(null);
  return tier === "global";
}
