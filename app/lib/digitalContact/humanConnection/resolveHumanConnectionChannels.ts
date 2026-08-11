/**
 * Central Human Connection Router (Build 06 / Build 10).
 *
 * Answers: "What truthful connection options can this executive offer?"
 * Consumed by /visitanos and /contact/{slug}. Does not own transport.
 * Destinations come from ECP only — never invent platform URLs.
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
  validateInstagramUrl,
  validateMessengerUrl,
  validateMicrosoftTeamsUrl,
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
  const teamsUrl = validateMicrosoftTeamsUrl(profile.connectionDestinations?.microsoftTeamsUrl);
  const hasTeams = Boolean(teamsUrl);
  const messengerUrl = validateMessengerUrl(profile.connectionDestinations?.messengerUrl);
  const hasMessenger = Boolean(messengerUrl);
  const instagramUrl = validateInstagramUrl(profile.connectionDestinations?.instagramUrl);
  const hasInstagram = Boolean(instagramUrl);

  const hasBrowserVideo = managed.browserVideo === true;
  const hasGoogleMeetManaged = managed.googleMeet === true && !hasApprovedMeetLink;

  /** Immediate video via approved external destinations and/or eligible managed video. */
  const faceToFace = resolvePreferredFaceToFaceConnection({ profile });
  const hasExternalVideo = faceToFace.hasImmediateVideo;
  /** Build 11: Daily managed browser video is the primary face-to-face path when offered. */
  const hasLiveFaceToFace = hasBrowserVideo || hasExternalVideo || hasGoogleMeetManaged;

  // --- Face-to-face / video ---
  // Preference: Daily (managed) → Meet room → Teams → FaceTime → managed Meet API (dormant).
  if (hasBrowserVideo) {
    collected.push({
      type: "browser_video",
      channelClass: "managed_session",
      priority: 1,
      presentation: "primary",
      action: { kind: "managed_browser_video" },
      requiresPresence: false,
      requiresWorkingHours: true,
    });
  }

  if (hasApprovedMeetLink && googleMeetUrl) {
    collected.push({
      type: "google_meet",
      channelClass: "direct",
      priority: hasBrowserVideo ? 25 : 5,
      presentation: hasBrowserVideo ? "secondary" : "primary",
      action: { kind: "external_url", url: googleMeetUrl, channel: "google_meet" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasTeams && teamsUrl) {
    collected.push({
      type: "teams",
      channelClass: "direct",
      priority: 28,
      presentation: hasBrowserVideo || hasApprovedMeetLink ? "secondary" : "primary",
      action: { kind: "external_url", url: teamsUrl, channel: "teams" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasFacetime && facetimeUrl) {
    collected.push({
      type: "facetime",
      channelClass: "direct",
      priority: 30,
      presentation: hasBrowserVideo || hasApprovedMeetLink || hasTeams ? "secondary" : "primary",
      action: { kind: "external_url", url: facetimeUrl, channel: "facetime" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasGoogleMeetManaged) {
    collected.push({
      type: "google_meet",
      channelClass: "managed_session",
      priority: 35,
      presentation: "secondary",
      action: { kind: "managed_google_meet" },
      requiresPresence: true,
      requiresWorkingHours: true,
    });
  }

  // --- App messaging / DM (only when approved destinations exist) ---
  // WhatsApp uses profile phone/whatsapp digits — never a duplicated destination URL.
  const appBase = hasLiveFaceToFace ? 60 : 50;

  if (hasWhatsApp) {
    collected.push({
      type: "whatsapp",
      channelClass: "direct",
      priority: appBase,
      presentation: hasLiveFaceToFace ? "secondary" : "secondary",
      action: {
        kind: "whatsapp",
        phoneDigits: waDigits,
        bodyPrefill: input.whatsappPrefill,
      },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasMessenger && messengerUrl) {
    collected.push({
      type: "messenger",
      channelClass: "direct",
      priority: appBase + 5,
      presentation: "secondary",
      action: { kind: "external_url", url: messengerUrl, channel: "messenger" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  if (hasInstagram && instagramUrl) {
    collected.push({
      type: "instagram",
      channelClass: "direct",
      priority: appBase + 10,
      presentation: "secondary",
      action: { kind: "external_url", url: instagramUrl, channel: "instagram" },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
  }

  // --- Carrier / native contact fallbacks ---
  // Order when no live F2F: Call first as primary; when F2F exists, demote to secondary.
  const directBase = hasLiveFaceToFace ? 100 : 40;

  if (hasPhone) {
    collected.push({
      type: "phone",
      channelClass: "direct",
      priority: hasLiveFaceToFace ? directBase + 10 : directBase,
      presentation: hasLiveFaceToFace ? "secondary" : "primary",
      action: { kind: "tel", phoneDigits },
      requiresPresence: false,
      requiresWorkingHours: false,
    });
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
  "google_meet",
  "teams",
  "messenger",
  "instagram",
  "schedule_request",
];
