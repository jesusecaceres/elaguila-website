/**
 * Business Development Analyst — pure cache decision (MD <caching>). Extracted from engine.ts so
 * it is directly testable without a database or provider call. No "server-only" marker — pure
 * logic, no secret, no network/database call.
 *
 * A current (non-superseded) assessment is a valid cache hit only when its status is not 'draft'
 * (a draft may be a half-finished/failed prior attempt, never a valid cache target) AND its
 * stored input_hash matches the freshly computed hash of the current input packet AND the caller
 * did not explicitly request re-analysis. Never depends on an unstable timestamp alone.
 */
import type { GrowthAssessment } from "../types";

export function shouldUseCachedAssessment(
  current: Pick<GrowthAssessment, "status" | "inputHash"> | null,
  freshInputHash: string,
  forceReanalysis: boolean,
): boolean {
  if (forceReanalysis) return false;
  if (!current) return false;
  if (current.status === "draft") return false;
  return current.inputHash === freshInputHash;
}
