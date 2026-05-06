import type { SupabaseClient } from "@supabase/supabase-js";

import { allocateRestauranteLeonixAdIdRpc } from "@/app/lib/supabase/leonixAdIdsServer";

const LEONIX_AD_ID_STRICT = /^REST-(\d{4})-(\d{6})$/i;

/**
 * Next `leonix_ad_id` for a **new** `restaurantes_public_listings` row: `REST-<year>-000001`.
 * Uses Postgres `leonix_allocate_formatted` + counter table (aligned with BEFORE INSERT trigger).
 */
export async function allocateNextRestauranteLeonixAdId(
  supabase: SupabaseClient,
  opts?: { maxProbeAttempts?: number },
): Promise<string> {
  const max = Math.max(1, Math.min(opts?.maxProbeAttempts ?? 12, 40));
  let lastErr: unknown = null;
  for (let i = 0; i < max; i += 1) {
    try {
      return await allocateRestauranteLeonixAdIdRpc(supabase);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("allocateNextRestauranteLeonixAdId: exhausted attempts");
}

export function isRestauranteLeonixAdIdFormat(value: string): boolean {
  return LEONIX_AD_ID_STRICT.test((value ?? "").trim());
}
