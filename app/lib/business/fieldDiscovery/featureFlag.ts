import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFlagTier, type ResolvedFlagTier } from "../featureFlagLogic";
import { FIELD_DISCOVERY_CANVASSING_FLAG_KEY } from "./constants";
import type { BusinessIdentityFlagRow } from "../types";

export type { ResolvedFlagTier };

/**
 * Server-only feature-flag reader for the `field_discovery_canvassing` row in the existing
 * `business_identity_flags` table — reuses the exact same table and computeFlagTier() decision
 * logic as Living Book / Health Map / DIY Concierge / Stewardship, per the "smallest truthful
 * intervention" doctrine. Starts disabled via the migration's seed row.
 */
async function fetchFieldDiscoveryCanvassingFlagRow(): Promise<BusinessIdentityFlagRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("business_identity_flags")
      .select("flag_key, enabled, pilot_user_ids, emergency_disabled, notes, updated_at, updated_by")
      .eq("flag_key", FIELD_DISCOVERY_CANVASSING_FLAG_KEY)
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

export async function resolveFieldDiscoveryCanvassingFlagTier(userId: string | null): Promise<ResolvedFlagTier> {
  const row = await fetchFieldDiscoveryCanvassingFlagRow();
  return computeFlagTier(row, userId);
}

export async function isFieldDiscoveryCanvassingEnabled(): Promise<boolean> {
  const tier = await resolveFieldDiscoveryCanvassingFlagTier(null);
  return tier === "global";
}
