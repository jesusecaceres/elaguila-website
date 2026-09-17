/**
 * Program 5 — Promise Keeper feature flag. Reuses business_identity_flags table.
 * Starts disabled via the migration's seed row.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import { PROMISE_KEEPER_FLAG_KEY } from "./constants";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

async function fetchPromiseKeeperFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", PROMISE_KEEPER_FLAG_KEY)
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

export async function resolvePromiseKeeperFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchPromiseKeeperFlagRow();
  return computeFlagTier(row, userId);
}

export async function isPromiseKeeperEnabled(): Promise<boolean> {
  const tier = await resolvePromiseKeeperFlagTier(null);
  return tier === "global";
}
