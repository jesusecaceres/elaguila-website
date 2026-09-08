import "server-only";

import type { DigitalContactProfile } from "../digitalContactTypes";
import { getExecutivePresenceForSlug } from "./presenceServer";

/**
 * Merge DB-backed temporary presence onto an ECP registry profile.
 * Registry remains identity SoT; presence is the live truth overlay.
 * Never invents presence when the row is missing/expired.
 */
export async function enrichProfileWithLivePresence(
  profile: DigitalContactProfile,
  now: Date = new Date(),
): Promise<DigitalContactProfile> {
  const presence = await getExecutivePresenceForSlug(profile.slug, now);
  if (!presence) {
    // Strip any accidental registry presence — production must not seed fake availability.
    if (profile.temporaryPresence == null) return profile;
    const { temporaryPresence: _removed, ...rest } = profile;
    return rest;
  }
  return { ...profile, temporaryPresence: presence };
}

export async function enrichProfilesWithLivePresence(
  profiles: DigitalContactProfile[],
  now: Date = new Date(),
): Promise<DigitalContactProfile[]> {
  return Promise.all(profiles.map((p) => enrichProfileWithLivePresence(p, now)));
}
