import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessContact, ContactType, ChannelKind } from "../types";
import { queryWithSelectShrink } from "./selectShrink";
import { normalizeContactValue } from "../normalization";

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
 * Business Information Editor (Gate 1) — the FIRST post-finalization update path for
 * business_contacts. Admin/service-role client only, staff-authorized caller
 * (requireStaffWorkspaceWriteAccess("edit_business_identity")) — no client mutation policy
 * exists on this table by design, so a user-scoped client must never reach this function.
 *
 * `business_contacts_one_primary_idx` is a SINGLE business-wide unique index on
 * `(business_id) WHERE is_primary = true` — NOT one-per-contact-type. This function never sets
 * is_primary on an update (leaves whatever the finalize wizard originally chose untouched) and
 * always inserts a NEW row with is_primary=false, so it can never violate that index. It targets
 * the SAME row `buildBusinessApplicationContext` would read as "the" phone/email/website for this
 * type (first match for that contactType+channelKind combination) — editing here and reading
 * there always agree.
 */
export async function upsertContactValueAsStaff(
  adminClient: SupabaseClient,
  businessId: string,
  contactType: ContactType,
  channelKind: ChannelKind | null,
  rawValue: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeContactValue(contactType, rawValue);
  if (!normalized) return { ok: false, error: "invalid_contact_value" };

  // Fetched in full (never more than a handful of rows per business) and filtered in JS so the
  // "which row is this field" rule stays byte-identical to buildBusinessApplicationContext's own
  // read-side logic — e.g. "the primary phone" matches ANY channel_kind that isn't 'whatsapp'
  // (including null), not only an exact null match.
  const { data: rows } = await adminClient
    .from("business_contacts")
    .select("id, channel_kind")
    .eq("business_id", businessId)
    .eq("contact_type", contactType);
  const candidates = (rows ?? []) as { id: string; channel_kind: string | null }[];
  const existing = channelKind === "whatsapp"
    ? candidates.find((r) => r.channel_kind === "whatsapp")
    : candidates.find((r) => r.channel_kind !== "whatsapp");

  const nowIso = new Date().toISOString();
  if (existing) {
    const { error } = await adminClient
      .from("business_contacts")
      .update({ value: normalized.value, normalized_value: normalized.normalizedValue, updated_at: nowIso })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await adminClient.from("business_contacts").insert({
    business_id: businessId,
    contact_type: contactType,
    value: normalized.value,
    normalized_value: normalized.normalizedValue,
    preferred_channel: false,
    channel_kind: channelKind,
    is_primary: false,
    label: "main",
    visibility: "public",
    capabilities: [],
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
