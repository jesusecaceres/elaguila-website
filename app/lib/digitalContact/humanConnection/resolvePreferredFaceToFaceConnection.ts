/**
 * Build 09 — Preferred face-to-face (digital doorbell) resolver.
 *
 * Leonix owns discovery/routing. External platforms own video transport.
 * Daily/managed browser video is NOT required for this V1 path.
 */

import type { DigitalContactProfile } from "../digitalContactTypes";
import {
  validateFacetimeDestination,
  validateGoogleMeetUrl,
} from "./channelValidation";

export type FaceToFaceVideoProvider = "google_meet" | "facetime";

export type FaceToFaceVideoOption = {
  provider: FaceToFaceVideoProvider;
  /** Validated launch URL. */
  url: string;
  /** True only when destination truthfully opens a video/meeting experience. */
  isImmediateVideo: true;
  /** Presentation priority — lower first. */
  priority: number;
};

export type PreferredFaceToFaceResult = {
  slug: string;
  primary: FaceToFaceVideoOption | null;
  secondary: FaceToFaceVideoOption[];
  hasImmediateVideo: boolean;
};

export type ResolvePreferredFaceToFaceInput = {
  profile: DigitalContactProfile;
};

/**
 * Resolve owner-approved immediate video destinations from ECP.
 * Preference: Google Meet (universal) → FaceTime (when configured).
 * Does not invent destinations. Does not require Daily/Resend/DB.
 */
export function resolvePreferredFaceToFaceConnection(
  input: ResolvePreferredFaceToFaceInput,
): PreferredFaceToFaceResult {
  const profile = input.profile;
  const slug = profile.slug;
  const options: FaceToFaceVideoOption[] = [];

  const meetUrl = validateGoogleMeetUrl(profile.connectionDestinations?.googleMeetUrl);
  if (meetUrl) {
    options.push({
      provider: "google_meet",
      url: meetUrl,
      isImmediateVideo: true,
      priority: 10,
    });
  }

  const facetimeUrl = validateFacetimeDestination(profile.connectionDestinations?.facetimeUrl);
  if (facetimeUrl) {
    options.push({
      provider: "facetime",
      url: facetimeUrl,
      isImmediateVideo: true,
      priority: 20,
    });
  }

  options.sort((a, b) => a.priority - b.priority);
  const primary = options[0] ?? null;
  const secondary = options.slice(1);

  return {
    slug,
    primary,
    secondary,
    hasImmediateVideo: primary != null,
  };
}

/** Profiles that currently expose at least one approved immediate video destination. */
export function listProfilesWithFaceToFaceVideo(
  profiles: DigitalContactProfile[],
): Array<{ profile: DigitalContactProfile; faceToFace: PreferredFaceToFaceResult }> {
  const out: Array<{ profile: DigitalContactProfile; faceToFace: PreferredFaceToFaceResult }> = [];
  for (const profile of profiles) {
    if (!profile.active) continue;
    const faceToFace = resolvePreferredFaceToFaceConnection({ profile });
    if (faceToFace.hasImmediateVideo) {
      out.push({ profile, faceToFace });
    }
  }
  return out;
}
