/**
 * LEO FINAL-02 Calendar WRITE adapter — server-only, consequential.
 * Deliberately separate from leoCalendarAdapter.ts (read-only): this file is
 * the only place LEO ever calls a Calendar-mutating endpoint. Callers MUST go
 * through leoActionExecutionService.ts — never invoked directly from
 * conversation code. UPDATE always re-proves the target event exists first;
 * never a fuzzy/destructive mutation.
 */
import "server-only";

import { refreshLeoGoogleAccessToken } from "@/app/leo/_lib/leoGoogleOAuthClient";
import {
  isLeoGoogleWorkspaceConfigured,
  LEO_GOOGLE_BOUNDS,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import type { LeoCalendarAttendeeProposal, LeoCalendarConflictState } from "@/app/leo/_lib/leoTypes";

const CALENDAR_WRITE_TIMEOUT_MS = LEO_GOOGLE_BOUNDS.fetchTimeoutMs;
const MAX_ATTENDEES = 20;
const MAX_TITLE_CHARS = 200;
const MAX_DESCRIPTION_CHARS = LEO_GOOGLE_BOUNDS.maxDescriptionChars;
const MAX_LOCATION_CHARS = 200;
const RFC3339_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export type LeoCalendarWriteResult =
  | {
      ok: true;
      eventId: string;
      htmlLink: string | null;
      providerUpdatedAt: string | null;
    }
  | { ok: false; errorCode: string; message: string };

export type LeoCalendarAvailabilityResult =
  | { ok: true; conflictState: LeoCalendarConflictState; busyWindows: { start: string; end: string }[] }
  | { ok: false; conflictState: "UNAVAILABLE"; errorCode: string; message: string };

function isValidRfc3339(v: string): boolean {
  return RFC3339_RE.test(v.trim());
}

function isValidEmailShape(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function boundText(v: string | null | undefined, max: number): string | null {
  if (!v?.trim()) return null;
  return v.replace(/\s+/g, " ").trim().slice(0, max);
}

async function calendarFetch(
  path: string,
  accessToken: string,
  init?: { method?: string; body?: unknown },
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CALENDAR_WRITE_TIMEOUT_MS);
  try {
    return await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function classifyWriteHttpStatus(status: number): string {
  if (status === 401) return "CALENDAR_WRITE_UNAUTHORIZED";
  if (status === 403) return "CALENDAR_WRITE_FORBIDDEN";
  if (status === 404) return "CALENDAR_EVENT_NOT_FOUND";
  if (status === 429) return "CALENDAR_WRITE_RATE_LIMITED";
  if (status >= 500) return "CALENDAR_WRITE_PROVIDER_ERROR";
  return "CALENDAR_WRITE_FAILED";
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
      message: "Calendar access token unavailable.",
    };
  }
  return { ok: true, accessToken: tokenResult.accessToken };
}

function validateAttendees(
  attendees: LeoCalendarAttendeeProposal[],
): { ok: true; value: { email: string }[] } | { ok: false; errorCode: string; message: string } {
  if (attendees.length > MAX_ATTENDEES) {
    return { ok: false, errorCode: "ATTENDEES_TOO_MANY", message: `Bounded to ${MAX_ATTENDEES} attendees.` };
  }
  for (const a of attendees) {
    if (!isValidEmailShape(a.email)) {
      return { ok: false, errorCode: "ATTENDEE_INVALID", message: "An attendee email is not well-formed." };
    }
  }
  return { ok: true, value: attendees.map((a) => ({ email: a.email.trim().toLowerCase() })) };
}

/**
 * Free/busy truth for the primary calendar over the proposed window.
 * UNKNOWN/UNAVAILABLE never silently become AVAILABLE.
 */
export async function checkLeoCalendarAvailability(input: {
  startIso: string;
  endIso: string;
}): Promise<LeoCalendarAvailabilityResult> {
  if (!isValidRfc3339(input.startIso) || !isValidRfc3339(input.endIso)) {
    return {
      ok: false,
      conflictState: "UNAVAILABLE",
      errorCode: "TIME_RANGE_INVALID",
      message: "start/end must be RFC3339 timestamps.",
    };
  }

  const auth = await getAccessTokenOrFail();
  if (!auth.ok) {
    return { ok: false, conflictState: "UNAVAILABLE", errorCode: auth.errorCode, message: auth.message };
  }

  try {
    const res = await calendarFetch("/freeBusy", auth.accessToken, {
      method: "POST",
      body: { timeMin: input.startIso, timeMax: input.endIso, items: [{ id: "primary" }] },
    });
    if (!res.ok) {
      return {
        ok: false,
        conflictState: "UNAVAILABLE",
        errorCode: classifyWriteHttpStatus(res.status),
        message: "Free/busy lookup failed.",
      };
    }
    const json = (await res.json()) as {
      calendars?: Record<string, { busy?: { start?: string; end?: string }[] }>;
    };
    const busyRaw = json.calendars?.primary?.busy ?? [];
    const busyWindows = busyRaw
      .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
      .slice(0, 20);
    return {
      ok: true,
      conflictState: busyWindows.length > 0 ? "CONFLICT" : "AVAILABLE",
      busyWindows,
    };
  } catch {
    return {
      ok: false,
      conflictState: "UNAVAILABLE",
      errorCode: "CALENDAR_NETWORK_OR_TIMEOUT",
      message: "Free/busy network/timeout failure.",
    };
  }
}

function mapEventResponse(raw: Record<string, unknown>): LeoCalendarWriteResult {
  const eventId = typeof raw.id === "string" ? raw.id : null;
  if (!eventId) {
    return { ok: false, errorCode: "CALENDAR_WRITE_NO_EVENT_ID", message: "Provider response missing event id." };
  }
  return {
    ok: true,
    eventId,
    htmlLink: typeof raw.htmlLink === "string" && raw.htmlLink.startsWith("https://") ? raw.htmlLink : null,
    providerUpdatedAt: typeof raw.updated === "string" ? raw.updated : null,
  };
}

export type LeoCalendarEventProposalInput = {
  title: string;
  startIso: string;
  endIso: string;
  timezone: string;
  attendees: LeoCalendarAttendeeProposal[];
  location: string | null;
  description: string | null;
};

function buildEventBody(input: LeoCalendarEventProposalInput, attendees: { email: string }[]) {
  return {
    summary: boundText(input.title, MAX_TITLE_CHARS) ?? "(untitled)",
    start: { dateTime: input.startIso, timeZone: input.timezone },
    end: { dateTime: input.endIso, timeZone: input.timezone },
    attendees,
    location: boundText(input.location, MAX_LOCATION_CHARS),
    description: boundText(input.description, MAX_DESCRIPTION_CHARS),
  };
}

/** Create a real event on the owner's primary calendar. Consequential. */
export async function createLeoCalendarEvent(
  input: LeoCalendarEventProposalInput,
): Promise<LeoCalendarWriteResult> {
  if (!isValidRfc3339(input.startIso) || !isValidRfc3339(input.endIso)) {
    return { ok: false, errorCode: "TIME_RANGE_INVALID", message: "start/end must be RFC3339 timestamps." };
  }
  if (!input.timezone?.trim()) {
    return { ok: false, errorCode: "TIMEZONE_REQUIRED", message: "Explicit timezone is required." };
  }
  const attendeesResult = validateAttendees(input.attendees);
  if (!attendeesResult.ok) return attendeesResult;

  const auth = await getAccessTokenOrFail();
  if (!auth.ok) return auth;

  try {
    const res = await calendarFetch("/calendars/primary/events", auth.accessToken, {
      method: "POST",
      body: buildEventBody(input, attendeesResult.value),
    });
    if (!res.ok) {
      return { ok: false, errorCode: classifyWriteHttpStatus(res.status), message: "Calendar event creation failed." };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return mapEventResponse(json);
  } catch {
    return { ok: false, errorCode: "CALENDAR_WRITE_NETWORK_OR_TIMEOUT", message: "Calendar create network/timeout failure." };
  }
}

/**
 * Update an existing event. Requires a proven event ID — a GET is performed
 * first; if the event cannot be proven to exist, this fails closed rather
 * than attempting a fuzzy/destructive PATCH.
 */
export async function updateLeoCalendarEvent(
  input: LeoCalendarEventProposalInput & { existingEventId: string },
): Promise<LeoCalendarWriteResult> {
  const eventId = input.existingEventId?.trim();
  if (!eventId) {
    return { ok: false, errorCode: "EVENT_ID_REQUIRED", message: "existingEventId is required for update." };
  }
  if (!isValidRfc3339(input.startIso) || !isValidRfc3339(input.endIso)) {
    return { ok: false, errorCode: "TIME_RANGE_INVALID", message: "start/end must be RFC3339 timestamps." };
  }
  if (!input.timezone?.trim()) {
    return { ok: false, errorCode: "TIMEZONE_REQUIRED", message: "Explicit timezone is required." };
  }
  const attendeesResult = validateAttendees(input.attendees);
  if (!attendeesResult.ok) return attendeesResult;

  const auth = await getAccessTokenOrFail();
  if (!auth.ok) return auth;

  try {
    // Prove the target event exists before mutating it.
    const existing = await calendarFetch(
      `/calendars/primary/events/${encodeURIComponent(eventId)}`,
      auth.accessToken,
    );
    if (existing.status === 404) {
      return { ok: false, errorCode: "CALENDAR_EVENT_NOT_FOUND", message: "Target event could not be proven to exist." };
    }
    if (!existing.ok) {
      return { ok: false, errorCode: classifyWriteHttpStatus(existing.status), message: "Could not verify target event." };
    }

    const res = await calendarFetch(
      `/calendars/primary/events/${encodeURIComponent(eventId)}`,
      auth.accessToken,
      { method: "PATCH", body: buildEventBody(input, attendeesResult.value) },
    );
    if (!res.ok) {
      return { ok: false, errorCode: classifyWriteHttpStatus(res.status), message: "Calendar event update failed." };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return mapEventResponse(json);
  } catch {
    return { ok: false, errorCode: "CALENDAR_WRITE_NETWORK_OR_TIMEOUT", message: "Calendar update network/timeout failure." };
  }
}
