import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessContact } from "../types";

type ContactRow = {
  id: string;
  business_id: string;
  contact_type: string;
  value: string;
  normalized_value: string;
  preferred_channel: boolean;
  channel_kind: string | null;
  is_primary: boolean;
  label: string;
  visibility: string;
  created_at: string;
  updated_at: string;
};

const CONTACT_COLUMNS =
  "id, business_id, contact_type, value, normalized_value, preferred_channel, channel_kind, is_primary, label, visibility, created_at, updated_at";

function mapContactRow(row: ContactRow): BusinessContact {
  return {
    id: row.id,
    businessId: row.business_id,
    contactType: row.contact_type as BusinessContact["contactType"],
    value: row.value,
    normalizedValue: row.normalized_value,
    preferredChannel: row.preferred_channel,
    channelKind: row.channel_kind as BusinessContact["channelKind"],
    isPrimary: row.is_primary,
    label: row.label as BusinessContact["label"],
    visibility: row.visibility as BusinessContact["visibility"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** RLS scopes this to businesses the caller has an active membership in. */
export async function listContactsForBusiness(client: SupabaseClient, businessId: string): Promise<BusinessContact[]> {
  const { data, error } = await client.from("business_contacts").select(CONTACT_COLUMNS).eq("business_id", businessId);
  if (error || !data) return [];
  return (data as ContactRow[]).map(mapContactRow);
}

/**
 * Creation/update/delete are intentionally NOT implemented as standalone client-callable
 * functions — business_contacts has no client mutation policy by design. Contact rows are
 * only ever created inside the atomic finalize RPC (Phase 12). Post-finalization contact
 * editing is out of scope for BCO-2 (Package 3's wizard only ever writes contacts through
 * finalization; a future package would add a server-side ownership-guarded update path).
 */
