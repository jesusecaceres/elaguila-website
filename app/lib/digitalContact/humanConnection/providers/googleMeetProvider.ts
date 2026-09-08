import "server-only";

import type { HumanConnectionVideoProvider } from "./types";
import type { HumanConnectionCapability } from "../humanConnectionTypes";

/**
 * Google Meet managed-session adapter seam (Build 06).
 *
 * UNCONFIGURED by design — no Google credentials invented.
 * Wire a real Meet Calendar/Meet API adapter here later without rewriting /visitanos.
 *
 * Static permanent Meet links on an executive profile are NOT treated as live availability.
 */
export const unconfiguredGoogleMeetProvider: HumanConnectionVideoProvider = {
  id: "google_meet_unconfigured",
  isConfigured() {
    return false;
  },
  getCapability(): HumanConnectionCapability {
    return {
      providerId: "google_meet_unconfigured",
      configured: false,
      healthy: false,
      canCreateEphemeralSession: false,
      supportsRecording: false,
    };
  },
  async createEphemeralSession() {
    return { ok: false, error: "not_configured" };
  },
};

export function isGoogleMeetManagedProviderReady(): boolean {
  const id = String(process.env.HUMAN_CONNECTION_MEET_PROVIDER ?? "")
    .trim()
    .toLowerCase();
  // Future: if (id === "google_meet" && hasGoogleCreds()) return true;
  if (id === "google_meet") {
    console.warn(
      "[human-connection] HUMAN_CONNECTION_MEET_PROVIDER=google_meet but Meet adapter is not implemented; remaining unconfigured",
    );
  }
  return false;
}
