/**
 * Systemic Repair Build — Owner Claim / Handoff repository.
 *
 * Staff-side operations (create/list/revoke) go through getAdminSupabase() (service-role, bypasses
 * RLS by design) exactly like every other Business Concierge admin write — every caller must have
 * already passed requireStaffWorkspaceWriteAccess("generate_ownership_claim"). The owner-side
 * accept operation deliberately does NOT live here as an admin-client call: it must run as the
 * authenticated owner (auth.uid() inside the RPC), via the caller's own bearer-token-scoped
 * client — see app/api/business/ownership-claim/accept/route.ts.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { StaffWriteActor } from "@/app/admin/_lib/businessWorkspaceAccess";
import { generateClaimToken, hashClaimToken } from "./tokens";
import type { AcceptOwnershipClaimResult, CreateOwnershipClaimInput, OwnershipClaim, OwnershipClaimStatus } from "./types";

type OwnershipClaimRow = {
  id: string;
  business_id: string;
  intended_owner_email: string | null;
  status: OwnershipClaimStatus;
  expires_at: string;
  created_by_roster_id: string;
  created_by_auth_user_id: string;
  created_by_email: string;
  created_by_role: string;
  created_at: string;
  revoked_by_roster_id: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  accepted_by_auth_user_id: string | null;
  accepted_by_email: string | null;
  accepted_at: string | null;
  resulting_membership_id: string | null;
};

const CLAIM_COLUMNS =
  "id, business_id, intended_owner_email, status, expires_at, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at, revoked_by_roster_id, revoked_at, revoke_reason, accepted_by_auth_user_id, accepted_by_email, accepted_at, resulting_membership_id";

function mapClaimRow(row: OwnershipClaimRow): OwnershipClaim {
  const isEffectivelyExpired = row.status === "pending" && new Date(row.expires_at).getTime() <= Date.now();
  return {
    id: row.id,
    businessId: row.business_id,
    intendedOwnerEmail: row.intended_owner_email,
    status: row.status,
    expiresAt: row.expires_at,
    createdByRosterId: row.created_by_roster_id,
    createdByAuthUserId: row.created_by_auth_user_id,
    createdByEmail: row.created_by_email,
    createdByRole: row.created_by_role,
    createdAt: row.created_at,
    revokedByRosterId: row.revoked_by_roster_id,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
    acceptedByAuthUserId: row.accepted_by_auth_user_id,
    acceptedByEmail: row.accepted_by_email,
    acceptedAt: row.accepted_at,
    resultingMembershipId: row.resulting_membership_id,
    isEffectivelyExpired,
  };
}

/**
 * Creates one invitation and returns the RAW token exactly once — it is never persisted anywhere,
 * only its hash. Fails with "claim_already_pending" if this business already has a live invitation
 * (the partial unique index on business_id WHERE status='pending' is the real guarantee; this is
 * just a clean, specific error instead of a raw constraint-violation message).
 */
export async function createOwnershipClaim(
  input: CreateOwnershipClaimInput,
  actor: StaffWriteActor,
): Promise<{ ok: true; claim: OwnershipClaim; rawToken: string } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();

  const { data: existingPending } = await supabase
    .from("business_ownership_claims")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("status", "pending")
    .maybeSingle();
  if (existingPending) {
    return { ok: false, error: "claim_already_pending" };
  }

  const rawToken = generateClaimToken();
  const claimTokenHash = hashClaimToken(rawToken);

  const { data, error } = await supabase
    .from("business_ownership_claims")
    .insert({
      business_id: input.businessId,
      claim_token_hash: claimTokenHash,
      intended_owner_email: input.intendedOwnerEmail,
      created_by_roster_id: actor.rosterId,
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select(CLAIM_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  return { ok: true, claim: mapClaimRow(data as OwnershipClaimRow), rawToken };
}

export async function listOwnershipClaimsForBusiness(businessId: string): Promise<OwnershipClaim[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_ownership_claims")
    .select(CLAIM_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as OwnershipClaimRow[]).map(mapClaimRow);
}

export async function revokeOwnershipClaim(
  claimId: string,
  businessId: string,
  actor: StaffWriteActor,
  reason: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("business_ownership_claims")
    .select("id, status")
    .eq("id", claimId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "not_found" };
  if ((existing as { status: OwnershipClaimStatus }).status !== "pending") {
    return { ok: false, error: "claim_not_pending" };
  }

  const { error } = await supabase
    .from("business_ownership_claims")
    .update({
      status: "revoked",
      revoked_by_roster_id: actor.rosterId,
      revoked_at: new Date().toISOString(),
      revoke_reason: reason,
    })
    .eq("id", claimId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Owner-side redemption. `callerClient` MUST be a bearer-token-scoped client resolved from the
 * caller's own session (see app/lib/business/supabaseUserClient.ts) — never the admin client —
 * so accept_business_ownership_claim() resolves auth.uid() as the real caller, matching the exact
 * safety contract already established by finalize_business_identity_v3's userClient.rpc() call.
 */
export async function acceptOwnershipClaim(callerClient: SupabaseClient, rawToken: string): Promise<AcceptOwnershipClaimResult> {
  const claimTokenHash = hashClaimToken(rawToken);
  const { data, error } = await callerClient.rpc("accept_business_ownership_claim", { p_claim_token_hash: claimTokenHash });
  if (error) {
    const message = error.message ?? "";
    if (message.includes("claim_not_found")) return { ok: false, error: "claim_not_found" };
    if (message.includes("claim_not_pending")) return { ok: false, error: "claim_not_pending" };
    if (message.includes("claim_expired")) return { ok: false, error: "claim_expired" };
    if (message.includes("claim_email_mismatch")) return { ok: false, error: "claim_email_mismatch" };
    if (message.includes("business_already_owned")) return { ok: false, error: "business_already_owned" };
    if (message.includes("insufficient_privilege")) return { ok: false, error: "not_authenticated" };
    return { ok: false, error: "unknown_error" };
  }
  if (typeof data !== "string") return { ok: false, error: "unknown_error" };
  return { ok: true, businessId: data };
}
