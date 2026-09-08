/**
 * Program 7 — Proactive Advisor feature flags.
 * Reuses existing business_identity_flags table and computeFlagTier() pattern.
 * Default: enabled false, emergency_disabled false, pilot empty.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

export const BUSINESS_PROACTIVE_ADVISOR_FLAG_KEY = "business_proactive_advisor";

async function fetchAdvisorFlagRow(flagKey: string): Promise<BusinessIdentityFlagRow | null> {
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

export async function resolveAdvisorFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchAdvisorFlagRow(BUSINESS_PROACTIVE_ADVISOR_FLAG_KEY);
  return computeFlagTier(row, userId);
}

export async function isAdvisorEnabled(): Promise<boolean> {
  const tier = await resolveAdvisorFlagTier(null);
  return tier === "global";
}
