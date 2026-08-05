/** TODAY-2 — DIY Concierge constants. */

export const DIY_CONCIERGE_FLAG_KEY = "business_diy_concierge";

/** Bumped whenever actionRegistry.ts templates change in a way that affects selection or content. */
export const DIY_REGISTRY_VERSION = "diy-concierge-2026-08-08.1";

export const DIY_ACTION_STATUSES = [
  "available",
  "in_progress",
  "awaiting_evidence",
  "awaiting_owner_confirmation",
  "completed",
  "postponed",
  "blocked",
  "no_longer_applicable",
  "cancelled",
] as const;

export const DIY_OWNER_DECISIONS = [
  "start",
  "continue",
  "mark_ready_for_review",
  "confirm_completion",
  "postpone",
  "resume",
  "decline",
  "request_guidance",
  "request_managed_service",
] as const;

export const DIY_EVIDENCE_TYPES = [
  "owner_attestation",
  "url",
  "text_note",
  "checklist_confirmation",
  "file_reference",
  "business_fact_reference",
  "listing_reference",
  "staff_confirmation",
] as const;

export const APPROVAL_REQUEST_TYPES = [
  "action_completion_confirmation",
  "owner_correction_confirmation",
  "concierge_guidance_request",
  "managed_service_request",
  "postponement_review",
  "resume_decision",
  "content_draft_approval",
] as const;

export const APPROVAL_STATUSES = ["pending", "approved", "declined", "withdrawn", "expired", "superseded"] as const;

export const SERVICE_REQUEST_TYPES = ["guide_me_concierge", "let_leonix_handle_it"] as const;

export const SERVICE_REQUEST_URGENCIES = ["no_rush", "soon", "urgent"] as const;

export const MAX_NOTE_LENGTH = 2000;
