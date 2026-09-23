/**
 * LEO FINAL-02 proposal fingerprinting — pure, fixture-safe, deliberately NOT
 * server-only so it is directly unit-testable. A content-tamper check, never
 * a secret and never a capability grant — see leoActionExecutionService.ts.
 */
import { createHash } from "node:crypto";

import type { LeoConnectedActionProposal } from "@/app/leo/_lib/leoTypes";

/**
 * Recursively sort object keys so structurally-identical content always
 * serializes identically regardless of property insertion order. A plain
 * `JSON.stringify(value, Object.keys(value).sort())` does NOT do this — the
 * array form of the replacer only allow-lists key names, and applies that
 * same top-level list at every nesting depth, silently dropping any nested
 * field whose name isn't also a top-level key (e.g. `email.bodyText` would
 * vanish, since "bodyText" is never a top-level proposal key) — that would
 * make two proposals with different bodies fingerprint identically.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/** Deterministic: identical proposal content always fingerprints identically. */
export function computeLeoActionProposalFingerprint(proposal: LeoConnectedActionProposal): string {
  const canonical = JSON.stringify(canonicalize(proposal));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
