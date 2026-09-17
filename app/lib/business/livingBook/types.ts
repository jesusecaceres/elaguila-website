/**
 * Gate BCO-5A — Living Business Book domain types. Mirrors
 * supabase/migrations/20260804180000_living_business_book_foundation.sql exactly.
 */

export type FactCategory =
  | "business_and_owner_goals"
  | "customers_and_market"
  | "products_and_services"
  | "operations_and_capacity"
  | "visibility_and_communication"
  | "challenges_and_readiness"
  | "other";

export type FactStatus = "active" | "superseded" | "rejected";

export type SourceClass =
  | "owner_confirmed"
  | "owner_statement"
  | "staff_observation"
  | "public_source_observation"
  | "connected_account_observation"
  | "leonix_listing_observation"
  | "imported_record"
  | "ai_inference"
  | "unknown"
  | "system_derived";

export type ConfidenceLevel = "low" | "medium" | "high";
export type FactVisibility = "owner_and_staff" | "staff_only";
export type FactSensitivity = "standard" | "sensitive";
export type ConfirmationState = "unconfirmed" | "owner_confirmed" | "owner_corrected" | "owner_rejected" | "staff_confirmed";

export type EvidenceType = "owner_statement" | "staff_note" | "public_web_page" | "social_profile" | "listing_data" | "document" | "photo" | "other";
export type ConsentState = "not_required" | "owner_provided" | "owner_declined" | "unknown";
export type RetentionState = "active" | "archived" | "deleted";

export type UnknownPriority = "low" | "medium" | "high";
export type UnknownStatus = "open" | "answered" | "not_applicable";
export type UnknownChannel = "discovery_session" | "staff_followup" | "owner_dashboard";

export type ContradictionType = "fact_vs_fact" | "fact_vs_evidence" | "evidence_vs_evidence" | "statement_vs_public_source";
export type ContradictionSeverity = "low" | "medium" | "high";
export type ContradictionStatus = "open" | "resolved";

export type CorrectionType = "owner_confirms" | "owner_corrects" | "owner_rejects" | "staff_clarification_request";
export type CorrectionStatus = "pending" | "accepted" | "declined";

export type DiscoverySessionType = "owner_questionnaire" | "staff_interview" | "meeting" | "phone_call" | "business_review" | "digital_discovery";
export type DiscoverySessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type DiscoveryConsentState = "not_required" | "owner_provided" | "owner_declined" | "pending";

export type BookAuditAction =
  | "fact_created" | "fact_updated" | "fact_confirmed" | "fact_rejected" | "fact_superseded"
  | "evidence_added" | "unknown_created" | "unknown_resolved"
  | "contradiction_created" | "contradiction_resolved"
  | "correction_requested" | "correction_accepted" | "correction_declined"
  | "discovery_started" | "discovery_answer_recorded" | "discovery_completed";

export type BookAuditRecordType =
  | "business_fact" | "business_evidence" | "business_unknown" | "business_contradiction"
  | "business_correction" | "business_discovery_session" | "business_discovery_answer";

/**
 * Every consequential Living Business Book row is authored by a real, currently-active staff
 * roster member OR the real, authenticated business owner — never a placeholder. Repository
 * functions accept this shape and only this shape; callers must build it exclusively from the
 * verified Package 4A StrictSalesActor or a verified owner session, never from caller-supplied
 * fields.
 */
export type LivingBookActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type BusinessFact = {
  id: string;
  businessId: string;
  factKey: string;
  factCategory: FactCategory;
  value: unknown;
  displayValue: string | null;
  status: FactStatus;
  sourceClass: SourceClass;
  confidence: ConfidenceLevel;
  effectiveDate: string | null;
  lastVerifiedAt: string | null;
  visibility: FactVisibility;
  sensitivity: FactSensitivity;
  confirmationState: ConfirmationState;
  supersedesFactId: string | null;
  createdActorType: "staff" | "owner";
  createdByEmail: string;
  createdByRole: string;
  updatedActorType: "staff" | "owner";
  updatedByEmail: string;
  updatedByRole: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessEvidence = {
  id: string;
  businessId: string;
  relatedFactId: string | null;
  relatedUnknownId: string | null;
  evidenceType: EvidenceType;
  sourceTitle: string;
  sourceUrl: string | null;
  capturedText: string | null;
  capturedAt: string;
  sourceDate: string | null;
  consentState: ConsentState;
  reliability: ConfidenceLevel;
  visibility: FactVisibility;
  retentionState: RetentionState;
  collectedByEmail: string;
  collectedByRole: string;
  createdAt: string;
};

export type BusinessUnknown = {
  id: string;
  businessId: string;
  questionLabel: string;
  whyItMatters: string | null;
  whoCanAnswer: string | null;
  priority: UnknownPriority;
  status: UnknownStatus;
  assignedChannel: UnknownChannel | null;
  askedAt: string | null;
  answeredAt: string | null;
  resolution: string | null;
  relatedFactId: string | null;
  visibility: FactVisibility;
  createdByEmail: string;
  createdAt: string;
};

export type BusinessContradiction = {
  id: string;
  businessId: string;
  contradictionType: ContradictionType;
  severity: ContradictionSeverity;
  status: ContradictionStatus;
  claimALabel: string;
  claimAFactId: string | null;
  claimAEvidenceId: string | null;
  claimBLabel: string;
  claimBFactId: string | null;
  claimBEvidenceId: string | null;
  resolution: string | null;
  resolvedCanonicalFactId: string | null;
  resolvedByEmail: string | null;
  resolvedAt: string | null;
  createdByEmail: string;
  createdAt: string;
};

export type BusinessCorrection = {
  id: string;
  businessId: string;
  relatedFactId: string | null;
  correctionType: CorrectionType;
  submittedValue: unknown;
  submittedDisplayValue: string | null;
  explanation: string | null;
  status: CorrectionStatus;
  decisionNote: string | null;
  decidedByEmail: string | null;
  decidedAt: string | null;
  submittedActorType: "staff" | "owner";
  submittedByEmail: string;
  createdAt: string;
};

export type BusinessDiscoverySession = {
  id: string;
  businessId: string;
  sessionType: DiscoverySessionType;
  status: DiscoverySessionStatus;
  language: "es" | "en";
  consentState: DiscoveryConsentState;
  facilitatorEmail: string | null;
  startedAt: string | null;
  completedAt: string | null;
  summary: string | null;
  nextUnansweredQuestionKey: string | null;
  createdByEmail: string;
  createdAt: string;
};

export type BusinessDiscoveryAnswer = {
  id: string;
  sessionId: string;
  businessId: string;
  questionKey: string;
  answerValue: unknown;
  answerText: string | null;
  skipped: boolean;
  createdFactId: string | null;
  createdUnknownId: string | null;
  actorEmail: string;
  answeredAt: string;
};

/** Deterministic, capability-independent counts for the staff Overview section. */
export type BookCompleteness = {
  confirmedFactCount: number;
  ownerStatementCount: number;
  openUnknownCount: number;
  unresolvedContradictionCount: number;
  staleFactCount: number;
  discoveryProgress: { answered: number; total: number } | null;
};

export type FactFreshness = "fresh" | "aging" | "stale" | "unknown";
