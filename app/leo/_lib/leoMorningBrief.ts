/**
 * LEO-14.11 Morning CEO Brief — pure deterministic composition.
 * No DB, no network, no AI. Orchestrates already-fetched canonical intelligence.
 */
import { LEONIX_OFFICE_TIME_ZONE } from "@/app/lib/visitanos/visitanosOfficeHours";
import type { LeoAttentionRuntimeBrief } from "@/app/leo/_lib/leoAttentionRuntime";
import {
  cardDueStateForCommitment,
  countLeoCommitmentIntelligence,
  isCandidateCommitment,
  isConfirmedOwnerCommitment,
} from "@/app/leo/_lib/leoCommitmentIntelligence";
import {
  interpretLeoReceiptState,
  mapReceiptToResultCard,
} from "@/app/leo/_lib/leoReceiptIntelligence";
import {
  boundSpokenSummary,
  mapCalendarEventToResultCard,
  mapClientCareSignalToResultCard,
  mapCommitmentToResultCard,
  mapProjectSnapshotToResultCard,
} from "@/app/leo/_lib/leoResultCards";
import type {
  LeoClientCareSignal,
  LeoClientCareWatchResult,
  LeoCommitment,
  LeoCommunicationExecutiveSnapshot,
  LeoDurableToolReceipt,
  LeoEmailResultCard,
  LeoMorningBrief,
  LeoMorningBriefAvailability,
  LeoMorningBriefCounts,
  LeoMorningBriefOverallState,
  LeoMorningBriefPriority,
  LeoMorningBriefSection,
  LeoMorningBriefSectionKind,
  LeoMorningBriefTopPriority,
  LeoProjectExecutiveSnapshot,
  LeoResultCard,
  LeoToolAvailability,
} from "@/app/leo/_lib/leoTypes";

export const LEO_MORNING_BRIEF_MAX_TOP_PRIORITIES = 5;
export const LEO_MORNING_BRIEF_MAX_EMAIL_CARDS = 5;
export const LEO_MORNING_BRIEF_MAX_CALENDAR_TODAY = 4;
export const LEO_MORNING_BRIEF_NEAR_MEETING_MS = 2 * 60 * 60 * 1000;

const PRIORITY_RANK: Record<LeoMorningBriefPriority, number> = {
  DO_NOW: 0,
  DO_TODAY: 1,
  WATCH: 2,
  CAN_WAIT: 3,
  UNKNOWN: 4,
};

const EMAIL_PRIORITY: Record<string, number> = {
  WAITING_ON_US: 0,
  LIKELY_REPLY_NEEDED: 1,
  NEEDS_REVIEW: 2,
  UNKNOWN: 3,
  INFORMATIONAL: 4,
  AUTOMATED: 5,
};

export type LeoMorningBriefBuildInput = {
  nowMs: number;
  timezone?: string | null;
  attention?: {
    availability: LeoMorningBriefAvailability;
    brief: LeoAttentionRuntimeBrief | null;
    limitation?: string | null;
  };
  clientCare?: {
    availability: LeoMorningBriefAvailability;
    watch: LeoClientCareWatchResult | null;
    limitation?: string | null;
  };
  communication?: {
    availability: LeoMorningBriefAvailability;
    snapshot: LeoCommunicationExecutiveSnapshot | null;
    limitation?: string | null;
  };
  commitments?: {
    availability: LeoMorningBriefAvailability;
    commitments: LeoCommitment[];
    limitation?: string | null;
  };
  receipts?: {
    availability: LeoMorningBriefAvailability;
    receipts: LeoDurableToolReceipt[];
    limitation?: string | null;
  };
  project?: {
    availability: LeoMorningBriefAvailability;
    snapshot: LeoProjectExecutiveSnapshot | null;
    limitation?: string | null;
  };
};

export function resolveLeoMorningBriefTimezone(input?: string | null): string {
  const tz = input?.trim();
  if (tz) return tz;
  return LEONIX_OFFICE_TIME_ZONE;
}

function mapToolAvailability(
  availability: LeoToolAvailability | "UNAVAILABLE" | "EMPTY" | undefined,
): LeoMorningBriefAvailability {
  if (!availability) return "UNAVAILABLE";
  if (availability === "AVAILABLE") return "AVAILABLE";
  if (availability === "PARTIAL") return "PARTIAL";
  if (availability === "NOT_CONFIGURED") return "NOT_CONFIGURED";
  if (availability === "EMPTY") return "EMPTY";
  return "UNAVAILABLE";
}

function ymdInTimezone(ms: number, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function formatTimeInTimezone(iso: string | null | undefined, timezone: string): string | null {
  if (!iso) return null;
  const d = Date.parse(iso);
  if (!Number.isFinite(d)) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

function scrubMorningBriefSpokenText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "")
    .replace(/\b(gmail|calendar|evidence|unknown|limitation|WAITING_ON_US|LIKELY_REPLY_NEEDED|NEEDS_REVIEW|AUTOMATED|INFORMATIONAL):\S+/gi, "")
    .replace(/\bLEO-[0-9]+[A-Z]?\b/g, "LEO")
    .replace(/\b[a-f0-9]{8,}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sortEmailCards(cards: LeoEmailResultCard[]): LeoEmailResultCard[] {
  return [...cards].sort((a, b) => {
    const pa = EMAIL_PRIORITY[a.attentionLabel ?? "UNKNOWN"] ?? 3;
    const pb = EMAIL_PRIORITY[b.attentionLabel ?? "UNKNOWN"] ?? 3;
    if (pa !== pb) return pa - pb;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}

function priorityCandidates(input: {
  nowMs: number;
  timezone: string;
  attention: LeoAttentionRuntimeBrief | null;
  clientCare: LeoClientCareWatchResult | null;
  communication: LeoCommunicationExecutiveSnapshot | null;
  commitments: LeoCommitment[];
  receipts: LeoDurableToolReceipt[];
  project: LeoProjectExecutiveSnapshot | null;
}): Array<Omit<LeoMorningBriefTopPriority, "rank">> {
  const out: Array<Omit<LeoMorningBriefTopPriority, "rank">> = [];
  const today = ymdInTimezone(input.nowMs, input.timezone);

  for (const signal of input.clientCare?.signals ?? []) {
    if (!signal.attentionEligible) continue;
    const priority: LeoMorningBriefPriority =
      signal.kind === "FOLLOW_UP_OVERDUE" || signal.kind === "NEEDS_REPLY"
        ? "DO_NOW"
        : signal.kind === "OPEN_SUPPORT" || signal.kind === "FOLLOW_UP_DUE"
          ? "DO_TODAY"
          : "WATCH";
    out.push({
      priority,
      what: signal.title,
      why: signal.summary,
      dueOrTime: signal.followUpAt ? formatTimeInTimezone(signal.followUpAt, input.timezone) : null,
      source: "Client Care",
      safeNextAction: signal.recommendedNextStep,
      cardId: `client:${signal.key}`,
      evidenceRef: signal.key,
    });
  }

  for (const c of input.commitments) {
    if (c.status !== "OPEN") continue;
    const dueState = cardDueStateForCommitment(c, input.nowMs);
    if (isConfirmedOwnerCommitment(c)) {
      const priority: LeoMorningBriefPriority =
        dueState === "OVERDUE" ? "DO_NOW" : dueState === "DUE_TODAY" ? "DO_TODAY" : dueState === "DUE_SOON" ? "WATCH" : "CAN_WAIT";
      if (priority === "CAN_WAIT" && c.priority === "INFORMATIONAL") continue;
      out.push({
        priority,
        what: c.title,
        why:
          dueState === "OVERDUE"
            ? "Confirmed commitment is overdue."
            : dueState === "DUE_TODAY"
              ? "Confirmed commitment is due today."
              : dueState === "DUE_SOON"
                ? "Confirmed commitment is due soon."
                : "Open confirmed commitment.",
        dueOrTime: c.dueAt ? formatTimeInTimezone(c.dueAt, input.timezone) : null,
        source: "Commitment",
        safeNextAction: "Review or complete this commitment.",
        cardId: `commitment:${c.id}`,
        evidenceRef: c.id,
      });
    } else if (isCandidateCommitment(c)) {
      out.push({
        priority: dueState === "OVERDUE" ? "WATCH" : "WATCH",
        what: c.title,
        why: "Possible commitment — needs confirmation before treating as a promise.",
        dueOrTime: c.dueAt ? formatTimeInTimezone(c.dueAt, input.timezone) : null,
        source: "Commitment candidate",
        safeNextAction: "Confirm or dismiss this candidate.",
        cardId: `commitment:${c.id}`,
        evidenceRef: c.id,
      });
    }
  }

  const emails = sortEmailCards(input.communication?.gmail.emailCards ?? []).slice(
    0,
    LEO_MORNING_BRIEF_MAX_EMAIL_CARDS,
  );
  for (const email of emails) {
    const label = email.attentionLabel ?? "UNKNOWN";
    if (label === "AUTOMATED" || label === "INFORMATIONAL") continue;
    const priority: LeoMorningBriefPriority =
      label === "WAITING_ON_US" ? "DO_NOW" : label === "LIKELY_REPLY_NEEDED" ? "DO_TODAY" : "WATCH";
    out.push({
      priority,
      what: email.title,
      why:
        label === "WAITING_ON_US"
          ? "Email conversation appears to be waiting on your reply."
          : label === "LIKELY_REPLY_NEEDED"
            ? "Email likely needs a reply."
            : "Email needs review.",
      dueOrTime: null,
      source: "Email",
      safeNextAction: "Open and review this conversation.",
      cardId: email.cardId,
      evidenceRef: email.messageId ?? email.threadId ?? email.cardId,
    });
  }

  const nextEvent = input.communication?.calendar.nextEvent ?? null;
  if (nextEvent?.start) {
    const startMs = Date.parse(nextEvent.start);
    const sameDay = ymdInTimezone(startMs, input.timezone) === today;
    const near = Number.isFinite(startMs) && startMs - input.nowMs <= LEO_MORNING_BRIEF_NEAR_MEETING_MS;
    if (sameDay || near) {
      out.push({
        priority: near ? "DO_NOW" : "DO_TODAY",
        what: nextEvent.title ?? "Upcoming meeting",
        why: sameDay ? "Meeting on today's schedule." : "Next calendar event is approaching.",
        dueOrTime: formatTimeInTimezone(nextEvent.start, input.timezone),
        source: "Calendar",
        safeNextAction: "Prepare for this meeting.",
        cardId: `calendar:${nextEvent.eventId}`,
        evidenceRef: nextEvent.eventId,
      });
    }
  }

  for (const receipt of input.receipts) {
    const interp = interpretLeoReceiptState(receipt);
    if (receipt.lifecycleState === "AWAITING_APPROVAL") {
      out.push({
        priority: "DO_TODAY",
        what: receipt.actionType.replace(/_/g, " "),
        why: "LEO prepared an action awaiting your approval.",
        dueOrTime: null,
        source: "Prepared action",
        safeNextAction: "Review the prepared action in LEO.",
        cardId: `receipt:${receipt.id}`,
        evidenceRef: receipt.id,
      });
    } else if (receipt.lifecycleState === "FAILED") {
      out.push({
        priority: "DO_TODAY",
        what: receipt.actionType.replace(/_/g, " "),
        why: interp.label,
        dueOrTime: null,
        source: "LEO action",
        safeNextAction: "Inspect what failed and decide next steps.",
        cardId: `receipt:${receipt.id}`,
        evidenceRef: receipt.id,
      });
    } else if (interp.preparedOnly) {
      out.push({
        priority: "WATCH",
        what: receipt.actionType.replace(/_/g, " "),
        why: "Prepared — not executed.",
        dueOrTime: null,
        source: "Prepared action",
        safeNextAction: "Review the preparation.",
        cardId: `receipt:${receipt.id}`,
        evidenceRef: receipt.id,
      });
    }
  }

  for (const item of input.attention?.visibleItems ?? input.attention?.items ?? []) {
    if (item.level === "INFORMATIONAL") continue;
    const priority: LeoMorningBriefPriority =
      item.level === "CRITICAL" ? "DO_NOW" : item.level === "HIGH" ? "DO_TODAY" : "WATCH";
    out.push({
      priority,
      what: item.title,
      why: item.summary,
      dueOrTime: null,
      source: "Attention",
      safeNextAction: item.recommendedNextStep,
      cardId: `attention:${item.id}`,
      evidenceRef: item.id,
    });
  }

  if (input.project?.qaAdvice?.summary) {
    const needsAttention =
      input.project.qaAdvice.state !== "NO_PROJECT_ACTION" &&
      input.project.qaAdvice.state !== "UNKNOWN" &&
      /review|mismatch|failed|behind|ahead|qa|investigate|wait/i.test(input.project.qaAdvice.summary);
    if (needsAttention) {
      out.push({
        priority: "WATCH",
        what: input.project.qaAdvice.summary,
        why: input.project.qaAdvice.nextStep ?? "Project/deployment state may need attention.",
        dueOrTime: null,
        source: "Project",
        safeNextAction: input.project.qaAdvice.nextStep ?? "Review project status.",
        cardId: "project:qa",
        evidenceRef: input.project.leoHead.sha ?? "project",
      });
    }
  }

  return out.sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return a.what.localeCompare(b.what);
  });
}

function dedupePriorities(
  items: Array<Omit<LeoMorningBriefTopPriority, "rank">>,
): LeoMorningBriefTopPriority[] {
  const seen = new Set<string>();
  const out: LeoMorningBriefTopPriority[] = [];
  for (const item of items) {
    const key = item.evidenceRef ?? item.cardId ?? item.what;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, rank: out.length + 1 });
    if (out.length >= LEO_MORNING_BRIEF_MAX_TOP_PRIORITIES) break;
  }
  return out;
}

function buildSection(
  kind: LeoMorningBriefSectionKind,
  title: string,
  priority: LeoMorningBriefPriority,
  summary: string,
  cards: LeoResultCard[],
  availability: LeoMorningBriefAvailability,
  limitation?: string | null,
): LeoMorningBriefSection {
  return {
    kind,
    title,
    priority,
    summary,
    count: cards.length,
    cards,
    evidenceRefs: cards.flatMap((c) => c.evidenceRefs ?? []).slice(0, 12),
    availability,
    limitation: limitation ?? null,
  };
}

function composeHeadline(input: {
  topPriorities: LeoMorningBriefTopPriority[];
  partialData: boolean;
  lightDay: boolean;
  commitmentCounts: ReturnType<typeof countLeoCommitmentIntelligence>;
  emailWaiting: number;
}): string {
  if (input.partialData) {
    const n = input.topPriorities.length;
    if (n === 0) {
      return "Based on available Leonix data, nothing urgent is flagged right now — some sources were unavailable.";
    }
    const bits = input.topPriorities.slice(0, 3).map((p) => p.what.toLowerCase());
    return `Based on available Leonix data, ${n} item${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} you first: ${bits.join(", ")}.`;
  }
  if (input.lightDay) {
    const meeting =
      input.topPriorities.find((p) => p.source === "Calendar")?.what ?? null;
    if (meeting) {
      return `Your morning looks light. ${meeting} is coming up and no confirmed commitments are overdue.`;
    }
    return "Your morning looks light. No confirmed commitments are overdue from available Leonix data.";
  }
  const n = input.topPriorities.length;
  if (n === 0) {
    return "Nothing urgent is flagged from available Leonix evidence right now.";
  }
  const bits: string[] = [];
  if (input.commitmentCounts.confirmedOverdue > 0) {
    bits.push(
      `${input.commitmentCounts.confirmedOverdue} overdue commitment${input.commitmentCounts.confirmedOverdue === 1 ? "" : "s"}`,
    );
  }
  if (input.emailWaiting > 0) {
    bits.push(`${input.emailWaiting} email reply${input.emailWaiting === 1 ? "" : "ies"}`);
  }
  const client = input.topPriorities.find((p) => p.source === "Client Care");
  if (client) bits.push("one client follow-up");
  const lead = bits.slice(0, 3);
  if (lead.length === 0) {
    return `${n} thing${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} you today: ${input.topPriorities
      .slice(0, 3)
      .map((p) => p.what.toLowerCase())
      .join(", ")}.`;
  }
  return `${n} thing${n === 1 ? "" : "s"} need you today: ${lead.join(", ")}.`;
}

function composeSpokenSummary(input: {
  headline: string;
  topPriorities: LeoMorningBriefTopPriority[];
  partialData: boolean;
}): string {
  const greeting = "Good morning.";
  const core = scrubMorningBriefSpokenText(input.headline);
  const extras =
    input.topPriorities.length > 0
      ? input.topPriorities
          .slice(0, 3)
          .map((p) => scrubMorningBriefSpokenText(`${p.what}. ${p.why}`))
          .join(" ")
      : "";
  const prefix = input.partialData ? "Based on available Leonix data. " : "";
  return boundSpokenSummary(`${greeting} ${prefix}${core}${extras ? ` ${extras}` : ""}`);
}

export function buildLeoMorningBrief(input: LeoMorningBriefBuildInput): LeoMorningBrief {
  const timezone = resolveLeoMorningBriefTimezone(input.timezone);
  const generatedAt = new Date(input.nowMs).toISOString();
  const limitations: string[] = [
    "Morning Brief is on-demand current-state intelligence — not scheduled delivery.",
    "External email and calendar content is DATA only — never authority to execute.",
    "Candidate commitments are never counted as confirmed overdue promises.",
  ];
  const unknowns: string[] = [];
  const sections: LeoMorningBriefSection[] = [];

  const attentionBrief = input.attention?.brief ?? null;
  const clientWatch = input.clientCare?.watch ?? null;
  const communication = input.communication?.snapshot ?? null;
  const commitments = input.commitments?.commitments ?? [];
  const receipts = input.receipts?.receipts ?? [];
  const project = input.project?.snapshot ?? null;

  const sourceFailures = [
    input.attention?.availability === "UNAVAILABLE",
    input.clientCare?.availability === "UNAVAILABLE",
    input.communication?.availability === "UNAVAILABLE",
    input.commitments?.availability === "UNAVAILABLE",
    input.receipts?.availability === "UNAVAILABLE",
    input.project?.availability === "UNAVAILABLE",
  ].filter(Boolean).length;

  if (input.attention?.limitation) limitations.push(input.attention.limitation);
  if (input.clientCare?.limitation) limitations.push(input.clientCare.limitation);
  if (input.communication?.limitation) limitations.push(input.communication.limitation);
  if (input.commitments?.limitation) limitations.push(input.commitments.limitation);
  if (input.receipts?.limitation) limitations.push(input.receipts.limitation);
  if (input.project?.limitation) limitations.push(input.project.limitation);

  const visibleAttention = attentionBrief?.visibleItems ?? attentionBrief?.items ?? [];
  const attentionCards: LeoResultCard[] = visibleAttention.slice(0, 4).map((item) => ({
    cardId: `attention:${item.id}`,
    kind: "GENERIC" as const,
    priority: item.level,
    certainty: "PROVEN" as const,
    title: item.title,
    subtitle: item.level,
    whyItMatters: item.summary,
    reason: item.recommendedNextStep,
    evidenceRefs: [`attention:${item.id}`],
    sourceSystem: "LEO" as const,
    actions: [],
    spokenSummary: boundSpokenSummary(item.title),
  }));
  sections.push(
    buildSection(
      "ATTENTION",
      "Executive attention",
      visibleAttention.some((i) => i.level === "CRITICAL" || i.level === "HIGH") ? "DO_NOW" : "WATCH",
      visibleAttention.length
        ? `${visibleAttention.length} attention item${visibleAttention.length === 1 ? "" : "s"} after owner dispositions.`
        : input.attention?.availability === "UNAVAILABLE"
          ? "Attention data is unavailable."
          : "No attention items currently qualify.",
      attentionCards,
      input.attention?.availability ?? "UNAVAILABLE",
      input.attention?.limitation,
    ),
  );

  const careSignals = (clientWatch?.signals ?? []).filter((s) => s.attentionEligible).slice(0, 5);
  sections.push(
    buildSection(
      "CLIENT_CARE",
      "Client & customer care",
      careSignals.some((s) => s.kind === "FOLLOW_UP_OVERDUE" || s.kind === "NEEDS_REPLY")
        ? "DO_NOW"
        : "WATCH",
      careSignals.length
        ? `${careSignals.length} client-care item${careSignals.length === 1 ? "" : "s"} need attention.`
        : input.clientCare?.availability === "UNAVAILABLE"
          ? "Client Care data is unavailable."
          : "No client-care items need attention from available sources.",
      careSignals.map((s) => mapClientCareSignalToResultCard(s)),
      input.clientCare?.availability ?? "UNAVAILABLE",
      input.clientCare?.limitation,
    ),
  );

  const emailCards = sortEmailCards(communication?.gmail.emailCards ?? []).slice(
    0,
    LEO_MORNING_BRIEF_MAX_EMAIL_CARDS,
  );
  const emailHigh = emailCards.filter(
    (c) => c.attentionLabel === "WAITING_ON_US" || c.attentionLabel === "LIKELY_REPLY_NEEDED" || c.attentionLabel === "NEEDS_REVIEW",
  );
  sections.push(
    buildSection(
      "EMAIL",
      "Email needing attention",
      emailHigh.some((c) => c.attentionLabel === "WAITING_ON_US") ? "DO_NOW" : "WATCH",
      emailHigh.length
        ? `${emailHigh.length} email conversation${emailHigh.length === 1 ? "" : "s"} may need your reply.`
        : communication?.gmail.availability === "NOT_CONFIGURED"
          ? "Gmail is not configured."
          : communication?.gmail.availability === "UNAVAILABLE"
            ? "Gmail is unavailable."
            : "No high-priority email conversations in the bounded set.",
      emailCards,
      mapToolAvailability(communication?.gmail.availability),
      input.communication?.limitation,
    ),
  );

  const todayEvents = communication?.calendar.todayEvents ?? [];
  const calendarCards = todayEvents
    .slice(0, LEO_MORNING_BRIEF_MAX_CALENDAR_TODAY)
    .map((event) => mapCalendarEventToResultCard({ event }));
  if (
    todayEvents.length === 0 &&
    communication?.calendar.tomorrowEvents?.length &&
    communication.calendar.availability === "AVAILABLE"
  ) {
    calendarCards.push(
      ...communication.calendar.tomorrowEvents.slice(0, 2).map((event) =>
        mapCalendarEventToResultCard({ event }),
      ),
    );
  }
  sections.push(
    buildSection(
      "CALENDAR",
      "Today's schedule",
      calendarCards.length ? "DO_TODAY" : "CAN_WAIT",
      calendarCards.length
        ? `${todayEvents.length || calendarCards.length} calendar item${calendarCards.length === 1 ? "" : "s"} on your horizon.`
        : communication?.calendar.availability === "NOT_CONFIGURED"
          ? "Calendar is not configured."
          : communication?.calendar.availability === "UNAVAILABLE"
            ? "Calendar is unavailable."
            : "No calendar events in today's bounded window.",
      calendarCards,
      mapToolAvailability(communication?.calendar.availability),
      input.communication?.limitation,
    ),
  );

  const commitmentCounts = countLeoCommitmentIntelligence(commitments, input.nowMs);
  const openCommitments = commitments.filter((c) => c.status === "OPEN");
  const confirmedCards = openCommitments
    .filter(isConfirmedOwnerCommitment)
    .slice(0, 6)
    .map((c) => mapCommitmentToResultCard({ commitment: c, nowMs: input.nowMs }));
  const candidateCards = openCommitments
    .filter(isCandidateCommitment)
    .slice(0, 3)
    .map((c) => mapCommitmentToResultCard({ commitment: c, nowMs: input.nowMs }));
  const commitmentSummary =
    input.commitments?.availability === "UNAVAILABLE"
      ? "Commitment records are unavailable — not claiming zero commitments."
      : `${commitmentCounts.confirmedOverdue} confirmed overdue; ${commitmentCounts.confirmedDueToday} due today; ${commitmentCounts.confirmedDueSoon} due soon; ${commitmentCounts.candidates} possible candidate${commitmentCounts.candidates === 1 ? "" : "s"}.`;
  sections.push(
    buildSection(
      "COMMITMENTS",
      "Commitments",
      commitmentCounts.confirmedOverdue > 0 ? "DO_NOW" : commitmentCounts.confirmedDueToday > 0 ? "DO_TODAY" : "WATCH",
      commitmentSummary,
      [...confirmedCards, ...candidateCards],
      input.commitments?.availability ?? "UNAVAILABLE",
      input.commitments?.limitation,
    ),
  );

  const receiptCards = receipts
    .filter((r) =>
      ["AWAITING_APPROVAL", "FAILED", "PREPARED", "NOT_EXECUTED", "VERIFIED", "EXECUTED"].includes(
        r.lifecycleState,
      ),
    )
    .slice(0, 6)
    .map(mapReceiptToResultCard);
  const awaiting = receipts.filter((r) => r.lifecycleState === "AWAITING_APPROVAL").length;
  const failed = receipts.filter((r) => r.lifecycleState === "FAILED").length;
  const prepared = receipts.filter((r) => r.lifecycleState === "PREPARED").length;
  sections.push(
    buildSection(
      "PREPARED_ACTIONS",
      "LEO prepared & action status",
      awaiting > 0 || failed > 0 ? "DO_TODAY" : "WATCH",
      input.receipts?.availability === "UNAVAILABLE"
        ? "Receipt history is unavailable."
        : `${prepared} prepared; ${awaiting} awaiting approval; ${failed} failed.`,
      receiptCards,
      input.receipts?.availability ?? "UNAVAILABLE",
      input.receipts?.limitation,
    ),
  );

  const projectCards: LeoResultCard[] = [];
  if (project) {
    projectCards.push(mapProjectSnapshotToResultCard(project));
  }
  sections.push(
    buildSection(
      "PROJECTS",
      "Project changes",
      project?.qaAdvice?.state && project.qaAdvice.state !== "NO_PROJECT_ACTION" ? "WATCH" : "CAN_WAIT",
      project
        ? project.recentChanges.length
          ? `${project.recentChanges.length} recent project change${project.recentChanges.length === 1 ? "" : "es"} noted.`
          : "No notable recent project changes in the bounded snapshot."
        : input.project?.availability === "UNAVAILABLE"
          ? "Project intelligence unavailable."
          : "Project intelligence not configured.",
      projectCards.slice(0, 2),
      input.project?.availability ?? "NOT_CONFIGURED",
      input.project?.limitation,
    ),
  );

  if (sourceFailures > 0) {
    const degraded: string[] = [];
    if (input.communication?.availability === "UNAVAILABLE") degraded.push("Gmail/Calendar unavailable");
    if (input.commitments?.availability === "UNAVAILABLE") degraded.push("Commitment persistence unavailable");
    if (input.receipts?.availability === "UNAVAILABLE") degraded.push("Receipt persistence unavailable");
    sections.push(
      buildSection(
        "SYSTEM",
        "Operational limitations",
        "WATCH",
        degraded.join("; ") || "Some intelligence sources were unavailable.",
        [],
        "PARTIAL",
        degraded.join("; ") || null,
      ),
    );
    unknowns.push("partial_source_availability");
  }

  const ranked = priorityCandidates({
    nowMs: input.nowMs,
    timezone,
    attention: attentionBrief,
    clientCare: clientWatch,
    communication,
    commitments: openCommitments,
    receipts,
    project,
  });
  const topPriorities = dedupePriorities(ranked);
  const canWait = ranked
    .filter((p) => p.priority === "CAN_WAIT")
    .slice(0, 4)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const partialData = sourceFailures > 0;
  const lightDay =
    !partialData &&
    topPriorities.filter((p) => p.priority === "DO_NOW" || p.priority === "DO_TODAY").length === 0 &&
    commitmentCounts.confirmedOverdue === 0;

  const overallState: LeoMorningBriefOverallState = partialData
    ? topPriorities.length > 0
      ? "PARTIAL_DATA"
      : "PARTIAL_DATA"
    : lightDay
      ? "LIGHT_DAY"
      : topPriorities.length > 0
        ? "NEEDS_ATTENTION"
        : "LIGHT_DAY";

  const headline = composeHeadline({
    topPriorities,
    partialData,
    lightDay,
    commitmentCounts,
    emailWaiting: communication?.gmail.executiveCounts.waitingOnUs ?? 0,
  });
  const spokenSummary = composeSpokenSummary({ headline, topPriorities, partialData });

  const counts: LeoMorningBriefCounts = {
    topPriorities: topPriorities.length,
    attention: visibleAttention.length,
    clientCare: careSignals.length,
    emailHighPriority: emailHigh.length,
    calendarToday: todayEvents.length,
    confirmedOverdue: commitmentCounts.confirmedOverdue,
    confirmedDueToday: commitmentCounts.confirmedDueToday,
    confirmedDueSoon: commitmentCounts.confirmedDueSoon,
    candidates: commitmentCounts.candidates,
    awaitingApproval: awaiting,
    failed,
    prepared,
  };

  return {
    generatedAt,
    timezone,
    overallState,
    headline,
    sections,
    counts,
    topPriorities,
    canWait,
    unknowns: [...new Set(unknowns)],
    limitations: [...new Set(limitations)],
    spokenSummary,
  };
}

/** Exported for governance tests — spoken yes cannot execute without exact pending action. */
export function leoMorningBriefGenericYesCannotExecute(pendingActionId: string | null | undefined): boolean {
  return !pendingActionId?.trim();
}
