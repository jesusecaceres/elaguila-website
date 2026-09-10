/**
 * Package B — Opportunity feature flag. Reuses the existing business_identity_flags table and
 * computeFlagTier() pattern exactly (see creativeStudio/featureFlag.ts). Default: disabled.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export const OPPORTUNITY_FLAG_KEY = "business_creative_opportunities";

async function fetchOpportunityFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", OPPORTUNITY_FLAG_KEY)
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

export async function resolveOpportunityFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchOpportunityFlagRow();
  return computeFlagTier(row, userId);
}

export async function isOpportunityEnabled(): Promise<boolean> {
  const tier = await resolveOpportunityFlagTier(null);
  return tier === "global";
}
