/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — domain types. Mirrors
 * supabase/migrations/20260911120000_client_project_discovery_foundation.sql exactly.
 *
 * Deliberately named "ProjectDiscovery" (never bare "Discovery") throughout — the Living Business
 * Book already has an unrelated, pre-existing "business_discovery_sessions" concept (a generic
 * business-profile questionnaire: owner_questionnaire/staff_interview/etc.). This domain is the
 * NEW, PROJECT-scoped concept from the Client Discovery & Project Blueprint Engine Master
 * (website/logo/print/campaign discovery leading to a project blueprint) — a different thing, and
 * the naming keeps that difference impossible to miss at every call site.
 */

// ---------------------------------------------------------------------------------------------
// Shared actor shape — matches the exact convention already used by GrowthEngineActor,
// LivingBookActor, MeetingActor, FieldDiscoveryActor.
// ---------------------------------------------------------------------------------------------
export type ProjectDiscoveryActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string; role?: string }
  | { type: "system"; role: string };

// ---------------------------------------------------------------------------------------------
// Discovery lifecycle (MD <discovery_lifecycle>)
// ---------------------------------------------------------------------------------------------
export type ProjectDiscoveryStatus =
  | "in_progress"
  | "needs_client_information"
  | "needs_leonix_decision"
  | "ready_for_blueprint"
  | "blueprint_created";

// ---------------------------------------------------------------------------------------------
// Project types (MD Master §7 + <project_type_registry>) — the canonical initial registry.
// ---------------------------------------------------------------------------------------------
export type ProjectType =
  | "website"
  | "website_improvement"
  | "landing_page"
  | "logo_brand_identity"
  | "business_cards"
  | "flyer"
  | "banner_signage"
  | "promotional_products"
  | "campaign_creative"
  | "sponsored_editorial"
  | "media_exposure_campaign"
  | "social_setup_cleanup"
  | "google_business_profile_support"
  | "referral_materials"
  | "launch_package_multi_project"
  | "custom_platform_software"
  | "other";

export interface ProjectDiscovery {
  id: string;
  businessId: string;
  status: ProjectDiscoveryStatus;
  title: string;
  primaryProjectType: ProjectType;
  language: "es" | "en";

  sourceGrowthAssessmentId: string | null;
  sourceGrowthSolutionId: string | null;
  sourceOpportunityId: string | null;
  sourceMeetingId: string | null;

  assignedStaffRosterId: string | null;

  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;

  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateProjectDiscoveryInput {
  businessId: string;
  title: string;
  primaryProjectType: ProjectType;
  language?: "es" | "en";
  sourceGrowthAssessmentId?: string | null;
  sourceGrowthSolutionId?: string | null;
  sourceOpportunityId?: string | null;
  sourceMeetingId?: string | null;
  assignedStaffRosterId?: string | null;
}

// ---------------------------------------------------------------------------------------------
// Multi-project foundation (MD <multi_project_foundation>)
// ---------------------------------------------------------------------------------------------
export type ProjectDiscoveryIntentStatus = "candidate" | "confirmed" | "declined" | "converted_to_project";

export interface ProjectDiscoveryIntent {
  id: string;
  businessId: string;
  discoveryId: string;
  projectType: ProjectType;
  projectSubtype: string | null;
  otherLabel: string | null;
  title: string;
  status: ProjectDiscoveryIntentStatus;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDiscoveryIntentInput {
  discoveryId: string;
  businessId: string;
  projectType: ProjectType;
  projectSubtype?: string | null;
  otherLabel?: string | null;
  title: string;
}

// ---------------------------------------------------------------------------------------------
// Truth / provenance classes (MD <truth_contract>) — never silently collapsed.
// ---------------------------------------------------------------------------------------------
export type DiscoveryTruthClass =
  | "client_confirmed"
  | "public_verified"
  | "staff_observation"
  | "ai_extracted"
  | "needs_confirmation"
  | "unknown"
  | "client_preference"
  | "leonix_recommendation"
  | "technical_decision";

// ---------------------------------------------------------------------------------------------
// Completeness classes (MD <completeness_contract>)
// ---------------------------------------------------------------------------------------------
export type DiscoveryCompletenessClass =
  | "required_before_build"
  | "required_before_launch"
  | "helpful"
  | "optional"
  | "not_applicable"
  | "needs_leonix_decision"
  | "needs_official_research";

export type DiscoveryItemValueType = "text" | "number" | "boolean" | "date" | "url" | "list" | "asset_ref" | "choice" | "other";
export type DiscoveryItemConfirmationState = "unconfirmed" | "confirmed" | "rejected";

// ---------------------------------------------------------------------------------------------
// Structured discovery items/answers (MD <data_model> B)
// ---------------------------------------------------------------------------------------------
export interface ProjectDiscoveryItem {
  id: string;
  businessId: string;
  discoveryId: string;
  projectIntentId: string | null;

  section: string;
  fieldKey: string;
  value: unknown;
  displayValue: string | null;
  valueType: DiscoveryItemValueType;

  truthClass: DiscoveryTruthClass;
  completenessClass: DiscoveryCompletenessClass;

  confirmationState: DiscoveryItemConfirmationState;
  clientConfirmedAt: string | null;

  capturedActorType: "staff" | "owner" | "system";
  capturedByRosterId: string | null;
  capturedByAuthUserId: string | null;
  capturedByEmail: string | null;
  capturedByRole: string;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CaptureProjectDiscoveryItemInput {
  discoveryId: string;
  businessId: string;
  projectIntentId?: string | null;
  section: string;
  fieldKey: string;
  value: unknown;
  displayValue?: string | null;
  valueType?: DiscoveryItemValueType;
  truthClass: DiscoveryTruthClass;
  completenessClass: DiscoveryCompletenessClass;
  notes?: string | null;
}

// ---------------------------------------------------------------------------------------------
// Source / evidence + asset references (MD <data_model> C, E)
// ---------------------------------------------------------------------------------------------
export type DiscoverySourceType =
  | "business_fact"
  | "business_unknown"
  | "meeting"
  | "meeting_note"
  | "transcript_import"
  | "research_run"
  | "growth_assessment"
  | "growth_solution"
  | "opportunity"
  | "asset"
  | "website_url"
  | "manual";

export interface ProjectDiscoverySource {
  id: string;
  businessId: string;
  discoveryId: string;
  itemId: string | null;
  sourceType: DiscoverySourceType;
  sourceRecordId: string | null;
  businessSourceFileId: string | null;
  externalUrl: string | null;
  label: string | null;
  notes: string | null;
  createdActorType: "staff" | "owner" | "system";
  createdByRosterId: string | null;
  createdByAuthUserId: string | null;
  createdByEmail: string | null;
  createdByRole: string;
  createdAt: string;
}

export interface AttachProjectDiscoverySourceInput {
  discoveryId: string;
  businessId: string;
  itemId?: string | null;
  sourceType: DiscoverySourceType;
  sourceRecordId?: string | null;
  businessSourceFileId?: string | null;
  externalUrl?: string | null;
  label?: string | null;
  notes?: string | null;
}

// ---------------------------------------------------------------------------------------------
// Consent (MD <data_model> F) — minimal reference model, NOT a recording implementation.
// ---------------------------------------------------------------------------------------------
export type DiscoveryConsentType = "notes" | "audio_recording" | "transcription" | "file_photo_review" | "followup_messages";
export type DiscoveryConsentState = "provided" | "declined" | "withdrawn";
export type DiscoveryConsentMethod = "verbal" | "written" | "digital_acknowledgment";

export interface ProjectDiscoveryConsent {
  id: string;
  businessId: string;
  discoveryId: string;
  consentType: DiscoveryConsentType;
  state: DiscoveryConsentState;
  method: DiscoveryConsentMethod;
  language: "es" | "en";
  scopeDetails: Record<string, unknown> | null;
  recordedActorType: "staff" | "owner";
  recordedByRosterId: string | null;
  recordedByAuthUserId: string;
  recordedByEmail: string;
  recordedByRole: string;
  createdAt: string;
}

export interface RecordProjectDiscoveryConsentInput {
  discoveryId: string;
  businessId: string;
  consentType: DiscoveryConsentType;
  state: DiscoveryConsentState;
  method: DiscoveryConsentMethod;
  language: "es" | "en";
  scopeDetails?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------------------------
// Events (append-only audit trail, mirrors GrowthEvent)
// ---------------------------------------------------------------------------------------------
export type ProjectDiscoveryEntityType = "discovery" | "intent" | "item" | "consent" | "source";

export interface ProjectDiscoveryEvent {
  id: string;
  businessId: string;
  discoveryId: string;
  entityType: ProjectDiscoveryEntityType;
  entityId: string;
  eventType: string;
  previousState: string | null;
  newState: string | null;
  source: string | null;
  note: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------------------------
// Client-safe projection (MD <client_safe_boundary>) — never carries internal rationale, staff-only
// notes, AI confidence mechanics, provider/model metadata, or a rejected internal recommendation.
// ---------------------------------------------------------------------------------------------
export interface ProjectDiscoveryClientSafeItem {
  section: string;
  fieldKey: string;
  displayValue: string | null;
  confirmationState: DiscoveryItemConfirmationState;
}

export interface ProjectDiscoveryClientSafeProjection {
  title: string;
  status: ProjectDiscoveryStatus;
  approvedItems: readonly ProjectDiscoveryClientSafeItem[];
  needsConfirmationItems: readonly ProjectDiscoveryClientSafeItem[];
}
