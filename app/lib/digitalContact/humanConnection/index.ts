export type { HumanConnectionVideoProvider, CreateEphemeralSessionInput, CreateEphemeralSessionResult } from "./providers/types";
export { getHumanConnectionVideoProvider, isHumanConnectionVideoProviderReady } from "./providers/getVideoProvider";
export { unconfiguredVideoProvider } from "./providers/unconfiguredProvider";
export { resolveVideoEligibility } from "./resolveVideoEligibility";
export type { ResolveVideoEligibilityInput } from "./resolveVideoEligibility";
export {
  isHumanConnectionVideoEnabled,
  isHumanConnectionNotificationReady,
} from "./videoKillSwitch";
export { resolveHumanConnectionChannels } from "./resolveHumanConnectionChannels";
export type { ResolveHumanConnectionChannelsInput, ManagedSessionOffers } from "./resolveHumanConnectionChannels";
export * from "./channelTypes";
export * from "./humanConnectionTypes";
export * from "./constants";
export { getHumanConnectionCopy } from "./humanConnectionCopy";
export type { HumanConnectionCopy } from "./humanConnectionCopy";
export { getConnectionChannelCopy, labelForChannel } from "./connectionChannelCopy";
export {
  buildTelHref,
  buildSmsHref,
  buildWhatsAppUrl,
  buildMailtoHref,
} from "./nativeChannelHrefs";
export {
  evaluateHumanConnectionLaunchReadiness,
  getDefaultBuild07LaunchEvidence,
  isScheduleRequestBackendReady,
} from "./launchReadiness";
export type { HumanConnectionLaunchReadiness, LaunchReadinessEvidence } from "./launchReadiness";


