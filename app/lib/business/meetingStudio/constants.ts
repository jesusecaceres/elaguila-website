/**
 * Program 5 — Meeting Studio constants. Mirrors the enum/check conventions from
 * Program 4 and Living Book / Health Map / Stewardship.
 */

export const MEETING_STUDIO_FLAG_KEY = "business_meeting_studio";

export const MEETING_STATUSES: readonly string[] = [
  "planned",
  "prepared",
  "in_progress",
  "completed",
  "cancelled",
];

export const MEETING_TYPES: readonly string[] = [
  "discovery",
  "check_in",
  "proposal_review",
  "follow_up",
  "intake",
];

export const MEETING_LANGUAGES: readonly string[] = ["es", "en"];

export const ATTENDEE_TYPES: readonly string[] = ["owner", "staff", "external"];

export const ATTENDANCE_STATES: readonly string[] = [
  "confirmed",
  "tentative",
  "declined",
  "attended",
  "no_show",
];

export const MEETING_CONSENT_TYPES: readonly string[] = [
  "notes",
  "audio_recording",
  "transcription",
  "connected_account_review",
  "file_photo_review",
  "followup_messages",
];

export const MEETING_CONSENT_STATES: readonly string[] = [
  "provided",
  "declined",
  "withdrawn",
];

export const MEETING_CONSENT_METHODS: readonly string[] = [
  "verbal",
  "written",
  "digital_acknowledgment",
];

export const MEETING_NOTE_TYPES: readonly string[] = [
  "owner_statement",
  "staff_observation",
  "potential_fact",
  "unknown",
  "contradiction",
  "decision",
  "action_item",
];

export const MEETING_NOTE_SOURCE_CLASSES: readonly string[] = [
  "owner_stated",
  "staff_observed",
  "system_derived",
  "ai_inference",
];

export const MEETING_NOTE_VISIBILITIES: readonly string[] = [
  "staff_only",
  "shared_with_owner",
];

export const MEETING_NOTE_SENSITIVITIES: readonly string[] = [
  "normal",
  "sensitive",
];

export const TRANSCRIPT_IMPORT_METHODS: readonly string[] = ["manual_import"];

export const TRANSCRIPT_IMPORT_STATUSES: readonly string[] = [
  "imported",
  "reviewed",
  "rejected",
];

export const MEETING_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  planned: ["prepared", "cancelled"],
  prepared: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isValidMeetingStatusTransition(
  from: string,
  to: string,
): boolean {
  const allowed = MEETING_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export const COCKPIT_BRIEFING_VERSION = "v1";
