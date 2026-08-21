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
 * Conservative body normalization for V1 comparison (LEO-21D).
 * CRLF→LF, trim trailing whitespace per line end, normalize final newline.
 * Does NOT collapse internal spaces (could hide material changes).
 */
export function normalizeLeoGmailReplyBodyForCompare(raw: string | null | undefined): string {
  if (typeof raw !== "string") return "";
  let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");
  s = s.replace(/\n+$/g, "\n");
  if (s.endsWith("\n") && s.length > 1) {
    // keep single trailing newline or none consistently: strip all trailing newlines
    s = s.replace(/\n+$/g, "");
  }
  return s.slice(0, 50_000);
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

const MAX_PLAIN_TEXT_CHARS = 50_000;

function decodeGmailBodyData(data: string): string | null {
  try {
    const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(b64, "base64");
    if (buf.length > MAX_PLAIN_TEXT_CHARS * 2) return null;
    return buf.toString("utf8").slice(0, MAX_PLAIN_TEXT_CHARS);
  } catch {
    return null;
  }
}

/**
 * Extract first text/plain part from a format=full payload. In-memory only.
 * Pure — safe for verifiers. Fail closed if missing / empty.
 */
export function extractLeoGmailTextPlainFromFullPayload(
  payload: unknown,
): { ok: true; text: string } | { ok: false; error: string } {
  const parts: string[] = [];

  function walk(node: unknown, depth: number): void {
    if (!node || typeof node !== "object" || depth > 8) return;
    const n = node as Record<string, unknown>;
    const mimeType = typeof n.mimeType === "string" ? n.mimeType.toLowerCase() : "";
    const body = n.body as { data?: unknown; size?: unknown } | undefined;
    if (mimeType.startsWith("text/plain") && body && typeof body.data === "string") {
      const decoded = decodeGmailBodyData(body.data);
      if (decoded != null) parts.push(decoded);
    }
    if (Array.isArray(n.parts)) {
      for (const p of n.parts) walk(p, depth + 1);
    }
  }

  walk(payload, 0);
  if (parts.length === 0) return { ok: false, error: "NO_TEXT_PLAIN" };
  const first = parts[0] ?? "";
  if (!first.trim()) return { ok: false, error: "AMBIGUOUS_EMPTY_TEXT_PLAIN" };
  return { ok: true, text: first.slice(0, MAX_PLAIN_TEXT_CHARS) };
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
