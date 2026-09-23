/**
 * LEO FINAL-02 Gmail WRITE adapter — server-only, consequential.
 * Deliberately separate from leoGmailAdapter.ts (read-only): this file is the
 * only place LEO ever calls a Gmail-mutating endpoint. Callers MUST go through
 * leoActionExecutionService.ts — never invoked directly from conversation code.
 * Never invents recipients, never adds CC/BCC, never returns raw provider
 * payloads or OAuth tokens to the caller.
 */
import "server-only";

import { refreshLeoGoogleAccessToken } from "@/app/leo/_lib/leoGoogleOAuthClient";
import {
  isLeoGoogleWorkspaceConfigured,
  LEO_GOOGLE_BOUNDS,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";

const GMAIL_WRITE_TIMEOUT_MS = LEO_GOOGLE_BOUNDS.fetchTimeoutMs;
const MAX_SUBJECT_CHARS = 200;
const MAX_BODY_CHARS = 20_000;

export type LeoGmailWriteResult =
  | {
      ok: true;
      messageId: string;
      threadId: string | null;
      labelIds: string[];
      providerTimestamp: string | null;
    }
  | { ok: false; errorCode: string; message: string };

function stripHeaderInjection(v: string): string {
  // Header values are single-line by construction — collapse any CR/LF an
  // upstream caller might smuggle in rather than trusting bounded-length alone.
  return v.replace(/[\r\n]+/g, " ").trim();
}

function encodeMimeHeaderValue(v: string): string {
  if (/^[\x20-\x7E]*$/.test(v)) return v;
  return `=?UTF-8?B?${Buffer.from(v, "utf8").toString("base64")}?=`;
}

function isValidEmailShape(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function base64UrlEncode(raw: string): string {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMimeMessage(input: {
  to: string;
  subject: string;
  bodyText: string;
  inReplyTo?: string | null;
  references?: string | null;
}): string {
  const lines: string[] = [
    `To: ${stripHeaderInjection(input.to)}`,
    `Subject: ${encodeMimeHeaderValue(stripHeaderInjection(input.subject))}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 8bit`,
  ];
  if (input.inReplyTo) lines.push(`In-Reply-To: ${stripHeaderInjection(input.inReplyTo)}`);
  if (input.references) lines.push(`References: ${stripHeaderInjection(input.references)}`);
  lines.push("", input.bodyText);
  return lines.join("\r\n");
}

function validateComposeInput(input: {
  to: string;
  subject: string;
  bodyText: string;
}): { ok: true } | { ok: false; errorCode: string; message: string } {
  if (!isValidEmailShape(input.to)) {
    return { ok: false, errorCode: "RECIPIENT_INVALID", message: "Recipient email is not well-formed." };
  }
  if (!input.subject.trim() || input.subject.length > MAX_SUBJECT_CHARS) {
    return { ok: false, errorCode: "SUBJECT_INVALID", message: "Subject is empty or too long." };
  }
  if (!input.bodyText.trim() || input.bodyText.length > MAX_BODY_CHARS) {
    return { ok: false, errorCode: "BODY_INVALID", message: "Body is empty or too long." };
  }
  return { ok: true };
}

async function gmailPost(path: string, accessToken: string, body: unknown): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), GMAIL_WRITE_TIMEOUT_MS);
  try {
    return await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function classifyWriteHttpStatus(status: number): string {
  if (status === 401) return "GMAIL_WRITE_UNAUTHORIZED";
  if (status === 403) return "GMAIL_WRITE_FORBIDDEN";
  if (status === 429) return "GMAIL_WRITE_RATE_LIMITED";
  if (status >= 500) return "GMAIL_WRITE_PROVIDER_ERROR";
  return "GMAIL_WRITE_FAILED";
}

async function getAccessTokenOrFail(): Promise<
  { ok: true; accessToken: string } | { ok: false; errorCode: string; message: string }
> {
  if (!isLeoGoogleWorkspaceConfigured()) {
    return { ok: false, errorCode: "GOOGLE_NOT_CONFIGURED", message: "Google Workspace is not configured." };
  }
  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    return {
      ok: false,
      errorCode: tokenResult.errorCode ?? "GOOGLE_TOKEN_UNAVAILABLE",
      message: "Gmail access token unavailable.",
    };
  }
  return { ok: true, accessToken: tokenResult.accessToken };
}

function mapMessageResponse(raw: Record<string, unknown>): LeoGmailWriteResult {
  const messageId = typeof raw.id === "string" ? raw.id : null;
  if (!messageId) {
    return { ok: false, errorCode: "GMAIL_WRITE_NO_MESSAGE_ID", message: "Provider response missing message id." };
  }
  const labelIds = Array.isArray(raw.labelIds) ? raw.labelIds.map(String).slice(0, 20) : [];
  return {
    ok: true,
    messageId,
    threadId: typeof raw.threadId === "string" ? raw.threadId : null,
    labelIds,
    providerTimestamp: new Date().toISOString(),
  };
}

/** Create a draft in the owner's actual Gmail mailbox. This IS a provider mutation. */
export async function createLeoGmailDraft(input: {
  to: string;
  subject: string;
  bodyText: string;
}): Promise<LeoGmailWriteResult> {
  const validation = validateComposeInput(input);
  if (!validation.ok) return validation;

  const auth = await getAccessTokenOrFail();
  if (!auth.ok) return auth;

  const raw = base64UrlEncode(buildMimeMessage(input));
  try {
    const res = await gmailPost("/users/me/drafts", auth.accessToken, { message: { raw } });
    if (!res.ok) {
      return { ok: false, errorCode: classifyWriteHttpStatus(res.status), message: "Gmail draft creation failed." };
    }
    const json = (await res.json()) as Record<string, unknown>;
    const message = (json.message ?? json) as Record<string, unknown>;
    return mapMessageResponse(message);
  } catch {
    return { ok: false, errorCode: "GMAIL_WRITE_NETWORK_OR_TIMEOUT", message: "Gmail draft network/timeout failure." };
  }
}

/** Send a new message. Consequential — no CC/BCC, no invented recipients. */
export async function sendLeoGmailMessage(input: {
  to: string;
  subject: string;
  bodyText: string;
}): Promise<LeoGmailWriteResult> {
  const validation = validateComposeInput(input);
  if (!validation.ok) return validation;

  const auth = await getAccessTokenOrFail();
  if (!auth.ok) return auth;

  const raw = base64UrlEncode(buildMimeMessage(input));
  try {
    const res = await gmailPost("/users/me/messages/send", auth.accessToken, { raw });
    if (!res.ok) {
      return { ok: false, errorCode: classifyWriteHttpStatus(res.status), message: "Gmail send failed." };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return mapMessageResponse(json);
  } catch {
    return { ok: false, errorCode: "GMAIL_WRITE_NETWORK_OR_TIMEOUT", message: "Gmail send network/timeout failure." };
  }
}

/** Reply within an existing thread. Requires a proven threadId — never fuzzy-matched. */
export async function replyLeoGmailMessage(input: {
  to: string;
  subject: string;
  bodyText: string;
  threadId: string;
  inReplyToRfc822MessageId?: string | null;
}): Promise<LeoGmailWriteResult> {
  const validation = validateComposeInput(input);
  if (!validation.ok) return validation;
  if (!input.threadId?.trim()) {
    return { ok: false, errorCode: "THREAD_ID_REQUIRED", message: "threadId is required for reply." };
  }

  const auth = await getAccessTokenOrFail();
  if (!auth.ok) return auth;

  const subject = /^re:/i.test(input.subject.trim()) ? input.subject : `Re: ${input.subject}`;
  const raw = base64UrlEncode(
    buildMimeMessage({
      to: input.to,
      subject,
      bodyText: input.bodyText,
      inReplyTo: input.inReplyToRfc822MessageId ?? null,
      references: input.inReplyToRfc822MessageId ?? null,
    }),
  );
  try {
    const res = await gmailPost("/users/me/messages/send", auth.accessToken, {
      raw,
      threadId: input.threadId.trim(),
    });
    if (!res.ok) {
      return { ok: false, errorCode: classifyWriteHttpStatus(res.status), message: "Gmail reply failed." };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return mapMessageResponse(json);
  } catch {
    return { ok: false, errorCode: "GMAIL_WRITE_NETWORK_OR_TIMEOUT", message: "Gmail reply network/timeout failure." };
  }
}
