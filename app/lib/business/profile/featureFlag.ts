import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import { BUSINESS_PROFILE_FLAG_KEY } from "./constants";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

/**
 * Server-only feature-flag reader for the `business_profile_builder` row in the existing
 * `business_identity_flags` table -- reuses the exact same table/decision logic as every other
 * Business Concierge sub-feature (see app/lib/business/ownership/featureFlag.ts). Seeded ENABLED
 * (see the migration) since this is tonight's live deliverable, not a staged rollout -- but the
 * emergency_disabled kill switch still works the moment someone flips that column.
 */
async function fetchBusinessProfileFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", BUSINESS_PROFILE_FLAG_KEY)
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

export async function resolveBusinessProfileFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchBusinessProfileFlagRow();
  return computeFlagTier(row, userId);
}

export async function isBusinessProfileEnabled(): Promise<boolean> {
  const tier = await resolveBusinessProfileFlagTier(null);
  return tier === "global";
}
