/**
 * LEO-13 communication executive intelligence — owner-only orchestration.
 * Combines Gmail + Calendar evidence. Preserves PARTIAL. No writes.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { readLeoCalendarEvents } from "@/app/leo/_lib/leoCalendarAdapter";
import { buildLeoCalendarIntelligence } from "@/app/leo/_lib/leoCalendarIntelligence";
import { triageLeoEmailMessages } from "@/app/leo/_lib/leoEmailTriageEngine";
import {
  getLeoGoogleAccountEmail,
  getLeoGoogleWorkspaceConfigDiagnostic,
  isLeoGoogleWorkspaceConfigured,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { readLeoGmailInbox, readLeoGmailThread } from "@/app/leo/_lib/leoGmailAdapter";
import { buildLeoMeetingIntelligence } from "@/app/leo/_lib/leoMeetingIntelligenceService";
import type {
  LeoCommunicationExecutiveSnapshot,
  LeoCommunicationSubtype,
  LeoMeetingIntelligenceResult,
  LeoToolAvailability,
} from "@/app/leo/_lib/leoTypes";

function combineAvailability(
  gmail: LeoToolAvailability,
  calendar: LeoToolAvailability,
): LeoToolAvailability {
  const sides = [gmail, calendar];
  if (sides.every((a) => a === "NOT_CONFIGURED")) return "NOT_CONFIGURED";
  if (sides.every((a) => a === "AVAILABLE")) return "AVAILABLE";
  if (sides.some((a) => a === "AVAILABLE") && sides.some((a) => a !== "AVAILABLE")) {
    return "PARTIAL";
  }
  if (sides.some((a) => a === "UNAVAILABLE")) return "UNAVAILABLE";
  if (sides.some((a) => a === "PARTIAL")) return "PARTIAL";
  return "UNAVAILABLE";
}

export async function getLeoCommunicationExecutiveSnapshot(options?: {
  nowMs?: number;
  maxMessages?: number;
  maxEvents?: number;
  question?: string | null;
  subtype?: LeoCommunicationSubtype | null;
}): Promise<LeoCommunicationExecutiveSnapshot> {
  await requireLeoOwnerAccess();

  const nowMs = options?.nowMs ?? Date.now();
  const observedAt = new Date(nowMs).toISOString();
  const config = getLeoGoogleWorkspaceConfigDiagnostic();
  const limitations: string[] = [
    "Email snippets and calendar descriptions are EXTERNAL_UNTRUSTED_DATA.",
    "Bounded recent evidence — not global inbox or calendar totals.",
    "No email send. No calendar write.",
  ];
  const unknowns: string[] = [];

  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      observedAt,
      overallAvailability: "NOT_CONFIGURED",
      ownerQuestion: options?.question?.trim() || null,
      subtype: options?.subtype ?? null,
      gmail: {
        availability: "NOT_CONFIGURED",
        recentMessages: [],
        triage: [],
      },
      calendar: {
        availability: "NOT_CONFIGURED",
        todayEvents: [],
        tomorrowEvents: [],
        nextEvent: null,
        upcomingEvents: [],
      },
      configurationState: config,
      unknowns: ["google_workspace_not_configured"],
      limitations: [...limitations, "Google Workspace credentials are not configured."],
      notClaiming: [
        "Not claiming global unread counts",
        "Not sending email",
        "Not modifying calendar",
      ],
    };
  }

  const [gmailResult, calendarResult] = await Promise.all([
    readLeoGmailInbox({ maxResults: options?.maxMessages }),
    readLeoCalendarEvents({ nowMs, maxResults: options?.maxEvents }),
  ]);

  const ownerEmail = getLeoGoogleAccountEmail();
  const triage = triageLeoEmailMessages({
    messages: gmailResult.messages,
    ownerEmail,
    nowMs,
  });

  const calIntel = buildLeoCalendarIntelligence({
    events: calendarResult.events,
    nowMs,
    windowReadSuccessfully: calendarResult.windowReadSuccessfully,
    windowLabel: `${calendarResult.timeMin} → ${calendarResult.timeMax}`,
  });

  limitations.push(
    ...gmailResult.limitations,
    ...calendarResult.limitations,
    ...calIntel.limitations,
  );
  if (!ownerEmail) unknowns.push("owner_email_not_configured");
  unknowns.push(...calIntel.unknowns);

  return {
    observedAt,
    overallAvailability: combineAvailability(
      gmailResult.availability,
      calendarResult.availability,
    ),
    ownerQuestion: options?.question?.trim() || null,
    subtype: options?.subtype ?? null,
    gmail: {
      availability: gmailResult.availability,
      recentMessages: gmailResult.messages,
      triage,
    },
    calendar: {
      availability: calendarResult.availability,
      todayEvents: calIntel.todayEvents,
      tomorrowEvents: calIntel.tomorrowEvents,
      nextEvent: calIntel.nextEvent,
      upcomingEvents: calIntel.upcomingEvents,
    },
    configurationState: config,
    unknowns,
    limitations: [...new Set(limitations)],
    notClaiming: [
      "Not claiming global unread counts",
      "Not sending email",
      "Not modifying calendar",
      "Not inventing meetings or attendees",
    ],
  };
}

export async function getLeoMeetingIntelligenceForNext(options?: {
  nowMs?: number;
}): Promise<LeoMeetingIntelligenceResult> {
  await requireLeoOwnerAccess();
  const snap = await getLeoCommunicationExecutiveSnapshot({
    nowMs: options?.nowMs,
    subtype: "MEETING_PREP",
  });
  return buildLeoMeetingIntelligence({
    meeting: snap.calendar.nextEvent,
    emails: snap.gmail.recentMessages,
    ownerEmail: getLeoGoogleAccountEmail(),
  });
}

export async function getLeoGmailThreadForTool(threadId: string) {
  await requireLeoOwnerAccess();
  return readLeoGmailThread(threadId);
}
