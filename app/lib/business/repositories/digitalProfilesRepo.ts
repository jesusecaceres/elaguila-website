import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessDigitalProfile } from "../types";

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
 * Creation/update/delete intentionally NOT implemented as standalone client-callable functions —
 * business_digital_profiles has no client mutation policy by design, same server-only rationale
 * as contactsRepo.ts. Rows are only ever created inside finalize_business_identity_v2.
 */
