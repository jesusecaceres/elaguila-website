/**
 * Pure feature-flag tier decision logic — deliberately NOT "server-only" (it performs no I/O,
 * holds no secret) so it can be unit-tested with a plain node:assert script, matching this
 * repo's actual testing convention (confirmed: no jest/vitest; "server-only" always throws
 * outside Next's bundler context, so anything guarded by it cannot be imported from a plain
 * script at all). featureFlag.ts (server-only) imports and re-exports this.
 */
import type { BusinessIdentityFlagRow } from "./types";

export type ResolvedFlagTier = "unavailable" | "global" | "pilot" | "preview";

export function computeFlagTier(row: BusinessIdentityFlagRow | null, userId: string | null): ResolvedFlagTier {
  if (!row) return "unavailable";
  if (row.emergencyDisabled) return "unavailable";
  if (row.enabled) return "global";
  if (userId && row.pilotUserIds.includes(userId)) return "pilot";
  return "preview";
}

/**
 * Package BCO-3 test-override decision (pure — no env reads here, so it's testable without
 * mutating process.env). Returns true only when every condition holds:
 *  - not the production Vercel environment (vercelEnv !== "production");
 *  - a test-override user id is configured;
 *  - it matches the requesting user.
 * Never reads or touches business_identity_flags.pilot_user_ids — this is a wholly separate,
 * server-only, non-production-only mechanism so staging/local E2E can exercise the eligible
 * path without adding a permanent pilot user or flipping the real flag row. Never exposed as a
 * client-visible query parameter or toggle — the only inputs are server env vars and the
 * already-authenticated user id.
 */
export function shouldApplyTestOverride(params: { userId: string | null; vercelEnv: string | undefined; overrideUserId: string | undefined }): boolean {
  if (params.vercelEnv === "production") return false;
  if (!params.overrideUserId || !params.userId) return false;
  return params.overrideUserId === params.userId;
}
