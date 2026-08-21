/**
 * LEO-21C — Pure Gmail reply verification helpers (no provider I/O, no send).
 * CAPABILITY ≠ AUTHORITY.
 */

import { createHash } from "node:crypto";

/** Normalize email for comparison — lowercase, trim. No guessing. */
export function normalizeLeoGmailRecipientEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  if (!t.includes("@") || t.length < 3 || t.length > 320) return null;
  return t;
}

/** Extract first email from a From/To display string. */
export function extractEmailFromAddressHeader(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const angle = raw.match(/<([^>]+@[^>]+)>/);
  if (angle?.[1]) return normalizeLeoGmailRecipientEmail(angle[1]);
  return normalizeLeoGmailRecipientEmail(raw);
}

export function leoGmailThreadIdsMatch(
  expectedThreadId: string | null | undefined,
  actualThreadId: string | null | undefined,
): boolean {
  const a = typeof expectedThreadId === "string" ? expectedThreadId.trim() : "";
  const b = typeof actualThreadId === "string" ? actualThreadId.trim() : "";
  return Boolean(a && b && a === b);
}

export function leoGmailOwnerSenderMatches(
  ownerEmail: string | null | undefined,
  fromHeader: string | null | undefined,
): boolean {
  const owner = normalizeLeoGmailRecipientEmail(ownerEmail);
  const from = extractEmailFromAddressHeader(fromHeader);
  return Boolean(owner && from && owner === from);
}

export function leoGmailRecipientInToList(
  expectedRecipient: string | null | undefined,
  toList: readonly string[] | null | undefined,
): boolean {
  const want = normalizeLeoGmailRecipientEmail(expectedRecipient);
  if (!want || !toList?.length) return false;
  return toList.some((t) => {
    const n = extractEmailFromAddressHeader(t) ?? normalizeLeoGmailRecipientEmail(t);
    return n === want;
  });
}

/**
 * Bounded body normalization for future comparison.
 * Does not claim MIME equivalence. CRLF→LF, trim ends, collapse runs of spaces per line.
 */
export function normalizeLeoGmailReplyBodyForCompare(raw: string | null | undefined): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim()
    .slice(0, 8000);
}

export function hashLeoGmailReplyBodyNormalized(raw: string | null | undefined): string {
  const n = normalizeLeoGmailReplyBodyForCompare(raw);
  return createHash("sha256").update(n).digest("hex").slice(0, 32);
}

export function leoGmailNormalizedBodiesMatch(
  approvedBody: string | null | undefined,
  observedBody: string | null | undefined,
): boolean {
  const a = normalizeLeoGmailReplyBodyForCompare(approvedBody);
  const b = normalizeLeoGmailReplyBodyForCompare(observedBody);
  if (!a || !b) return false;
  return a === b;
}

export type LeoGmailReplyPayloadValidation =
  | { ok: true; threadId: string; recipient: string; body: string }
  | { ok: false; safeFailureClass: "TARGET_UNRESOLVED"; missing: string[] };

/**
 * Immutable approved-request field checks for GMAIL_REPLY.
 * Never invents recipient from a display name.
 */
export function validateLeoGmailReplyApprovedPayload(input: {
  actionFamily: string;
  structuredPayload: Record<string, unknown> | null | undefined;
  normalizedTarget?: Record<string, unknown> | null;
}): LeoGmailReplyPayloadValidation {
  if (input.actionFamily !== "GMAIL_REPLY") {
    return { ok: false, safeFailureClass: "TARGET_UNRESOLVED", missing: ["actionFamily"] };
  }
  const p = input.structuredPayload ?? {};
  const t = input.normalizedTarget ?? {};
  const threadId =
    (typeof p.threadId === "string" && p.threadId.trim()) ||
    (typeof t.threadId === "string" && t.threadId.trim()) ||
    "";
  const recipientRaw =
    (typeof p.recipient === "string" && p.recipient) ||
    (typeof t.recipientEmail === "string" && t.recipientEmail) ||
    "";
  const recipient = normalizeLeoGmailRecipientEmail(recipientRaw);
  const body = typeof p.body === "string" ? p.body.trim() : "";

  const missing: string[] = [];
  if (!threadId) missing.push("exact_thread_id");
  if (!recipient) missing.push("exact_recipient_email");
  if (!body) missing.push("reply_body");

  if (missing.length) {
    return { ok: false, safeFailureClass: "TARGET_UNRESOLVED", missing };
  }
  return { ok: true, threadId, recipient: recipient!, body };
}
