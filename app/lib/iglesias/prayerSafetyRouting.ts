import type { PrayerModerationStatus, PrayerSafetyDecision, PrayerSafetyResult, PrayerStatus } from "./prayerTypes";
import type { PrayerVisibility } from "./prayerTaxonomy";

export type PrayerModerationRoute = {
  status: PrayerStatus;
  moderation_status: PrayerModerationStatus;
  publish: boolean;
  outcome: "PUBLISHED" | "HUMAN_REVIEW" | "PRIVATE_RECEIVED" | "CRISIS" | "DISALLOWED_HOLD";
};

export function emptySafetyResult(source: PrayerSafetyResult["source"]): PrayerSafetyResult {
  return {
    decision: "UNCERTAIN",
    reason_codes: ["AI_FAILURE"],
    risk_level: null,
    contains_private_info: false,
    contains_third_party_pii: false,
    contains_spam: false,
    contains_threat: false,
    contains_hate: false,
    contains_self_harm_signal: false,
    contains_imminent_violence_signal: false,
    source,
  };
}

export function routePrayerSafetyDecision(
  decision: PrayerSafetyDecision,
  visibility: PrayerVisibility,
): PrayerModerationRoute {
  if (decision === "HIGH_RISK") {
    return {
      status: "MODERATION_HOLD",
      moderation_status: "CRISIS_REVIEW",
      publish: false,
      outcome: "CRISIS",
    };
  }
  if (decision === "CLEARLY_DISALLOWED") {
    return {
      status: "MODERATION_HOLD",
      moderation_status: "DISALLOWED",
      publish: false,
      outcome: "DISALLOWED_HOLD",
    };
  }
  if (decision === "UNCERTAIN") {
    return {
      status: "MODERATION_HOLD",
      moderation_status: "HUMAN_REVIEW",
      publish: false,
      outcome: visibility === "PRIVATE_PRAYER_TEAM" ? "PRIVATE_RECEIVED" : "HUMAN_REVIEW",
    };
  }

  if (visibility === "PRIVATE_PRAYER_TEAM") {
    return {
      status: "OPEN",
      moderation_status: "CLEARLY_SAFE",
      publish: false,
      outcome: "PRIVATE_RECEIVED",
    };
  }

  return {
    status: "OPEN",
    moderation_status: "CLEARLY_SAFE",
    publish: true,
    outcome: "PUBLISHED",
  };
}

export function mergeSafetyResults(heuristic: PrayerSafetyResult, ai: PrayerSafetyResult | null): PrayerSafetyResult {
  if (!ai) {
    return heuristic.decision === "CLEARLY_SAFE"
      ? { ...emptySafetyResult("ai_failure"), ...heuristic, decision: "UNCERTAIN", reason_codes: [...heuristic.reason_codes, "AI_FAILURE"], source: "ai_failure" }
      : { ...heuristic, source: "heuristic" };
  }

  const rank: Record<PrayerSafetyDecision, number> = {
    CLEARLY_SAFE: 0,
    UNCERTAIN: 1,
    CLEARLY_DISALLOWED: 2,
    HIGH_RISK: 3,
  };
  const decision = rank[heuristic.decision] >= rank[ai.decision] ? heuristic.decision : ai.decision;
  return {
    decision,
    reason_codes: Array.from(new Set([...heuristic.reason_codes, ...ai.reason_codes])),
    risk_level: heuristic.risk_level === "critical" || ai.risk_level === "critical" ? "critical" : ai.risk_level ?? heuristic.risk_level,
    contains_private_info: heuristic.contains_private_info || ai.contains_private_info,
    contains_third_party_pii: heuristic.contains_third_party_pii || ai.contains_third_party_pii,
    contains_spam: heuristic.contains_spam || ai.contains_spam,
    contains_threat: heuristic.contains_threat || ai.contains_threat,
    contains_hate: heuristic.contains_hate || ai.contains_hate,
    contains_self_harm_signal: heuristic.contains_self_harm_signal || ai.contains_self_harm_signal,
    contains_imminent_violence_signal: heuristic.contains_imminent_violence_signal || ai.contains_imminent_violence_signal,
    source: "combined",
  };
}
