import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessMembership } from "../types";

type MembershipRow = {
  id: string;
  business_id: string;
  user_id: string;
  membership_role: string;
  membership_status: string;
  is_primary_owner: boolean;
  invited_by_user_id: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

const MEMBERSHIP_COLUMNS =
  "id, business_id, user_id, membership_role, membership_status, is_primary_owner, invited_by_user_id, accepted_at, revoked_at, created_at, updated_at";

function mapMembershipRow(row: MembershipRow): BusinessMembership {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    membershipRole: row.membership_role as BusinessMembership["membershipRole"],
    membershipStatus: row.membership_status as BusinessMembership["membershipStatus"],
    isPrimaryOwner: row.is_primary_owner,
    invitedByUserId: row.invited_by_user_id,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** RLS scopes this to memberships of businesses the caller is themselves an active member of. */
export async function listMembershipsForCurrentUser(client: SupabaseClient): Promise<BusinessMembership[]> {
  const { data, error } = await client.from("business_memberships").select(MEMBERSHIP_COLUMNS).eq("membership_status", "active");
  if (error || !data) return [];
  return (data as MembershipRow[]).map(mapMembershipRow);
}

export async function findActiveMembershipForCurrentUser(
  client: SupabaseClient,
  userId: string,
): Promise<BusinessMembership | null> {
  const { data, error } = await client
    .from("business_memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapMembershipRow(data as MembershipRow);
}

export async function isPrimaryOwner(client: SupabaseClient, businessId: string, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("business_memberships")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("is_primary_owner", true)
    .eq("membership_status", "active")
    .maybeSingle();
  return !error && !!data;
}

/**
 * Founding-owner creation is intentionally NOT implemented here as a standalone client-callable
 * function — business_memberships.INSERT has no client policy by design. It only ever happens
 * inside the atomic finalize RPC (Phase 12), which creates both the business and its founding
 * membership row in the same database transaction.
 */
