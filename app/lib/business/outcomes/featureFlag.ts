/**
 * Program 7 — Business Outcomes feature flags.
 * Reuses existing business_identity_flags table and computeFlagTier() pattern.
 * Default: enabled false, emergency_disabled false, pilot empty.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

export const BUSINESS_OUTCOMES_FLAG_KEY = "business_outcomes";

async function fetchOutcomesFlagRow(flagKey: string): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", flagKey)
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

export async function resolveOutcomesFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchOutcomesFlagRow(BUSINESS_OUTCOMES_FLAG_KEY);
  return computeFlagTier(row, userId);
}

export async function isOutcomesEnabled(): Promise<boolean> {
  const tier = await resolveOutcomesFlagTier(null);
  return tier === "global";
}
