/**
 * LEO-20C — Thin Self-Intelligence sensor type contract.
 * Types only — not a registry service, database, or persistence layer.
 */

export const LEO_SELF_INTELLIGENCE_SENSOR_AVAILABILITY = [
  "AVAILABLE",
  "PARTIAL",
  "UNAVAILABLE",
  "UNKNOWN",
] as const;

export type LeoSelfIntelligenceSensorAvailability =
  (typeof LEO_SELF_INTELLIGENCE_SENSOR_AVAILABILITY)[number];

export const LEO_SELF_INTELLIGENCE_SENSOR_COVERAGE = [
  "COMPLETE",
  "PARTIAL",
  "MINIMAL",
  "NONE",
  "UNKNOWN",
] as const;

export type LeoSelfIntelligenceSensorCoverage =
  (typeof LEO_SELF_INTELLIGENCE_SENSOR_COVERAGE)[number];

export type LeoSelfIntelligenceSensorResult = {
  sensorId: string;
  dimension: string;
  availability: LeoSelfIntelligenceSensorAvailability;
  coverage: LeoSelfIntelligenceSensorCoverage;
  freshness: "CURRENT" | "AGING" | "STALE" | "UNKNOWN";
  evidenceRefs: string[];
  measurementTypes: string[];
  limitations: string[];
  sourceSystem: string;
  lastObservedAt: string | null;
  epistemic: "KNOWN" | "CONFIRMED" | "INFERRED" | "UNKNOWN";
  confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
};
