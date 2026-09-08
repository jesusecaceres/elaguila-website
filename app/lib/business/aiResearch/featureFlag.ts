import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import { FIELD_DISCOVERY_AI_RESEARCH_FLAG_KEY } from "../fieldDiscovery/constants";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

/** Server-only feature-flag reader for `field_discovery_ai_research`, reusing business_identity_flags. */
async function fetchAiResearchFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", FIELD_DISCOVERY_AI_RESEARCH_FLAG_KEY)
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

export async function resolveAiResearchFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchAiResearchFlagRow();
  return computeFlagTier(row, userId);
}

export async function isAiResearchEnabled(): Promise<boolean> {
  const tier = await resolveAiResearchFlagTier(null);
  return tier === "global";
}
