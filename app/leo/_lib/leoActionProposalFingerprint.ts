import { createHash } from "node:crypto";

import type {
  LeoActionProposalActionFamily,
  LeoActionProposalNormalizedTarget,
  LeoActionProposalReferentSnapshot,
  LeoActionProposalStructuredPayload,
} from "@/app/leo/_lib/leoActionProposalTypes";

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  const parts: string[] = [];
  for (const k of keys) {
    parts.push(`${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  }
  return `{${parts.join(",")}}`;
}

export type LeoActionProposalFingerprintInput = {
  /**
   * Immutable approval identity: include owner actor so approval cannot be
   * transferred across owners even if the payload matches.
   */
  ownerActorId: string;
  actionFamily: LeoActionProposalActionFamily;

  normalizedTarget: LeoActionProposalNormalizedTarget;
  structuredPayload: LeoActionProposalStructuredPayload;
  /**
   * Bounded referent identity only (no full transcripts).
   * This is the place where threadId/eventId/recipient resolution identity lands.
   */
  referentSnapshot: LeoActionProposalReferentSnapshot;
};

/**
 * Deterministic, retry-stable proposal fingerprint.
 *
 * Contract: exclude timestamps, random values, UI state, transient request ids.
 */
export function computeLeoActionProposalFingerprint(
  input: LeoActionProposalFingerprintInput,
): string {
  const raw = stableStringify({
    ownerActorId: input.ownerActorId,
    actionFamily: input.actionFamily,
    normalizedTarget: input.normalizedTarget,
    structuredPayload: input.structuredPayload,
    referentSnapshot: input.referentSnapshot,
  });
  return createHash("sha256").update(raw).digest("hex").slice(0, 64);
}

