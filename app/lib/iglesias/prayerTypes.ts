import type { PrayerCategoryKey, PrayerLanguage, PrayerVisibility } from "./prayerTaxonomy";

export type PrayerStatus =
  | "OPEN"
  | "STILL_NEEDS_PRAYER"
  | "UPDATE_POSTED"
  | "CLOSED"
  | "ANSWERED_OR_GRATITUDE"
  | "REMOVED"
  | "MODERATION_HOLD";

export type PrayerModerationStatus =
  | "PENDING"
  | "CLEARLY_SAFE"
  | "HUMAN_REVIEW"
  | "DISALLOWED"
  | "CRISIS_REVIEW";

export type PrayerSafetyDecision = "CLEARLY_SAFE" | "UNCERTAIN" | "CLEARLY_DISALLOWED" | "HIGH_RISK";

export type PrayerSafetyResult = {
  decision: PrayerSafetyDecision;
  reason_codes: string[];
  risk_level: "low" | "medium" | "high" | "critical" | null;
  contains_private_info: boolean;
  contains_third_party_pii: boolean;
  contains_spam: boolean;
  contains_threat: boolean;
  contains_hate: boolean;
  contains_self_harm_signal: boolean;
  contains_imminent_violence_signal: boolean;
  source: "ai_gateway" | "heuristic" | "ai_failure" | "combined";
};

export type PrayerPublicCard = {
  id: string;
  visibility: "PUBLIC_NAMED" | "PUBLIC_ANONYMOUS";
  language: PrayerLanguage;
  city: string | null;
  category: PrayerCategoryKey | null;
  displayName: string | null;
  anonymous: boolean;
  body: string;
  status: PrayerStatus;
  createdAt: string;
  acknowledgementCount: number;
  latestUpdate: {
    kind: "STILL_NEEDS_PRAYER" | "UPDATE" | "GRATITUDE" | "CLOSE";
    body: string | null;
    createdAt: string;
  } | null;
  owned: boolean;
  acknowledgedByViewer: boolean;
};

export type PrayerSubmitOutcome =
  | "PUBLISHED"
  | "HUMAN_REVIEW"
  | "PRIVATE_RECEIVED"
  | "CRISIS"
  | "DISALLOWED_HOLD";

export type PrayerRequestRow = {
  id: string;
  submitter_user_id: string | null;
  anonymous_session_hash: string | null;
  ip_hash: string | null;
  visibility: PrayerVisibility;
  language: PrayerLanguage;
  city: string | null;
  category: PrayerCategoryKey | null;
  display_name: string | null;
  body: string;
  body_normalized: string;
  body_original_internal: string | null;
  status: PrayerStatus;
  moderation_status: PrayerModerationStatus;
  risk_level: string | null;
  ai_decision: string | null;
  ai_reason_codes: string[] | null;
  contains_private_info: boolean;
  contains_third_party_pii: boolean;
  contains_spam: boolean;
  contains_threat: boolean;
  contains_hate: boolean;
  contains_self_harm_signal: boolean;
  contains_imminent_violence_signal: boolean;
  contact_consent: boolean;
  preferred_contact_method: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  closed_at: string | null;
};
