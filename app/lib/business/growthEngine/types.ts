/**
 * Business Development & Growth Engine — Gate A domain types.
 * Extends (never duplicates) Living Business Book, Health Map, Recommendations, Opportunities
 * (business_creative_opportunities), Creative Studio (business_creative_jobs), Promise Keeper
 * (business_commitments). Every cross-domain reference here is an id string pointing at the
 * existing canonical table — never a copy of its state.
 */

// ---------------------------------------------------------------------------------------------
// Shared actor shape — matches the exact convention already used by OpportunityActor,
// AiResearchActor, FieldDiscoveryActor, etc. Structurally compatible with StaffWriteActor.
// ---------------------------------------------------------------------------------------------
export type GrowthEngineActor =
  | { type: "staff"; rosterId: string; authUserId: string; role: string }
  | { type: "owner"; authUserId: string; role: string }
  | { type: "system"; role: string };

// ---------------------------------------------------------------------------------------------
// Assessment (Section A, MD §3.1 / §19)
// ---------------------------------------------------------------------------------------------
export type GrowthAssessmentStatus = "draft" | "needs_review" | "reviewed" | "needs_correction" | "rejected" | "superseded";

/**
 * The three review outcomes an operator can record against a `needs_review` assessment (Gate D).
 * "accepted" maps to status 'reviewed'; the other two preserve the draft as historical, non-working
 * guidance with a reviewer + note, and require a fresh re-analysis (a new version) before the
 * business can be reviewed again — re-analyzing never silently discards the corrected/rejected
 * version, it only supersedes it (see createGrowthAssessment's existing supersede-on-new-version
 * behavior).
 */
export type GrowthAssessmentReviewDecision = "accepted" | "needs_correction" | "rejected";

/** One structured finding/question/solution-candidate item. Bilingual, evidence-traceable. */
export type GrowthFindingItem = {
  textEs: string;
  textEn: string;
  evidenceRefs?: readonly string[];
};

export type GrowthProviderClass = "leonix_provides" | "leonix_coordinates_partner" | "external_professional_required";

/** An AI-suggested solution candidate living inside an assessment — NOT yet a canonical row. */
export type GrowthSuggestedSolution = GrowthFindingItem & {
  providerClass: GrowthProviderClass;
  category: string;
};

export type GrowthMediaMixItem = GrowthFindingItem & { channelKey: string };

export interface GrowthAssessment {
  id: string;
  businessId: string;
  status: GrowthAssessmentStatus;

  providerKey: string | null;
  modelKey: string | null;
  inputSnapshot: Record<string, unknown>;
  inputHash: string | null;
  costMetadata: Record<string, unknown>;

  summaryEs: string | null;
  summaryEn: string | null;
  whatFound: readonly GrowthFindingItem[];
  whatKnown: readonly GrowthFindingItem[];
  whatUnknown: readonly GrowthFindingItem[];
  needsVerification: readonly GrowthFindingItem[];
  weakOrMissing: readonly GrowthFindingItem[];
  clientQuestions: readonly GrowthFindingItem[];
  risksConstraints: readonly GrowthFindingItem[];
  growthOpportunities: readonly GrowthFindingItem[];
  suggestedSolutions: readonly GrowthSuggestedSolution[];
  recommendedMediaMix: readonly GrowthMediaMixItem[];
  priorityOrder: readonly GrowthFindingItem[];
  measurementPlan: readonly GrowthFindingItem[];
  nextRightMoveEs: string | null;
  nextRightMoveEn: string | null;

  createdActorType: "staff" | "owner" | "system";
  createdByRosterId: string | null;
  createdByAuthUserId: string | null;
  createdByRole: string;

  reviewedAt: string | null;
  reviewedByRosterId: string | null;
  reviewedByAuthUserId: string | null;
  reviewedByRole: string | null;
  operatorReviewNotes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateGrowthAssessmentInput {
  businessId: string;
  providerKey?: string | null;
  modelKey?: string | null;
  inputSnapshot?: Record<string, unknown>;
  inputHash?: string | null;
  costMetadata?: Record<string, unknown>;
  summaryEs?: string | null;
  summaryEn?: string | null;
  whatFound?: readonly GrowthFindingItem[];
  whatKnown?: readonly GrowthFindingItem[];
  whatUnknown?: readonly GrowthFindingItem[];
  needsVerification?: readonly GrowthFindingItem[];
  weakOrMissing?: readonly GrowthFindingItem[];
  clientQuestions?: readonly GrowthFindingItem[];
  risksConstraints?: readonly GrowthFindingItem[];
  growthOpportunities?: readonly GrowthFindingItem[];
  suggestedSolutions?: readonly GrowthSuggestedSolution[];
  recommendedMediaMix?: readonly GrowthMediaMixItem[];
  priorityOrder?: readonly GrowthFindingItem[];
  measurementPlan?: readonly GrowthFindingItem[];
  nextRightMoveEs?: string | null;
  nextRightMoveEn?: string | null;
  status?: GrowthAssessmentStatus;
}

// ---------------------------------------------------------------------------------------------
// Roadmap (Section B, MD §13)
// ---------------------------------------------------------------------------------------------
export type GrowthRoadmapType = "established" | "startup";
export type GrowthRoadmapStepState =
  | "not_started" | "in_progress" | "needs_client_input" | "needs_official_research"
  | "blocked" | "complete" | "not_applicable";
export type GrowthRoadmapStepRequirement = "required" | "optional";

export interface GrowthRoadmapStep {
  id: string;
  businessId: string;
  roadmapType: GrowthRoadmapType;
  stepKey: string;
  sequence: number;
  state: GrowthRoadmapStepState;
  requirement: GrowthRoadmapStepRequirement;
  dependsOnStepKey: string | null;
  sourceAssessmentId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------------------------
// Solutions (Section C, MD §7)
// ---------------------------------------------------------------------------------------------
export type GrowthSolutionReadiness = "ready" | "needs_preparation" | "blocked" | "needs_more_information";
export type GrowthSolutionPriority = "low" | "medium" | "high";
export type GrowthSolutionState = "suggested" | "reviewed" | "approved" | "dismissed" | "in_progress" | "complete";

export type GrowthSolutionExecutionTarget =
  | { type: "campaign"; id: string }
  | { type: "creative_job"; id: string }
  | { type: "commitment"; id: string }
  | { type: "official_requirement"; id: string };

export interface GrowthSolution {
  id: string;
  businessId: string;
  sourceAssessmentId: string | null;

  providerClass: GrowthProviderClass;
  category: string;
  titleEs: string;
  titleEn: string;
  rationaleEs: string | null;
  rationaleEn: string | null;
  evidenceRefs: readonly string[];

  readiness: GrowthSolutionReadiness;
  priority: GrowthSolutionPriority;
  state: GrowthSolutionState;

  linkedCampaignId: string | null;
  linkedCreativeJobId: string | null;
  linkedCommitmentId: string | null;
  linkedOfficialRequirementId: string | null;

  createdActorType: "staff" | "owner" | "system";
  createdByRosterId: string | null;
  createdByAuthUserId: string | null;
  createdByRole: string;

  reviewedAt: string | null;
  reviewedByRosterId: string | null;
  reviewedByAuthUserId: string | null;
  reviewedByRole: string | null;
  reviewNote: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateGrowthSolutionInput {
  businessId: string;
  sourceAssessmentId?: string | null;
  providerClass: GrowthProviderClass;
  category: string;
  titleEs: string;
  titleEn: string;
  rationaleEs?: string | null;
  rationaleEn?: string | null;
  evidenceRefs?: readonly string[];
  readiness?: GrowthSolutionReadiness;
  priority?: GrowthSolutionPriority;
}

// ---------------------------------------------------------------------------------------------
// Media channel catalog (Section D, MD §8/§9)
// ---------------------------------------------------------------------------------------------
export type GrowthChannelClass = "leonix_owned" | "partner";
export type GrowthChannelAvailability = "available" | "available_partner_terms_required" | "coming_soon" | "not_available";

export interface GrowthMediaChannel {
  id: string;
  channelKey: string;
  channelClass: GrowthChannelClass;
  labelEs: string;
  labelEn: string;
  availabilityState: GrowthChannelAvailability;
  config: Record<string, unknown>;
  notesEs: string | null;
  notesEn: string | null;
  isActive: boolean;
}

/**
 * Gate D (MD Part 10) — the future shape `config` (the existing untyped jsonb column above) can
 * hold once a partner channel's real commercial terms are confirmed, WITHOUT any schema/migration
 * change: config is already an open jsonb blob, so this type is documentation/forward-compatibility
 * only — it is never read, validated, or enforced anywhere yet, and no field here is populated by
 * this gate. Kept loosely typed (every field optional) on purpose: partial configuration (e.g. just
 * station + market, pricing still pending) must remain representable.
 */
export interface GrowthPartnerMediaChannelConfig {
  station?: string;
  market?: string;
  language?: string;
  audience?: string;
  spotLengthSeconds?: number;
  rotation?: string;
  scheduleDaysTimes?: string;
  campaignStart?: string;
  campaignEnd?: string;
  productionRequirements?: string;
  pricing?: string;
  inventoryNotes?: string;
  partnerTermsConfirmed?: boolean;
}

// ---------------------------------------------------------------------------------------------
// Campaign (Section E, MD §11)
// ---------------------------------------------------------------------------------------------
export type GrowthCampaignStatus =
  | "draft" | "needs_client_input" | "ready_for_review" | "approved" | "in_production"
  | "live" | "measuring" | "complete" | "paused" | "cancelled";

export interface GrowthCampaign {
  id: string;
  businessId: string;
  sourceSolutionId: string | null;
  linkedOpportunityId: string | null;
  /** Gate 6 (Client Discovery & Project Blueprint Engine) — set when this campaign was created via "Create Campaign" from an approved Media/Exposure Campaign project blueprint. */
  sourceProjectBlueprintId: string | null;

  objectiveEs: string;
  objectiveEn: string;
  targetAudienceEs: string | null;
  targetAudienceEn: string | null;
  offerEs: string | null;
  offerEn: string | null;
  primaryCtaEs: string | null;
  primaryCtaEn: string | null;
  capacityAssumption: string | null;

  campaignStart: string | null;
  campaignEnd: string | null;
  budgetAmount: number | null;
  budgetCurrency: string;

  creativeRequirements: Record<string, unknown>;
  trackingPlan: Record<string, unknown>;
  status: GrowthCampaignStatus;

  clientApprovedAt: string | null;
  clientApprovalNote: string | null;
  staffApprovedAt: string | null;
  staffApprovedByRosterId: string | null;
  staffApprovedByRole: string | null;

  createdActorType: "staff" | "owner" | "system";
  createdByRosterId: string | null;
  createdByRole: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateGrowthCampaignInput {
  businessId: string;
  sourceSolutionId?: string | null;
  linkedOpportunityId?: string | null;
  sourceProjectBlueprintId?: string | null;
  objectiveEs: string;
  objectiveEn: string;
  targetAudienceEs?: string | null;
  targetAudienceEn?: string | null;
  offerEs?: string | null;
  offerEn?: string | null;
  primaryCtaEs?: string | null;
  primaryCtaEn?: string | null;
  capacityAssumption?: string | null;
  campaignStart?: string | null;
  campaignEnd?: string | null;
  budgetAmount?: number | null;
  budgetCurrency?: string;
  creativeRequirements?: Record<string, unknown>;
  trackingPlan?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------------------------
// Official requirements research (Section G)
// ---------------------------------------------------------------------------------------------
export type GrowthOfficialRequirementState = "needs_research" | "researched_unverified" | "human_verified" | "not_applicable";

export interface GrowthOfficialRequirement {
  id: string;
  businessId: string;
  jurisdiction: string;
  requirementTopicEs: string;
  requirementTopicEn: string;
  businessCategoryContext: string | null;
  sourceUrl: string | null;
  sourceAgency: string | null;
  lastVerifiedAt: string | null;
  state: GrowthOfficialRequirementState;
  needsHumanVerification: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrowthOfficialRequirementInput {
  businessId: string;
  jurisdiction: string;
  requirementTopicEs: string;
  requirementTopicEn: string;
  businessCategoryContext?: string | null;
  sourceUrl?: string | null;
  sourceAgency?: string | null;
  notes?: string | null;
}

// ---------------------------------------------------------------------------------------------
// Events (Section I)
// ---------------------------------------------------------------------------------------------
export type GrowthEntityType = "assessment" | "roadmap_step" | "solution" | "campaign" | "official_requirement";

export interface GrowthEvent {
  id: string;
  businessId: string;
  entityType: GrowthEntityType;
  entityId: string;
  eventType: string;
  previousState: string | null;
  newState: string | null;
  source: string | null;
  note: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------------------------
// Client-safe projection (Section J) — never carries rationale, evidence_refs, internal notes,
// review metadata, or any AI-inference-not-yet-promoted content.
// ---------------------------------------------------------------------------------------------
export interface GrowthClientSafeProjection {
  alreadyStrong: readonly { textEs: string; textEn: string }[];
  letsConfirm: readonly { textEs: string; textEn: string }[];
  recommendedNextSteps: readonly { titleEs: string; titleEn: string; priority: GrowthSolutionPriority }[];
  projects: readonly { titleEs: string; titleEn: string; state: GrowthSolutionState }[];
  campaigns: readonly { objectiveEs: string; objectiveEn: string; status: GrowthCampaignStatus }[];
  results: readonly { textEs: string; textEn: string }[];
}
