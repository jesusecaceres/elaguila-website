/**
 * LEO-13 Gmail adapter — server-only, read-only, bounded.
 * No send/modify/delete. No attachments. No raw MIME bodies.
 */
import "server-only";

import { refreshLeoGoogleAccessToken } from "@/app/leo/_lib/leoGoogleOAuthClient";
import { classifyLeoGmailHttpStatus } from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";
import {
  getLeoGoogleAccountEmail,
  isLeoGoogleWorkspaceConfigured,
  LEO_GOOGLE_BOUNDS,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
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
 * LEO-21C — Bounded single-message metadata read for reply verification.
 * Read-only. No body/MIME dump. Reuses same gmailGet path.
 */
export async function readLeoGmailMessageById(
  messageId: string,
): Promise<LeoGmailReadResult> {
  const limitations: string[] = [
    "Gmail message read-only — metadata only.",
    "No attachment or raw MIME body fetch.",
    "Body comparison for VERIFIED is PARTIAL until a future safe body-read gate.",
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
