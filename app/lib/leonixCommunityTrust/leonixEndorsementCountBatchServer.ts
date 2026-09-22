import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { LeonixEndorsementTargetType } from "./leonixEndorsementRegistry";
import { aggregateEndorsementCounts, LEONIX_ENDORSEMENT_VOTES_TABLE } from "./leonixEndorsementCountBatch";

export async function fetchLeonixEndorsementCountsByTargets(input: {
  targetType: LeonixEndorsementTargetType;
  ids: readonly string[];
}): Promise<Map<string, number>> {
  const keys = [...new Set(input.ids.map((k) => k.trim()).filter(Boolean))];
  const empty = aggregateEndorsementCounts([], keys);
  if (keys.length === 0 || !isSupabaseAdminConfigured()) return empty;
  try {
    const supabase = getAdminSupabase();
    const collected: Array<{ target_id?: string | null }> = [];
    const chunkSize = 120;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from(LEONIX_ENDORSEMENT_VOTES_TABLE)
        .select("target_id")
        .eq("target_type", input.targetType)
        .in("target_id", chunk);
      if (error) continue;
      collected.push(...((data ?? []) as Array<{ target_id?: string | null }>));
    }
    return aggregateEndorsementCounts(collected, keys);
  } catch {
    return empty;
  }
}
