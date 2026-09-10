/**
 * Program 4, Gate 4C — AI Research Engine domain types. Gemini is the only live provider for V1
 * (LOCKED V1 PROVIDER DECISIONS) — every other provider key must report isConfigured() === false
 * and must never be claimed live. AI output is always draft/inference — never written directly to
 * business_facts (see repository.ts and the Gate 4D promotion workflow).
 */
export type { LivingBookActor as AiResearchActor } from "../livingBook/types";

export type AiResearchRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type BusinessAiResearchRun = {
  id: string;
  businessId: string;
  providerKey: string;
  modelKey: string;
  templateVersion: string;
  inputSnapshot: Record<string, unknown>;
  inputHash: string;
  sourceLinkIds: readonly string[];
  sourceFileIds: readonly string[];
  status: AiResearchRunStatus;
  failureCode: string | null;
  failureReason: string | null;
  costMetadata: Record<string, unknown>;
  triggeredActorType: "staff" | "owner";
  triggeredByRosterId: string | null;
  triggeredByAuthUserId: string;
  triggeredByEmail: string;
  triggeredByRole: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type BriefingReviewStatus = "draft" | "staff_reviewed" | "partially_promoted" | "fully_promoted" | "rejected" | "superseded";

export type BriefingConfidence = "low" | "medium" | "high";

export type BriefingEvidenceRef = { sourceType: string; sourceId: string | null; excerpt: string | null };

export type BriefingStrengthOrOpportunity = {
  itemId: string;
  claimEs: string;
  claimEn: string;
  evidenceRefs: readonly BriefingEvidenceRef[];
  confidence: BriefingConfidence;
  requiresConfirmation: boolean;
  sourceTypes: readonly string[];
  reasoningSummary: string;
  prohibitedClaimFlags: readonly string[];
  promotionStatus: "unresolved" | "promoted" | "rejected";
};

export type BriefingContradiction = {
  itemId: string;
  descriptionEs: string;
  descriptionEn: string;
  evidenceRefs: readonly BriefingEvidenceRef[];
  recommendedConfirmationQuestionEs: string;
  recommendedConfirmationQuestionEn: string;
  promotionStatus: "unresolved" | "promoted" | "rejected";
};

export type BriefingUnknown = {
  itemId: string;
  questionEs: string;
  questionEn: string;
  whyNeededEs: string;
  whyNeededEn: string;
  priority: "low" | "medium" | "high";
  relatedDimensionKey: string | null;
  promotionStatus: "unresolved" | "promoted" | "rejected";
};

export type BusinessAiBriefingDraft = {
  id: string;
  businessId: string;
  researchRunId: string;
  schemaVersion: string;
  summaryEs: string;
  summaryEn: string;
  strengths: readonly BriefingStrengthOrOpportunity[];
  opportunities: readonly BriefingStrengthOrOpportunity[];
  contradictions: readonly BriefingContradiction[];
  unknowns: readonly BriefingUnknown[];
  limitations: readonly string[];
  reviewStatus: BriefingReviewStatus;
  reviewedByRosterId: string | null;
  reviewedByAuthUserId: string | null;
  reviewedByEmail: string | null;
  reviewedByRole: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Website V1 research adapter contract
// ---------------------------------------------------------------------------

export type WebsiteResearchStatus = "completed" | "unreachable" | "blocked" | "unsupported";

export type WebsiteResearchEvidence = {
  category: string;
  claim: string;
  excerpt: string | null;
  confidence: BriefingConfidence;
  requiresConfirmation: boolean;
};

export type WebsiteResearchResult = {
  sourceUrl: string;
  finalUrl: string | null;
  status: WebsiteResearchStatus;
  observedAt: string;
  httpStatus: number | null;
  https: boolean | null;
  title: string | null;
  metaDescription: string | null;
  declaredLanguage: string | null;
  viewportPresent: boolean | null;
  contacts: { phones: string[]; emails: string[]; addresses: string[] };
  navigationLabels: string[];
  ctaCandidates: string[];
  structuredDataTypes: string[];
  evidence: WebsiteResearchEvidence[];
  limitations: string[];
};

// ---------------------------------------------------------------------------
// AI input packet / output contract
// ---------------------------------------------------------------------------

export type AiResearchInputPacket = {
  businessIdentity: { displayName: string; broadBusinessType: string; businessStage: string };
  ownerStatedGoals: readonly string[];
  confirmedFacts: readonly { factKey: string; displayValue: string }[];
  sourceLinks: readonly { sourceType: string; url: string }[];
  fileEvidence: readonly { fileKind: string; excerptOrCaption: string | null }[];
  websiteResearch: WebsiteResearchResult | null;
  unknowns: readonly { questionLabel: string }[];
  contradictions: readonly { claimALabel: string; claimBLabel: string }[];
  latestHealthFindings: readonly { dimensionKey: string; findingLabel: string }[];
  capacityReadiness: string | null;
  lionCodeRules: readonly string[];
  outputSchemaVersion: string;
  prohibitedClaims: readonly string[];
  languageTarget: "es" | "en" | "both";
};

export type AiBriefingSynthesisResult =
  | {
      ok: true;
      summaryEs: string;
      summaryEn: string;
      strengths: BriefingStrengthOrOpportunity[];
      opportunities: BriefingStrengthOrOpportunity[];
      contradictions: BriefingContradiction[];
      unknowns: BriefingUnknown[];
      limitations: string[];
    }
  | { ok: false; failureCode: string; failureReason: string };
