/**
 * LEO-13 / LEO-14.3 communication executive intelligence — owner-only orchestration.
 * Combines Gmail + Calendar evidence. Preserves PARTIAL. No writes.
 * LEO-14.3: bounded thread enrichment before triage + executive email cards.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { readLeoCalendarEvents } from "@/app/leo/_lib/leoCalendarAdapter";
import { buildLeoCalendarIntelligence } from "@/app/leo/_lib/leoCalendarIntelligence";
import { triageLeoEmailMessages } from "@/app/leo/_lib/leoEmailTriageEngine";
import {
  buildLeoGmailConversationUnits,
  composeLeoGmailExecutiveSummary,
  composeLeoGmailSpokenSummary,
  countLeoGmailExecutiveLabels,
  LEO_GMAIL_THREAD_ENRICHMENT,
  mapLeoGmailConversationToEmailCard,
  mapPoolLimited,
  selectLeoGmailThreadEnrichmentCandidates,
} from "@/app/leo/_lib/leoGmailTriageUpgrade";
import {
  getLeoGoogleAccountEmail,
  getLeoGoogleWorkspaceConfigDiagnostic,
  isLeoGoogleWorkspaceConfigured,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { buildLeoGoogleConnectionDiagnostic } from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";
import { readLeoGmailInbox, readLeoGmailThread } from "@/app/leo/_lib/leoGmailAdapter";
import { buildLeoMeetingIntelligence } from "@/app/leo/_lib/leoMeetingIntelligenceService";
import type {
  LeoCommunicationExecutiveSnapshot,
  LeoCommunicationSubtype,
  LeoEmailMessageEvidence,
  LeoEmailThreadEvidence,
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

const EMPTY_GMAIL_COUNTS = {
  conversations: 0,
  waitingOnUs: 0,
  likelyReply: 0,
  needsReview: 0,
  automated: 0,
  informational: 0,
  unknown: 0,
} as const;

function emptyThreadEnrichment() {
  return {
    requested: 0,
    succeeded: 0,
    failed: 0,
    maxUniqueThreads: LEO_GMAIL_THREAD_ENRICHMENT.maxUniqueThreads,
    maxConcurrency: LEO_GMAIL_THREAD_ENRICHMENT.maxConcurrency,
  };
}

async function enrichGmailThreadsBounded(
  messages: LeoEmailMessageEvidence[],
): Promise<{
  threadsById: Record<string, LeoEmailThreadEvidence>;
  requested: number;
  succeeded: number;
  failed: number;
}> {
  const candidates = selectLeoGmailThreadEnrichmentCandidates(messages);
  const threadsById: Record<string, LeoEmailThreadEvidence> = {};
  let succeeded = 0;
  let failed = 0;

  await mapPoolLimited(
    candidates,
    LEO_GMAIL_THREAD_ENRICHMENT.maxConcurrency,
    async (threadId) => {
      try {
        const result = await readLeoGmailThread(threadId);
        if (result.availability === "AVAILABLE" && result.messages.length > 0) {
          threadsById[threadId] = { threadId, messages: result.messages };
          succeeded += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
      return null;
    },
  );

  return {
    threadsById,
    requested: candidates.length,
    succeeded,
    failed,
  };
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
    `Gmail thread enrichment capped at ${LEO_GMAIL_THREAD_ENRICHMENT.maxUniqueThreads} unique threads (concurrency ${LEO_GMAIL_THREAD_ENRICHMENT.maxConcurrency}).`,
  ];
  const unknowns: string[] = [];

  if (!isLeoGoogleWorkspaceConfigured()) {
    const runtimeDiagnostic = buildLeoGoogleConnectionDiagnostic({
      config,
      gmailAvailability: "NOT_CONFIGURED",
      calendarAvailability: "NOT_CONFIGURED",
      gmailErrorCode: "GOOGLE_NOT_CONFIGURED",
      calendarErrorCode: "GOOGLE_NOT_CONFIGURED",
    });
    return {
      observedAt,
      overallAvailability: "NOT_CONFIGURED",
      ownerQuestion: options?.question?.trim() || null,
      subtype: options?.subtype ?? null,
      gmail: {
        availability: "NOT_CONFIGURED",
        recentMessages: [],
        triage: [],
        errorCode: "GOOGLE_NOT_CONFIGURED",
        emailCards: [],
        executiveCounts: { ...EMPTY_GMAIL_COUNTS },
        spokenSummary: null,
        threadEnrichment: emptyThreadEnrichment(),
      },
      calendar: {
        availability: "NOT_CONFIGURED",
        todayEvents: [],
        tomorrowEvents: [],
        nextEvent: null,
        upcomingEvents: [],
        errorCode: "GOOGLE_NOT_CONFIGURED",
      },
      runtimeDiagnostic,
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

  let threadsById: Record<string, LeoEmailThreadEvidence> = {};
  let enrichment = emptyThreadEnrichment();
  if (
    gmailResult.availability === "AVAILABLE" ||
    gmailResult.availability === "PARTIAL"
  ) {
    const enriched = await enrichGmailThreadsBounded(gmailResult.messages);
    threadsById = enriched.threadsById;
    enrichment = {
      requested: enriched.requested,
      succeeded: enriched.succeeded,
      failed: enriched.failed,
      maxUniqueThreads: LEO_GMAIL_THREAD_ENRICHMENT.maxUniqueThreads,
      maxConcurrency: LEO_GMAIL_THREAD_ENRICHMENT.maxConcurrency,
    };
    if (enriched.failed > 0) {
      unknowns.push("some_gmail_thread_enrichments_failed");
      limitations.push(
        `${enriched.failed} thread enrichment(s) failed — those conversations stay conservatively classified.`,
      );
    }
  }

  const triage = triageLeoEmailMessages({
    messages: gmailResult.messages,
    threadsById,
    ownerEmail,
    nowMs,
  });

  const units = buildLeoGmailConversationUnits({
    messages: gmailResult.messages,
    triage,
  });
  const emailCards = units.map(mapLeoGmailConversationToEmailCard);
  const executiveCounts = countLeoGmailExecutiveLabels(emailCards);
  const gmailOk =
    gmailResult.availability === "AVAILABLE" || gmailResult.availability === "PARTIAL";
  const spokenSummary = gmailOk
    ? composeLeoGmailSpokenSummary({ counts: executiveCounts, cards: emailCards })
    : null;

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

  const runtimeDiagnostic = buildLeoGoogleConnectionDiagnostic({
    config,
    gmailAvailability: gmailResult.availability,
    calendarAvailability: calendarResult.availability,
    gmailErrorCode: gmailResult.errorCode,
    calendarErrorCode: calendarResult.errorCode,
  });

  // Partial: inbox ok but some threads failed → still usable Gmail intelligence.
  let gmailAvailability = gmailResult.availability;
  if (
    gmailAvailability === "AVAILABLE" &&
    enrichment.failed > 0 &&
    enrichment.succeeded > 0
  ) {
    gmailAvailability = "PARTIAL";
  }

  return {
    observedAt,
    overallAvailability: combineAvailability(
      gmailAvailability,
      calendarResult.availability,
    ),
    ownerQuestion: options?.question?.trim() || null,
    subtype: options?.subtype ?? null,
    gmail: {
      availability: gmailAvailability,
      recentMessages: gmailResult.messages,
      triage,
      errorCode: gmailResult.errorCode,
      emailCards,
      executiveCounts,
      spokenSummary,
      threadEnrichment: enrichment,
    },
    calendar: {
      availability: calendarResult.availability,
      todayEvents: calIntel.todayEvents,
      tomorrowEvents: calIntel.tomorrowEvents,
      nextEvent: calIntel.nextEvent,
      upcomingEvents: calIntel.upcomingEvents,
      errorCode: calendarResult.errorCode,
    },
    runtimeDiagnostic,
    configurationState: config,
    unknowns,
    limitations: [...new Set(limitations)],
    notClaiming: [
      "Not claiming global unread counts",
      "Not sending email",
      "Not modifying calendar",
      "Not inventing meetings or attendees",
      "Not inventing customer/lead status from Gmail alone",
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

/** Exposed for executive summary composition without re-fetching. */
export function composeGmailExecutiveSummaryFromSnapshot(
  snap: LeoCommunicationExecutiveSnapshot,
): string {
  return composeLeoGmailExecutiveSummary({
    counts: snap.gmail.executiveCounts,
    cards: snap.gmail.emailCards,
    ownerQuestion: snap.ownerQuestion,
    gmailAvailable:
      snap.gmail.availability === "AVAILABLE" || snap.gmail.availability === "PARTIAL",
  });
}
