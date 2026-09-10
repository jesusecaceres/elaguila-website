/**
 * LEO-13 Google Workspace config — credentials + safe diagnostics only.
 * Never returns, logs, or exposes env values / token fragments / secret lengths.
 */
import "server-only";

/** Read-only Gmail scope — no send/modify. */
export const LEO_GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly" as const;

/** Read-only Calendar scope — no create/update/delete/RSVP. */
export const LEO_CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly" as const;

/**
 * LEO-21C — Declared future Gmail write scope for GMAIL_REPLY.
 * NOT enabled in the current grant expectation. Do not add to LEO_GOOGLE_EXPECTED_SCOPES
 * until an explicit PM RED OAuth consent gate.
 */
export const LEO_GMAIL_SEND_SCOPE =
  "https://www.googleapis.com/auth/gmail.send" as const;

/** Alias: scopes that must be present on the live refresh-token grant today. */
export const LEO_GOOGLE_CURRENT_READ_SCOPES = [
  LEO_GMAIL_READONLY_SCOPE,
  LEO_CALENDAR_READONLY_SCOPE,
] as const;

/**
 * Active expected OAuth grant — READ ONLY.
 * Must not include gmail.send until a separate RED consent gate.
 */
export const LEO_GOOGLE_EXPECTED_SCOPES = LEO_GOOGLE_CURRENT_READ_SCOPES;

/** Future write scope required for GMAIL_REPLY live send (not granted yet). */
export const LEO_GMAIL_REPLY_REQUIRED_WRITE_SCOPE = LEO_GMAIL_SEND_SCOPE;

/**
 * Hard fail-closed switch: Gmail reply provider write capability.
 * Env: LEO_GMAIL_REPLY_WRITE_ENABLED — only explicit "true" enables.
 * Missing / empty / false / 0 / anything else → false.
 * Do not set this in LEO-21D environments.
 */
export function isLeoGmailReplyWriteFlagEnabled(): boolean {
  const v = process.env.LEO_GMAIL_REPLY_WRITE_ENABLED;
  if (typeof v !== "string") return false;
  return v.trim().toLowerCase() === "true";
}

/**
 * @deprecated Prefer isLeoGmailReplyWriteFlagEnabled + scope proof (two-key).
 * Kept as alias for the env write flag only (not full two-key authority).
 */
export const LEO_GMAIL_REPLY_WRITE_CAPABILITY_ENABLED: boolean = false;

/**
 * Env write-flag check only. Full send authority also requires proven gmail.send.
 */
export function isLeoGmailReplyWriteCapabilityEnabled(): boolean {
  return isLeoGmailReplyWriteFlagEnabled();
}

export const LEO_GOOGLE_BOUNDS = {
  maxMessagesDefault: 25,
  maxMessagesHard: 50,
  maxEventsDefault: 25,
  maxEventsHard: 50,
  maxRelatedEmailsPerMeeting: 10,
  fetchTimeoutMs: 12_000,
  oauthTimeoutMs: 12_000,
  maxSnippetChars: 280,
  maxDescriptionChars: 500,
  maxSubjectChars: 200,
} as const;

export type LeoGoogleWorkspaceConfigDiagnostic = {
  configured: boolean;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  refreshTokenConfigured: boolean;
  ownerEmailConfigured: boolean;
  gmailExpectedScope: boolean;
  calendarExpectedScope: boolean;
};

function envPresent(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

/** Internal credential read — never export values to UI / logs / diagnostics. */
export function getLeoGoogleClientId(): string | null {
  const v = process.env.LEO_GOOGLE_CLIENT_ID?.trim();
  return v || null;
}

export function getLeoGoogleClientSecret(): string | null {
  const v = process.env.LEO_GOOGLE_CLIENT_SECRET?.trim();
  return v || null;
}

export function getLeoGoogleRefreshToken(): string | null {
  const v = process.env.LEO_GOOGLE_REFRESH_TOKEN?.trim();
  return v || null;
}

export function getLeoGoogleAccountEmail(): string | null {
  const v = process.env.LEO_GOOGLE_ACCOUNT_EMAIL?.trim().toLowerCase();
  return v || null;
}

export function isLeoGoogleWorkspaceConfigured(): boolean {
  return Boolean(
    getLeoGoogleClientId() && getLeoGoogleClientSecret() && getLeoGoogleRefreshToken(),
  );
}

/**
 * Safe configuration diagnostic — booleans only.
 * Never returns token values, prefixes, lengths, or emails.
 */
export function getLeoGoogleWorkspaceConfigDiagnostic(): LeoGoogleWorkspaceConfigDiagnostic {
  return {
    configured: isLeoGoogleWorkspaceConfigured(),
    clientIdConfigured: envPresent("LEO_GOOGLE_CLIENT_ID"),
    clientSecretConfigured: envPresent("LEO_GOOGLE_CLIENT_SECRET"),
    refreshTokenConfigured: envPresent("LEO_GOOGLE_REFRESH_TOKEN"),
    ownerEmailConfigured: envPresent("LEO_GOOGLE_ACCOUNT_EMAIL"),
    gmailExpectedScope: true,
    calendarExpectedScope: true,
  };
}

/** Owner-facing status labels — Configured / Not configured only (no secrets). */
export type LeoGoogleOwnerStatusLabel = "Configured" | "Not configured";

export type LeoGoogleOwnerFacingStatuses = {
  workspace: LeoGoogleOwnerStatusLabel;
  gmail: LeoGoogleOwnerStatusLabel;
  calendar: LeoGoogleOwnerStatusLabel;
  ownerAccount: LeoGoogleOwnerStatusLabel;
};

/**
 * Maps safe diagnostics to owner labels.
 * Gmail/Calendar share one OAuth grant — both Configured only when workspace credentials exist.
 * Does not claim live API success.
 */
export function getLeoGoogleOwnerFacingStatuses(
  diagnostic: LeoGoogleWorkspaceConfigDiagnostic = getLeoGoogleWorkspaceConfigDiagnostic(),
): LeoGoogleOwnerFacingStatuses {
  const workspace: LeoGoogleOwnerStatusLabel = diagnostic.configured
    ? "Configured"
    : "Not configured";
  return {
    workspace,
    gmail: workspace,
    calendar: workspace,
    ownerAccount: diagnostic.ownerEmailConfigured ? "Configured" : "Not configured",
  };
}
