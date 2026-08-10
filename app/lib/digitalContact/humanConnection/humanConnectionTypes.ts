/**
 * Leonix Human Connection Layer (Build 04) — provider-neutral contracts.
 *
 * Separates executive eligibility, provider capability, session request/result,
 * and public visitor UI state. Do not mix these into React components.
 */

import type { ExecutivePublicAvailabilityState } from "../digitalContactTypes";

/** Why immediate video may or may not be offered. */
export type HumanConnectionVideoDenialReason =
  | "executive_missing"
  | "executive_inactive"
  | "allow_video_false"
  | "unknown_schedule"
  | "outside_hours"
  | "absence_active"
  | "presence_missing"
  | "presence_expired"
  | "presence_busy"
  | "presence_away"
  | "policy_hides_availability"
  | "not_freshly_available"
  | "provider_unconfigured"
  | "provider_unhealthy"
  | "kill_switch_off"
  | "notification_unconfigured"
  | "eligible";

export type HumanConnectionEligibility = {
  slug: string;
  offerImmediateVideo: boolean;
  reason: HumanConnectionVideoDenialReason;
  /** Build 03 public availability state used as an input — never trust alone. */
  publicAvailabilityState: ExecutivePublicAvailabilityState | null;
  allowVideo: boolean;
  allowScheduling: boolean;
  providerConfigured: boolean;
  /** Validated one-hop backup slug when primary is not video-eligible (may still lack video proof). */
  backupSlug: string | null;
  /** Backup may be offered for video only when backup itself is freshly eligible. */
  backupOfferImmediateVideo: boolean;
};

/** Provider capability snapshot (no secrets). */
export type HumanConnectionCapability = {
  providerId: string;
  configured: boolean;
  healthy: boolean;
  canCreateEphemeralSession: boolean;
  /** Always false in V1 — no recording. */
  supportsRecording: false;
};

export type HumanConnectionVisitorSafeSession = {
  sessionId: string;
  /** Visitor-safe join URL or token target — never host credentials. */
  visitorJoinUrl: string;
  expiresAt: string;
  providerId: string;
};

export type HumanConnectionHostSessionHint = {
  sessionId: string;
  /** Host join target — server/notification only; never sent to anonymous visitors. */
  hostJoinUrl: string;
  expiresAt: string;
};

export type HumanConnectionSessionResult =
  | {
      ok: true;
      visitor: HumanConnectionVisitorSafeSession;
      /** Present only in server-internal flows — stripped before client response. */
      host?: HumanConnectionHostSessionHint;
    }
  | {
      ok: false;
      error: HumanConnectionErrorCode;
      eligibilityReason?: HumanConnectionVideoDenialReason;
    };

export type HumanConnectionErrorCode =
  | "invalid_request"
  | "rate_limited"
  | "not_eligible"
  | "provider_unconfigured"
  | "provider_error"
  | "session_create_failed"
  | "notification_failed"
  | "kill_switch_off"
  | "executive_not_found";

/** Visitor-facing connection UI states — never claim CONNECTED without provider proof. */
export type HumanConnectionPublicState =
  | "idle"
  | "precall"
  | "requesting"
  | "ready"
  | "waiting"
  | "launched"
  | "no_answer"
  | "failed"
  | "expired";

export type HumanConnectionSurface = "virtual_front_desk" | "digital_contact";

export type HumanConnectionRequestInput = {
  profileSlug: string;
  visitorFirstName: string;
  reasonForVisit?: string | null;
  lang: "es" | "en";
  surface: HumanConnectionSurface;
  source?: string | null;
};

export type HumanConnectionPublicOffer = {
  slug: string;
  offerVideo: boolean;
  offerSchedule: boolean;
  videoReason: HumanConnectionVideoDenialReason;
  backupSlug: string | null;
  /** Public display name from ECP — never duplicated contact fields. */
  backupDisplayName: string | null;
  backupOfferVideo: boolean;
};

/** Temporary presence statuses — all must expire. */
export type ExecutivePresenceStatus = "available" | "busy" | "away";

export type ExecutivePresenceRecord = {
  profileSlug: string;
  status: ExecutivePresenceStatus;
  expiresAt: string;
  updatedAt: string;
  /** Staff identifier — never exposed publicly. */
  updatedBy: string | null;
};

export type ScheduleContactMethod = "email" | "phone" | "whatsapp";

export type ScheduleRequestInput = {
  profileSlug: string;
  visitorName: string;
  contactMethod: ScheduleContactMethod;
  email?: string | null;
  phone?: string | null;
  preferredTime: string;
  message?: string | null;
  lang: "es" | "en";
  surface: HumanConnectionSurface;
  source?: string | null;
};
