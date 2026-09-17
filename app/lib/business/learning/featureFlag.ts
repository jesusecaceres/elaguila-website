import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { LEARNING_CENTER_FLAG_KEY } from "./constants";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

/**
 * TODAY-1 — server-only feature-flag reader for the `business_learning_center` row in the
 * existing `business_identity_flags` table, reusing the same table and computeFlagTier() decision
 * logic as every prior gate's flag rather than a parallel flags system. Also gates the Idea
 * Builder -- this package introduces exactly one flag.
 */
async function fetchLearningCenterFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", LEARNING_CENTER_FLAG_KEY)
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

export async function resolveLearningCenterFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchLearningCenterFlagRow();
  return computeFlagTier(row, userId);
}
