/**
 * LEO-20A — Health map derivation (deterministic, no fake scores).
 */
import type {
  LeoSelfIntelligenceDimensionResult,
  LeoSelfIntelligenceHealthState,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

/**
 * Health map is the ordered dimension result list.
 * Rules are enforced in adapters; this module validates/normalizes only.
 */
export function buildLeoSelfIntelligenceHealthMap(
  dimensions: LeoSelfIntelligenceDimensionResult[],
): LeoSelfIntelligenceDimensionResult[] {
  return dimensions.map(normalizeDimensionHealth);
}

function normalizeDimensionHealth(
  d: LeoSelfIntelligenceDimensionResult,
): LeoSelfIntelligenceDimensionResult {
  // No sensor / no coverage → NOT_MEASURED (never promote to HEALTHY).
  if (d.coverage === "NONE" && d.state !== "NOT_MEASURED" && d.state !== "UNKNOWN") {
    return {
      ...d,
      state: "NOT_MEASURED",
      reason: `${d.reason} (normalized: no trustworthy sensor coverage → NOT_MEASURED).`,
      epistemic: "UNKNOWN",
      confidence: "NONE",
    };
  }

  // LEO-20C doctrine: PARTIAL coverage cannot report HEALTHY.
  if (d.state === "HEALTHY" && d.coverage === "PARTIAL") {
    return {
      ...d,
      state: "WATCH",
      reason: `${d.reason} (normalized: PARTIAL coverage cannot conclude HEALTHY).`,
      limitations: [
        ...d.limitations,
        "PARTIAL coverage forbids HEALTHY — foundations may exist without full-dimension proof.",
      ],
    };
  }

  return d;
}

export function summarizeHealthMapStates(
  healthMap: LeoSelfIntelligenceDimensionResult[],
): Record<LeoSelfIntelligenceHealthState, number> {
  const counts: Record<LeoSelfIntelligenceHealthState, number> = {
    HEALTHY: 0,
    WATCH: 0,
    NEEDS_ATTENTION: 0,
    CRITICAL: 0,
    UNKNOWN: 0,
    NOT_MEASURED: 0,
  };
  for (const d of healthMap) counts[d.state] += 1;
  return counts;
}
