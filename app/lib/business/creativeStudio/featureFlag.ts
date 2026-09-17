/**
 * Program 6, Gate 6X — Creative Studio feature flags.
 * Reuses existing business_identity_flags table and computeFlagTier() pattern.
 * Default: enabled false, emergency_disabled false, pilot empty.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

export const CREATIVE_STUDIO_FLAG_KEY = "business_creative_studio";
export const MAGAZINE_AD_STUDIO_FLAG_KEY = "business_magazine_ad_studio";
export const SPONSORED_INSERT_STUDIO_FLAG_KEY = "business_sponsored_insert_studio";

async function fetchCreativeFlagRow(flagKey: string): Promise<BusinessIdentityFlagRow | null> {
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

export async function resolveCreativeStudioFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchCreativeFlagRow(CREATIVE_STUDIO_FLAG_KEY);
  return computeFlagTier(row, userId);
}

export async function isCreativeStudioEnabled(): Promise<boolean> {
  const tier = await resolveCreativeStudioFlagTier(null);
  return tier === "global";
}

export async function resolveMagazineAdStudioFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchCreativeFlagRow(MAGAZINE_AD_STUDIO_FLAG_KEY);
  return computeFlagTier(row, userId);
}

export async function isMagazineAdStudioEnabled(): Promise<boolean> {
  const tier = await resolveMagazineAdStudioFlagTier(null);
  return tier === "global";
}

export async function resolveSponsoredInsertStudioFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchCreativeFlagRow(SPONSORED_INSERT_STUDIO_FLAG_KEY);
  return computeFlagTier(row, userId);
}

export async function isSponsoredInsertStudioEnabled(): Promise<boolean> {
  const tier = await resolveSponsoredInsertStudioFlagTier(null);
  return tier === "global";
}
