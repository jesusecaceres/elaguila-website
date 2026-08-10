import "server-only";

import { getDigitalContactProfile } from "../digitalContactRegistry";
import type { DigitalContactLang, DigitalContactProfile } from "../digitalContactTypes";
import { enrichProfileWithLivePresence } from "./enrichProfileWithPresence";
import { getHumanConnectionVideoProvider } from "./providers/getVideoProvider";
import { resolveVideoEligibility } from "./resolveVideoEligibility";
import {
  isHumanConnectionNotificationReady,
  isHumanConnectionVideoEnabled,
} from "./videoKillSwitch";
import type { HumanConnectionPublicOffer, HumanConnectionSurface } from "./humanConnectionTypes";

export type ResolvePublicOfferInput = {
  profileSlug: string;
  lang?: DigitalContactLang;
  surface: HumanConnectionSurface;
  now?: Date;
  forceOfferSchedule?: boolean;
};

/**
 * Public-safe offer flags for visitor UI. No staff metadata, no host credentials.
 */
export async function resolveHumanConnectionPublicOffer(
  input: ResolvePublicOfferInput,
): Promise<HumanConnectionPublicOffer | null> {
  const slug = String(input.profileSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return null;

  const base = getDigitalContactProfile(slug);
  if (!base) return null;

  const now = input.now ?? new Date();
  const lang = input.lang === "en" ? "en" : "es";
  const profile: DigitalContactProfile = await enrichProfileWithLivePresence(base, now);

  const provider = getHumanConnectionVideoProvider();
  const cap = provider.getCapability();
  const videoEnabled = isHumanConnectionVideoEnabled();
  const notificationReady = isHumanConnectionNotificationReady();

  const eligibility = resolveVideoEligibility({
    profile,
    now,
    lang,
    lookupProfile: asyncLookupSync,
    providerConfigured: provider.isConfigured() && cap.configured,
    providerHealthy: cap.healthy && cap.canCreateEphemeralSession,
    videoEnabled,
    notificationReady,
  });

  let backupOfferVideo = false;
  let backupDisplayName: string | null = null;
  if (eligibility.backupSlug) {
    const backupBase = getDigitalContactProfile(eligibility.backupSlug);
    if (backupBase) {
      backupDisplayName = backupBase.preferredName || backupBase.fullName;
      const backupEnriched = await enrichProfileWithLivePresence(backupBase, now);
      const backupElig = resolveVideoEligibility({
        profile: backupEnriched,
        now,
        lang,
        lookupProfile: () => null,
        providerConfigured: provider.isConfigured() && cap.configured,
        providerHealthy: cap.healthy && cap.canCreateEphemeralSession,
        videoEnabled,
        notificationReady,
      });
      backupOfferVideo = backupElig.offerImmediateVideo;
    }
  }

  const forceSchedule =
    input.forceOfferSchedule === true || input.surface === "virtual_front_desk";
  const scheduleCapability = forceSchedule || eligibility.allowScheduling === true;
  /**
   * Build 07 — Schedule CTA only when a real notify path exists (Resend).
   * Capability alone must not expose a form that reports fake success.
   */
  const offerSchedule = scheduleCapability && notificationReady;

  return {
    slug: profile.slug,
    offerVideo: eligibility.offerImmediateVideo,
    offerSchedule,
    videoReason: eligibility.reason,
    backupSlug: eligibility.backupSlug,
    backupDisplayName,
    backupOfferVideo,
  };
}

function asyncLookupSync(slug: string): DigitalContactProfile | null {
  return getDigitalContactProfile(slug);
}
