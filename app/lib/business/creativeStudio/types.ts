/**
 * Program 6, Gate 6I-6K — Creative data model types.
 * Job, Snapshot, Brief, Version, Composition, Asset, Review, Export, ProviderRun.
 * DO NOT put everything into one JSON blob.
 */
import type { PrintFormatKey } from "./printSpecs";
import type { CreativeArchetypeKey, CreativeLane } from "./archetypes/types";
import type { LayoutVariant } from "./archetypes/compositionRules";

// ─── Creative Job (Gate 6J) ───────────────────────────────────────────────

export type CreativeAssetType =
  | "magazine_ad"
  | "sponsored_insert"
  | "business_description"
  | "social_copy"
  | "whatsapp_promo_copy"
  | "flyer_copy"
  | "coupon_copy"
  | "logo_direction"
  | "website_strategy"
  | "campaign_plan_30_day";

export type CreativeJobStatus =
  | "draft"
  | "ready_for_generation"
  | "generated"
  | "in_review"
  | "changes_requested"
  | "owner_review"
  | "approved"
  | "archived";

export type CreativeLanguage = "es" | "en" | "bilingual" | "es_primary_en_support" | "en_primary_es_support";

export interface CreativeJob {
  id: string;
  businessId: string;
  sourceRecommendationId: string | null;
  sourceProposalId: string | null;
  /** Package B — set when this job was created via "Create Creative Request" from an approved opportunity. */
  sourceOpportunityId: string | null;
  assetType: CreativeAssetType;
  language: CreativeLanguage;
  format: PrintFormatKey;
  archetype: CreativeArchetypeKey;
  layoutVariant: LayoutVariant;
  status: CreativeJobStatus;
  inputSnapshotId: string | null;
  doctrineVersion: string;
  templateVersion: string;
  providerKey: string;
  modelKey: string;
  creativeLane: CreativeLane;
  riskClass: RiskClass;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  approvedActorType: "staff" | "owner" | null;
  approvedByRosterId: string | null;
  approvedByAuthUserId: string | null;
  approvedByEmail: string | null;
  approvedByRole: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Immutable Verified Input Snapshot (Gate 6K) ──────────────────────────

export type SnapshotTruthStatus = "KNOWN" | "STALE" | "UNKNOWN" | "CONTRADICTED" | "UNAPPROVED_INFERENCE";

export interface SnapshotEvidenceRef {
  factId: string | null;
  sourceClass: string | null;
  approvalState: string | null;
  evidenceId: string | null;
}

export interface SnapshotCategory {
  category: string;
  truthStatus: SnapshotTruthStatus;
  data: Record<string, unknown>;
  evidenceRefs: readonly SnapshotEvidenceRef[];
  snapshotTimestamp: string;
}

export interface CreativeInputSnapshot {
  id: string;
  businessId: string;
  jobId: string;
  version: number;
  categories: readonly SnapshotCategory[];
  snapshotTimestamp: string;
  createdActorType: "staff" | "owner";
  createdByAuthUserId: string;
  createdByRosterId: string | null;
  createdAt: string;
}

// ─── Creative Brief (Gate 6M) ─────────────────────────────────────────────

export type BriefStatus = "DRAFT" | "STAFF_APPROVED";

export interface CreativeBrief {
  id: string;
  businessId: string;
  jobId: string;
  status: BriefStatus;
  businessGoal: string;
  campaignObjective: string;
  readerNeed: string;
  targetAudience: string;
  primaryLanguage: CreativeLanguage;
  secondaryLanguage: CreativeLanguage | null;
  primaryMessage: string;
  supportingMessage: string | null;
  offer: string | null;
  cta: string;
  contactPath: string;
  qrTarget: string | null;
  keyServices: readonly string[];
  trustEvidence: readonly string[];
  requiredDisclaimers: readonly string[];
  prohibitedClaims: readonly string[];
  creativeLane: CreativeLane;
  archetype: CreativeArchetypeKey;
  format: PrintFormatKey;
  layoutOptions: readonly LayoutVariant[];
  imageStrategy: string;
  mustUseAssetIds: readonly string[];
  optionalAssetIds: readonly string[];
  missingAssetDescriptions: readonly string[];
  sourceRecommendationId: string | null;
  desiredAction: string;
  riskClass: RiskClass;
  reviewRequirements: readonly string[];
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  approvedByAuthUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Creative Version ─────────────────────────────────────────────────────

export interface CreativeJobVersion {
  id: string;
  businessId: string;
  jobId: string;
  versionNumber: number;
  snapshotId: string;
  briefId: string | null;
  generatedCopy: Record<string, unknown>;
  generatedHeadlines: readonly string[];
  generatedBodyCopy: readonly string[];
  generatedCta: string | null;
  generatedDisclaimer: string | null;
  isCurrent: boolean;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
}

// ─── Creative Composition ─────────────────────────────────────────────────

export interface CreativeComposition {
  id: string;
  businessId: string;
  jobId: string;
  versionId: string;
  format: PrintFormatKey;
  archetype: CreativeArchetypeKey;
  layoutVariant: LayoutVariant;
  zoneAssignments: Record<string, string>;
  zoneContent: Record<string, unknown>;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
}

// ─── Creative Review (Gate 6U) ────────────────────────────────────────────

export type ReviewIssueType =
  | "FACT_ERROR"
  | "CONTACT_ERROR"
  | "OFFER_ERROR"
  | "SPELLING"
  | "TRANSLATION"
  | "BRAND"
  | "IMAGE"
  | "RIGHTS"
  | "LAYOUT"
  | "READABILITY"
  | "QR"
  | "DISCLAIMER"
  | "COMPLIANCE"
  | "RESOLUTION"
  | "OTHER";

export interface CreativeReview {
  id: string;
  businessId: string;
  jobId: string;
  versionId: string;
  issueType: ReviewIssueType;
  issueDescription: string;
  severity: "blocker" | "warning" | "minor" | "resolved";
  resolutionOfId: string | null;
  reviewerActorType: "staff" | "owner";
  reviewerRosterId: string | null;
  reviewerAuthUserId: string;
  reviewerEmail: string;
  reviewerRole: string;
  createdAt: string;
}

// ─── Creative Export (Gate 6V) ────────────────────────────────────────────

export type ExportType =
  | "CANVA_PRODUCTION_PACK_JSON"
  | "CANVA_PRODUCTION_BRIEF_TEXT"
  | "COPY_DECK"
  | "IMAGE_BRIEF"
  | "PRINT_SPEC_SHEET"
  | "REVIEW_CHECKLIST"
  | "APPROVAL_SNAPSHOT"
  | "CREATIVE_PROOF_PDF";

export interface CreativeExport {
  id: string;
  businessId: string;
  jobId: string;
  versionId: string;
  exportType: ExportType;
  content: string;
  status: "pending" | "generated" | "failed";
  generatedAt: string | null;
  createdActorType: "staff" | "owner";
  createdByAuthUserId: string;
  createdByRosterId: string | null;
  createdAt: string;
}

// ─── Provider Run (Gate 6P) ───────────────────────────────────────────────

export interface CreativeProviderRun {
  id: string;
  businessId: string;
  jobId: string;
  versionId: string | null;
  providerKey: string;
  modelKey: string;
  templateVersion: string;
  schemaVersion: string;
  inputSnapshotId: string;
  status: "pending" | "success" | "failed" | "fallback";
  errorState: string | null;
  latencyMs: number | null;
  costMetadata: Record<string, unknown> | null;
  initiatedActorType: "staff" | "owner" | "system";
  initiatedByRosterId: string | null;
  initiatedByAuthUserId: string | null;
  initiatedByRole: string;
  createdAt: string;
}

// ─── Risk Classes (Gate 6N) ───────────────────────────────────────────────

export type RiskClass =
  | "NORMAL"
  | "LEGAL"
  | "MEDICAL"
  | "FINANCIAL"
  | "INSURANCE"
  | "IMMIGRATION"
  | "TAX"
  | "SAFETY"
  | "EMPLOYMENT"
  | "HOUSING";

export const HIGH_RISK_CLASSES: readonly RiskClass[] = [
  "LEGAL", "MEDICAL", "FINANCIAL", "INSURANCE", "IMMIGRATION", "TAX", "SAFETY", "EMPLOYMENT", "HOUSING",
];

export function isHighRisk(riskClass: RiskClass): boolean {
  return HIGH_RISK_CLASSES.includes(riskClass);
}

// ─── Canva Integration Status (Gate 6Q) ───────────────────────────────────

export type CanvaIntegrationStatus = "manual_handoff" | "provider_ready" | "connected" | "certified";

export const CANVA_DEFAULT_STATUS: CanvaIntegrationStatus = "manual_handoff";

// ─── Doctrine ─────────────────────────────────────────────────────────────

export const CREATIVE_DOCTRINE_VERSION = "v1";
export const CREATIVE_TEMPLATE_VERSION = "v1";

export const CREATIVE_DOCTRINE_RULES: readonly string[] = [
  "Never invent a business fact, service, price, offer, expiration date, review, rating, award, certification, guarantee, legal outcome, medical result, address, phone number, social account, or QR destination.",
  "Never imply AI-generated imagery is authentic client photography.",
  "Never silently change approved business truth.",
  "Never silently overwrite creative history.",
  "Never auto-publish.",
  "Never auto-charge.",
  "Never create Stripe/payment records.",
  "Never grant entitlements.",
  "Never claim Canva integration is live unless proven.",
  "Never claim image generation is live unless proven.",
  "Approval != Publication.",
  "Image generation is NOT part of this build.",
];
