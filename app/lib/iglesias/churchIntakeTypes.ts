export const CHURCH_INTAKE_DECISIONS = ["AUTO_PUBLISH", "HUMAN_REVIEW", "BLOCK"] as const;
export type ChurchIntakeDecision = (typeof CHURCH_INTAKE_DECISIONS)[number];

export const AUTO_PUBLISH_MIN_CONFIDENCE = 0.88;
export const AUTO_PUBLISH_MIN_IDENTITY = 0.82;
export const AUTO_PUBLISH_MIN_SAFETY = 0.88;

export type ChurchIntakeResult = {
  decision: ChurchIntakeDecision;
  confidence: number;
  reasons: string[];
  riskSignals: string[];
  identityConfidence: number;
  safetyConfidence: number;
  attentionFields: string[];
  source: "deterministic" | "ai_gateway" | "ai_unavailable" | "combined";
};

export type ChurchDuplicateCandidate = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  approval_status: string;
};

export function isChurchIntakeDecision(value: string): value is ChurchIntakeDecision {
  return (CHURCH_INTAKE_DECISIONS as readonly string[]).includes(value);
}

export function clampConfidence(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
