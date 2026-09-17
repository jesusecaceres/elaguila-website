import "server-only";

import { randomBytes, createHash } from "node:crypto";

/**
 * A 256-bit, single-purpose, unguessable invitation token. Returned to the staff caller exactly
 * once at claim-creation time — never persisted anywhere. Only its hash (below) is stored.
 */
export function generateClaimToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex digest — what actually lives in business_ownership_claims.claim_token_hash. */
export function hashClaimToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim()).digest("hex");
}
