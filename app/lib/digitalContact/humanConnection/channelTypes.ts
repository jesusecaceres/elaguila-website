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
  | "zoom"
  | "teams"
  | "messenger"
  | "instagram";

/** CLASS A = direct/app launch. CLASS B = managed session (provider credentials). */
export type HumanConnectionChannelClass = "direct" | "managed_session";

export type HumanConnectionExternalUrlChannel =
  | "facetime"
  | "google_meet"
  | "teams"
  | "messenger"
  | "instagram";

export type HumanConnectionChannelAction =
  | { kind: "tel"; phoneDigits: string }
  | { kind: "sms"; phoneDigits: string; bodyPrefill?: string }
  | { kind: "whatsapp"; phoneDigits: string; bodyPrefill?: string }
  | { kind: "mailto"; email: string }
  | { kind: "external_url"; url: string; channel: HumanConnectionExternalUrlChannel }
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
 * (phone/email/WhatsApp digits stay on profile fields — do not duplicate WhatsApp truth).
 * Never invent values in production registry. Missing = hide channel.
 */
export type ExecutiveConnectionDestinations = {
  /**
   * Approved FaceTime-compatible public destination only
   * (e.g. facetime: link or Apple FaceTime https link). Never a private Apple ID dump.
   * Optional future client type — not required for Leonix V1 (Android-first).
   */
  facetimeUrl?: string | null;
  /**
   * Owner-approved Google Meet HTTPS URL (meet.google.com).
   * VIDEO ROOM — not a guaranteed ringing call. Do NOT invent.
   */
  googleMeetUrl?: string | null;
  /**
   * Owner-approved Microsoft Teams meeting HTTPS URL.
   * VIDEO ROOM. Do NOT invent.
   */
  microsoftTeamsUrl?: string | null;
  /**
   * Owner-approved Facebook Messenger HTTPS destination (e.g. m.me/…).
   * Messaging / direct communication — not a proven video call. Do NOT invent.
   */
  messengerUrl?: string | null;
  /**
   * Owner-approved Instagram HTTPS destination (profile or ig.me message link).
   * Messaging / direct communication — not a proven video call. Do NOT invent.
   */
  instagramUrl?: string | null;
};
