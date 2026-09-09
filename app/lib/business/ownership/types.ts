/**
 * Systemic Repair Build — Owner Claim / Handoff. Mirrors the CHECK constraints in
 * supabase/migrations/20260909120000_business_ownership_claim_foundation.sql exactly.
 */

export type OwnershipClaimStatus = "pending" | "accepted" | "expired" | "revoked";

export type OwnershipClaim = {
  id: string;
  businessId: string;
  intendedOwnerEmail: string | null;
  status: OwnershipClaimStatus;
  expiresAt: string;
  createdByRosterId: string;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
  revokedByRosterId: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  acceptedByAuthUserId: string | null;
  acceptedByEmail: string | null;
  acceptedAt: string | null;
  resultingMembershipId: string | null;
  /** Derived, not stored: status === "pending" && expiresAt has passed. See the migration's note on
   * accept_business_ownership_claim for why "expired" is never written back to the row on the
   * read/redemption-attempt path — an expired claim can never be accepted regardless. */
  isEffectivelyExpired: boolean;
};

export type CreateOwnershipClaimInput = {
  businessId: string;
  intendedOwnerEmail: string | null;
};

export type AcceptOwnershipClaimResult =
  | { ok: true; businessId: string }
  | { ok: false; error: "claim_not_found" | "claim_not_pending" | "claim_expired" | "claim_email_mismatch" | "business_already_owned" | "not_authenticated" | "unknown_error" };
