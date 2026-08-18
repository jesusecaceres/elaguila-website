/**
 * Provider-neutral video connection boundary.
 * Provider-specific SDKs must stay behind this interface.
 */

import type {
  HumanConnectionCapability,
  HumanConnectionHostSessionHint,
  HumanConnectionVisitorSafeSession,
} from "../humanConnectionTypes";

export type CreateEphemeralSessionInput = {
  profileSlug: string;
  visitorFirstName: string;
  reasonForVisit?: string | null;
  lang: "es" | "en";
  /** Absolute ISO expiry preference from orchestrator. */
  preferredExpiresAt: string;
};

export type CreateEphemeralSessionResult =
  | {
      ok: true;
      visitor: HumanConnectionVisitorSafeSession;
      host: HumanConnectionHostSessionHint;
    }
  | { ok: false; error: "not_configured" | "unhealthy" | "create_failed" };

export type HumanConnectionVideoProvider = {
  readonly id: string;
  isConfigured(): boolean;
  getCapability(): HumanConnectionCapability;
  createEphemeralSession(input: CreateEphemeralSessionInput): Promise<CreateEphemeralSessionResult>;
  /** Optional revoke — providers may no-op. */
  revokeSession?(sessionId: string): Promise<void>;
};
