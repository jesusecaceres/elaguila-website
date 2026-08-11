/**
 * Central Human Connection Router (Build 06).
 *
 * Answers: "What truthful connection options can this executive offer?"
 * Consumed by /visitanos and /contact/{slug}. Does not own transport.
 */

import type { DigitalContactProfile } from "../digitalContactTypes";
import type { HumanConnectionSurface } from "./humanConnectionTypes";
import type {
  HumanConnectionChannel,
  HumanConnectionChannelType,
  HumanConnectionRouteResult,
} from "./channelTypes";
import {
  isValidPublicEmail,
  isValidPublicPhoneDigits,
  validateFacetimeDestination,
  validateGoogleMeetUrl,
} from "./channelValidation";
import { resolvePreferredFaceToFaceConnection } from "./resolvePreferredFaceToFaceConnection";

export type ManagedSessionOffers = {
  /**
   * Browser video (Daily or future adapter) may appear only when server eligibility is true.
   * Injected from status API / resolveVideoEligibility — never trust client inventing this.
   */
  browserVideo?: boolean;
  /**
   * Managed Google Meet session eligibility. Remains false until Meet adapter is configured.
   * Static Meet links alone must NOT set this true.
   */
  googleMeet?: boolean;
  /**
   * Schedule / follow-up REQUEST channel. Build 07: only when notify backend is ready
   * (e.g. Resend). Capability flags alone must not show a broken Schedule CTA.
   */
  scheduleRequest?: boolean;
};

export type ResolveHumanConnectionChannelsInput = {
  profile: DigitalContactProfile;
  surface: HumanConnectionSurface;
  /** When true (VFD), schedule request may appear even if allowScheduling is false. */
  forceOfferSchedule?: boolean;
  smsPrefill?: string;
  whatsappPrefill?: string;
  managed?: ManagedSessionOffers;
};

function whatsappDigitsFor(profile: DigitalContactProfile): string {
  const w = String(profile.whatsappDigits ?? "").replace(/\D/g, "");
  if (isValidPublicPhoneDigits(w)) return w;
  const p = String(profile.phoneDigits ?? "").replace(/\D/g, "");
  return isValidPublicPhoneDigits(p) ? p : "";
}

/**
 * Resolve ordered truthful channels from ECP data + managed session offers.
 * Unavailable / unconfigured channels are omitted (never shown disabled).
 */
export function resolveHumanConnectionChannels(
  input: ResolveHumanConnectionChannelsInput,
): HumanConnectionRouteResult {
  const profile = input.profile;
  const slug = profile.slug;
  const managed = input.managed ?? {};
  const forceSchedule =
    input.forceOfferSchedule === true || input.surface === "virtual_front_desk";

  const collected: HumanConnectionChannel[] = [];

  const phoneDigits = String(profile.phoneDigits ?? "").replace(/\D/g, "");
  const hasPhone = isValidPublicPhoneDigits(phoneDigits);
  const waDigits = whatsappDigitsFor(profile);
  const hasWhatsApp = isValidPublicPhoneDigits(waDigits);
  const hasEmail = isValidPublicEmail(profile.email);

  const facetimeUrl = validateFacetimeDestination(profile.connectionDestinations?.facetimeUrl);
  const hasFacetime = Boolean(facetimeUrl);
  const googleMeetUrl = validateGoogleMeetUrl(profile.connectionDestinations?.googleMeetUrl);
  const hasApprovedMeetLink = Boolean(googleMeetUrl);

  const hasBrowserVideo = managed.browserVideo === true;
  const hasGoogleMeetManaged = managed.googleMeet === true && !hasApprovedMeetLink;

  /** Immediate video via approved external destinations and/or eligible managed video. */
  const faceToFace = resolvePreferredFaceToFaceConnection({ profile });
  const hasExternalVideo = faceToFace.hasImmediateVideo;
  const hasLiveFaceToFace = hasBrowserVideo || hasExternalVideo || hasGoogleMeetManaged;

  // --- Face-to-face / video (when truthful) ---
  // Build 09: approved Google Meet URL is a DIRECT external destination (no Daily/Resend).
  // Preference: Meet link → FaceTime → managed browser video (dormant) → managed Meet API (dormant).
  if (hasApprovedMeetLink && googleMeetUrl) {
    collected.push({
      type: "google_meet",
      channelClass: "direct",
      priority: 5,
      presentation: "primary",
      action: { kind: "external_url", url: googleMeetUrl, channel: "google_meet" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasFacetime && facetimeUrl) {
    collected.push({
      type: "facetime",
      channelClass: "direct",
      priority: 15,
      presentation: hasApprovedMeetLink ? "secondary" : "primary",
      action: { kind: "external_url", url: facetimeUrl, channel: "facetime" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasBrowserVideo) {
    collected.push({
      type: "browser_video",
      channelClass: "managed_session",
      priority: 30,
      presentation: hasExternalVideo ? "secondary" : "primary",
      action: { kind: "managed_browser_video" },
      requiresPresence: true,
      requiresWorkingHours: true,
    });
  }

  if (hasGoogleMeetManaged) {
    collected.push({
      type: "google_meet",
      channelClass: "managed_session",
      priority: 35,
      presentation: hasExternalVideo || hasBrowserVideo ? "secondary" : "primary",
      action: { kind: "managed_google_meet" },
      requiresPresence: true,
      requiresWorkingHours: true,
    });
  }

  // --- Direct app / carrier channels ---
  // Order when no live F2F: Call → WhatsApp → SMS → Email (Build 02 hierarchy).
  // When live F2F exists: WhatsApp → Call → SMS → Email after live options.
  const directBase = hasLiveFaceToFace ? 100 : 40;

  if (hasLiveFaceToFace) {
    if (hasWhatsApp) {
      collected.push({
        type: "whatsapp",
        channelClass: "direct",
        priority: directBase,
        presentation: "secondary",
        action: {
          kind: "whatsapp",
          phoneDigits: waDigits,
          bodyPrefill: input.whatsappPrefill,
        },
        requiresPresence: false,
        requiresWorkingHours: false,
      });
    }
    if (hasPhone) {
      collected.push({
        type: "phone",
        channelClass: "direct",
        priority: directBase + 10,
        presentation: "secondary",
        action: { kind: "tel", phoneDigits },
        requiresPresence: false,
        requiresWorkingHours: false,
      });
    }
  } else {
    if (hasPhone) {
      collected.push({
        type: "phone",
        channelClass: "direct",
        priority: directBase,
        presentation: "primary",
        action: { kind: "tel", phoneDigits },
        requiresPresence: false,
        requiresWorkingHours: false,
      });
    }
    if (hasWhatsApp) {
      collected.push({
        type: "whatsapp",
        channelClass: "direct",
        priority: directBase + 10,
        presentation: "secondary",
        action: {
          kind: "whatsapp",
          phoneDigits: waDigits,
          bodyPrefill: input.whatsappPrefill,
        },
        requiresPresence: false,
        requiresWorkingHours: false,
      });
    }
  }

  if (hasPhone) {
    collected.push({
      type: "sms",
      channelClass: "direct",
      priority: directBase + 20,
      presentation: "secondary",
      action: {
        kind: "sms",
        phoneDigits,
        bodyPrefill: input.smsPrefill,
      },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasEmail) {
    collected.push({
      type: "email",
      channelClass: "direct",
      priority: directBase + 30,
      presentation: "tertiary",
      action: { kind: "mailto", email: profile.email.trim() },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  const scheduleCapability =
    forceSchedule || profile.capabilities?.allowScheduling === true;
  /** Backend gate — hide schedule when notify/persist path is not production-ready. */
  const scheduleBackendReady = managed.scheduleRequest === true;
  if (scheduleCapability && scheduleBackendReady) {
    collected.push({
      type: "schedule_request",
      channelClass: "direct",
      priority: 900,
      presentation: "tertiary",
      action: { kind: "schedule_request" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  // Deduplicate by type (safety)
  const seen = new Set<HumanConnectionChannelType>();
  const channels = collected
    .filter((c) => {
      if (seen.has(c.type)) return false;
      seen.add(c.type);
      return true;
    })
    .sort((a, b) => a.priority - b.priority);

  const primary = channels.find((c) => c.presentation === "primary") ?? channels[0] ?? null;

  return {
    slug,
    channels,
    primaryType: primary?.type ?? null,
    hasLiveFaceToFace,
  };
}

/** Pure helper for tests — channels that must never require Daily. */
export const DIRECT_CHANNELS_WITHOUT_MANAGED_VIDEO: HumanConnectionChannelType[] = [
  "phone",
  "sms",
  "whatsapp",
  "email",
  "facetime",
  "schedule_request",
];
