import {
  COMMUNITY_STAGED_PUBLISH_KEYS,
  type CommunityKind,
} from "../constants/communitySessionKeys";
import type { CommunityPublishEnvelope } from "./communityPublishSnapshots";

export function writeCommunityStagedPublish(
  kind: CommunityKind,
  envelope: CommunityPublishEnvelope
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(COMMUNITY_STAGED_PUBLISH_KEYS[kind], JSON.stringify(envelope));
  } catch {
    /* quota / private mode */
  }
}

export function readCommunityStagedPublish(
  kind: CommunityKind
): CommunityPublishEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COMMUNITY_STAGED_PUBLISH_KEYS[kind]);
    if (!raw) return null;
    return JSON.parse(raw) as CommunityPublishEnvelope;
  } catch {
    return null;
  }
}

export function clearCommunityStagedPublish(kind: CommunityKind): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(COMMUNITY_STAGED_PUBLISH_KEYS[kind]);
  } catch {
    /* ignore */
  }
}
