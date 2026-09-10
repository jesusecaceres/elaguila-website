import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessExternalLink } from "../types";

type ExternalLinkRow = {
  id: string;
  business_id: string;
  record_type: string;
  record_id: string;
  relationship_role: string;
  linked_by: string;
  linked_at: string;
  verified_at: string | null;
  status: string;
  notes: string | null;
};

const EXTERNAL_LINK_COLUMNS =
  "id, business_id, record_type, record_id, relationship_role, linked_by, linked_at, verified_at, status, notes";

function mapExternalLinkRow(row: ExternalLinkRow): BusinessExternalLink {
  return {
    id: row.id,
    businessId: row.business_id,
    recordType: row.record_type as BusinessExternalLink["recordType"],
    recordId: row.record_id,
    relationshipRole: row.relationship_role as BusinessExternalLink["relationshipRole"],
    linkedBy: row.linked_by,
    linkedAt: row.linked_at,
    verifiedAt: row.verified_at,
    status: row.status as BusinessExternalLink["status"],
    notes: row.notes,
  };
}

/** RLS scopes this to businesses the caller has an active membership in. */
export async function listExternalLinksForBusiness(
  client: SupabaseClient,
  businessId: string,
): Promise<BusinessExternalLink[]> {
  const { data, error } = await client
    .from("business_external_links")
    .select(EXTERNAL_LINK_COLUMNS)
    .eq("business_id", businessId);
  if (error || !data) return [];
  return (data as ExternalLinkRow[]).map(mapExternalLinkRow);
}

/**
 * Admin/LEO read path — every external record (a payment, a lead, a support
 * ticket, ...) verified-linked to one business, grouped by record type. Used to
 * prepare the future Business 360 / Global Search consumption path without
 * committing to a UI yet. Never guesses: only rows an admin explicitly linked
 * and verified appear here — nothing is matched by free-text business_name.
 */
export async function listVerifiedExternalLinksByType(
  adminClient: SupabaseClient,
  businessId: string,
): Promise<Record<string, BusinessExternalLink[]>> {
  const { data, error } = await adminClient
    .from("business_external_links")
    .select(EXTERNAL_LINK_COLUMNS)
    .eq("business_id", businessId)
    .eq("status", "verified");
  if (error || !data) return {};
  const out: Record<string, BusinessExternalLink[]> = {};
  for (const row of (data as ExternalLinkRow[]).map(mapExternalLinkRow)) {
    (out[row.recordType] ??= []).push(row);
  }
  return out;
}

/**
 * Admin-scoped only — checks whether a candidate record is already
 * verified-linked to some (possibly inaccessible-to-the-caller) business.
 * Never exposes the linked business's private data — callers must only use
 * the boolean result. Mirrors listingLinksRepo.hasVerifiedLinkForListing.
 */
export async function hasVerifiedExternalLink(
  adminClient: SupabaseClient,
  recordType: string,
  recordId: string,
): Promise<boolean> {
  const { data, error } = await adminClient
    .from("business_external_links")
    .select("id")
    .eq("record_type", recordType)
    .eq("record_id", recordId)
    .eq("status", "verified")
    .maybeSingle();
  return !error && !!data;
}

export type CreateVerifiedExternalLinkInput = {
  businessId: string;
  recordType: string;
  recordId: string;
  linkedByAuthUserId: string;
};

export type CreateVerifiedExternalLinkResult =
  | { ok: true; id: string }
  | { ok: false; error: "duplicate" | "insert_failed" };

/**
 * ADMIN-OS-01 GATE 2 — the one write path into this table. Server/admin-only (no client
 * mutation policy exists on business_external_links, matching business_listing_links).
 * Callers MUST have already confirmed the target record is real via
 * `lookupExternalRecordById` — this function never guesses or infers a link from a
 * business_name match, and never mutates the linked record itself (payments/leads/support
 * tickets are read-only from this table's point of view).
 *
 * Writes status="verified" immediately (not "pending") because the calling admin action IS
 * the verification step — an authorized staff member explicitly chose this exact record by
 * its real id, unlike business_listing_links' owner-self-claim model which needs a separate
 * staff review step afterward.
 */
export async function createVerifiedExternalLink(
  adminClient: SupabaseClient,
  input: CreateVerifiedExternalLinkInput,
): Promise<CreateVerifiedExternalLinkResult> {
  // Prevent a duplicate row for the SAME business + record (any status) — distinct from the
  // DB's own unique-when-verified index, which only guards against the same record being
  // verified-linked to two DIFFERENT businesses.
  const { data: existing } = await adminClient
    .from("business_external_links")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("record_type", input.recordType)
    .eq("record_id", input.recordId)
    .maybeSingle();
  if (existing) return { ok: false, error: "duplicate" };

  const { data, error } = await adminClient
    .from("business_external_links")
    .insert({
      business_id: input.businessId,
      record_type: input.recordType,
      record_id: input.recordId,
      relationship_role: "primary",
      linked_by: input.linkedByAuthUserId,
      status: "verified",
      verified_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    // The DB's own unique-when-verified index (record_type, record_id) WHERE status='verified'
    // is the last line of defense against linking the same record to two businesses — surface
    // that as the same honest "duplicate" outcome rather than a raw constraint-violation error.
    if (error?.code === "23505") return { ok: false, error: "duplicate" };
    return { ok: false, error: "insert_failed" };
  }
  return { ok: true, id: String((data as { id: string }).id) };
}
