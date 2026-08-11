/**
 * Human Connection Router — channel domain (Build 06).
 * Primary concept: CONNECTION CHANNEL (not video provider).
 */

export type HumanConnectionChannelType =
  | "phone"
  | "sms"
  | "whatsapp"
  | "facetime"
  | "google_meet"
  | "browser_video"
  | "email"
  | "schedule_request"
  /** Future-ready only — not implemented in V1. */
  | "zoom"
  | "teams"
  | "messenger";

/** CLASS A = direct/app launch. CLASS B = managed session (provider credentials). */
export type HumanConnectionChannelClass = "direct" | "managed_session";

export type HumanConnectionChannelAction =
  | { kind: "tel"; phoneDigits: string }
  | { kind: "sms"; phoneDigits: string; bodyPrefill?: string }
  | { kind: "whatsapp"; phoneDigits: string; bodyPrefill?: string }
  | { kind: "mailto"; email: string }
  | { kind: "external_url"; url: string; channel: "facetime" | "google_meet" }
  | { kind: "managed_browser_video" }
  | { kind: "managed_google_meet" }
  | { kind: "schedule_request" };

/**
 * One truthful, launchable connection option for a visitor.
 * Destinations reference ECP public data — never duplicated identity.
 */
export type HumanConnectionChannel = {
  type: HumanConnectionChannelType;
  channelClass: HumanConnectionChannelClass;
  /** Lower = higher priority. */
  priority: number;
  /** Presentation tier for CRO. */
  presentation: "primary" | "secondary" | "tertiary";
  action: HumanConnectionChannelAction;
  requiresPresence: boolean;
  requiresWorkingHours: boolean;
};

export type HumanConnectionRouteResult = {
  slug: string;
  channels: HumanConnectionChannel[];
  /** First primary channel type, if any. */
  primaryType: HumanConnectionChannelType | null;
  hasLiveFaceToFace: boolean;
};

/**
 * Optional ECP destinations for channels that are NOT already on the profile
 * (phone/email/WhatsApp stay on profile fields — do not duplicate).
 * Never invent values in production registry.
 */
export type ExecutiveConnectionDestinations = {
  /**
   * Approved FaceTime-compatible public destination only
   * (e.g. facetime: link or Apple FaceTime https link). Never a private Apple ID dump.
   */
  facetimeUrl?: string | null;
  /**
   * Owner-approved Google Meet HTTPS URL (meet.google.com).
   * Used as a DIRECT external video destination — not a managed Meet API session.
   * Do NOT invent. Leave absent until owner provides an approved link.
   */
  googleMeetUrl?: string | null;
};
