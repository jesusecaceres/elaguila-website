export type { HumanConnectionVideoProvider, CreateEphemeralSessionInput, CreateEphemeralSessionResult } from "./providers/types";
export { getHumanConnectionVideoProvider, isHumanConnectionVideoProviderReady } from "./providers/getVideoProvider";
export { unconfiguredVideoProvider } from "./providers/unconfiguredProvider";
export { resolveVideoEligibility } from "./resolveVideoEligibility";
export type { ResolveVideoEligibilityInput } from "./resolveVideoEligibility";
export {
  isHumanConnectionVideoEnabled,
  isHumanConnectionNotificationReady,
} from "./videoKillSwitch";
export { isHumanConnectionScheduleEnabled } from "./videoKillSwitch";
export { resolveHumanConnectionChannels } from "./resolveHumanConnectionChannels";
export type { ResolveHumanConnectionChannelsInput, ManagedSessionOffers } from "./resolveHumanConnectionChannels";
export {
  resolvePreferredFaceToFaceConnection,
  listProfilesWithFaceToFaceVideo,
} from "./resolvePreferredFaceToFaceConnection";
export type {
  PreferredFaceToFaceResult,
  FaceToFaceVideoOption,
  FaceToFaceVideoProvider,
  ResolvePreferredFaceToFaceInput,
} from "./resolvePreferredFaceToFaceConnection";
export { getFaceToFaceCopy, providerOpensLabel, videoRoomHintForProvider } from "./faceToFaceCopy";
export type { FaceToFaceCopy } from "./faceToFaceCopy";
export * from "./channelTypes";
export * from "./humanConnectionTypes";
export * from "./constants";
export { getHumanConnectionCopy } from "./humanConnectionCopy";
export type { HumanConnectionCopy } from "./humanConnectionCopy";
export { getConnectionChannelCopy, labelForChannel } from "./connectionChannelCopy";
export {
  capabilityForChannel,
  isVideoRoomChannel,
  isAppConnectionChannel,
  isNativeContactFallbackChannel,
} from "./connectionCapability";
export type { ConnectionCapabilityKind } from "./connectionCapability";
export {
  validateGoogleMeetUrl,
  validateMicrosoftTeamsUrl,
  validateMessengerUrl,
  validateInstagramUrl,
  validateFacetimeDestination,
  isValidPublicPhoneDigits,
  isValidPublicEmail,
} from "./channelValidation";
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


