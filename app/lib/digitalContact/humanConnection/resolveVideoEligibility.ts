/**
 * Central immediate-video eligibility (Build 04 → Build 11 doorbell).
 *
 * Build 11 V1 digital doorbell:
 * - Office hours + allowVideo + configured provider are enough to OFFER the CTA.
 * - Manual temporary presence is NOT required for the doorbell button.
 * - Fresh "available" presence is NEVER claimed in visitor copy from this flag alone.
 * - If staff marked busy/away with fresh presence, fail closed (do not offer).
 * - Notification readiness does NOT block offering (notify is best-effort at request time).
 */

import { resolveExecutivePublicAvailability } from "../resolveExecutivePublicAvailability";
import type { DigitalContactLang, DigitalContactProfile } from "../digitalContactTypes";
import type {
  HumanConnectionEligibility,
  HumanConnectionVideoDenialReason,
} from "./humanConnectionTypes";

export type ResolveVideoEligibilityInput = {
  profile: DigitalContactProfile | null | undefined;
  now?: Date;
  lang?: DigitalContactLang;
  lookupProfile: (slug: string) => DigitalContactProfile | null;
  /** Injected so unit tests can force configured/unconfigured without env. */
  providerConfigured: boolean;
  providerHealthy?: boolean;
  /** Kill switch — when false, immediate video is refused. Default true for pure unit tests. */
  videoEnabled?: boolean;
  /**
   * Legacy notify gate. Build 11: ignored for offering the doorbell.
   * Notification is attempted at session-create time and must not block the CTA.
   */
  notificationReady?: boolean;
};

function denial(
  slug: string,
  reason: HumanConnectionVideoDenialReason,
  extras: Partial<HumanConnectionEligibility> = {},
): HumanConnectionEligibility {
  return {
    slug,
    offerImmediateVideo: false,
    reason,
    publicAvailabilityState: extras.publicAvailabilityState ?? null,
    allowVideo: extras.allowVideo ?? false,
    allowScheduling: extras.allowScheduling ?? false,
    providerConfigured: extras.providerConfigured ?? false,
    backupSlug: extras.backupSlug ?? null,
    backupOfferImmediateVideo: extras.backupOfferImmediateVideo ?? false,
  };
}

/**
 * Decide whether immediate face-to-face video may be offered for this executive.
 * Always re-run on the server before creating a session.
 */
export function resolveVideoEligibility(
  input: ResolveVideoEligibilityInput,
): HumanConnectionEligibility {
  const now = input.now ?? new Date();
  const lang = input.lang === "en" ? "en" : "es";
  const providerConfigured = input.providerConfigured === true;
  const providerHealthy = input.providerHealthy !== false;
  const videoEnabled = input.videoEnabled !== false;

  const profile = input.profile;
  if (!profile) {
    return denial("unknown", "executive_missing", { providerConfigured });
  }

  const slug = profile.slug;
  if (!profile.active) {
    return denial(slug, "executive_inactive", { providerConfigured });
  }

  if (!videoEnabled) {
    return denial(slug, "kill_switch_off", {
      providerConfigured,
      allowVideo: profile.capabilities?.allowVideo === true,
      allowScheduling: profile.capabilities?.allowScheduling === true,
    });
  }

  const avail = resolveExecutivePublicAvailability({
    profile,
    now,
    lang,
    lookupProfile: input.lookupProfile,
  });

  const allowVideo = avail.capabilities.allowVideo === true;
  const allowScheduling = avail.capabilities.allowScheduling === true;
  const baseExtras: Partial<HumanConnectionEligibility> = {
    publicAvailabilityState: avail.publicAvailabilityState,
    allowVideo,
    allowScheduling,
    providerConfigured,
    backupSlug: avail.backupSlug,
  };

  // Evaluate backup video eligibility (one hop) for handoff — never recursive.
  let backupOfferImmediateVideo = false;
  if (avail.backupSlug) {
    const backupProfile = input.lookupProfile(avail.backupSlug);
    if (backupProfile) {
      const backupElig = resolveVideoEligibility({
        profile: backupProfile,
        now,
        lang,
        lookupProfile: () => null, // block recursive backup chains
        providerConfigured,
        providerHealthy,
        videoEnabled,
        notificationReady: input.notificationReady,
      });
      backupOfferImmediateVideo = backupElig.offerImmediateVideo;
    }
  }
  baseExtras.backupOfferImmediateVideo = backupOfferImmediateVideo;

  if (!allowVideo) {
    return denial(slug, "allow_video_false", baseExtras);
  }

  if (avail.absenceActive || avail.publicAvailabilityState === "absent") {
    return denial(slug, "absence_active", baseExtras);
  }

  if (avail.publicAvailabilityState === "unknown_schedule" || avail.withinWorkingHours === null) {
    return denial(slug, "unknown_schedule", baseExtras);
  }

  if (avail.withinWorkingHours === false || avail.publicAvailabilityState === "outside_hours") {
    return denial(slug, "outside_hours", baseExtras);
  }

  // Soft presence: only deny when a FRESH busy/away signal exists.
  // Missing / expired presence does NOT block the V1 office-hours doorbell.
  const presence = profile.temporaryPresence;
  if (presence) {
    const expiresAt = Date.parse(presence.expiresAt);
    const setAt = Date.parse(presence.setAt);
    const fresh =
      Number.isFinite(expiresAt) &&
      Number.isFinite(setAt) &&
      expiresAt > setAt &&
      now.getTime() < expiresAt;

    if (fresh) {
      if (presence.status === "busy" || avail.publicAvailabilityState === "busy") {
        return denial(slug, "presence_busy", baseExtras);
      }
      if (presence.status === "away" || avail.publicAvailabilityState === "away") {
        return denial(slug, "presence_away", baseExtras);
      }
    }
  }

  if (!providerConfigured) {
    return denial(slug, "provider_unconfigured", baseExtras);
  }
  if (!providerHealthy) {
    return denial(slug, "provider_unhealthy", baseExtras);
  }

  return {
    slug,
    offerImmediateVideo: true,
    reason: "eligible",
    publicAvailabilityState: avail.publicAvailabilityState,
    allowVideo: true,
    allowScheduling,
    providerConfigured: true,
    backupSlug: avail.backupSlug,
    backupOfferImmediateVideo,
  };
}
