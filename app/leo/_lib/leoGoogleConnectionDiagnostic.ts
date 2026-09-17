/**
 * LEO-13A-RUNTIME — safe Google connection diagnostic (fixture-safe, no secrets).
 * Classifies OAuth / Gmail / Calendar failures without exposing provider payloads.
 */
import type { LeoGoogleWorkspaceConfigDiagnostic } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import type {
  LeoCalendarDiagnosticCode,
  LeoGmailDiagnosticCode,
  LeoGoogleConnectionDiagnostic,
  LeoGoogleOAuthDiagnosticCode,
  LeoToolAvailability,
} from "@/app/leo/_lib/leoTypes";

const OAUTH_CODES = new Set<string>([
  "GOOGLE_NOT_CONFIGURED",
  "GOOGLE_TOKEN_UNAUTHORIZED",
  "GOOGLE_TOKEN_EXCHANGE_FAILED",
  "GOOGLE_TOKEN_MISSING",
  "GOOGLE_TOKEN_NETWORK_OR_TIMEOUT",
  "GOOGLE_TOKEN_UNAVAILABLE",
]);

export function isLeoGoogleDiagnosticQuestion(question: string): boolean {
  const q = question.trim().toLowerCase().replace(/\s+/g, " ");
  return (
    /\bdiagnose google( workspace)? connection\b/.test(q) ||
    /\bgoogle connection status\b/.test(q) ||
    /\bgoogle workspace (status|diagnostic|diagnosis)\b/.test(q) ||
    /\bwhy (can'?t|cannot) (leo )?read (gmail|calendar)\b/.test(q)
  );
}

export function isLeoGoogleOAuthErrorCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return OAUTH_CODES.has(code) || code.startsWith("GOOGLE_TOKEN_") || code === "GOOGLE_NOT_CONFIGURED";
}

/** Map Gmail HTTP status to sanitized code — never includes body text. */
export function classifyLeoGmailHttpStatus(status: number): LeoGmailDiagnosticCode {
  if (status === 401) return "GMAIL_API_UNAUTHORIZED";
  if (status === 403) return "GMAIL_API_FORBIDDEN";
  return "GMAIL_API_FAILED";
}

/** Map Calendar HTTP status to sanitized code — never includes body text. */
export function classifyLeoCalendarHttpStatus(status: number): LeoCalendarDiagnosticCode {
  if (status === 401) return "CALENDAR_API_UNAUTHORIZED";
  if (status === 403) return "CALENDAR_API_FORBIDDEN";
  return "CALENDAR_API_FAILED";
}

function normalizeOAuthCode(code: string | null): LeoGoogleOAuthDiagnosticCode {
  if (!code) return "GOOGLE_TOKEN_EXCHANGE_FAILED";
  if (code === "GOOGLE_NOT_CONFIGURED") return "GOOGLE_NOT_CONFIGURED";
  if (code === "GOOGLE_TOKEN_UNAUTHORIZED") return "GOOGLE_TOKEN_UNAUTHORIZED";
  if (code === "GOOGLE_TOKEN_EXCHANGE_FAILED") return "GOOGLE_TOKEN_EXCHANGE_FAILED";
  if (code === "GOOGLE_TOKEN_MISSING") return "GOOGLE_TOKEN_MISSING";
  if (code === "GOOGLE_TOKEN_NETWORK_OR_TIMEOUT") return "GOOGLE_TOKEN_NETWORK_OR_TIMEOUT";
  if (code === "GOOGLE_TOKEN_UNAVAILABLE") return "GOOGLE_TOKEN_EXCHANGE_FAILED";
  return "GOOGLE_TOKEN_EXCHANGE_FAILED";
}

function mapGmailSide(
  configured: boolean,
  availability: LeoToolAvailability,
  errorCode: string | null,
  oauthFailed: boolean,
): LeoGmailDiagnosticCode {
  if (!configured || errorCode === "GOOGLE_NOT_CONFIGURED") return "GOOGLE_NOT_CONFIGURED";
  if (oauthFailed || isLeoGoogleOAuthErrorCode(errorCode)) return "UNAVAILABLE_DUE_TO_OAUTH";
  if (availability === "AVAILABLE" || availability === "PARTIAL") return "AVAILABLE";
  if (errorCode === "GMAIL_API_UNAUTHORIZED") return "GMAIL_API_UNAUTHORIZED";
  if (errorCode === "GMAIL_API_FORBIDDEN") return "GMAIL_API_FORBIDDEN";
  if (errorCode === "GMAIL_API_NETWORK_OR_TIMEOUT" || errorCode === "GMAIL_NETWORK_OR_TIMEOUT") {
    return "GMAIL_API_NETWORK_OR_TIMEOUT";
  }
  return "GMAIL_API_FAILED";
}

function mapCalendarSide(
  configured: boolean,
  availability: LeoToolAvailability,
  errorCode: string | null,
  oauthFailed: boolean,
): LeoCalendarDiagnosticCode {
  if (!configured || errorCode === "GOOGLE_NOT_CONFIGURED") return "GOOGLE_NOT_CONFIGURED";
  if (oauthFailed || isLeoGoogleOAuthErrorCode(errorCode)) return "UNAVAILABLE_DUE_TO_OAUTH";
  if (availability === "AVAILABLE" || availability === "PARTIAL") return "AVAILABLE";
  if (errorCode === "CALENDAR_API_UNAUTHORIZED") return "CALENDAR_API_UNAUTHORIZED";
  if (errorCode === "CALENDAR_API_FORBIDDEN") return "CALENDAR_API_FORBIDDEN";
  if (
    errorCode === "CALENDAR_API_NETWORK_OR_TIMEOUT" ||
    errorCode === "CALENDAR_NETWORK_OR_TIMEOUT"
  ) {
    return "CALENDAR_API_NETWORK_OR_TIMEOUT";
  }
  return "CALENDAR_API_FAILED";
}

/**
 * Build owner-safe diagnostic from config booleans + adapter error codes.
 * Never accepts or returns secrets.
 */
export function buildLeoGoogleConnectionDiagnostic(input: {
  config: LeoGoogleWorkspaceConfigDiagnostic;
  gmailAvailability: LeoToolAvailability;
  calendarAvailability: LeoToolAvailability;
  gmailErrorCode: string | null;
  calendarErrorCode: string | null;
}): LeoGoogleConnectionDiagnostic {
  const gmailOauthFail = isLeoGoogleOAuthErrorCode(input.gmailErrorCode);
  const calOauthFail = isLeoGoogleOAuthErrorCode(input.calendarErrorCode);
  const oauthFailed = gmailOauthFail || calOauthFail || !input.config.configured;

  let oauth: LeoGoogleOAuthDiagnosticCode;
  if (!input.config.configured) {
    oauth = "GOOGLE_NOT_CONFIGURED";
  } else if (gmailOauthFail) {
    oauth = normalizeOAuthCode(input.gmailErrorCode);
  } else if (calOauthFail) {
    oauth = normalizeOAuthCode(input.calendarErrorCode);
  } else if (
    input.gmailAvailability === "AVAILABLE" ||
    input.calendarAvailability === "AVAILABLE" ||
    (input.gmailErrorCode && input.gmailErrorCode.startsWith("GMAIL_")) ||
    (input.calendarErrorCode && input.calendarErrorCode.startsWith("CALENDAR_"))
  ) {
    oauth = "AVAILABLE";
  } else {
    oauth = "GOOGLE_TOKEN_EXCHANGE_FAILED";
  }

  return {
    workspaceConfigured: input.config.configured,
    clientIdConfigured: input.config.clientIdConfigured,
    clientSecretConfigured: input.config.clientSecretConfigured,
    refreshTokenConfigured: input.config.refreshTokenConfigured,
    ownerEmailConfigured: input.config.ownerEmailConfigured,
    oauth,
    gmail: mapGmailSide(
      input.config.configured,
      input.gmailAvailability,
      input.gmailErrorCode,
      oauthFailed && oauth !== "AVAILABLE",
    ),
    calendar: mapCalendarSide(
      input.config.configured,
      input.calendarAvailability,
      input.calendarErrorCode,
      oauthFailed && oauth !== "AVAILABLE",
    ),
  };
}

function oauthOwnerLine(code: LeoGoogleOAuthDiagnosticCode): string {
  if (code === "AVAILABLE") return "OAuth token refresh: AVAILABLE";
  return `OAuth token refresh: ${code}`;
}

function gmailOwnerLine(code: LeoGmailDiagnosticCode): string {
  if (code === "AVAILABLE") return "Gmail: AVAILABLE";
  if (code === "UNAVAILABLE_DUE_TO_OAUTH") {
    return "Gmail: unavailable because OAuth token refresh failed";
  }
  if (code === "GOOGLE_NOT_CONFIGURED") return "Gmail: Not configured";
  return `Gmail: ${code}`;
}

function calendarOwnerLine(code: LeoCalendarDiagnosticCode): string {
  if (code === "AVAILABLE") return "Calendar: AVAILABLE";
  if (code === "UNAVAILABLE_DUE_TO_OAUTH") {
    return "Calendar: unavailable because OAuth token refresh failed";
  }
  if (code === "GOOGLE_NOT_CONFIGURED") return "Calendar: Not configured";
  return `Calendar: ${code}`;
}

/** Concise owner-facing diagnostic — codes only, no secrets. */
export function composeGoogleConnectionDiagnosticSummary(
  diag: LeoGoogleConnectionDiagnostic,
): string {
  const workspace = diag.workspaceConfigured ? "Configured" : "Not configured";
  return [
    `Google Workspace: ${workspace}`,
    `Client ID: ${diag.clientIdConfigured ? "Configured" : "Not configured"}`,
    `Client secret: ${diag.clientSecretConfigured ? "Configured" : "Not configured"}`,
    `Refresh token: ${diag.refreshTokenConfigured ? "Configured" : "Not configured"}`,
    `Owner account: ${diag.ownerEmailConfigured ? "Configured" : "Not configured"}`,
    oauthOwnerLine(diag.oauth),
    gmailOwnerLine(diag.gmail),
    calendarOwnerLine(diag.calendar),
  ].join("\n");
}

/** One-line safe diagnostic for natural Gmail/Calendar failure answers. */
export function composeGoogleFailureDiagnosticLine(
  side: "gmail" | "calendar",
  diag: LeoGoogleConnectionDiagnostic | null | undefined,
): string | null {
  if (!diag) return null;
  const code = side === "gmail" ? diag.gmail : diag.calendar;
  if (code === "AVAILABLE") return null;
  if (code === "UNAVAILABLE_DUE_TO_OAUTH") {
    return `Diagnostic: ${diag.oauth}`;
  }
  return `Diagnostic: ${code}`;
}

/** Security: reject any diagnostic object that accidentally carries secret-like strings. */
export function leoGoogleDiagnosticContainsForbiddenSecretMaterial(text: string): boolean {
  if (!text?.trim()) return false;
  if (/ya29\.|1\/\/|GOCSPX-|AIza/i.test(text)) return true;
  if (/Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(text)) return true;
  if (/refresh_token|access_token|client_secret/i.test(text) && /[=:]\s*\S{8,}/.test(text)) {
    return true;
  }
  // Long opaque tokens
  if (/\b[A-Za-z0-9_-]{40,}\b/.test(text) && !/GOOGLE_|GMAIL_|CALENDAR_|AVAILABLE|UNAVAILABLE|CONFIGURED|Diagnostic/.test(text)) {
    return true;
  }
  return false;
}
