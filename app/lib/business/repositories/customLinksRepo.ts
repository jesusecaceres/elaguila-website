import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessCustomLink } from "../types";

type CustomLinkRow = {
  id: string;
  business_id: string;
  link_type: string;
  custom_label: string | null;
  display_url: string;
  normalized_url: string;
  visibility: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const CUSTOM_LINK_COLUMNS = "id, business_id, link_type, custom_label, display_url, normalized_url, visibility, sort_order, created_at, updated_at";

function mapCustomLinkRow(row: CustomLinkRow): BusinessCustomLink {
  return {
    id: row.id,
    businessId: row.business_id,
    linkType: row.link_type as BusinessCustomLink["linkType"],
    customLabel: row.custom_label,
    displayUrl: row.display_url,
    normalizedUrl: row.normalized_url,
    visibility: row.visibility as BusinessCustomLink["visibility"],
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * RLS scopes this to businesses the caller has an active membership in. Gate BCO-3R-B.2 — this
 * whole table is new; if the migration hasn't been applied to a given environment yet, the
 * select simply errors and this returns an empty list (same fail-open convention already used by
 * listDigitalProfilesForBusiness) rather than breaking the completed-Identity read path.
 */
export async function listCustomLinksForBusiness(client: SupabaseClient, businessId: string): Promise<BusinessCustomLink[]> {
  const { data, error } = await client.from("business_custom_links").select(CUSTOM_LINK_COLUMNS).eq("business_id", businessId).order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as CustomLinkRow[]).map(mapCustomLinkRow);
}

/**
 * Creation/update/delete intentionally NOT implemented as standalone client-callable functions —
 * business_custom_links has no client mutation policy by design, same server-only rationale as
 * business_contacts/business_digital_profiles. Rows are only ever created inside
 * finalize_business_identity_v3.
 */
