/**
 * Program 4, Gate 4A — Field Discovery + Canvassing domain types. Mirrors the Living Business
 * Book / Health Map / DIY Concierge / Stewardship type conventions exactly: dual staff/owner
 * actor shape, bilingual-safe copy left to constants.ts, no `any`, no unsafe casts.
 *
 * Locked doctrine: one canonical business identity (public.businesses.id). This domain never
 * creates a parallel prospect/CRM table — a canvassed business IS a real businesses row.
 */

export type { LivingBookActor as FieldDiscoveryActor } from "../livingBook/types";

// ---------------------------------------------------------------------------
// Source links
// ---------------------------------------------------------------------------

export type SourceType =
  | "website"
  | "google_business"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "yelp"
  | "whatsapp"
  | "other";

export type SourceCollectionMethod = "canvassing" | "owner_provided" | "staff_entered" | "manual_import";

export type SourceLinkStatus = "pending" | "reachable" | "unreachable" | "researched" | "archived";

export type BusinessSourceLink = {
  id: string;
  businessId: string;
  sourceType: SourceType;
  url: string;
  normalizedUrl: string;
  collectionMethod: SourceCollectionMethod;
  consentRecordId: string | null;
  status: SourceLinkStatus;
  lastResearchedAt: string | null;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Source files (canvassing uploads)
// ---------------------------------------------------------------------------

export type SourceFileKind =
  | "business_card"
  | "menu"
  | "flyer"
  | "logo"
  | "photo"
  | "screenshot"
  | "pdf"
  | "price_list"
  | "service_list"
  | "other";

export type SourceFileUploadStatus = "pending" | "uploaded" | "linked_to_evidence" | "deleted" | "failed";

export type BusinessSourceFile = {
  id: string;
  businessId: string;
  relatedDiscoverySessionId: string | null;
  fileKind: SourceFileKind;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  consentRecordId: string | null;
  createdEvidenceId: string | null;
  uploadStatus: SourceFileUploadStatus;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export type ConsentType = "photo_capture" | "file_upload" | "source_research" | "ai_research" | "followup_contact";
export type ConsentState = "provided" | "declined" | "withdrawn";
export type ConsentMethod = "verbal_at_visit" | "written" | "digital_form" | "owner_dashboard";

export type BusinessConsentRecord = {
  id: string;
  businessId: string;
  consentType: ConsentType;
  consentState: ConsentState;
  method: ConsentMethod;
  scopeDetails: Record<string, unknown>;
  relatedDiscoverySessionId: string | null;
  recordedActorType: "staff" | "owner";
  recordedByRosterId: string | null;
  recordedByAuthUserId: string;
  recordedByEmail: string;
  recordedByRole: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Duplicate warning (reuses app/lib/business/duplicates.ts shape at the call site)
// ---------------------------------------------------------------------------

export type CanvassDuplicateWarning = {
  level: "exact" | "probable" | "possible" | "none";
  candidates: readonly { businessId: string; displayNameMasked: string }[];
};

// ---------------------------------------------------------------------------
// Canvassing intake payload (Quick Visit / Full Discovery / Finish Later)
// ---------------------------------------------------------------------------

export type CanvassMode = "quick_visit" | "full_discovery" | "finish_later";

export type CanvassIntakeInput = {
  mode: CanvassMode;
  confirmCreateDespiteDuplicates: boolean;
  businessName: string;
  publicFacingName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  googleBusinessLink: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  serviceAreaSummary: string | null;
  whatBusinessSells: string | null;
  immediateConcern: string | null;
  preferredLanguage: "es" | "en";
  preferredFollowUpChannel: "whatsapp" | "phone_call" | "sms" | "email" | null;
  consentPhotoCapture: boolean;
  consentFileUpload: boolean;
  consentSourceResearch: boolean;
  consentFollowupContact: boolean;
  notes: string | null;
  nextFollowUpDate: string | null;
};

export type CanvassIntakeResult =
  | {
      ok: true;
      businessId: string;
      discoverySessionId: string | null;
      duplicateWarning: CanvassDuplicateWarning;
      nextRoute: string;
    }
  | { ok: false; error: string; duplicateWarning?: CanvassDuplicateWarning };
