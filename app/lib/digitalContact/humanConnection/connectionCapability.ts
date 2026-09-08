/**
 * Build 10 — truthful connection capability metadata.
 * Platforms are not equivalent; UI must not claim video when the contract is messaging.
 */

import type { HumanConnectionChannelType } from "./channelTypes";

export type ConnectionCapabilityKind =
  | "video_room"
  | "direct_video"
  | "direct_communication"
  | "messaging"
  | "phone"
  | "email"
  | "managed_video";

const CAPABILITY_BY_CHANNEL: Record<HumanConnectionChannelType, ConnectionCapabilityKind> = {
  google_meet: "video_room",
  teams: "video_room",
  facetime: "direct_video",
  browser_video: "managed_video",
  zoom: "video_room",
  whatsapp: "messaging",
  messenger: "messaging",
  instagram: "messaging",
  sms: "messaging",
  phone: "phone",
  email: "email",
  schedule_request: "messaging",
};

export function capabilityForChannel(type: HumanConnectionChannelType): ConnectionCapabilityKind {
  return CAPABILITY_BY_CHANNEL[type];
}

/** Video-room / immediate video destinations shown in the face-to-face area. */
export function isVideoRoomChannel(type: HumanConnectionChannelType): boolean {
  const kind = capabilityForChannel(type);
  return kind === "video_room" || kind === "direct_video" || kind === "managed_video";
}

/** App-based messaging / DM channels (not carrier phone/SMS/email). */
export function isAppConnectionChannel(type: HumanConnectionChannelType): boolean {
  return type === "whatsapp" || type === "messenger" || type === "instagram";
}

/** Carrier / native contact fallbacks. */
export function isNativeContactFallbackChannel(type: HumanConnectionChannelType): boolean {
  return type === "phone" || type === "sms" || type === "email";
}
