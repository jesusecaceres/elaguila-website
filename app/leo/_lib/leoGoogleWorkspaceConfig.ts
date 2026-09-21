/**
 * LEO-13 Google Workspace config — credentials + safe diagnostics only.
 * Never returns, logs, or exposes env values / token fragments / secret lengths.
 */
import "server-only";

import type {
  LeoGoogleCapabilityDiagnostic,
  LeoGoogleReadCapabilityState,
  LeoGoogleWriteCapabilityState,
} from "@/app/leo/_lib/leoTypes";

/** Read-only Gmail scope — no send/modify. */
export const LEO_GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly" as const;

/** Read-only Calendar scope — no create/update/delete/RSVP. */
export const LEO_CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly" as const;

/** LEO FINAL-02: draft/send scope. Supports both draft management and sending. */
export const LEO_GMAIL_COMPOSE_SCOPE =
  "https://www.googleapis.com/auth/gmail.compose" as const;

/** LEO FINAL-02: event create/update scope. */
export const LEO_CALENDAR_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events" as const;

/** LEO FINAL-02: saved-contact lookup scope. */
export const LEO_CONTACTS_READONLY_SCOPE =
  "https://www.googleapis.com/auth/contacts.readonly" as const;

/** Scopes required for existing LEO-13 read behavior. Unchanged by FINAL-02. */
export const LEO_GOOGLE_EXPECTED_SCOPES = [
  LEO_GMAIL_READONLY_SCOPE,
  LEO_CALENDAR_READONLY_SCOPE,
] as const;

/**
 * LEO FINAL-02: minimum additional scopes required for connected-action writes.
 * The refresh token currently in LEO_GOOGLE_REFRESH_TOKEN was minted under
 * LEO_GOOGLE_EXPECTED_SCOPES only and must NOT be assumed to carry these —
 * the owner must complete a new consent flow (FINAL-03) before any of these
 * scopes are actually granted. See scripts/LEO_GOOGLE_OAUTH_SETUP.md.
 */
export const LEO_GOOGLE_WRITE_SCOPES = [
  LEO_GMAIL_COMPOSE_SCOPE,
  LEO_CALENDAR_EVENTS_SCOPE,
  LEO_CONTACTS_READONLY_SCOPE,
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
 * LEO FINAL-02 rollout gate. Server-only, default FALSE, absence = FALSE.
 * The browser cannot read or control this — it is never sent to the client.
 * This flag is NEVER sufficient authorization by itself; every write path
 * still requires owner_admin, explicit confirmation, and a successful
 * provider call before any receipt can reach EXECUTED/VERIFIED.
 */
export function isLeoGoogleWriteEnabled(): boolean {
  return process.env.LEO_GOOGLE_WRITE_ENABLED?.trim().toLowerCase() === "true";
}

/**
 * Truthful Google capability diagnostic for connected-action gating.
 * Distinguishes CONFIG_MISSING / TOKEN_UNAVAILABLE / SCOPE_MISSING /
 * WRITE_DISABLED / WRITE_READY (write) and CONFIG_MISSING / TOKEN_UNAVAILABLE /
 * READ_READY (read). Never hardcodes success — read/write readiness reflect
 * only what is actually configured, never an assumed scope grant.
 */
export function getLeoGoogleCapabilityDiagnostic(input: {
  tokenAvailable: boolean;
}): LeoGoogleCapabilityDiagnostic {
  const configured = isLeoGoogleWorkspaceConfigured();
  const writeEnabledFlag = isLeoGoogleWriteEnabled();

  const read: LeoGoogleReadCapabilityState = !configured
    ? "CONFIG_MISSING"
    : !input.tokenAvailable
      ? "TOKEN_UNAVAILABLE"
      : "READ_READY";

  let write: LeoGoogleWriteCapabilityState;
  if (!configured) {
    write = "CONFIG_MISSING";
  } else if (!input.tokenAvailable) {
    write = "TOKEN_UNAVAILABLE";
  } else if (!writeEnabledFlag) {
    write = "WRITE_DISABLED";
  } else {
    // Eligible to attempt — actual scope possession is proven only by a real
    // provider call (see leoGmailWriteAdapter.ts / leoCalendarWriteAdapter.ts),
    // which downgrades this to SCOPE_MISSING truth at the point of failure.
    write = "WRITE_READY";
  }

  return { read, write, writeEnabledFlag };
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
