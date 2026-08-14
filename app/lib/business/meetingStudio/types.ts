/**
 * Program 5 — Meeting Studio domain types. Mirrors the Gate BCO-5A/6A/TODAY-3/Program 4
 * type conventions exactly. Meeting notes are observations/owner statements — they never
 * directly mutate business_facts. No fake recording/transcription state.
 */

export type MeetingStatus =
  | "planned"
  | "prepared"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MeetingType =
  | "discovery"
  | "check_in"
  | "proposal_review"
  | "follow_up"
  | "intake";

export type MeetingLanguage = "es" | "en";

export type AttendeeType =
  | "owner"
  | "staff"
  | "external";

export type AttendanceState =
  | "confirmed"
  | "tentative"
  | "declined"
  | "attended"
  | "no_show";

export type MeetingConsentType =
  | "notes"
  | "audio_recording"
  | "transcription"
  | "connected_account_review"
  | "file_photo_review"
  | "followup_messages";

export type MeetingConsentState = "provided" | "declined" | "withdrawn";

export type MeetingConsentMethod = "verbal" | "written" | "digital_acknowledgment";

export type MeetingNoteType =
  | "owner_statement"
  | "staff_observation"
  | "potential_fact"
  | "unknown"
  | "contradiction"
  | "decision"
  | "action_item";

export type MeetingNoteSourceClass =
  | "owner_stated"
  | "staff_observed"
  | "system_derived"
  | "ai_inference";

export type MeetingNoteVisibility = "staff_only" | "shared_with_owner";

export type MeetingNoteSensitivity = "normal" | "sensitive";

export type TranscriptImportMethod = "manual_import";

export type TranscriptImportStatus = "imported" | "reviewed" | "rejected";

export type MeetingActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type BusinessMeeting = {
  id: string;
  businessId: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  language: MeetingLanguage;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  agendaSnapshot: Record<string, unknown> | null;
  briefingSnapshot: Record<string, unknown> | null;
  recapEs: string | null;
  recapEn: string | null;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  completedByRosterId: string | null;
  completedByAuthUserId: string | null;
  completedByEmail: string | null;
  completedByRole: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeetingAttendee = {
  id: string;
  meetingId: string;
  businessId: string;
  attendeeType: AttendeeType;
  displayName: string;
  contactReference: string | null;
  staffRosterId: string | null;
  staffAuthUserId: string | null;
  language: MeetingLanguage | null;
  attendanceState: AttendanceState;
  createdAt: string;
};

export type MeetingConsentRecord = {
  id: string;
  meetingId: string;
  businessId: string;
  consentType: MeetingConsentType;
  state: MeetingConsentState;
  method: MeetingConsentMethod;
  language: MeetingLanguage;
  recordedActorType: "staff" | "owner";
  recordedByRosterId: string | null;
  recordedByAuthUserId: string;
  recordedByEmail: string;
  recordedByRole: string;
  scopeDetails: Record<string, unknown> | null;
  createdAt: string;
};

export type MeetingNote = {
  id: string;
  meetingId: string;
  businessId: string;
  noteType: MeetingNoteType;
  content: string;
  sourceClass: MeetingNoteSourceClass;
  visibility: MeetingNoteVisibility;
  sensitivity: MeetingNoteSensitivity;
  potentialFactKey: string | null;
  requiresConfirmation: boolean;
  recordedActorType: "staff" | "owner";
  recordedByRosterId: string | null;
  recordedByAuthUserId: string;
  recordedByEmail: string;
  recordedByRole: string;
  createdAt: string;
};

export type MeetingTranscriptImport = {
  id: string;
  meetingId: string;
  businessId: string;
  importMethod: TranscriptImportMethod;
  language: MeetingLanguage;
  transcriptText: string | null;
  storagePath: string | null;
  consentRecordId: string | null;
  status: TranscriptImportStatus;
  importedActorType: "staff" | "owner";
  importedByRosterId: string | null;
  importedByAuthUserId: string;
  importedByEmail: string;
  importedByRole: string;
  createdAt: string;
  reviewedAt: string | null;
};

export type CockpitBriefing = {
  businessId: string;
  businessName: string;
  primaryLanguage: string | null;
  truthClasses: {
    confirmed: CockpitBriefingItem[];
    ownerStated: CockpitBriefingItem[];
    staffObservation: CockpitBriefingItem[];
    systemDerived: CockpitBriefingItem[];
    aiInference: CockpitBriefingItem[];
    unknown: CockpitBriefingItem[];
    contradiction: CockpitBriefingItem[];
  };
  healthMap: {
    latestRunDate: string | null;
    strongCount: number;
    needsAttentionCount: number;
    insufficientInfoCount: number;
    contradictionBlockedCount: number;
    dimensions: { key: string; status: string; explanationEn: string }[];
  } | null;
  recommendation: {
    candidateKey: string | null;
    status: string | null;
    verifiedNeedEn: string | null;
    primaryIntervention: string | null;
    costBand: string | null;
    expectedEffort: string | null;
    rejectedHigherCostReasonEn: string | null;
    sixTests: { testKey: string; result: string; explanationEn: string }[];
  } | null;
  researchFreshness: {
    latestRunDate: string | null;
    latestRunStatus: string | null;
    latestDraftReviewStatus: string | null;
    sourceLinkCount: number;
    sourceFileCount: number;
  } | null;
  entitlements: {
    activePackageTier: string | null;
    activeBenefits: string[];
    warnings: string[];
  } | null;
  commitments: {
    activeCount: number;
    blockedCount: number;
    nextDueDate: string | null;
  } | null;
  whatNotToSell: string[];
  suggestedTopics: { es: string; en: string }[];
  generatedAt: string;
};

export type CockpitBriefingItem = {
  key: string;
  label: string;
  value: string;
  source: string;
  lastVerifiedAt: string | null;
};

// ---------------------------------------------------------------------------
// Meeting note → Living Business Book promotion
// ---------------------------------------------------------------------------

export type MeetingNotePromotionDestination = "fact" | "unknown" | "contradiction" | "correction";

export type MeetingNotePromotion = {
  id: string;
  businessId: string;
  meetingId: string;
  meetingNoteId: string;
  destinationType: MeetingNotePromotionDestination;
  destinationRecordId: string;
  promotedByRosterId: string | null;
  promotedByAuthUserId: string;
  promotedByEmail: string;
  promotedByRole: string;
  createdAt: string;
};
