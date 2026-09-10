/**
 * LEO-22C — Owner response feedback + governed fact-correction contracts.
 * Feedback never rewrites Living Book truth. No RED execution.
 */

import type { LeoWorkspaceId } from "@/app/leo/_lib/leoWorkspaceModel";

export const LEO_FEEDBACK_POLARITIES = ["POSITIVE", "NEGATIVE"] as const;
export type LeoFeedbackPolarity = (typeof LEO_FEEDBACK_POLARITIES)[number];

export const LEO_FEEDBACK_FAILURE_CATEGORIES = [
  "WRONG_ANSWER",
  "MISSING_INFORMATION",
  "WRONG_NAVIGATION",
  "FAILED_NAVIGATION",
  "MISUNDERSTOOD_REQUEST",
  "VOICE_RECOGNITION_ERROR",
  "VOICE_OUTPUT_ERROR",
  "RESPONSE_TOO_LONG",
  "RESPONSE_UNCLEAR",
  "OUTDATED_INFORMATION",
  "WRONG_RECOMMENDATION",
  "ACTION_FAILED",
  "GOVERNANCE_ERROR",
  "DATA_QUALITY_ERROR",
  "OTHER",
] as const;
export type LeoFeedbackFailureCategory = (typeof LEO_FEEDBACK_FAILURE_CATEGORIES)[number];

export const LEO_FEEDBACK_FAILURE_CLASSES = [
  "UNDERSTANDING",
  "REASONING",
  "RETRIEVAL",
  "NAVIGATION",
  "PRESENTATION",
  "VOICE_RECOGNITION",
  "VOICE_OUTPUT",
  "ACTION",
  "GOVERNANCE",
  "DATA_QUALITY",
  "OTHER",
] as const;
export type LeoFeedbackFailureClass = (typeof LEO_FEEDBACK_FAILURE_CLASSES)[number];

export const LEO_FACT_CORRECTION_STATUSES = ["PROPOSED", "ACCEPTED", "REJECTED"] as const;
export type LeoFactCorrectionStatus = (typeof LEO_FACT_CORRECTION_STATUSES)[number];

export const LEO_FEEDBACK_PERSISTENCE_STATES = ["PERSISTED", "NOT_PERSISTED"] as const;
export type LeoFeedbackPersistenceState = (typeof LEO_FEEDBACK_PERSISTENCE_STATES)[number];

export type LeoFeedbackSourceRef = {
  sourceKind: string;
  sourceRef: string;
  label: string;
};

export type LeoFeedbackRecord = {
  id: string;
  polarity: LeoFeedbackPolarity;
  failureCategory: LeoFeedbackFailureCategory | null;
  failureClass: LeoFeedbackFailureClass | null;
  sessionId: string | null;
  leoTurnId: string | null;
  userTurnId: string | null;
  localResponseId: string;
  ownerKey: string | null;
  requestSnapshot: string | null;
  responseSnapshot: string | null;
  activeWorkspace: string | null;
  selectedCardId: string | null;
  selectedEntityRef: string | null;
  presentationIntentKind: string | null;
  ownerNote: string | null;
  expectedDestination: LeoWorkspaceId | null;
  sourceRefs: LeoFeedbackSourceRef[];
  persistenceState: LeoFeedbackPersistenceState;
  createdAt: string;
  updatedAt: string;
};

export type LeoFeedbackUpsertInput = {
  polarity: LeoFeedbackPolarity;
  failureCategory?: LeoFeedbackFailureCategory | null;
  sessionId?: string | null;
  leoTurnId?: string | null;
  userTurnId?: string | null;
  localResponseId: string;
  requestSnapshot?: string | null;
  responseSnapshot?: string | null;
  activeWorkspace?: string | null;
  selectedCardId?: string | null;
  selectedEntityRef?: string | null;
  presentationIntentKind?: string | null;
  ownerNote?: string | null;
  expectedDestination?: LeoWorkspaceId | null;
  sourceRefs?: LeoFeedbackSourceRef[];
  proposeFactCorrection?: boolean;
};

export type LeoFeedbackQualitySnapshot = {
  ratedResponses: number;
  positiveCount: number;
  negativeCount: number;
  positiveRate: number | null;
  negativeByFailureClass: Partial<Record<LeoFeedbackFailureClass, number>>;
  topNegativeCategory: LeoFeedbackFailureCategory | null;
  navigationErrorCount: number;
  voiceRecognitionErrorCount: number;
  dataQualityErrorCount: number;
  limitation: string | null;
};

export type LeoFactCorrectionProposal = {
  id: string;
  feedbackId: string | null;
  currentStatement: string | null;
  proposedStatement: string;
  sourceContext: string | null;
  status: LeoFactCorrectionStatus;
  createdAt: string;
};

export type LeoRegressionCandidate = {
  input: string;
  observed: string | null;
  expected: string | null;
  failureClass: LeoFeedbackFailureClass;
  feedbackId: string;
  eligible: true;
};
