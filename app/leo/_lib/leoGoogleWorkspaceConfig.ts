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

export const LEO_GOOGLE_EXPECTED_SCOPES = [
  LEO_GMAIL_READONLY_SCOPE,
  LEO_CALENDAR_READONLY_SCOPE,
] as const;

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
