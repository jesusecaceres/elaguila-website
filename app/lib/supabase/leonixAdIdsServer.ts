import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Allocates the next Leonix Ad ID via Postgres RPC (`leonix_allocate_formatted`),
 * backed by `leonix_ad_id_counters` (atomic per namespace/prefix/year).
 * Retries on transient RPC failures; unique conflicts should not occur if counters stay in sync.
 */
export async function allocateLeonixAdIdViaRpc(
  supabase: SupabaseClient,
  input: { namespace: string; prefix: string; year?: number },
  opts?: { maxAttempts?: number },
): Promise<string> {
  const year = input.year ?? new Date().getFullYear();
  const max = Math.max(1, Math.min(opts?.maxAttempts ?? 12, 40));
  let lastErr: string | null = null;
  for (let attempt = 0; attempt < max; attempt += 1) {
    const { data, error } = await supabase.rpc("leonix_allocate_formatted", {
      p_namespace: input.namespace,
      p_prefix: input.prefix,
      p_year: year,
    });
    if (!error && typeof data === "string" && data.trim()) {
      return data.trim();
    }
    lastErr = error?.message ?? (data == null ? "leonix_allocate_formatted_empty" : "leonix_allocate_formatted_invalid");
  }
  throw new Error(lastErr ?? "allocateLeonixAdIdViaRpc: exhausted");
}

export async function allocateRestauranteLeonixAdIdRpc(supabase: SupabaseClient): Promise<string> {
  return allocateLeonixAdIdViaRpc(supabase, { namespace: "restaurantes", prefix: "REST" });
}
