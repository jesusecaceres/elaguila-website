import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { DIY_CONCIERGE_FLAG_KEY } from "./constants";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

/**
 * TODAY-2 — server-only feature-flag reader for the `business_diy_concierge` row in the existing
 * `business_identity_flags` table, reusing the same table and computeFlagTier() decision logic as
 * every prior gate's flag rather than a parallel flags system.
 */
async function fetchDiyConciergeFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", DIY_CONCIERGE_FLAG_KEY)
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

export async function resolveDiyConciergeFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchDiyConciergeFlagRow();
  return computeFlagTier(row, userId);
}
