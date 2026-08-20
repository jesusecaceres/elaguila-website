/**
 * LEO-1 foundation types — semantic contract between Leonix operational truth
 * and future LEO intelligence.
 *
 * This is a truth contract, not an Attention Engine / AI layer.
 * Do not mirror full Admin or Supabase row shapes here.
 */

/** Honest availability of an observation or snapshot field. */
export type LeoTruthAvailability = "LIVE" | "PARTIAL" | "UNAVAILABLE" | "UNKNOWN";

/** Where an observation was obtained (system-level, not a full DB dump). */
export type LeoSourceSystem = "admin_command_center" | "admin_flag_truth" | "leo";

export type LeoSourceType =
  | "dashboard_snapshot"
  | "leads_counts"
  | "expiring_queue"
  | "pending_review_queue"
  | "flag_classifier"
  | "access_gate"
  | "client_care_leads"
  | "client_care_support";

/**
 * Minimal provenance. Fields are optional because not every Admin source
 * exposes every dimension.
 */
export type LeoProvenance = {
  sourceSystem: LeoSourceSystem;
  sourceType: LeoSourceType;
  /** Stable helper / table / route identifier when known (never a secret). */
  sourceId?: string;
  /** ISO timestamp when the underlying Admin truth already provides one. */
  observedAt?: string;
  availability: LeoTruthAvailability;
  /**
   * Only when Admin truth already supplies a confidence-like string
   * (e.g. stored moderation confidence). Never invent AI confidence.
   */
  confidenceText?: string | null;
};

/** Small reference to a canonical entity — never a full row clone. */
export type LeoEntityRef = {
  entityType: "listing" | "lead" | "report" | "profile" | "support_ticket" | "other";
  /** Internal id when known. */
  id?: string;
  /** Public Leonix Ad ID when known. */
  leonixAdId?: string | null;
  /** Human-readable lane/source label when known (e.g. listings · rentas). */
  categorySource?: string;
};

/**
 * Normalized executive observation for future Attention Engine intake.
 * No urgency scoring, no invented reasons, no fake owner-required decisions.
 */
export type LeoObservationKind =
  | "leads_needing_reply"
  | "pending_listings_review"
  | "pending_reports"
  | "listings_expiring_soon"
  | "listings_expired"
  | "review_queue_preview"
  | "users_needing_help_proxy"
  | "snapshot_limitation"
  /** LEO-5 client-care → attention normalization kinds (deterministic). */
  | "client_care_follow_up_overdue"
  | "client_care_follow_up_due"
  | "client_care_needs_reply"
  | "client_care_waiting_on_customer"
  | "client_care_open_support"
  | "client_care_stale_active_lead"
  | "client_care_limitation";

export type LeoObservation = {
  /** Stable key within a snapshot (e.g. leads_needing_reply). */
  key: string;
  kind: LeoObservationKind;
  title: string;
  summary: string;
  availability: LeoTruthAvailability;
  provenance: LeoProvenance;
  /** Count or numeric value when the source provides one. */
  count?: number;
  /** Persisted / classified reason text only when known — never guessed. */
  reasonText?: string | null;
  /** Flag source kind when derived from Admin flag truth. */
  flagSourceKind?: string | null;
  /** True when Admin already says the item can be explained. */
  canExplain?: boolean;
  entityRef?: LeoEntityRef;
  /**
   * Soft signal only: Admin attention surfaces already treat this category
   * as operator-facing. Not Attention Engine scoring.
   */
  mayRequireOwnerAttention?: boolean;
  /** Honest limitation / unavailable explanation when truth is degraded. */
  limitationNote?: string | null;
};

export type LeoExecutiveTruthSnapshot = {
  /** When this LEO adapter assembled the snapshot (adapter clock, not inventing Admin ages). */
  assembledAt: string;
  observations: LeoObservation[];
  /**
   * Explicit non-claims so callers cannot treat this foundation as full LEO.
   */
  notClaiming: readonly string[];
  limitations: string[];
};

/* -------------------------------------------------------------------------- */
/* LEO-2 Listing Reason Chain — explainability contract (no AI, no persistence) */
/* -------------------------------------------------------------------------- */

/** Canonical evidence class for a listing flag/review explanation. */
export type LeoReasonSourceType =
  | "USER_REPORT"
  | "STORED_MODERATION_REVIEW"
  | "MANUAL_MODERATION"
  | "DETERMINISTIC_STATE"
  | "STATUS_ONLY"
  | "UNKNOWN";

/** Whether the evidence was stored historically or derived from current state. */
export type LeoEvidenceQuality = "PERSISTED" | "DERIVED" | "MISSING";

/**
 * Explanation state for a listing reason chain.
 * No AI-generated explanation state in LEO-2.
 */
export type LeoReasonExplanationState = "EXPLAINED" | "PARTIALLY_EXPLAINED" | "UNKNOWN";

/** One ordered evidence item — never a full Admin/Supabase row dump. */
export type LeoReasonEvidenceItem = {
  sourceType: LeoReasonSourceType;
  /** Stable id from canonical source when available (report/review id, etc.). */
  sourceId?: string | null;
  /** Reason code/category only when the canonical source actually stores one. */
  reasonCode?: string | null;
  /** Human-readable reason only when actually available — never guessed. */
  humanReadableReason?: string | null;
  /** Rule/trigger id only when stored (e.g. scanner keyword flag ids). */
  ruleOrTrigger?: string | null;
  /** ISO timestamp when the canonical source provides one. */
  evidenceAt?: string | null;
  /** Confidence text only when the canonical source provides it. */
  confidenceText?: string | null;
  /** Risk/recommended action only when stored on a moderation review — pass-through, not LEO scoring. */
  canonicalRiskLevel?: string | null;
  canonicalRecommendedAction?: string | null;
  quality: LeoEvidenceQuality;
  /** Table/system reference (never secrets). */
  sourceTable?: string | null;
  sourceSystem?: string | null;
  /** Honest limitation for this evidence item. */
  limitationNote?: string | null;
};

export type LeoListingReasonChain = {
  entityType: "listing";
  entityId: string;
  leonixAdId?: string | null;
  currentStatus: string | null;
  explanationState: LeoReasonExplanationState;
  /** Deterministic primary evidence per Admin precedence. */
  primaryReason: LeoReasonEvidenceItem | null;
  /** Full ordered evidence list — secondary items preserved. */
  evidence: LeoReasonEvidenceItem[];
  /** Best overall quality among evidence (MISSING if none usable). */
  provenanceQuality: LeoEvidenceQuality;
  /** True when review-like state exists but original cause was not persisted. */
  observabilityGap: boolean;
  /** Owner-facing limitation when reason is unavailable or partial. */
  limitationNote: string | null;
  /** Explicit non-claims for this chain. */
  notClaiming: readonly string[];
};

/* -------------------------------------------------------------------------- */
/* LEO-3 Living Leonix Book — durable executive memory (not chat history) */
/* -------------------------------------------------------------------------- */

export type LeoMemoryEpistemicType =
  | "system_fact"
  | "observation"
  | "owner_statement"
  | "staff_statement"
  | "inference"
  | "unknown"
  | "contradiction"
  | "historical_decision"
  | "active_decision"
  | "draft_idea";

export type LeoMemoryStatus = "active" | "superseded" | "draft";

export type LeoMemorySourceActorType = "owner" | "staff" | "system" | "leo";

export type LeoMemoryConfidence = "low" | "medium" | "high";

/** Reference to a canonical Leonix entity — never a full row copy. */
export type LeoMemorySubjectReference = {
  subjectType: string;
  subjectKey: string;
  /** Optional structured refs: system + table + id. */
  refs?: Array<{
    system: string;
    table?: string;
    id?: string;
  }>;
};

export type LeoMemorySource = {
  actorType: LeoMemorySourceActorType;
  actorId?: string | null;
  system: string;
  /** Small structured provenance only — not secrets or full payloads. */
  reference?: Record<string, unknown>;
};

/** Evidence pointer — ids/summaries only, not full emails or raw API dumps. */
export type LeoMemoryEvidenceReference = {
  kind: string;
  id?: string;
  summary?: string;
  system?: string;
  table?: string;
};

export type LeoMemoryRecord = {
  id: string;
  subject: LeoMemorySubjectReference;
  epistemicType: LeoMemoryEpistemicType;
  status: LeoMemoryStatus;
  statement: string;
  source: LeoMemorySource;
  evidence: LeoMemoryEvidenceReference[];
  confidence: LeoMemoryConfidence | null;
  supersedesId: string | null;
  contradictsIds: string[];
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
  supersededAt: string | null;
  createdByRosterId: string | null;
  createdByAuthUserId: string | null;
};

export type LeoCreateMemoryInput = {
  subject: LeoMemorySubjectReference;
  epistemicType: LeoMemoryEpistemicType;
  statement: string;
  /** Required — create fails closed without provenance. */
  source: LeoMemorySource;
  evidence?: LeoMemoryEvidenceReference[];
  confidence?: LeoMemoryConfidence | null;
  status?: Extract<LeoMemoryStatus, "active" | "draft">;
  validFrom?: string | null;
  validTo?: string | null;
  contradictsIds?: string[];
};

export type LeoSupersedeMemoryInput = {
  /** Existing memory id to supersede (must be active or draft). */
  previousId: string;
  /** Corrected statement / replacement memory. */
  replacement: LeoCreateMemoryInput;
};

export type LeoRecordContradictionInput = {
  leftId: string;
  rightId: string;
};

/* -------------------------------------------------------------------------- */
/* LEO-4 Attention Engine v0 — deterministic prioritization (no persistence) */
/* -------------------------------------------------------------------------- */

export type LeoAttentionLevel = "CRITICAL" | "HIGH" | "NORMAL" | "INFORMATIONAL";

export type LeoAttentionDisposition =
  | "OWNER_ATTENTION"
  | "STAFF_ATTENTION"
  | "DELEGABLE"
  | "INFORMATIONAL"
  | "UNKNOWN_OWNER";

export type LeoAttentionFactor = {
  /** Stable factor id (e.g. actionability, count_tier, trust_safety). */
  factor: string;
  /** Numeric contribution to the score (may be negative). */
  value: number;
  /** Short evidence label — not invented impact. */
  evidence: string;
  /** Why this factor applied. */
  reason: string;
};

export type LeoAttentionItem = {
  /** Stable attention item key (group key or observation key). */
  id: string;
  title: string;
  summary: string;
  level: LeoAttentionLevel;
  disposition: LeoAttentionDisposition;
  score: number;
  /** Observation keys that contributed. */
  sourceObservationKeys: string[];
  observationKinds: LeoObservationKind[];
  factors: LeoAttentionFactor[];
  affectedCount: number | null;
  rootCauseKey: string | null;
  /** Only when evidence supports customer-facing nature — not severity invention. */
  customerFacing: boolean;
  /** Only when evidence establishes revenue/payment signal — LEO-1 has none; always false in v0 inputs. */
  revenueEvidence: boolean;
  /** Age in hours when a known observedAt exists; otherwise null. */
  ageHours: number | null;
  limitationNote: string | null;
  /** Deterministic next step label — operational, not strategic advice. */
  recommendedNextStep: string | null;
};

export type LeoAttentionBrief = {
  generatedAt: string;
  items: LeoAttentionItem[];
  totalSignalsConsidered: number;
  groupsCreated: number;
  actionableCount: number;
  informationalCount: number;
  topN: number;
  limitations: string[];
  notClaiming: readonly string[];
};

/* -------------------------------------------------------------------------- */
/* LEO-5 Client Care Watcher — read-only observability (no outreach)         */
/* -------------------------------------------------------------------------- */

/**
 * Care signal kinds supported by current canonical evidence.
 * COMMITMENT_* omitted — Living Book has no formal commitment lifecycle yet.
 * WAITING_ON_LEONIX omitted — no explicit workflow status for that party.
 */
export type LeoClientCareSignalKind =
  | "NEEDS_REPLY"
  | "FOLLOW_UP_DUE"
  | "FOLLOW_UP_OVERDUE"
  | "WAITING_ON_CUSTOMER"
  | "OPEN_SUPPORT"
  | "STALE_ACTIVE_LEAD"
  | "INFORMATIONAL_LIMITATION"
  | "UNKNOWN";

/** Sources included in Client Care v0 (not every lead table). */
export type LeoClientCareSource = "LEAD" | "SUPPORT_TICKET";

export type LeoClientCareWaitingParty = "customer" | "leonix" | "unknown";

export type LeoClientCareSignal = {
  /** Stable key: `${source}:${entityId}:${kind}` */
  key: string;
  kind: LeoClientCareSignalKind;
  source: LeoClientCareSource;
  entityRef: LeoEntityRef;
  title: string;
  summary: string;
  status: string;
  observedAt: string;
  createdAt: string | null;
  lastContactedAt: string | null;
  followUpAt: string | null;
  ageDays: number | null;
  overdueByDays: number | null;
  waitingParty: LeoClientCareWaitingParty | null;
  /** Heuristic signals must mark this true. Explicit due dates are false. */
  isHeuristic: boolean;
  evidence: string;
  provenance: LeoProvenance;
  limitationNote: string | null;
  recommendedNextStep: string | null;
  attentionEligible: boolean;
};

export type LeoClientCareWatchResult = {
  generatedAt: string;
  signals: LeoClientCareSignal[];
  totalRecordsConsidered: number;
  limitations: string[];
  notClaiming: readonly string[];
};

/* -------------------------------------------------------------------------- */
/* LEO-6 Governance + Decision Engine v0 — classify / prepare, never execute */
/* -------------------------------------------------------------------------- */

export type LeoGovernanceLevel = "GREEN" | "YELLOW" | "RED" | "NEVER";

/**
 * Trust source for inputs that may accompany an action intent.
 * EXTERNAL_UNTRUSTED_DATA is DATA only — never authority.
 */
export type LeoTrustSource =
  | "SYSTEM_POLICY"
  | "OWNER_INSTRUCTION"
  | "TRUSTED_INTERNAL_STATE"
  | "EXTERNAL_UNTRUSTED_DATA";

export type LeoActionIntentKind =
  | "READ"
  | "ANALYZE"
  | "PREPARE_DRAFT"
  | "SEND_EXTERNAL"
  | "PUBLISH_PUBLIC"
  | "DEPLOY_PRODUCTION"
  | "MERGE_MAIN"
  | "SPEND_MONEY"
  | "CHANGE_PRICING"
  | "ACCEPT_CONTRACT"
  | "DELETE_CRITICAL_DATA"
  | "CHANGE_PERMISSIONS"
  | "REMOVE_STAFF"
  | "MODIFY_AUDIT"
  | "BYPASS_APPROVAL"
  | "SELF_GRANT_PRIVILEGE"
  | "CONCEAL_INFORMATION"
  | "REWRITE_GOVERNANCE"
  | "OTHER";

export type LeoGovernanceReason = {
  ruleId: string;
  level: LeoGovernanceLevel;
  reason: string;
  evidence: string;
  reversible: boolean | null;
  externalSideEffect: boolean;
  financialImpact: boolean;
  privilegeImpact: boolean;
  customerImpact: boolean;
  publicImpact: boolean;
  destructiveImpact: boolean;
  auditSensitivity: boolean;
};

export type LeoGovernanceAssessment = {
  actionKind: LeoActionIntentKind;
  level: LeoGovernanceLevel;
  reasons: LeoGovernanceReason[];
  approvalRequired: boolean;
  executionAllowed: boolean;
  preparationAllowed: boolean;
  reversible: boolean | null;
  blockedReason: string | null;
  assessedAt: string;
  trustSourcesConsidered: LeoTrustSource[];
  /** Structural audit preparation — not written to Admin audit in LEO-6. */
  auditPrep: {
    ruleIds: string[];
    actionKind: LeoActionIntentKind;
    level: LeoGovernanceLevel;
    reasonCodes: string[];
    assessedAt: string;
  };
  limitations: string[];
};

export type LeoDecisionRecommendationState =
  | "SUPPORTED_OPTION"
  | "INSUFFICIENT_EVIDENCE"
  | "OWNER_JUDGMENT_REQUIRED"
  | "BLOCKED_BY_GOVERNANCE";

export type LeoDecisionChallengeCategory =
  | "unsupported_assumption"
  | "unresolved_contradiction"
  | "missing_evidence"
  | "irreversible_consequence"
  | "financial_exposure"
  | "customer_impact"
  | "operational_dependency"
  | "governance_dependency"
  | "deadline_dependency"
  | "unknown_owner";

export type LeoDecisionChallenge = {
  category: LeoDecisionChallengeCategory;
  statement: string;
  evidence: string;
};

export type LeoDecisionOption = {
  id: string;
  label: string;
  /** Only when explicitly provided — never invented. */
  irreversible?: boolean;
  financialExposure?: boolean;
  customerImpact?: boolean;
  requiresOwnerApproval?: boolean;
  notes?: string;
};

export type LeoDecisionContext = {
  decisionKey: string;
  question: string;
  options: LeoDecisionOption[];
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  contradictions: string[];
  risks: string[];
  /** Explicit reversibility of the decision as a whole when known. */
  reversible: boolean | null;
  deadlineAt: string | null;
  relatedMemoryIds: string[];
  relatedAttentionItemIds: string[];
  /** Action intent under governance for this decision (defaults to ANALYZE). */
  actionKind?: LeoActionIntentKind;
  /** Trust sources present in the input bundle. */
  trustSources?: LeoTrustSource[];
  /** When true and supported by evidence/rules, may select a SUPPORTED_OPTION. */
  explicitlySupportedOptionId?: string | null;
  ownerRequiredHint?: boolean;
  nowMs?: number;
};

export type LeoDecisionBrief = {
  decisionKey: string;
  question: string;
  options: LeoDecisionOption[];
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  contradictions: string[];
  risks: string[];
  challenges: LeoDecisionChallenge[];
  reversible: boolean | null;
  governance: LeoGovernanceAssessment;
  recommendationState: LeoDecisionRecommendationState;
  supportedOptionId: string | null;
  ownerDecisionRequired: boolean;
  limitations: string[];
  generatedAt: string;
  notClaiming: readonly string[];
};

/* -------------------------------------------------------------------------- */
/* LEO-7 Conversation / Owner Retrieval — evidence-first, no generative AI    */
/* -------------------------------------------------------------------------- */

export type LeoConversationIntent =
  | "ATTENTION_OVERVIEW"
  | "CLIENT_CARE"
  | "LISTING_REASON"
  | "MEMORY_LOOKUP"
  | "DECISION_SUPPORT"
  | "CAPABILITY_OVERVIEW"
  | "CAPABILITY_GOVERNANCE"
  | "PREPARATION"
  | "PROJECT_INTELLIGENCE"
  | "COMMUNICATION_INTELLIGENCE"
  | "COMMITMENT_INTELLIGENCE"
  | "RECEIPT_INTELLIGENCE"
  | "MORNING_BRIEF"
  | "UNKNOWN";

/** LEO-13 deterministic communication question subtype. */
export type LeoCommunicationSubtype = "EMAIL" | "CALENDAR" | "MEETING_PREP";

export type LeoConversationAnswerState =
  | "ANSWERED"
  | "PARTIALLY_ANSWERED"
  | "INSUFFICIENT_EVIDENCE"
  | "UNSUPPORTED_INTENT"
  | "BLOCKED_BY_GOVERNANCE";

export type LeoConversationCitation = {
  sourceKind: string;
  sourceRef: string;
  label: string;
};

export type LeoConversationEvidence = {
  sourceKind: string;
  sourceRef: string;
  summary: string;
  availability: LeoTruthAvailability;
  provenance?: LeoProvenance;
  limitationNote?: string | null;
};

export type LeoConversationMemorySubject = {
  subjectType: string;
  subjectKey: string;
};

/**
 * Owner conversation request — no authority escalation fields allowed.
 * Client cannot submit approvalGranted / bypassGovernance / roleOverride.
 */
/** LEO-14.6: bounded client UI selection — never authority or owner identity. */
export type LeoConversationClientContext = {
  selectedCardId?: string | null;
  selectedEntityRef?: LeoConversationEntityRef | null;
  visibleCardIds?: string[];
};

/** LEO-14.6: safe focus refs returned to client (no owner ids / raw payloads). */
export type LeoConversationFocus = {
  cardId?: string;
  entityRef?: LeoConversationEntityRef;
  threadId?: string;
  messageId?: string;
  eventId?: string;
  commitmentId?: string;
  receiptId?: string;
};

/**
 * LEO-14.6 active conversation context — references only.
 * Built server-side; never accepts client-supplied authority.
 */
export type LeoActiveConversationContext = {
  sessionId: string | null;
  lastTurnId: string | null;
  lastIntent: string | null;
  focusCardId: string | null;
  focusEntityRef: LeoConversationEntityRef | null;
  focusThreadId: string | null;
  focusMessageId: string | null;
  focusEventId: string | null;
  focusCommitmentId: string | null;
  focusReceiptId: string | null;
  lastCardIds: string[];
  focus?: LeoConversationFocus;
};

export type LeoConversationPersistenceState =
  | "PERSISTED"
  | "NOT_PERSISTED_UNAVAILABLE"
  | "FAILED"
  | "SKIPPED";

export type LeoConversationRequest = {
  question: string;
  /** Optional explicit intent; validated against enum only. */
  intent?: LeoConversationIntent;
  listingId?: string | null;
  memorySubject?: LeoConversationMemorySubject | null;
  /** Explicit decision context for DECISION_SUPPORT. */
  decisionContext?: LeoDecisionContext | null;
  /** Explicit action kind for CAPABILITY_GOVERNANCE. */
  actionKind?: LeoActionIntentKind | null;
  maxResults?: number;
  /**
   * Untrusted external snippets for fact context only.
   * Cannot grant authority or lower governance.
   */
  externalUntrustedNotes?: string[];
  /** Explicit preparation kind for PREPARATION intent (LEO-8). */
  preparationKind?: LeoPreparationKind | null;
  /** Optional watcher kind for on-demand evaluation before preparation. */
  watcherKind?: LeoWatcherKind | null;
  /** Canonical entity id when preparing follow-up for a known lead/signal. */
  entityId?: string | null;
  nowMs?: number;
  /** LEO-14.6: optional durable session to resume (server-owned). */
  sessionId?: string;
  /** LEO-14.6: optional client retry key — stored in contextRefs, not a DB column. */
  clientRequestId?: string;
  /** LEO-14.6: bounded UI selection hints — never authority. */
  clientContext?: LeoConversationClientContext;
};

export type LeoConversationRouteResult = {
  intent: LeoConversationIntent;
  /** Deterministic confidence: high when explicit intent or clear pattern; low when UNKNOWN. */
  confidence: "high" | "medium" | "low";
  inferredActionKind: LeoActionIntentKind | null;
  inferredPreparationKind: LeoPreparationKind | null;
  /** LEO-13: EMAIL | CALENDAR | MEETING_PREP when intent is COMMUNICATION_INTELLIGENCE. */
  inferredCommunicationSubtype: LeoCommunicationSubtype | null;
  routeNotes: string[];
};

export type LeoConversationAnswer = {
  intent: LeoConversationIntent;
  answerState: LeoConversationAnswerState;
  summary: string;
  evidence: LeoConversationEvidence[];
  citations: LeoConversationCitation[];
  unknowns: string[];
  limitations: string[];
  governance: LeoGovernanceAssessment | null;
  suggestedNextRetrieval: string | null;
  /** Present when PREPARATION intent produced a YELLOW artifact. */
  preparedAction: LeoPreparedAction | null;
  generatedAt: string;
  notClaiming: readonly string[];
  /** LEO-10: optional structured key points from constrained synthesis. */
  keyPoints?: LeoAiKeyPoint[] | null;
  /** LEO-10: optional challenge notes (decision support). */
  challengePoints?: string[] | null;
  /** LEO-10A: safe next questions (no execution). */
  suggestedQuestions?: string[] | null;
  /** LEO-10: operational metadata — never prompt bodies or secrets. */
  aiMeta?: LeoAiAnswerMeta | null;
  /**
   * LEO-14.2: optional structured executive result cards.
   * Backwards-compatible — existing UI may ignore and keep using summary.
   */
  resultCards?: LeoResultCard[] | null;
  /**
   * LEO-14.2: optional voice-safe answer summary for future TTS/hands-free.
   * Distinct from visual card detail and from prose `summary`.
   */
  spokenSummary?: string | null;
  /** LEO-14.6: durable session id when persistence succeeded; never fabricated. */
  sessionId?: string | null;
  /** LEO-14.6: LEO turn id when assistant turn persisted. */
  turnId?: string | null;
  /** LEO-14.6: USER turn id when user turn persisted. */
  userTurnId?: string | null;
  /** LEO-14.6: whether history was saved this turn. */
  persistenceState?: LeoConversationPersistenceState;
  /** LEO-14.6: active referent/focus context for UI continuity. */
  conversationContext?: LeoActiveConversationContext | null;
};

/* -------------------------------------------------------------------------- */
/* LEO-10 Constrained executive synthesis — subordinate to evidence/governance */
/* -------------------------------------------------------------------------- */

export type LeoAiGroundingState =
  | "GROUNDED"
  | "PARTIALLY_GROUNDED"
  | "INSUFFICIENT_EVIDENCE"
  | "AI_UNAVAILABLE"
  | "AI_REJECTED"
  | "AI_SKIPPED";

export type LeoAiKeyPointKind =
  | "FACT"
  | "SYNTHESIS"
  | "CHALLENGE"
  | "RECOMMENDATION"
  | "UNKNOWN";

export type LeoAiKeyPoint = {
  kind: LeoAiKeyPointKind;
  text: string;
  evidenceIds: string[];
};

export type LeoAiFallbackReason =
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_MODEL_OUTPUT"
  | "GROUNDING_VALIDATION_FAILED"
  | "INTENT_NOT_AI_ELIGIBLE"
  | "INSUFFICIENT_EVIDENCE";

export type LeoAiReasoningMode = "AI" | "DETERMINISTIC";

export type LeoAiAnswerMeta = {
  reasoningMode: LeoAiReasoningMode;
  aiUsed: boolean;
  providerAvailable: boolean;
  providerSucceeded: boolean;
  fallbackUsed: boolean;
  fallbackReason: LeoAiFallbackReason | null;
  evidenceCount: number;
  intent: LeoConversationIntent;
  governanceLevel: LeoGovernanceLevel | null;
  groundingState: LeoAiGroundingState;
};

export type LeoAiEvidenceItem = {
  id: string;
  sourceType: string;
  statement: string;
  provenanceLabel: string;
  truthState: LeoTruthAvailability;
  canonicalRef: string | null;
  trustClass: "SYSTEM_POLICY" | "TRUSTED_INTERNAL" | "EXTERNAL_UNTRUSTED" | "OWNER_QUESTION";
};

export type LeoAiEvidenceBundle = {
  correlationKey: string;
  intent: LeoConversationIntent;
  question: string;
  facts: LeoAiEvidenceItem[];
  unknowns: string[];
  limitations: string[];
  governanceLevel: LeoGovernanceLevel | null;
  governanceSummary: string | null;
  approvalRequired: boolean;
  executionAllowed: false;
  preparationAllowed: boolean;
  listingReasonUnknown: boolean;
  consequentialDecision: boolean;
  preparedStatus: LeoPreparedActionStatus | null;
  externalUntrustedNotes: string[];
  policyNotes: readonly string[];
};

export type LeoAiReasonedAnswer = {
  summary: string;
  keyPoints: LeoAiKeyPoint[];
  evidenceReferences: string[];
  unknowns: string[];
  limitations: string[];
  challengePoints: string[];
  governanceExplanation: string | null;
  preparationDraft: string | null;
  answerConfidenceState: "GROUNDED" | "PARTIALLY_GROUNDED" | "INSUFFICIENT_EVIDENCE";
};

/* -------------------------------------------------------------------------- */
/* LEO-8 Watchers + Yellow Preparation — observe/prepare, never execute       */
/* -------------------------------------------------------------------------- */

export type LeoWatcherKind =
  | "CLIENT_CARE"
  | "ATTENTION"
  | "FOLLOW_UP"
  | "DECISION_REVIEW"
  | "MEMORY_CONTRADICTION";

export type LeoPreparationKind =
  | "FOLLOW_UP_DRAFT"
  | "MEETING_BRIEF"
  | "DECISION_BRIEF"
  | "REVIEW_PLAN"
  | "CLIENT_CARE_PLAN"
  | "INTERNAL_TASK_DRAFT";

export type LeoPreparedActionStatus = "PREPARED" | "NOT_EXECUTED";

export type LeoWatcherFindingType =
  | "signal"
  | "attention_item"
  | "follow_up"
  | "decision_review"
  | "memory_contradiction"
  | "empty";

export type LeoWatcherFinding = {
  key: string;
  watcherKind: LeoWatcherKind;
  findingType: LeoWatcherFindingType;
  title: string;
  summary: string;
  evidenceRefs: string[];
  detectedAt: string;
  affectedCount: number | null;
  attentionLevel: LeoAttentionLevel | null;
  governanceLevel: LeoGovernanceLevel | null;
  suggestedPreparationKind: LeoPreparationKind | null;
  limitations: string[];
};

export type LeoWatcherRunRequest = {
  watcherKind: LeoWatcherKind;
  maxFindings?: number;
  nowMs?: number;
  /** Required for DECISION_REVIEW. */
  decisionContext?: LeoDecisionContext | null;
  /** Optional preloaded memory rows for MEMORY_CONTRADICTION (bounded). */
  memoryRecords?: LeoMemoryRecord[] | null;
};

export type LeoWatcherRunResult = {
  watcherKind: LeoWatcherKind;
  ranAt: string;
  findings: LeoWatcherFinding[];
  totalFindings: number;
  limitations: string[];
  notClaiming: readonly string[];
};

export type LeoPreparedAction = {
  id: string;
  preparationKind: LeoPreparationKind;
  governance: LeoGovernanceAssessment;
  title: string;
  purpose: string;
  sourceEvidenceRefs: string[];
  /** Structured draft steps / outline — not a sent message. */
  draftSteps: string[];
  draftBody: string;
  targetRef: string | null;
  /** Always PREPARED + NOT_EXECUTED semantics in LEO-8. */
  status: LeoPreparedActionStatus;
  executionAllowed: false;
  limitations: string[];
  unknowns: string[];
  createdAt: string;
  notClaiming: readonly string[];
};

export type LeoPreparationRequest = {
  preparationKind: LeoPreparationKind;
  /** Optional on-demand watcher to gather findings first. */
  watcherKind?: LeoWatcherKind | null;
  entityId?: string | null;
  decisionContext?: LeoDecisionContext | null;
  /** Explicit action if caller asked to send/deploy — assessed, never executed. */
  requestedActionKind?: LeoActionIntentKind | null;
  maxFindings?: number;
  nowMs?: number;
  question?: string | null;
};

/* -------------------------------------------------------------------------- */
/* LEO-11 Universal Tool Bus — governed capability contracts                  */
/* -------------------------------------------------------------------------- */

export type LeoToolId =
  | "leo.attention.read"
  | "leo.clientCare.read"
  | "leo.reasonChain.read"
  | "leo.memory.read"
  | "leo.decision.analyze"
  | "leo.watcher.run"
  | "leo.preparation.prepare"
  | "leo.capabilities.read"
  | "leo.adminCapabilities.read"
  | "leo.project.github.read"
  | "leo.project.vercel.read"
  | "leo.project.snapshot.read"
  | "leo.email.inbox.read"
  | "leo.email.thread.read"
  | "leo.calendar.events.read"
  | "leo.communication.snapshot.read"
  | "leo.meeting.prepare";

export type LeoToolCategory =
  | "EXECUTIVE_INTELLIGENCE"
  | "CUSTOMER_CARE"
  | "MEMORY"
  | "DECISION"
  | "PREPARATION"
  | "ADMIN_OPERATIONS"
  | "DATA"
  | "PROJECT_INTELLIGENCE"
  | "COMMUNICATION"
  | "CALENDAR"
  | "FINANCE"
  | "MARKETING"
  | "RESEARCH"
  | "CREATIVE"
  | "SYSTEM_HEALTH"
  | "CUSTOM";

export type LeoToolAvailability =
  | "AVAILABLE"
  | "PARTIAL"
  | "UNAVAILABLE"
  | "NOT_CONFIGURED"
  | "NOT_VERIFIED"
  | "DISABLED";

export type LeoToolOperationMode = "READ" | "ANALYZE" | "PREPARE" | "WRITE" | "EXECUTE";

export type LeoToolDefinition = {
  id: LeoToolId;
  name: string;
  description: string;
  category: LeoToolCategory;
  operationModes: readonly LeoToolOperationMode[];
  /** Static declared availability; runtime catalog may refine (e.g. NOT_CONFIGURED). */
  availability: LeoToolAvailability;
  ownerOnly: true;
  serverOnly: true;
  /** Default governance action kind for this tool's primary mode. */
  requiredGovernanceAction: LeoActionIntentKind;
  readScopes: readonly string[];
  writeScopes: readonly string[];
  externalSystem: "NONE" | "GITHUB" | "VERCEL" | "ADMIN_OS" | "GOOGLE" | null;
  supportsPreparation: boolean;
  supportsExecution: false;
  evidenceRequirements: readonly string[];
  limitations: readonly string[];
  verified: boolean;
  version: string;
};

export type LeoToolInvocationRequest = {
  toolId: string;
  operation: LeoToolOperationMode;
  parameters?: Record<string, unknown>;
  nowMs?: number;
};

export type LeoToolReceiptStatus =
  | "SUCCEEDED"
  | "PARTIAL"
  | "BLOCKED"
  | "UNAVAILABLE"
  | "FAILED";

export type LeoToolReceipt = {
  receiptId: string;
  toolId: string;
  requestedOperation: LeoToolOperationMode;
  governanceLevel: LeoGovernanceLevel;
  startedAt: string;
  completedAt: string;
  status: LeoToolReceiptStatus;
  evidenceCount: number;
  /** Always false in LEO-11 v0. */
  writePerformed: false;
  /** Always false in LEO-11 v0. */
  externalEffectPerformed: false;
  limitations: string[];
  errorCode?: string | null;
};

export type LeoToolResult = {
  ok: boolean;
  toolId: string;
  operation: LeoToolOperationMode;
  availability: LeoToolAvailability;
  governance: LeoGovernanceAssessment;
  receipt: LeoToolReceipt;
  summary: string;
  evidence: LeoConversationEvidence[];
  data: unknown;
  unknowns: string[];
  limitations: string[];
};

export type LeoToolCatalogEntry = LeoToolDefinition & {
  runtimeAvailability: LeoToolAvailability;
};

export type LeoToolCatalog = {
  generatedAt: string;
  tools: LeoToolCatalogEntry[];
  available: LeoToolCatalogEntry[];
  partial: LeoToolCatalogEntry[];
  notConfigured: LeoToolCatalogEntry[];
  other: LeoToolCatalogEntry[];
  humanGroups: {
    label: string;
    toolIds: LeoToolId[];
    status: "available" | "partial" | "not_configured" | "unavailable";
  }[];
};

/* -------------------------------------------------------------------------- */
/* LEO-11 Project Intelligence — GitHub / Vercel evidence (read-only)         */
/* -------------------------------------------------------------------------- */

export type LeoProjectProvider = "GITHUB" | "VERCEL";

export type LeoRepositorySnapshot = {
  provider: "GITHUB";
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string | null;
  branch: string | null;
  headSha: string | null;
  headMessage: string | null;
  headCommittedAt: string | null;
  /** Safe author label when API provides it — never email. */
  headAuthor: string | null;
  mainHeadSha: string | null;
  mainHeadMessage: string | null;
  /** Ahead/behind vs main when compare API succeeds — null if unknown. */
  compareToMain: {
    aheadBy: number | null;
    behindBy: number | null;
    status: string | null;
  } | null;
  recentCommits: {
    sha: string;
    message: string;
    committedAt: string | null;
    author: string | null;
  }[];
  availability: LeoToolAvailability;
  limitations: string[];
};

export type LeoDeploymentSnapshot = {
  provider: "VERCEL";
  projectName: string | null;
  deploymentId: string;
  url: string | null;
  state: string | null;
  /** preview | production | null when unknown */
  target: string | null;
  gitBranch: string | null;
  gitCommitSha: string | null;
  commitMessage: string | null;
  createdAt: string | null;
  readyState: string | null;
  limitations: string[];
};

export type LeoProjectChangeClassification =
  | "FEATURE"
  | "FIX"
  | "MERGE"
  | "POLISH"
  | "ARCHITECTURE"
  | "DATA"
  | "SECURITY"
  | "UNKNOWN";

export type LeoProjectChange = {
  sha: string;
  message: string;
  committedAt: string | null;
  branch: string | null;
  classification: LeoProjectChangeClassification;
  provider: "GITHUB";
};

export type LeoProjectCorrelationState =
  | "BRANCH_HEAD_HAS_PREVIEW"
  | "BRANCH_HEAD_PREVIEW_READY"
  | "BRANCH_HEAD_PREVIEW_BUILDING"
  | "BRANCH_HEAD_PREVIEW_FAILED"
  | "BRANCH_HEAD_NO_PREVIEW"
  | "PRODUCTION_MATCHES_BRANCH_HEAD"
  | "PRODUCTION_DIFFERS_FROM_BRANCH_HEAD"
  | "PRODUCTION_BEHIND_BRANCH"
  | "PRODUCTION_AHEAD_OR_DIVERGED"
  | "UNKNOWN_RELATIONSHIP";

export type LeoProjectCorrelationResult = {
  states: LeoProjectCorrelationState[];
  branchHeadSha: string | null;
  latestPreview: LeoDeploymentSnapshot | null;
  latestProduction: LeoDeploymentSnapshot | null;
  previewForHead: LeoDeploymentSnapshot | null;
  productionMatchesHead: boolean | null;
  /** Only true when GitHub compare proves ahead/behind. */
  productionBehindBranch: boolean | null;
  interpretation: string;
  limitations: string[];
};

export type LeoProjectQaAdviceState =
  | "WAIT_FOR_BUILD"
  | "QA_PREVIEW"
  | "INVESTIGATE_BUILD_FAILURE"
  | "REVIEW_CHANGES"
  | "NO_PROJECT_ACTION"
  | "UNKNOWN";

export type LeoProjectQaAdvice = {
  state: LeoProjectQaAdviceState;
  summary: string;
  /** Never recommends deploy/promote/Production mutation. */
  nextStep: string;
  limitations: string[];
};

export type LeoProjectTimelineItemType =
  | "COMMIT"
  | "PREVIEW_DEPLOYMENT"
  | "PRODUCTION_DEPLOYMENT";

export type LeoProjectTimelineItem = {
  id: string;
  type: LeoProjectTimelineItemType;
  at: string | null;
  label: string;
  sha: string | null;
  readyState: string | null;
};

export type LeoProjectConfigDiagnostic = {
  github: {
    configured: boolean;
    repositoryAllowlisted: true;
    allowlistedRepo: string;
  };
  vercel: {
    configured: boolean;
    teamIdAvailable: boolean;
    projectIdAvailable: boolean;
    projectAllowlisted: true;
    allowlistedProject: string;
  };
  /** Never includes token values or prefixes. */
  requiredEnvNames: readonly string[];
};

export type LeoProjectHealthSignal = {
  kind: "DEPLOYMENT_PLATFORM_STATE";
  label: string;
  /** Platform/build state only — never "system healthy". */
  value: string;
  limitationNote: string;
};

export type LeoProjectSnapshot = {
  generatedAt: string;
  github: LeoRepositorySnapshot | null;
  vercel: {
    projectName: string | null;
    deployments: LeoDeploymentSnapshot[];
    latestPreview: LeoDeploymentSnapshot | null;
    latestProduction: LeoDeploymentSnapshot | null;
    availability: LeoToolAvailability;
    limitations: string[];
  } | null;
  correlations: {
    sha: string;
    githubBranch: string | null;
    vercelDeployments: {
      deploymentId: string;
      target: string | null;
      readyState: string | null;
    }[];
  }[];
  healthSignals: LeoProjectHealthSignal[];
  limitations: string[];
  notClaiming: readonly string[];
};

/** LEO-12 executive project brain snapshot — bounded ephemeral evidence. */
export type LeoProjectExecutiveSnapshot = {
  observedAt: string;
  repository: string;
  leoBranch: string;
  mainBranch: string | null;
  leoHead: {
    sha: string | null;
    message: string | null;
    committedAt: string | null;
    author: string | null;
  };
  mainHead: {
    sha: string | null;
    message: string | null;
  };
  latestLeoPreview: LeoDeploymentSnapshot | null;
  latestProduction: LeoDeploymentSnapshot | null;
  correlation: LeoProjectCorrelationResult;
  recentChanges: LeoProjectChange[];
  timeline: LeoProjectTimelineItem[];
  qaAdvice: LeoProjectQaAdvice;
  configurationState: LeoProjectConfigDiagnostic;
  /** Owner question used for concise question-aware summaries. */
  ownerQuestion: string | null;
  /** Legacy-compatible nested snapshot for tool adapters. */
  raw: LeoProjectSnapshot;
  limitations: string[];
  notClaiming: readonly string[];
};

/* -------------------------------------------------------------------------- */
/* LEO-13 Gmail + Calendar executive intelligence (read-only foundation)      */
/* -------------------------------------------------------------------------- */

export type LeoGoogleOAuthAvailability =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE"
  | "FAILED";

/** Server-caller OAuth result — accessToken must never be returned to UI. */
export type LeoGoogleOAuthResult = {
  availability: LeoGoogleOAuthAvailability;
  accessToken: string | null;
  expiresIn: number | null;
  errorCode: string | null;
};

/** LEO-13A-RUNTIME — sanitized OAuth diagnostic codes (never secrets). */
export type LeoGoogleOAuthDiagnosticCode =
  | "AVAILABLE"
  | "GOOGLE_NOT_CONFIGURED"
  | "GOOGLE_TOKEN_UNAUTHORIZED"
  | "GOOGLE_TOKEN_EXCHANGE_FAILED"
  | "GOOGLE_TOKEN_MISSING"
  | "GOOGLE_TOKEN_NETWORK_OR_TIMEOUT";

export type LeoGmailDiagnosticCode =
  | "AVAILABLE"
  | "GOOGLE_NOT_CONFIGURED"
  | "UNAVAILABLE_DUE_TO_OAUTH"
  | "GMAIL_API_UNAUTHORIZED"
  | "GMAIL_API_FORBIDDEN"
  | "GMAIL_API_FAILED"
  | "GMAIL_API_NETWORK_OR_TIMEOUT";

export type LeoCalendarDiagnosticCode =
  | "AVAILABLE"
  | "GOOGLE_NOT_CONFIGURED"
  | "UNAVAILABLE_DUE_TO_OAUTH"
  | "CALENDAR_API_UNAUTHORIZED"
  | "CALENDAR_API_FORBIDDEN"
  | "CALENDAR_API_FAILED"
  | "CALENDAR_API_NETWORK_OR_TIMEOUT";

/** Owner-safe Google connection diagnosis — booleans + error class codes only. */
export type LeoGoogleConnectionDiagnostic = {
  workspaceConfigured: boolean;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  refreshTokenConfigured: boolean;
  ownerEmailConfigured: boolean;
  oauth: LeoGoogleOAuthDiagnosticCode;
  gmail: LeoGmailDiagnosticCode;
  calendar: LeoCalendarDiagnosticCode;
};

export type LeoEmailReadState = "READ" | "UNREAD" | "UNKNOWN";

export type LeoEmailMessageEvidence = {
  messageId: string;
  threadId: string | null;
  sender: string | null;
  recipients: string[];
  to?: string[];
  cc?: string[];
  subject: string | null;
  receivedAt: string | null;
  snippet: string | null;
  labelIds: string[];
  readState: LeoEmailReadState;
};

export type LeoEmailThreadEvidence = {
  threadId: string;
  messages: LeoEmailMessageEvidence[];
};

export type LeoEmailTriageState =
  | "UNREAD"
  | "RECENT"
  | "POSSIBLE_REPLY_NEEDED"
  | "WAITING_ON_OWNER"
  | "WAITING_ON_OTHER"
  | "OWNER_REPLIED"
  | "INFORMATIONAL"
  | "UNKNOWN";

export type LeoEmailTriageResult = {
  messageId: string;
  threadId: string | null;
  state: LeoEmailTriageState;
  unread: boolean;
  directionProven: boolean;
  limitations: string[];
  unknowns: string[];
};

export type LeoGmailReadResult = {
  availability: LeoToolAvailability;
  messages: LeoEmailMessageEvidence[];
  ownerEmailConfigured: boolean;
  limitations: string[];
  errorCode: string | null;
};

export type LeoCalendarAttendee = {
  email: string;
  displayName: string | null;
  responseStatus: string | null;
};

export type LeoCalendarEventEvidence = {
  eventId: string;
  title: string | null;
  start: string | null;
  end: string | null;
  timezone: string | null;
  attendees: LeoCalendarAttendee[];
  organizer: string | null;
  location: string | null;
  meetingUrl: string | null;
  description: string | null;
  responseStatus: string | null;
};

export type LeoCalendarEventClassification =
  | "TODAY"
  | "UPCOMING"
  | "NEXT_MEETING"
  | "IN_PROGRESS"
  | "RECENTLY_ENDED"
  | "UNKNOWN_TIME";

export type LeoCalendarReadResult = {
  availability: LeoToolAvailability;
  events: LeoCalendarEventEvidence[];
  timeMin: string;
  timeMax: string;
  windowReadSuccessfully: boolean;
  limitations: string[];
  errorCode: string | null;
};

export type LeoCalendarIntelligenceResult = {
  nowMs: number;
  todayEvents: LeoCalendarEventEvidence[];
  tomorrowEvents: LeoCalendarEventEvidence[];
  nextEvent: LeoCalendarEventEvidence | null;
  upcomingEvents: LeoCalendarEventEvidence[];
  classified: {
    event: LeoCalendarEventEvidence;
    classification: LeoCalendarEventClassification;
    limitations: string[];
  }[];
  limitations: string[];
  unknowns: string[];
};

export type LeoMeetingRelatedEmail = {
  message: LeoEmailMessageEvidence;
  matchReason:
    | "EXACT_ATTENDEE_EMAIL"
    | "EXACT_ORGANIZER_EMAIL"
    | "STRONG_TITLE_PLUS_CORROBORATION";
  matchedEmails: string[];
};

export type LeoMeetingIntelligenceResult = {
  meeting: LeoCalendarEventEvidence | null;
  attendees: LeoCalendarAttendee[];
  relatedEmailEvidence: LeoMeetingRelatedEmail[];
  unknowns: string[];
  limitations: string[];
};

export type LeoCommunicationExecutiveSnapshot = {
  observedAt: string;
  overallAvailability: LeoToolAvailability;
  ownerQuestion: string | null;
  subtype: LeoCommunicationSubtype | null;
  gmail: {
    availability: LeoToolAvailability;
    recentMessages: LeoEmailMessageEvidence[];
    triage: LeoEmailTriageResult[];
    /** Sanitized adapter error class — never a provider body or secret. */
    errorCode: string | null;
    /** LEO-14.3: deduplicated executive conversation cards. */
    emailCards: LeoEmailResultCard[];
    executiveCounts: {
      conversations: number;
      waitingOnUs: number;
      likelyReply: number;
      needsReview: number;
      automated: number;
      informational: number;
      unknown: number;
    };
    /** Voice-safe Gmail answer summary. */
    spokenSummary: string | null;
    threadEnrichment: {
      requested: number;
      succeeded: number;
      failed: number;
      maxUniqueThreads: number;
      maxConcurrency: number;
    };
  };
  calendar: {
    availability: LeoToolAvailability;
    todayEvents: LeoCalendarEventEvidence[];
    tomorrowEvents: LeoCalendarEventEvidence[];
    nextEvent: LeoCalendarEventEvidence | null;
    upcomingEvents: LeoCalendarEventEvidence[];
    /** Sanitized adapter error class — never a provider body or secret. */
    errorCode: string | null;
  };
  /** Owner-safe runtime diagnosis for Google Workspace connection. */
  runtimeDiagnostic: LeoGoogleConnectionDiagnostic;
  configurationState: {
    configured: boolean;
    clientIdConfigured: boolean;
    clientSecretConfigured: boolean;
    refreshTokenConfigured: boolean;
    ownerEmailConfigured: boolean;
    gmailExpectedScope: boolean;
    calendarExpectedScope: boolean;
  };
  unknowns: string[];
  limitations: string[];
  notClaiming: readonly string[];
};

/* -------------------------------------------------------------------------- */
/* LEO-14.11 Morning CEO Brief — orchestrated executive start-of-day intelligence */
/* -------------------------------------------------------------------------- */

export type LeoMorningBriefPriority = "DO_NOW" | "DO_TODAY" | "WATCH" | "CAN_WAIT" | "UNKNOWN";

export type LeoMorningBriefSectionKind =
  | "ATTENTION"
  | "CLIENT_CARE"
  | "EMAIL"
  | "CALENDAR"
  | "COMMITMENTS"
  | "PREPARED_ACTIONS"
  | "PROJECTS"
  | "SYSTEM";

export type LeoMorningBriefAvailability =
  | "AVAILABLE"
  | "PARTIAL"
  | "EMPTY"
  | "UNAVAILABLE"
  | "NOT_CONFIGURED";

export type LeoMorningBriefOverallState =
  | "NEEDS_ATTENTION"
  | "LIGHT_DAY"
  | "PARTIAL_DATA"
  | "UNAVAILABLE";

export type LeoMorningBriefSection = {
  kind: LeoMorningBriefSectionKind;
  title: string;
  priority: LeoMorningBriefPriority;
  summary: string;
  count: number;
  cards: LeoResultCard[];
  evidenceRefs: string[];
  availability: LeoMorningBriefAvailability;
  limitation?: string | null;
};

export type LeoMorningBriefTopPriority = {
  rank: number;
  priority: LeoMorningBriefPriority;
  what: string;
  why: string;
  dueOrTime: string | null;
  source: string;
  safeNextAction: string | null;
  cardId: string | null;
  evidenceRef: string | null;
};

export type LeoMorningBriefCounts = {
  topPriorities: number;
  attention: number;
  clientCare: number;
  emailHighPriority: number;
  calendarToday: number;
  confirmedOverdue: number;
  confirmedDueToday: number;
  confirmedDueSoon: number;
  candidates: number;
  awaitingApproval: number;
  failed: number;
  prepared: number;
};

export type LeoMorningBrief = {
  generatedAt: string;
  timezone: string;
  overallState: LeoMorningBriefOverallState;
  headline: string;
  sections: LeoMorningBriefSection[];
  counts: LeoMorningBriefCounts;
  topPriorities: LeoMorningBriefTopPriority[];
  canWait: LeoMorningBriefTopPriority[];
  unknowns: string[];
  limitations: string[];
  spokenSummary: string;
};

/* -------------------------------------------------------------------------- */
/* LEO-14.1 Operational persistence — sessions, commitments, receipts, acks  */
/* -------------------------------------------------------------------------- */

export type LeoConversationMode = "TEXT" | "HANDS_FREE" | "LOW_ATTENTION";

export type LeoConversationLanguage = "en" | "es" | "auto";

export type LeoConversationRole = "USER" | "LEO" | "SYSTEM";

export type LeoConversationSession = {
  id: string;
  ownerAuthUserId: string;
  title: string | null;
  uiLanguage: LeoConversationLanguage;
  speechLanguage: LeoConversationLanguage;
  responseLanguage: LeoConversationLanguage;
  mode: LeoConversationMode;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type LeoConversationEntityRef = {
  system: string;
  kind: string;
  id: string;
  label?: string;
};

export type LeoConversationTurn = {
  id: string;
  sessionId: string;
  ownerAuthUserId: string;
  role: LeoConversationRole;
  /** Bounded conversational text — never full Gmail bodies or secrets. */
  boundedText: string;
  intent: string | null;
  resultCardRefs: string[];
  selectedEntityRefs: LeoConversationEntityRef[];
  receiptIds: string[];
  contextRefs: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
  archivedAt: string | null;
};

export type LeoCommitmentKind =
  | "EXPLICIT_OWNER"
  | "EXTRACTED_CANDIDATE"
  | "EXTERNAL_PARTY";

export type LeoCommitmentStatus = "OPEN" | "COMPLETED" | "CANCELLED" | "SUPERSEDED";

/** Derived only — never persisted as canonical status. */
export type LeoCommitmentDerivedDueState = "NONE" | "DUE_SOON" | "OVERDUE";

/** LEO-14.4 conversation query categories — not persisted. */
export type LeoCommitmentQueryKind =
  | "OPEN"
  | "OVERDUE"
  | "DUE_TODAY"
  | "DUE_SOON"
  | "NO_DUE_DATE"
  | "COMPLETED"
  | "CANCELLED"
  | "ALL"
  | "BY_COUNTERPARTY"
  | "BY_SOURCE"
  | "PROMISED"
  | "FORGETTING"
  | "CAN_WAIT";

export type LeoCommitmentCreationMethod =
  | "OWNER_UTTERANCE"
  | "OWNER_CONFIRM"
  | "EXTRACTED"
  | "SYSTEM";

export type LeoCommitmentCreatedBy = "owner" | "leo" | "system";

/** Reuses LeoAttentionLevel for priority consistency. */
export type LeoCommitmentPriority = LeoAttentionLevel;

export type LeoCommitment = {
  id: string;
  ownerAuthUserId: string;
  title: string;
  normalizedText: string;
  kind: LeoCommitmentKind;
  status: LeoCommitmentStatus;
  dueAt: string | null;
  timezone: string | null;
  counterparty: string | null;
  sourceType: string;
  sourceRef: Record<string, unknown>;
  provenance: Record<string, unknown>;
  evidenceAt: string | null;
  createdBy: LeoCommitmentCreatedBy;
  creationMethod: LeoCommitmentCreationMethod;
  priority: LeoCommitmentPriority;
  category: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  supersededBy: string | null;
  confidence: LeoMemoryConfidence | null;
  notes: string | null;
  relatedRefs: LeoConversationEntityRef[];
  createdAt: string;
  updatedAt: string;
};

export type LeoToolReceiptLifecycleState =
  | "REQUESTED"
  | "AUTHORIZED"
  | "PREPARED"
  | "AWAITING_APPROVAL"
  | "EXECUTED"
  | "VERIFIED"
  | "FAILED"
  | "NOT_EXECUTED"
  | "CANCELLED";

export type LeoToolReceiptApprovalState = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type LeoToolReceiptExecutionState = "NONE" | "NOT_EXECUTED" | "EXECUTED" | "FAILED";

export type LeoToolReceiptVerificationState = "NONE" | "VERIFIED" | "FAILED";

/**
 * Durable persisted receipt (leo_tool_receipts).
 * Distinct from ephemeral LeoToolReceipt on the in-memory tool bus.
 */
export type LeoDurableToolReceipt = {
  id: string;
  correlationId: string;
  toolId: string;
  actionType: string;
  actorAuthUserId: string;
  governanceLevel: LeoGovernanceLevel;
  requestedPayloadSummary: string;
  preparationRef: string | null;
  lifecycleState: LeoToolReceiptLifecycleState;
  approvalState: LeoToolReceiptApprovalState;
  executionState: LeoToolReceiptExecutionState;
  verificationState: LeoToolReceiptVerificationState;
  safeErrorClass: string | null;
  sourceRefs: LeoConversationEntityRef[];
  sessionId: string | null;
  turnId: string | null;
  requestedAt: string;
  authorizedAt: string | null;
  preparedAt: string | null;
  executedAt: string | null;
  verifiedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** ACK/DISMISS/SNOOZE — distinct from LeoAttentionDisposition (OWNER_ATTENTION etc.). */
export type LeoAttentionAckDisposition = "ACKNOWLEDGED" | "DISMISSED" | "SNOOZED";

export type LeoAttentionAck = {
  id: string;
  ownerAuthUserId: string;
  sourceKind: string;
  sourceKey: string;
  disposition: LeoAttentionAckDisposition;
  snoozeUntil: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

/* -------------------------------------------------------------------------- */
/* LEO-14.2 Executive result cards + global action contracts                  */
/* -------------------------------------------------------------------------- */

export type LeoCertainty = "PROVEN" | "LIKELY" | "POSSIBLE" | "UNKNOWN";

export type LeoResultCardKind =
  | "EMAIL"
  | "CALENDAR"
  | "CLIENT"
  | "PROJECT"
  | "COMMITMENT"
  | "BRIEF_SECTION"
  | "PREPARED_ACTION"
  | "GENERIC";

export type LeoResultSourceSystem =
  | "LEONIX"
  | "GOOGLE_GMAIL"
  | "GOOGLE_CALENDAR"
  | "GITHUB"
  | "VERCEL"
  | "LEO"
  | "UNKNOWN";

export type LeoEmailDirection = "INBOUND" | "OUTBOUND" | "UNKNOWN";

export type LeoEmailSenderClass = "HUMAN" | "AUTOMATED" | "NO_REPLY" | "UNKNOWN";

export type LeoEmailRelationshipClass =
  | "CUSTOMER"
  | "LEAD"
  | "INTERNAL"
  | "VENDOR"
  | "UNKNOWN";

export type LeoEmailAttentionLabel =
  | "NEEDS_REVIEW"
  | "LIKELY_REPLY_NEEDED"
  | "WAITING_ON_US"
  | "INFORMATIONAL"
  | "AUTOMATED"
  | "RECEIPT"
  | "SYSTEM"
  | "UNKNOWN";

export type LeoCalendarPreparationState = "NONE" | "PREPARED" | "NOT_EXECUTED";

/** Card-level derived due state — never persisted. Broader than LeoCommitmentDerivedDueState. */
export type LeoCommitmentCardDueState =
  | "OVERDUE"
  | "DUE_TODAY"
  | "DUE_SOON"
  | "FUTURE"
  | "NO_DUE_DATE";

export type LeoExecutiveActionType =
  | "OPEN_EXTERNAL"
  | "OPEN_INTERNAL"
  | "INSPECT"
  | "SUMMARIZE"
  | "PREPARE_DRAFT"
  | "PREPARE_FOLLOWUP"
  | "CREATE_COMMITMENT"
  | "ACKNOWLEDGE"
  | "DISMISS"
  | "REMIND_LATER"
  | "SHOW_TIMELINE"
  | "SHOW_EVIDENCE"
  | "COPY"
  | "CALL"
  | "WHATSAPP"
  | "EMAIL"
  | "JOIN_MEETING"
  | "OPEN_GMAIL"
  | "OPEN_CALENDAR"
  | "OPEN_GITHUB"
  | "OPEN_VERCEL";

export type LeoExecutionType =
  | "NAVIGATE"
  | "CLIENT_ONLY"
  | "PREPARE"
  | "PERSIST_INTERNAL"
  | "EXECUTE_EXTERNAL";

export type LeoActionReceiptBehavior = "NONE" | "CREATE" | "UPDATE";

export type LeoActionTargetRef = {
  system: LeoResultSourceSystem;
  entityType: string;
  id: string;
  /** Only when generated by a trusted server/pure mapper — never arbitrary email content. */
  url?: string | null;
  meta?: Record<string, string>;
};

export type LeoExecutiveAction = {
  actionId: string;
  type: LeoExecutiveActionType;
  label: string;
  iconSemantic: string;
  targetRef: LeoActionTargetRef;
  governanceLevel: LeoGovernanceLevel;
  executionType: LeoExecutionType;
  toolId: LeoToolId | null;
  enabled: boolean;
  disabledReason: string | null;
  requiresConfirmation: boolean;
  receiptBehavior: LeoActionReceiptBehavior;
};

export type LeoResultCardBase = {
  cardId: string;
  kind: LeoResultCardKind;
  /** Reuses LeoAttentionLevel for priority consistency. */
  priority: LeoAttentionLevel;
  certainty: LeoCertainty;
  title: string;
  subtitle: string | null;
  whyItMatters: string | null;
  reason: string | null;
  evidenceRefs: string[];
  sourceSystem: LeoResultSourceSystem;
  actions: LeoExecutiveAction[];
  /** Voice-safe concise line — not a dump of visual fields. */
  spokenSummary: string;
  /**
   * LEO-14.5 owner attention disposition for suppressible cards.
   * ACTIVE when no suppressing ACK/DISMISS/SNOOZE applies.
   */
  ownerAttentionDisposition?: "ACTIVE" | LeoAttentionAckDisposition | null;
};

export type LeoEmailResultCard = LeoResultCardBase & {
  kind: "EMAIL";
  messageId: string;
  threadId: string | null;
  senderDisplayName: string | null;
  senderAddress: string | null;
  subject: string | null;
  snippet: string | null;
  receivedAt: string | null;
  readState: LeoEmailReadState;
  direction: LeoEmailDirection;
  triageState: LeoEmailTriageState | null;
  senderClass: LeoEmailSenderClass;
  relationshipClass: LeoEmailRelationshipClass;
  attentionLabel: LeoEmailAttentionLabel;
  gmailOpenUrl: string | null;
};

export type LeoCalendarResultCard = LeoResultCardBase & {
  kind: "CALENDAR";
  eventId: string;
  start: string | null;
  end: string | null;
  timezone: string | null;
  durationMinutes: number | null;
  attendees: LeoCalendarAttendee[];
  organizer: string | null;
  location: string | null;
  meetingUrl: string | null;
  descriptionSummary: string | null;
  relatedEmailCardIds: string[];
  preparationState: LeoCalendarPreparationState;
};

export type LeoClientResultCard = LeoResultCardBase & {
  kind: "CLIENT";
  entityRef: LeoEntityRef;
  displayName: string;
  businessName: string | null;
  status: string;
  waitingParty: LeoClientCareWaitingParty | null;
  lastInteractionAt: string | null;
  followUpAt: string | null;
  source: LeoClientCareSource | null;
};

export type LeoProjectResultCard = LeoResultCardBase & {
  kind: "PROJECT";
  repository: string | null;
  projectName: string | null;
  branch: string | null;
  commitSha: string | null;
  commitMessage: string | null;
  deploymentId: string | null;
  deploymentUrl: string | null;
  deploymentState: string | null;
  environment: string | null;
  /** Only when evidence supports a deterministic classification; else null. */
  launchRisk: string | null;
  whatChanged: string | null;
};

export type LeoCommitmentResultCard = LeoResultCardBase & {
  kind: "COMMITMENT";
  commitmentId: string;
  commitmentKind: LeoCommitmentKind;
  status: LeoCommitmentStatus;
  dueAt: string | null;
  timezone: string | null;
  counterparty: string | null;
  category: string | null;
  sourceType: string;
  sourceRef: Record<string, unknown>;
  acknowledgedAt: string | null;
  completedAt: string | null;
  relatedRefs: LeoConversationEntityRef[];
  derivedDueState: LeoCommitmentCardDueState;
  confidence: LeoMemoryConfidence | null;
};

export type LeoPreparedActionResultCard = LeoResultCardBase & {
  kind: "PREPARED_ACTION";
  preparationId: string;
  preparationKind: LeoPreparationKind;
  preparationStatus: LeoPreparedActionStatus;
  /** Always false for prepared-only cards in LEO-14.2. */
  executionAllowed: false;
  draftBodyPreview: string | null;
  targetRef: string | null;
};

export type LeoBriefSectionResultCard = LeoResultCardBase & {
  kind: "BRIEF_SECTION";
  sectionKey: string;
  itemCount: number;
};

export type LeoGenericResultCard = LeoResultCardBase & {
  kind: "GENERIC";
};

export type LeoResultCard =
  | LeoEmailResultCard
  | LeoCalendarResultCard
  | LeoClientResultCard
  | LeoProjectResultCard
  | LeoCommitmentResultCard
  | LeoPreparedActionResultCard
  | LeoBriefSectionResultCard
  | LeoGenericResultCard;
