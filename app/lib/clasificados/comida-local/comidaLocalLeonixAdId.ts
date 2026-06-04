import type { SupabaseClient } from "@supabase/supabase-js";

import { allocateLeonixAdIdViaRpc } from "@/app/lib/supabase/leonixAdIdsServer";

const LEONIX_AD_ID_STRICT = /^COMIDA-(\d{4})-(\d{6})$/i;

/**
 * Next `leonix_ad_id` for a new `comida_local_public_listings` row: `COMIDA-<year>-000001`.
 * Uses Postgres `leonix_allocate_formatted` (namespace `comida_local`, prefix `COMIDA`).
 */
export async function allocateNextComidaLocalLeonixAdId(
  supabase: SupabaseClient,
  opts?: { maxProbeAttempts?: number }
): Promise<string> {
  const max = Math.max(1, Math.min(opts?.maxProbeAttempts ?? 12, 40));
  let lastErr: unknown = null;
  for (let i = 0; i < max; i += 1) {
    try {
      return await allocateLeonixAdIdViaRpc(supabase, {
        namespace: "comida_local",
        prefix: "COMIDA",
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("allocateNextComidaLocalLeonixAdId: exhausted attempts");
}

export function isComidaLocalLeonixAdIdFormat(value: string): boolean {
  return LEONIX_AD_ID_STRICT.test((value ?? "").trim());
}
