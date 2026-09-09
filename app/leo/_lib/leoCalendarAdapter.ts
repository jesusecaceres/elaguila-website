/**
 * LEO-13 Calendar adapter — server-only, read-only, bounded.
 * No create/update/patch/delete/accept/decline/invite.
 */
import "server-only";

import { refreshLeoGoogleAccessToken } from "@/app/leo/_lib/leoGoogleOAuthClient";
import { classifyLeoCalendarHttpStatus } from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";
import {
  isLeoGoogleWorkspaceConfigured,
  LEO_GOOGLE_BOUNDS,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import type {
  LeoCalendarEventEvidence,
  LeoCalendarReadResult,
  LeoToolAvailability,
} from "@/app/leo/_lib/leoTypes";

function clampMax(requested?: number | null): number {
  const n = requested ?? LEO_GOOGLE_BOUNDS.maxEventsDefault;
  return Math.min(Math.max(1, Math.floor(n)), LEO_GOOGLE_BOUNDS.maxEventsHard);
}

function boundText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

function eventInstant(node: unknown): { iso: string | null; timezone: string | null } {
  if (!node || typeof node !== "object") return { iso: null, timezone: null };
  const o = node as { dateTime?: unknown; date?: unknown; timeZone?: unknown };
  if (typeof o.dateTime === "string" && o.dateTime.trim()) {
    return {
      iso: o.dateTime.trim(),
      timezone: typeof o.timeZone === "string" ? o.timeZone : null,
    };
  }
  if (typeof o.date === "string" && o.date.trim()) {
    // All-day — preserve date as ISO date midnight UTC without inventing local TZ.
    return { iso: `${o.date.trim()}T00:00:00.000Z`, timezone: null };
  }
  return { iso: null, timezone: null };
}

function extractMeetingUrl(raw: Record<string, unknown>): string | null {
  const conf = raw.conferenceData as
    | { entryPoints?: { entryPointType?: string; uri?: string }[] }
    | undefined;
  const hangout = typeof raw.hangoutLink === "string" ? raw.hangoutLink : null;
  const fromConf = conf?.entryPoints?.find(
    (e) => e.entryPointType === "video" && typeof e.uri === "string",
  )?.uri;
  return boundText(fromConf || hangout, 300);
}

function mapEvent(raw: Record<string, unknown>): LeoCalendarEventEvidence | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;
  const start = eventInstant(raw.start);
  const end = eventInstant(raw.end);
  const attendeesRaw = Array.isArray(raw.attendees) ? raw.attendees : [];
  const attendees = attendeesRaw
    .map((a) => {
      if (!a || typeof a !== "object") return null;
      const email =
        typeof (a as { email?: unknown }).email === "string"
          ? String((a as { email: string }).email).trim().toLowerCase()
          : null;
      if (!email) return null;
      const displayName =
        typeof (a as { displayName?: unknown }).displayName === "string"
          ? boundText((a as { displayName: string }).displayName, 80)
          : null;
      const responseStatus =
        typeof (a as { responseStatus?: unknown }).responseStatus === "string"
          ? String((a as { responseStatus: string }).responseStatus)
          : null;
      return { email, displayName, responseStatus };
    })
    .filter(Boolean) as LeoCalendarEventEvidence["attendees"];

  const organizerEmail =
    raw.organizer && typeof raw.organizer === "object"
      ? typeof (raw.organizer as { email?: unknown }).email === "string"
        ? String((raw.organizer as { email: string }).email).trim().toLowerCase()
        : null
      : null;

  return {
    eventId: id,
    title: boundText(raw.summary, 200),
    start: start.iso,
    end: end.iso,
    timezone: start.timezone || end.timezone,
    attendees,
    organizer: organizerEmail,
    location: boundText(raw.location, 200),
    meetingUrl: extractMeetingUrl(raw),
    description: boundText(raw.description, LEO_GOOGLE_BOUNDS.maxDescriptionChars),
    responseStatus:
      typeof raw.status === "string" ? boundText(raw.status, 40) : null,
  };
}

async function calendarGet(path: string, accessToken: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LEO_GOOGLE_BOUNDS.fetchTimeoutMs);
  try {
    return await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
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

/**
 * Read calendar events for a bounded time window. Read-only.
 */
export async function readLeoCalendarEvents(options?: {
  timeMinIso?: string | null;
  timeMaxIso?: string | null;
  maxResults?: number | null;
  nowMs?: number;
}): Promise<LeoCalendarReadResult> {
  const maxResults = clampMax(options?.maxResults);
  const nowMs = options?.nowMs ?? Date.now();
  const timeMin = options?.timeMinIso ?? new Date(nowMs - 2 * 60 * 60 * 1000).toISOString();
  const timeMax =
    options?.timeMaxIso ?? new Date(nowMs + 7 * 24 * 60 * 60 * 1000).toISOString();

  const limitations: string[] = [
    "Calendar read-only — no create/update/delete/RSVP.",
    `Bounded to ${maxResults} events (hard max ${LEO_GOOGLE_BOUNDS.maxEventsHard}).`,
    "Event counts reflect the requested bounded window, not the entire calendar.",
  ];

  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      availability: "NOT_CONFIGURED",
      events: [],
      timeMin,
      timeMax,
      windowReadSuccessfully: false,
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
      tokenResult.availability === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : "UNAVAILABLE";
    return {
      availability,
      events: [],
      timeMin,
      timeMax,
      windowReadSuccessfully: false,
      limitations: [...limitations, "Calendar access token unavailable."],
      errorCode: tokenResult.errorCode ?? "GOOGLE_TOKEN_UNAVAILABLE",
    };
  }

  try {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults: String(maxResults),
      singleEvents: "true",
      orderBy: "startTime",
    });
    const res = await calendarGet(
      `/calendars/primary/events?${params.toString()}`,
      tokenResult.accessToken,
    );
    if (!res.ok) {
      return {
        availability: "UNAVAILABLE",
        events: [],
        timeMin,
        timeMax,
        windowReadSuccessfully: false,
        limitations: [...limitations, "Calendar events request failed."],
        errorCode: classifyLeoCalendarHttpStatus(res.status),
      };
    }

    const json = (await res.json()) as { items?: Record<string, unknown>[] };
    const events = (json.items ?? [])
      .slice(0, maxResults)
      .map(mapEvent)
      .filter((e): e is LeoCalendarEventEvidence => Boolean(e));

    return {
      availability: "AVAILABLE",
      events,
      timeMin,
      timeMax,
      windowReadSuccessfully: true,
      limitations,
      errorCode: null,
    };
  } catch {
    return {
      availability: "UNAVAILABLE",
      events: [],
      timeMin,
      timeMax,
      windowReadSuccessfully: false,
      limitations: [...limitations, "Calendar network/timeout failure."],
      errorCode: "CALENDAR_API_NETWORK_OR_TIMEOUT",
    };
  }
}
