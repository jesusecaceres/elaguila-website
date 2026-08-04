import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { LIVING_BOOK_FLAG_KEY } from "./constants";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

/**
 * Gate BCO-5A — server-only feature-flag reader for the `living_business_book` row in the
 * existing `business_identity_flags` table (Gate BCO-1C.1). Deliberately reuses the same table
 * and the same computeFlagTier() decision logic rather than a parallel flags system — the
 * "smallest truthful intervention." Starts disabled (emergency_disabled=false, enabled=false,
 * pilot_user_ids=[]) via the migration's seed row.
 */
async function fetchLivingBookFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", LIVING_BOOK_FLAG_KEY)
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

export async function resolveLivingBookFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchLivingBookFlagRow();
  return computeFlagTier(row, userId);
}
