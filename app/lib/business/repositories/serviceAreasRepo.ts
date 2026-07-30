import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessServiceArea } from "../types";

type ServiceAreaRow = {
  id: string;
  business_id: string;
  area_kind: string;
  raw_text: string;
  normalized_text: string;
  city_hint: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

const SERVICE_AREA_COLUMNS = "id, business_id, area_kind, raw_text, normalized_text, city_hint, is_primary, created_at, updated_at";

function mapServiceAreaRow(row: ServiceAreaRow): BusinessServiceArea {
  return {
    id: row.id,
    businessId: row.business_id,
    areaKind: row.area_kind as BusinessServiceArea["areaKind"],
    rawText: row.raw_text,
    normalizedText: row.normalized_text,
    cityHint: row.city_hint,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** RLS scopes this to businesses the caller has an active membership in. */
export async function listServiceAreasForBusiness(client: SupabaseClient, businessId: string): Promise<BusinessServiceArea[]> {
  const { data, error } = await client.from("business_service_areas").select(SERVICE_AREA_COLUMNS).eq("business_id", businessId);
  if (error || !data) return [];
  return (data as ServiceAreaRow[]).map(mapServiceAreaRow);
}

/**
 * Creation/update/delete intentionally NOT implemented as standalone client-callable functions —
 * same server-only rationale as contactsRepo.ts. Service-area rows are only ever created inside
 * the atomic finalize RPC (Phase 12).
 */
