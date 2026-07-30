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
