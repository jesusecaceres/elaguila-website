/**
 * LEO-22C — Deterministic failure classification.
 * Owner-selected category always wins. No model guessing.
 */

import type {
  LeoFeedbackFailureCategory,
  LeoFeedbackFailureClass,
} from "@/app/leo/_lib/leoFeedbackTypes";

const CATEGORY_TO_CLASS: Record<LeoFeedbackFailureCategory, LeoFeedbackFailureClass> = {
  WRONG_ANSWER: "REASONING",
  MISSING_INFORMATION: "RETRIEVAL",
  WRONG_NAVIGATION: "NAVIGATION",
  FAILED_NAVIGATION: "NAVIGATION",
  MISUNDERSTOOD_REQUEST: "UNDERSTANDING",
  VOICE_RECOGNITION_ERROR: "VOICE_RECOGNITION",
  VOICE_OUTPUT_ERROR: "VOICE_OUTPUT",
  RESPONSE_TOO_LONG: "PRESENTATION",
  RESPONSE_UNCLEAR: "PRESENTATION",
  OUTDATED_INFORMATION: "RETRIEVAL",
  WRONG_RECOMMENDATION: "REASONING",
  ACTION_FAILED: "ACTION",
  GOVERNANCE_ERROR: "GOVERNANCE",
  DATA_QUALITY_ERROR: "DATA_QUALITY",
  OTHER: "OTHER",
};

export function classifyLeoFeedbackFailure(
  category: LeoFeedbackFailureCategory | null | undefined,
): LeoFeedbackFailureClass | null {
  if (!category) return null;
  return CATEGORY_TO_CLASS[category];
}

export const LEO_FEEDBACK_FAILURE_LABELS: Record<LeoFeedbackFailureCategory, string> = {
  WRONG_ANSWER: "Wrong answer",
  MISSING_INFORMATION: "Missing information",
  WRONG_NAVIGATION: "Took me to the wrong place",
  FAILED_NAVIGATION: "Did not navigate",
  MISUNDERSTOOD_REQUEST: "Did not understand me",
  VOICE_RECOGNITION_ERROR: "Voice heard me wrong",
  VOICE_OUTPUT_ERROR: "Read the wrong thing",
  RESPONSE_TOO_LONG: "Response too long",
  RESPONSE_UNCLEAR: "Response unclear",
  OUTDATED_INFORMATION: "Outdated information",
  WRONG_RECOMMENDATION: "Wrong recommendation",
  ACTION_FAILED: "Requested action failed",
  GOVERNANCE_ERROR: "Approval/governance problem",
  DATA_QUALITY_ERROR: "Underlying data is wrong",
  OTHER: "Other",
};
