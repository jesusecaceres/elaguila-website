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

  // Absence of negative evidence with PARTIAL coverage must not silently stay HEALTHY
  // without an explicit limitation — adapters already handle; keep guard.
  if (d.state === "HEALTHY" && d.coverage === "PARTIAL" && d.limitations.length === 0) {
    return {
      ...d,
      limitations: [
        ...d.limitations,
        "HEALTHY with PARTIAL coverage — not proof of complete Leonix health in this dimension.",
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
