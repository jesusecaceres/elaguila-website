/**
 * LEO-13/21D Gmail adapter — server-only, bounded.
 * Inbox/thread/message reads remain metadata-first.
 * messages.send exists only via sendLeoGmailRawMessage (two-key gated by callers).
 * No attachments persisted. No raw MIME persistence.
 */
import "server-only";

import { refreshLeoGoogleAccessToken } from "@/app/leo/_lib/leoGoogleOAuthClient";
import { classifyLeoGmailHttpStatus } from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";
import {
  getLeoGoogleAccountEmail,
  isLeoGoogleWorkspaceConfigured,
  LEO_GOOGLE_BOUNDS,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { extractLeoGmailTextPlainFromFullPayload } from "@/app/leo/_lib/leoGmailReplyVerificationHelpers";
import type {
  LeoEmailMessageEvidence,
  LeoGmailReadResult,
  LeoToolAvailability,
} from "@/app/leo/_lib/leoTypes";

function clampMax(requested?: number | null): number {
  const n = requested ?? LEO_GOOGLE_BOUNDS.maxMessagesDefault;
  return Math.min(Math.max(1, Math.floor(n)), LEO_GOOGLE_BOUNDS.maxMessagesHard);
}

function boundText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

function headerMap(headers: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(headers)) return out;
  for (const h of headers) {
    if (!h || typeof h !== "object") continue;
    const name = String((h as { name?: unknown }).name ?? "").toLowerCase();
    const value = String((h as { value?: unknown }).value ?? "");
    if (name) out[name] = value;
  }
  return out;
}

function splitAddresses(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/** Metadata headers for inbox/thread/message reads — includes RFC reply headers (LEO-21C). */
export const LEO_GMAIL_METADATA_HEADERS = [
  "From",
  "To",
  "Cc",
  "Subject",
  "Date",
  "Message-ID",
  "References",
  "In-Reply-To",
] as const;

function metadataHeadersQuery(): string {
  return LEO_GMAIL_METADATA_HEADERS.map(
    (h) => `metadataHeaders=${encodeURIComponent(h)}`,
  ).join("&");
}

async function gmailGet(path: string, accessToken: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LEO_GOOGLE_BOUNDS.fetchTimeoutMs);
  try {
    return await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function mapMessage(raw: Record<string, unknown>): LeoEmailMessageEvidence {
  const payload = (raw.payload ?? {}) as Record<string, unknown>;
  const headers = headerMap(payload.headers);
  const labelIds = Array.isArray(raw.labelIds)
    ? raw.labelIds.map(String).slice(0, 20)
    : [];
  const unread = labelIds.some((l) => l.toUpperCase() === "UNREAD");
  return {
    messageId: String(raw.id ?? ""),
    threadId: raw.threadId ? String(raw.threadId) : null,
    sender: boundText(headers.from, 200),
    recipients: splitAddresses(headers.to),
    to: splitAddresses(headers.to),
    cc: splitAddresses(headers.cc),
    subject: boundText(headers.subject, LEO_GOOGLE_BOUNDS.maxSubjectChars),
    receivedAt: raw.internalDate
      ? new Date(Number(raw.internalDate)).toISOString()
      : boundText(headers.date, 80),
    snippet: boundText(raw.snippet, LEO_GOOGLE_BOUNDS.maxSnippetChars),
    labelIds,
    readState: unread ? "UNREAD" : "READ",
    rfcMessageId: boundText(headers["message-id"], 320),
    referencesHeader: boundText(headers.references, 2000),
    inReplyToHeader: boundText(headers["in-reply-to"], 320),
  };
}

/**
 * Read recent inbox message metadata. Bounded. Read-only.
 */
export async function readLeoGmailInbox(options?: {
  maxResults?: number | null;
}): Promise<LeoGmailReadResult> {
  const maxResults = clampMax(options?.maxResults);
  const limitations: string[] = [
    "Gmail read-only — no send/modify/delete.",
    "No attachment or raw MIME body fetch.",
    `Bounded to ${maxResults} recent messages (hard max ${LEO_GOOGLE_BOUNDS.maxMessagesHard}).`,
    "Counts reflect bounded recent evidence, not global inbox totals.",
  ];

  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      availability: "NOT_CONFIGURED",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [
        ...limitations,
        "Google Workspace is not configured (LEO_GOOGLE_* credentials missing).",
      ],
      errorCode: "GOOGLE_NOT_CONFIGURED",
    };
  }

  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    const availability: LeoToolAvailability =
      tokenResult.availability === "NOT_CONFIGURED"
        ? "NOT_CONFIGURED"
        : tokenResult.availability === "UNAVAILABLE"
          ? "UNAVAILABLE"
          : "UNAVAILABLE";
    return {
      availability,
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Gmail access token unavailable."],
      errorCode: tokenResult.errorCode ?? "GOOGLE_TOKEN_UNAVAILABLE",
    };
  }

  const accessToken = tokenResult.accessToken;

  try {
    const listRes = await gmailGet(
      `/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
      accessToken,
    );
    if (!listRes.ok) {
      return {
        availability: "UNAVAILABLE",
        messages: [],
        ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
        limitations: [...limitations, "Gmail list request failed."],
        errorCode: classifyLeoGmailHttpStatus(listRes.status),
      };
    }

    const listJson = (await listRes.json()) as { messages?: { id?: string }[] };
    const ids = (listJson.messages ?? [])
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id))
      .slice(0, maxResults);

    const messages: LeoEmailMessageEvidence[] = [];
    for (const id of ids) {
      // metadata format — no full body, no attachments
      const msgRes = await gmailGet(
        `/users/me/messages/${encodeURIComponent(id)}?format=metadata&${metadataHeadersQuery()}`,
        accessToken,
      );
      if (!msgRes.ok) continue;
      const raw = (await msgRes.json()) as Record<string, unknown>;
      const mapped = mapMessage(raw);
      if (mapped.messageId) messages.push(mapped);
    }

    return {
      availability: "AVAILABLE",
      messages,
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations,
      errorCode: null,
    };
  } catch {
    return {
      availability: "UNAVAILABLE",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Gmail network/timeout failure."],
      errorCode: "GMAIL_API_NETWORK_OR_TIMEOUT",
    };
  }
}

/**
 * Bounded thread metadata lookup (messages in thread, metadata only).
 */
export async function readLeoGmailThread(threadId: string): Promise<LeoGmailReadResult> {
  const limitations: string[] = [
    "Gmail thread read-only — metadata only.",
    "No attachment or raw MIME body fetch.",
  ];

  if (!threadId.trim()) {
    return {
      availability: "UNAVAILABLE",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "threadId required."],
      errorCode: "GMAIL_THREAD_ID_REQUIRED",
    };
  }

  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      availability: "NOT_CONFIGURED",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Google Workspace is not configured."],
      errorCode: "GOOGLE_NOT_CONFIGURED",
    };
  }

  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    return {
      availability: "UNAVAILABLE",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Gmail access token unavailable."],
      errorCode: tokenResult.errorCode ?? "GOOGLE_TOKEN_UNAVAILABLE",
    };
  }

  try {
    const res = await gmailGet(
      `/users/me/threads/${encodeURIComponent(threadId.trim())}?format=metadata&${metadataHeadersQuery()}`,
      tokenResult.accessToken,
    );
    if (!res.ok) {
      return {
        availability: "UNAVAILABLE",
        messages: [],
        ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
        limitations: [...limitations, "Gmail thread request failed."],
        errorCode: "GMAIL_THREAD_FAILED",
      };
    }
    const json = (await res.json()) as { messages?: Record<string, unknown>[] };
    const messages = (json.messages ?? [])
      .slice(0, LEO_GOOGLE_BOUNDS.maxMessagesHard)
      .map(mapMessage)
      .filter((m) => m.messageId);

    return {
      availability: "AVAILABLE",
      messages,
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [
        ...limitations,
        `Bounded to ${LEO_GOOGLE_BOUNDS.maxMessagesHard} thread messages.`,
      ],
      errorCode: null,
    };
  } catch {
    return {
      availability: "UNAVAILABLE",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Gmail thread network/timeout failure."],
      errorCode: "GMAIL_THREAD_NETWORK_OR_TIMEOUT",
    };
  }
}

/**
 * LEO-21C/21D — Bounded single-message metadata read.
 * Read-only. Prefer readLeoGmailMessagePlainTextById for body verification.
 */
export async function readLeoGmailMessageById(
  messageId: string,
): Promise<LeoGmailReadResult> {
  const limitations: string[] = [
    "Gmail message read-only — metadata only.",
    "No attachment or raw MIME body fetch.",
  ];

  if (!messageId.trim()) {
    return {
      availability: "UNAVAILABLE",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "messageId required."],
      errorCode: "GMAIL_MESSAGE_ID_REQUIRED",
    };
  }

  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      availability: "NOT_CONFIGURED",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Google Workspace is not configured."],
      errorCode: "GOOGLE_NOT_CONFIGURED",
    };
  }

  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    return {
      availability: "UNAVAILABLE",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Gmail access token unavailable."],
      errorCode: tokenResult.errorCode ?? "GOOGLE_TOKEN_UNAVAILABLE",
    };
  }

  try {
    const res = await gmailGet(
      `/users/me/messages/${encodeURIComponent(messageId.trim())}?format=metadata&${metadataHeadersQuery()}`,
      tokenResult.accessToken,
    );
    if (!res.ok) {
      return {
        availability: "UNAVAILABLE",
        messages: [],
        ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
        limitations: [...limitations, "Gmail message request failed."],
        errorCode: classifyLeoGmailHttpStatus(res.status),
      };
    }
    const raw = (await res.json()) as Record<string, unknown>;
    const mapped = mapMessage(raw);
    return {
      availability: "AVAILABLE",
      messages: mapped.messageId ? [mapped] : [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations,
      errorCode: null,
    };
  } catch {
    return {
      availability: "UNAVAILABLE",
      messages: [],
      ownerEmailConfigured: Boolean(getLeoGoogleAccountEmail()),
      limitations: [...limitations, "Gmail message network/timeout failure."],
      errorCode: "GMAIL_MESSAGE_NETWORK_OR_TIMEOUT",
    };
  }
}

export type LeoGmailPlainTextMessageRead =
  | {
      ok: true;
      message: LeoEmailMessageEvidence;
      plainText: string;
      availability: "AVAILABLE";
    }
  | {
      ok: false;
      availability: LeoToolAvailability;
      errorCode: string;
      limitations: string[];
    };

/**
 * LEO-21D — format=full read for ONE message id; extract text/plain only.
 * Never persists raw MIME / full provider dump.
 */
export async function readLeoGmailMessagePlainTextById(
  messageId: string,
): Promise<LeoGmailPlainTextMessageRead> {
  const limitations: string[] = [
    "Gmail full-format read for verification — text/plain only.",
    "Raw MIME and full provider JSON are not persisted.",
  ];

  if (!messageId.trim()) {
    return {
      ok: false,
      availability: "UNAVAILABLE",
      errorCode: "GMAIL_MESSAGE_ID_REQUIRED",
      limitations: [...limitations, "messageId required."],
    };
  }
  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      ok: false,
      availability: "NOT_CONFIGURED",
      errorCode: "GOOGLE_NOT_CONFIGURED",
      limitations,
    };
  }

  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    return {
      ok: false,
      availability: "UNAVAILABLE",
      errorCode: tokenResult.errorCode ?? "GOOGLE_TOKEN_UNAVAILABLE",
      limitations,
    };
  }

  try {
    const res = await gmailGet(
      `/users/me/messages/${encodeURIComponent(messageId.trim())}?format=full`,
      tokenResult.accessToken,
    );
    if (!res.ok) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        errorCode: classifyLeoGmailHttpStatus(res.status),
        limitations,
      };
    }
    const raw = (await res.json()) as Record<string, unknown>;
    const mapped = mapMessage(raw);
    if (!mapped.messageId) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        errorCode: "GMAIL_MESSAGE_EMPTY",
        limitations,
      };
    }
    const extracted = extractLeoGmailTextPlainFromFullPayload(raw.payload);
    if (!extracted.ok) {
      return {
        ok: false,
        availability: "UNAVAILABLE",
        errorCode: extracted.error,
        limitations: [...limitations, "text/plain extraction failed."],
      };
    }
    return {
      ok: true,
      message: mapped,
      plainText: extracted.text,
      availability: "AVAILABLE",
    };
  } catch {
    return {
      ok: false,
      availability: "UNAVAILABLE",
      errorCode: "GMAIL_MESSAGE_NETWORK_OR_TIMEOUT",
      limitations,
    };
  }
}

export type LeoGmailSendTransportResult =
  | {
      ok: true;
      messageId: string;
      threadId: string | null;
    }
  | {
      ok: false;
      errorCode:
        | "GOOGLE_NOT_CONFIGURED"
        | "GOOGLE_TOKEN_UNAVAILABLE"
        | "GMAIL_SEND_REJECTED"
        | "GMAIL_SEND_TIMEOUT"
        | "GMAIL_SEND_ERROR"
        | "GMAIL_SEND_MISSING_ID";
      httpStatus: number | null;
      /** True only after the HTTP request may have been dispatched. */
      dispatchStarted: boolean;
    };

/**
 * LEO-21D — Minimal Gmail messages.send transport.
 * Does not approve/claim/write receipts. Does not persist provider dumps.
 */
export async function sendLeoGmailRawMessage(input: {
  rawBase64Url: string;
  threadId: string;
}): Promise<LeoGmailSendTransportResult> {
  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      ok: false,
      errorCode: "GOOGLE_NOT_CONFIGURED",
      httpStatus: null,
      dispatchStarted: false,
    };
  }
  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    return {
      ok: false,
      errorCode: "GOOGLE_TOKEN_UNAVAILABLE",
      httpStatus: null,
      dispatchStarted: false,
    };
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LEO_GOOGLE_BOUNDS.fetchTimeoutMs);
  let dispatchStarted = false;
  try {
    dispatchStarted = true;
    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: input.rawBase64Url,
          threadId: input.threadId,
        }),
        signal: ctrl.signal,
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return {
        ok: false,
        errorCode: res.status >= 400 && res.status < 500 ? "GMAIL_SEND_REJECTED" : "GMAIL_SEND_ERROR",
        httpStatus: res.status,
        dispatchStarted: true,
      };
    }
    const json = (await res.json()) as { id?: unknown; threadId?: unknown };
    const messageId = typeof json.id === "string" ? json.id.trim() : "";
    if (!messageId) {
      return {
        ok: false,
        errorCode: "GMAIL_SEND_MISSING_ID",
        httpStatus: res.status,
        dispatchStarted: true,
      };
    }
    return {
      ok: true,
      messageId,
      threadId: typeof json.threadId === "string" ? json.threadId : null,
    };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return {
      ok: false,
      errorCode: aborted ? "GMAIL_SEND_TIMEOUT" : "GMAIL_SEND_ERROR",
      httpStatus: null,
      dispatchStarted,
    };
  } finally {
    clearTimeout(t);
  }
}
