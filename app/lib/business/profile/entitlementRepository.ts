/**
 * Staff-Created Business Profile pipeline -- Gate 07 commercial-benefit layer.
 *
 * Trace proved no existing table represents a business-level (as opposed to listing-level or
 * owner_user_id-level) commercial grant, so business_profile_entitlements exists purely to answer
 * "is business X authorized to publish its Business Profile" for the print/digital-package-only
 * case where no category listing exists at all. It never stores a price or package name -- that
 * stays in the existing Revenue OS tables. All writes go through the service-role admin client,
 * gated by requireStaffWorkspaceWriteAccess("grant_business_profile_entitlement") at the API-route
 * layer -- matching every other Business Concierge staff write (createOwnershipClaim precedent).
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { StaffWriteActor } from "@/app/admin/_lib/businessWorkspaceAccess";
import type { BusinessProfileCommercialState, BusinessProfileEntitlement, BusinessProfileEntitlementSourceType, GrantBusinessProfileEntitlementInput } from "./types";

type EntitlementRow = {
  id: string;
  business_id: string;
  status: "active" | "scheduled" | "expired" | "revoked";
  source_type: BusinessProfileEntitlementSourceType;
  source_reference: string | null;
  starts_at: string;
  expires_at: string | null;
  granted_at: string;
  granted_by_roster_id: string | null;
  granted_by_email: string | null;
  revoked_at: string | null;
  revoked_by_roster_id: string | null;
  created_at: string;
  updated_at: string;
};

const ENTITLEMENT_COLUMNS =
  "id, business_id, status, source_type, source_reference, starts_at, expires_at, granted_at, granted_by_roster_id, granted_by_email, revoked_at, revoked_by_roster_id, created_at, updated_at";

function mapEntitlementRow(row: EntitlementRow): BusinessProfileEntitlement {
  return {
    id: row.id,
    businessId: row.business_id,
    status: row.status,
    sourceType: row.source_type,
    sourceReference: row.source_reference,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    grantedAt: row.granted_at,
    grantedByRosterId: row.granted_by_roster_id,
    grantedByEmail: row.granted_by_email,
    revokedAt: row.revoked_at,
    revokedByRosterId: row.revoked_by_roster_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBusinessProfileEntitlements(businessId: string): Promise<BusinessProfileEntitlement[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_profile_entitlements")
    .select(ENTITLEMENT_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as EntitlementRow[]).map(mapEntitlementRow);
}

/**
 * Mirrors publish_business_profile()'s own two-path check (path A: verified business_listing_links
 * joined to an active listing_package_entitlements row; path B: an active/unexpired row here) so
 * the staff panel can show the SAME truthful state the publish RPC will actually enforce, never a
 * separately-invented "is this business paid" guess.
 */
export async function resolveBusinessProfileCommercialState(businessId: string): Promise<{
  eligible: boolean;
  state: BusinessProfileCommercialState;
  via: "listing_entitlement" | "business_profile_entitlement" | null;
  liveEntitlement: BusinessProfileEntitlement | null;
}> {
  const supabase = getAdminSupabase();

  const { data: linkRows } = await supabase
    .from("business_listing_links")
    .select("listing_source, listing_id")
    .eq("business_id", businessId)
    .eq("status", "verified");

  let viaListing = false;
  if (linkRows && linkRows.length > 0) {
    for (const link of linkRows as { listing_source: string; listing_id: string }[]) {
      const { data: entitlementRow } = await supabase
        .from("listing_package_entitlements")
        .select("id, status, ends_at")
        .eq("listing_source", link.listing_source)
        .eq("listing_id", link.listing_id)
        .eq("status", "active")
        .maybeSingle();
      if (entitlementRow) {
        const endsAt = (entitlementRow as { ends_at: string | null }).ends_at;
        if (!endsAt || new Date(endsAt).getTime() > Date.now()) {
          viaListing = true;
          break;
        }
      }
    }
  }

  if (viaListing) {
    return { eligible: true, state: "active", via: "listing_entitlement", liveEntitlement: null };
  }

  const rows = await listBusinessProfileEntitlements(businessId);
  const live = rows.find(isLiveEntitlement) ?? null;
  if (live) {
    const state: BusinessProfileCommercialState = live.sourceType === "comp" || live.sourceType === "partner" ? "complimentary" : "active";
    return { eligible: true, state, via: "business_profile_entitlement", liveEntitlement: live };
  }

  const mostRecent = rows[0] ?? null;
  if (mostRecent && (mostRecent.status === "expired" || mostRecent.status === "revoked")) {
    return { eligible: false, state: "expired", via: null, liveEntitlement: mostRecent };
  }

  return { eligible: false, state: "not_purchased", via: null, liveEntitlement: null };
}

function isLiveEntitlement(e: BusinessProfileEntitlement): boolean {
  if (e.status !== "active") return false;
  if (!e.expiresAt) return true;
  return new Date(e.expiresAt).getTime() > Date.now();
}

export async function grantBusinessProfileEntitlement(
  businessId: string,
  input: GrantBusinessProfileEntitlementInput,
  actor: StaffWriteActor,
): Promise<{ ok: true; entitlement: BusinessProfileEntitlement } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_profile_entitlements")
    .insert({
      business_id: businessId,
      status: "active",
      source_type: input.sourceType,
      source_reference: input.sourceReference,
      expires_at: input.expiresAt,
      granted_by_roster_id: actor.rosterId,
      granted_by_email: actor.email,
    })
    .select(ENTITLEMENT_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, entitlement: mapEntitlementRow(data as EntitlementRow) };
}

export async function revokeBusinessProfileEntitlement(
  entitlementId: string,
  businessId: string,
  actor: StaffWriteActor,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("business_profile_entitlements")
    .select("id, status")
    .eq("id", entitlementId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "not_found" };
  if ((existing as { status: string }).status === "revoked") return { ok: false, error: "already_revoked" };

  const { error } = await supabase
    .from("business_profile_entitlements")
    .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by_roster_id: actor.rosterId })
    .eq("id", entitlementId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
