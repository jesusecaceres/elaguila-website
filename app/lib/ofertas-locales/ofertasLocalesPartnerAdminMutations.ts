import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function nullableUuid(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

export async function upsertOfertaLocalPartnerOrganization(input: {
  supabase: SupabaseClient;
  id?: string | null;
  displayName: string;
  partnerType?: string;
  pickupLocationEligible?: boolean;
  internalNotes?: string | null;
  adminUserId: string;
}) {
  const now = new Date().toISOString();
  const row = {
    display_name: input.displayName.trim(),
    partner_type: input.partnerType ?? "magazine_pickup_partner",
    pickup_location_eligible: input.pickupLocationEligible === true,
    internal_notes: input.internalNotes?.trim() || null,
    updated_at: now,
  };
  if (!row.display_name) return { ok: false as const, error: "display_name_required" };
  if (input.id?.trim()) {
    const { error } = await input.supabase
      .from("ofertas_local_partner_organizations")
      .update(row)
      .eq("id", input.id.trim());
    return error ? { ok: false as const, error: "partner_update_failed", detail: error.message } : { ok: true as const };
  }
  const { error } = await input.supabase
    .from("ofertas_local_partner_organizations")
    .insert({ ...row, created_at: now });
  return error ? { ok: false as const, error: "partner_insert_failed", detail: error.message } : { ok: true as const };
}

export async function setOfertaLocalPartnerVerification(input: {
  supabase: SupabaseClient;
  partnerOrganizationId: string;
  adminUserId: string;
  verified: boolean;
}) {
  const now = new Date().toISOString();
  const { error } = await input.supabase
    .from("ofertas_local_partner_organizations")
    .update({
      verification_status: input.verified ? "verified" : "revoked",
      verified_at: input.verified ? now : null,
      verified_by: input.verified ? nullableUuid(input.adminUserId) : null,
      updated_at: now,
    })
    .eq("id", input.partnerOrganizationId);
  return error ? { ok: false as const, error: "partner_verification_failed", detail: error.message } : { ok: true as const };
}

export async function setOfertaLocalPartnerOperationalStatus(input: {
  supabase: SupabaseClient;
  partnerOrganizationId: string;
  status: "active" | "suspended" | "expired";
  reason?: string | null;
}) {
  const now = new Date().toISOString();
  const { error } = await input.supabase
    .from("ofertas_local_partner_organizations")
    .update({
      operational_status: input.status,
      suspended_at: input.status === "suspended" ? now : null,
      suspension_reason: input.reason?.trim() || null,
      updated_at: now,
    })
    .eq("id", input.partnerOrganizationId);
  return error ? { ok: false as const, error: "partner_status_failed", detail: error.message } : { ok: true as const };
}

export async function assignOfertaLocalPartnerCourtesy(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  partnerOrganizationId: string;
  productKey: string;
  courtesyStartsAt?: string | null;
  courtesyEndsAt?: string | null;
  placementPriority?: number;
  badgeEnabled?: boolean;
  highlightedPlacementEnabled?: boolean;
  pickupVisibilityEnabled?: boolean;
  reason?: string | null;
  adminUserId: string;
}) {
  const now = new Date().toISOString();
  const { error: suspendExisting } = await input.supabase
    .from("ofertas_local_partner_assignments")
    .update({ assignment_status: "revoked", revoked_at: now, revoked_by: nullableUuid(input.adminUserId), revoked_reason: "Replaced by newer assignment", updated_at: now })
    .eq("oferta_local_id", input.ofertaLocalId)
    .eq("assignment_status", "active");
  if (suspendExisting) return { ok: false as const, error: "existing_assignment_revoke_failed", detail: suspendExisting.message };

  const { data, error } = await input.supabase
    .from("ofertas_local_partner_assignments")
    .insert({
      oferta_local_id: input.ofertaLocalId,
      partner_organization_id: input.partnerOrganizationId,
      courtesy_product_key: input.productKey,
      courtesy_starts_at: input.courtesyStartsAt || now,
      courtesy_ends_at: input.courtesyEndsAt || null,
      placement_priority: Math.max(0, Math.min(100, input.placementPriority ?? 0)),
      badge_enabled: input.badgeEnabled === true,
      highlighted_placement_enabled: input.highlightedPlacementEnabled === true,
      pickup_visibility_enabled: input.pickupVisibilityEnabled === true,
      assignment_reason: input.reason?.trim() || null,
      created_by: nullableUuid(input.adminUserId),
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error || !data?.id) return { ok: false as const, error: "partner_assignment_failed", detail: error?.message };

  const { error: parentError } = await input.supabase
    .from("ofertas_locales")
    .update({
      partner_assignment_id: data.id,
      commercial_eligibility_source: "partner_courtesy",
      updated_at: now,
    })
    .eq("id", input.ofertaLocalId);
  if (parentError) return { ok: false as const, error: "parent_partner_link_failed", detail: parentError.message };

  return { ok: true as const, assignmentId: String(data.id) };
}

export async function revokeOfertaLocalPartnerAssignment(input: {
  supabase: SupabaseClient;
  assignmentId: string;
  adminUserId: string;
  reason: string;
}) {
  const now = new Date().toISOString();
  const { error } = await input.supabase
    .from("ofertas_local_partner_assignments")
    .update({
      assignment_status: "revoked",
      revoked_at: now,
      revoked_by: nullableUuid(input.adminUserId),
      revoked_reason: input.reason.trim().slice(0, 1000),
      updated_at: now,
    })
    .eq("id", input.assignmentId);
  return error ? { ok: false as const, error: "partner_assignment_revoke_failed", detail: error.message } : { ok: true as const };
}
