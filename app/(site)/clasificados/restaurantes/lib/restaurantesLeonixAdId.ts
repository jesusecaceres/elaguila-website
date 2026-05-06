import type { SupabaseClient } from "@supabase/supabase-js";

const LEONIX_AD_ID_STRICT = /^REST-(\d{4})-(\d{6})$/i;

/**
 * Next `leonix_ad_id` for a **new** `restaurantes_public_listings` row: `REST-<currentYear>-000001`.
 * Scans existing rows with the same year prefix; safe under contention via caller retries on unique violations.
 */
export async function allocateNextRestauranteLeonixAdId(
  supabase: SupabaseClient,
  opts?: { maxProbeAttempts?: number },
): Promise<string> {
  const maxProbe = Math.max(1, Math.min(opts?.maxProbeAttempts ?? 12, 40));
  const year = new Date().getFullYear();
  const prefix = `REST-${year}-`;

  for (let i = 0; i < maxProbe; i += 1) {
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select("leonix_ad_id")
      .like("leonix_ad_id", `${prefix}%`);
    if (error) {
      throw new Error(error.message);
    }
    let maxSeq = 0;
    for (const row of data ?? []) {
      const v = (row as { leonix_ad_id?: string | null }).leonix_ad_id;
      if (typeof v !== "string") continue;
      const m = v.trim().match(LEONIX_AD_ID_STRICT);
      if (!m) continue;
      const y = Number(m[1]);
      if (y !== year) continue;
      const seq = Number.parseInt(m[2], 10);
      if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
    }
    const candidate = `${prefix}${String(maxSeq + 1).padStart(6, "0")}`;
    const { data: clash } = await supabase
      .from("restaurantes_public_listings")
      .select("id")
      .eq("leonix_ad_id", candidate)
      .maybeSingle();
    if (!clash) return candidate;
  }

  throw new Error("allocateNextRestauranteLeonixAdId: exhausted attempts");
}

export function isRestauranteLeonixAdIdFormat(value: string): boolean {
  return LEONIX_AD_ID_STRICT.test((value ?? "").trim());
}
