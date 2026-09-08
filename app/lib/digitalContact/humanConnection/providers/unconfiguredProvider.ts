import type { HumanConnectionVideoProvider } from "./types";
import type { HumanConnectionCapability } from "../humanConnectionTypes";

/**
 * Default production-safe adapter: explicitly unconfigured.
 * Wire a real hosted ephemeral-room provider here without touching /visitanos or /contact.
 */
export const unconfiguredVideoProvider: HumanConnectionVideoProvider = {
  id: "unconfigured",
  isConfigured() {
    return false;
  },
  getCapability(): HumanConnectionCapability {
    return {
      providerId: "unconfigured",
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
