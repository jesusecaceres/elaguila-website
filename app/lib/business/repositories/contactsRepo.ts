import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessContact } from "../types";
import { queryWithSelectShrink } from "./selectShrink";

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
  capabilities: string[] | null;
  created_at: string;
  updated_at: string;
};

// Gate BCO-3R-B.2 — `capabilities` gracefully drops via queryWithSelectShrink if that migration
// hasn't been applied to this environment yet (see repositories/selectShrink.ts).
const CONTACT_COLUMNS =
  "id, business_id, contact_type, value, normalized_value, preferred_channel, channel_kind, is_primary, label, visibility, capabilities, created_at, updated_at";

function mapContactRow(row: Partial<ContactRow>): BusinessContact {
  return {
    id: row.id!,
    businessId: row.business_id!,
    contactType: row.contact_type as BusinessContact["contactType"],
    value: row.value!,
    normalizedValue: row.normalized_value!,
    preferredChannel: Boolean(row.preferred_channel),
    channelKind: (row.channel_kind ?? null) as BusinessContact["channelKind"],
    isPrimary: Boolean(row.is_primary),
    label: row.label as BusinessContact["label"],
    visibility: row.visibility as BusinessContact["visibility"],
    capabilities: (row.capabilities ?? []) as BusinessContact["capabilities"],
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

/** RLS scopes this to businesses the caller has an active membership in. */
export async function listContactsForBusiness(client: SupabaseClient, businessId: string): Promise<BusinessContact[]> {
  const { data, error } = await queryWithSelectShrink("business_contacts", CONTACT_COLUMNS, (cols) =>
    client.from("business_contacts").select(cols).eq("business_id", businessId),
  );
  if (error || !data) return [];
  return (data as Partial<ContactRow>[]).map(mapContactRow);
}

/**
 * Creation/update/delete are intentionally NOT implemented as standalone client-callable
 * functions — business_contacts has no client mutation policy by design. Contact rows are
 * only ever created inside the atomic finalize RPC (Phase 12). Post-finalization contact
 * editing is out of scope for BCO-2 (Package 3's wizard only ever writes contacts through
 * finalization; a future package would add a server-side ownership-guarded update path).
 */
