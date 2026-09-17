import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessDigitalProfile, DigitalProfilePlatform } from "../types";

type DigitalProfileRow = {
  id: string;
  business_id: string;
  platform: string;
  handle_or_url: string;
  created_at: string;
  updated_at: string;
};

const DIGITAL_PROFILE_COLUMNS = "id, business_id, platform, handle_or_url, created_at, updated_at";

function mapDigitalProfileRow(row: DigitalProfileRow): BusinessDigitalProfile {
  return {
    id: row.id,
    businessId: row.business_id,
    platform: row.platform as BusinessDigitalProfile["platform"],
    handleOrUrl: row.handle_or_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** RLS scopes this to businesses the caller has an active membership in (Gate BCO-3R). */
export async function listDigitalProfilesForBusiness(client: SupabaseClient, businessId: string): Promise<BusinessDigitalProfile[]> {
  const { data, error } = await client.from("business_digital_profiles").select(DIGITAL_PROFILE_COLUMNS).eq("business_id", businessId);
  if (error || !data) return [];
  return (data as DigitalProfileRow[]).map(mapDigitalProfileRow);
}

/**
 * Business Information Editor (Gate 1) — the FIRST post-finalization update path for
 * business_digital_profiles. Admin/service-role client only, staff-authorized caller.
 * `handle_or_url` legitimately holds either a bare handle or a full profile URL depending on
 * platform convention (the column name itself says so), so this deliberately does NOT run it
 * through the website-domain normalizer (which would strip a real profile path like
 * `/warfitness` down to just the host) — only trims and bounds the length. One row per platform:
 * finds the existing row for (business_id, platform) and updates it, or inserts a new one.
 */
export async function upsertDigitalProfileAsStaff(
  adminClient: SupabaseClient,
  businessId: string,
  platform: DigitalProfilePlatform,
  rawHandleOrUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const value = rawHandleOrUrl.trim().slice(0, 500);
  if (!value) return { ok: false, error: "invalid_digital_profile" };

  const { data: existing } = await adminClient
    .from("business_digital_profiles")
    .select("id")
    .eq("business_id", businessId)
    .eq("platform", platform)
    .limit(1)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  if (existing) {
    const { error } = await adminClient
      .from("business_digital_profiles")
      .update({ handle_or_url: value, updated_at: nowIso })
      .eq("id", (existing as { id: string }).id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await adminClient.from("business_digital_profiles").insert({
    business_id: businessId,
    platform,
    handle_or_url: value,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
