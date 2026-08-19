/**
 * LEO-14.2 executive result cards — pure evidence → card mappers.
 * No DB, no network, no AI. Missing evidence → UNKNOWN / null.
 */
import {
  createAcknowledgeAction,
  createCreateCommitmentAction,
  createInspectAction,
  createJoinMeetingAction,
  createOpenCalendarAction,
  createOpenGmailAction,
  createOpenGithubAction,
  createOpenVercelAction,
  createPrepareDraftAction,
  createRemindLaterAction,
  createShowEvidenceAction,
  createSummarizeAction,
  buildTrustedGmailThreadUrl,
} from "@/app/leo/_lib/leoExecutiveActions";
import { LEO_COMMITMENT_DUE_SOON_MS } from "@/app/leo/_lib/leoPersistenceSemantics";
import type {
  LeoAttentionLevel,
  LeoCalendarEventEvidence,
  LeoCalendarResultCard,
  LeoCertainty,
  LeoClientCareSignal,
  LeoClientResultCard,
  LeoCommitment,
  LeoCommitmentCardDueState,
  LeoCommitmentResultCard,
  LeoEmailAttentionLabel,
  LeoEmailDirection,
  LeoEmailMessageEvidence,
  LeoEmailResultCard,
  LeoEmailTriageResult,
  LeoPreparedAction,
  LeoPreparedActionResultCard,
  LeoProjectExecutiveSnapshot,
  LeoProjectResultCard,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";

const SPOKEN_MAX = 220;
const DUE_SOON_MS = LEO_COMMITMENT_DUE_SOON_MS;

export function boundSpokenSummary(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "No spoken summary available.";
  // Strip URLs and long opaque ids from spoken output.
  const cleaned = t
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[0-9a-f]{16,}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Details are available on screen.";
  return cleaned.length > SPOKEN_MAX ? `${cleaned.slice(0, SPOKEN_MAX - 1)}…` : cleaned;
}

export function parseEmailSender(raw: string | null | undefined): {
  displayName: string | null;
  address: string | null;
} {
  if (!raw?.trim()) return { displayName: null, address: null };
  const s = raw.trim();
  const m = s.match(/^(.*)<([^>]+)>\s*$/);
  if (m) {
    const name = m[1].replace(/^["']|["']$/g, "").trim();
    const address = m[2].trim().toLowerCase();
    return {
      displayName: name || null,
      address: address || null,
    };
  }
  if (s.includes("@")) {
    return { displayName: null, address: s.toLowerCase() };
  }
  return { displayName: s.slice(0, 120), address: null };
}

function mapTriageToAttention(
  triage: LeoEmailTriageResult | null | undefined,
): {
  direction: LeoEmailDirection;
  attentionLabel: LeoEmailAttentionLabel;
  certainty: LeoCertainty;
  reason: string | null;
} {
  if (!triage) {
    return {
      direction: "UNKNOWN",
      attentionLabel: "UNKNOWN",
      certainty: "UNKNOWN",
      reason: "No triage evidence provided.",
    };
  }
  if (triage.state === "WAITING_ON_OWNER" && triage.directionProven) {
    return {
      direction: "INBOUND",
      attentionLabel: "WAITING_ON_US",
      certainty: "PROVEN",
      reason: "Thread direction proves latest meaningful message is inbound after owner outbound.",
    };
  }
  if (triage.state === "POSSIBLE_REPLY_NEEDED") {
    return {
      direction: triage.directionProven ? "INBOUND" : "UNKNOWN",
      attentionLabel: "LIKELY_REPLY_NEEDED",
      certainty: "POSSIBLE",
      reason: "Reply may be needed, but thread direction is not fully proven.",
    };
  }
  if (triage.state === "OWNER_REPLIED") {
    return {
      direction: "OUTBOUND",
      attentionLabel: "INFORMATIONAL",
      certainty: triage.directionProven ? "PROVEN" : "LIKELY",
      reason: "Latest meaningful message appears to be owner outbound.",
    };
  }
  if (triage.state === "INFORMATIONAL") {
    return {
      direction: "UNKNOWN",
      attentionLabel: "INFORMATIONAL",
      certainty: "LIKELY",
      reason: "Classified informational from thread evidence.",
    };
  }
  if (triage.state === "UNREAD") {
    return {
      direction: "UNKNOWN",
      attentionLabel: "NEEDS_REVIEW",
      certainty: "POSSIBLE",
      reason: "Unread alone does not prove a reply is required.",
    };
  }
  return {
    direction: "UNKNOWN",
    attentionLabel: "NEEDS_REVIEW",
    certainty: "UNKNOWN",
    reason: `Triage state ${triage.state} without stronger proof.`,
  };
}

export function deriveCommitmentCardDueState(
  dueAt: string | null | undefined,
  nowMs: number,
  status: LeoCommitment["status"],
): LeoCommitmentCardDueState {
  if (status !== "OPEN" || !dueAt) return "NO_DUE_DATE";
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return "NO_DUE_DATE";
  if (due < nowMs) return "OVERDUE";
  const dueDate = new Date(due);
  const nowDate = new Date(nowMs);
  const sameUtcDay =
    dueDate.getUTCFullYear() === nowDate.getUTCFullYear() &&
    dueDate.getUTCMonth() === nowDate.getUTCMonth() &&
    dueDate.getUTCDate() === nowDate.getUTCDate();
  if (sameUtcDay) return "DUE_TODAY";
  if (due - nowMs <= DUE_SOON_MS) return "DUE_SOON";
  return "FUTURE";
}

export function mapEmailEvidenceToResultCard(input: {
  message: LeoEmailMessageEvidence;
  triage?: LeoEmailTriageResult | null;
  priority?: LeoAttentionLevel;
}): LeoEmailResultCard {
  const { message, triage } = input;
  const sender = parseEmailSender(message.sender);
  const mapped = mapTriageToAttention(triage);
  const gmailOpenUrl = buildTrustedGmailThreadUrl(message.threadId);
  const title = message.subject?.trim() || "(No subject)";
  const who = sender.displayName || sender.address || "Unknown sender";

  const spoken =
    mapped.attentionLabel === "WAITING_ON_US"
      ? `${who} appears to be waiting for a response.`
      : mapped.attentionLabel === "LIKELY_REPLY_NEEDED"
        ? `${who} may need a reply, but that is not fully proven.`
        : `Email from ${who}: ${title}.`;

  const actions = [
    createOpenGmailAction({ threadId: message.threadId, messageId: message.messageId }),
    createSummarizeAction({
      system: "GOOGLE_GMAIL",
      entityType: "thread",
      id: message.threadId || message.messageId,
      toolId: "leo.email.thread.read",
    }),
    createPrepareDraftAction({
      system: "GOOGLE_GMAIL",
      entityType: "thread",
      id: message.threadId || message.messageId,
      label: "Draft reply",
    }),
    createCreateCommitmentAction({
      system: "GOOGLE_GMAIL",
      entityType: "message",
      id: message.messageId,
    }),
    createShowEvidenceAction({
      system: "GOOGLE_GMAIL",
      entityType: "message",
      id: message.messageId,
    }),
  ];

  return {
    cardId: `email:${message.messageId}`,
    kind: "EMAIL",
    priority: input.priority ?? "NORMAL",
    certainty: mapped.certainty,
    title,
    subtitle: who,
    whyItMatters:
      mapped.attentionLabel === "WAITING_ON_US"
        ? "Someone may be waiting on you."
        : mapped.attentionLabel === "LIKELY_REPLY_NEEDED"
          ? "This may need your attention, but evidence is incomplete."
          : null,
    reason: mapped.reason,
    evidenceRefs: [`gmail:message:${message.messageId}`],
    sourceSystem: "GOOGLE_GMAIL",
    actions,
    spokenSummary: boundSpokenSummary(spoken),
    messageId: message.messageId,
    threadId: message.threadId,
    senderDisplayName: sender.displayName,
    senderAddress: sender.address,
    subject: message.subject,
    snippet: message.snippet ? message.snippet.slice(0, 280) : null,
    receivedAt: message.receivedAt,
    readState: message.readState,
    direction: mapped.direction,
    triageState: triage?.state ?? null,
    // Classification upgrades are out of scope for 14.2 — stay UNKNOWN.
    senderClass: "UNKNOWN",
    relationshipClass: "UNKNOWN",
    attentionLabel: mapped.attentionLabel,
    gmailOpenUrl,
  };
}

export function mapCalendarEventToResultCard(input: {
  event: LeoCalendarEventEvidence;
  preparationState?: LeoCalendarResultCard["preparationState"];
  relatedEmailCardIds?: string[];
  priority?: LeoAttentionLevel;
}): LeoCalendarResultCard {
  const { event } = input;
  const prep = input.preparationState ?? "NONE";
  let durationMinutes: number | null = null;
  if (event.start && event.end) {
    const a = Date.parse(event.start);
    const b = Date.parse(event.end);
    if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a) {
      durationMinutes = Math.round((b - a) / 60000);
    }
  }
  const title = event.title?.trim() || "Untitled meeting";
  const spoken = event.start
    ? `Meeting “${title}” starts at ${event.start}.`
    : `Meeting “${title}” — start time unknown.`;

  const actions = [
    createOpenCalendarAction({ eventId: event.eventId }),
    createJoinMeetingAction({ eventId: event.eventId, meetingUrl: event.meetingUrl }),
    createPrepareDraftAction({
      system: "GOOGLE_CALENDAR",
      entityType: "event",
      id: event.eventId,
      toolId: "leo.meeting.prepare",
      label: "Prepare meeting brief",
    }),
    createShowEvidenceAction({
      system: "GOOGLE_CALENDAR",
      entityType: "event",
      id: event.eventId,
    }),
  ];

  return {
    cardId: `calendar:${event.eventId}`,
    kind: "CALENDAR",
    priority: input.priority ?? "NORMAL",
    certainty: event.start ? "PROVEN" : "UNKNOWN",
    title,
    subtitle: event.start,
    whyItMatters: "Upcoming calendar evidence from Google Calendar.",
    reason: event.start ? "Event start time present in calendar evidence." : "Start time missing.",
    evidenceRefs: [`calendar:event:${event.eventId}`],
    sourceSystem: "GOOGLE_CALENDAR",
    actions,
    spokenSummary: boundSpokenSummary(spoken),
    eventId: event.eventId,
    start: event.start,
    end: event.end,
    timezone: event.timezone,
    durationMinutes,
    attendees: event.attendees ?? [],
    organizer: event.organizer,
    location: event.location,
    meetingUrl: event.meetingUrl,
    descriptionSummary: event.description ? event.description.slice(0, 280) : null,
    relatedEmailCardIds: input.relatedEmailCardIds ?? [],
    preparationState: prep,
  };
}

export function mapCommitmentToResultCard(input: {
  commitment: LeoCommitment;
  nowMs: number;
}): LeoCommitmentResultCard {
  const c = input.commitment;
  const derivedDueState = deriveCommitmentCardDueState(c.dueAt, input.nowMs, c.status);
  const isCandidate = c.kind === "EXTRACTED_CANDIDATE";
  const isExternal = c.kind === "EXTERNAL_PARTY";

  let spoken: string;
  if (isCandidate) {
    spoken =
      derivedDueState === "OVERDUE"
        ? `Possible commitment needing confirmation: ${c.title}.`
        : `Possible commitment: ${c.title}. Needs confirmation.`;
  } else if (isExternal) {
    spoken = `External-party commitment: ${c.title}.`;
  } else if (derivedDueState === "OVERDUE") {
    spoken = `Overdue commitment: ${c.title}.`;
  } else if (derivedDueState === "DUE_TODAY") {
    spoken = `Due today: ${c.title}.`;
  } else if (derivedDueState === "DUE_SOON") {
    spoken = `Coming due soon: ${c.title}.`;
  } else {
    spoken = `Your commitment: ${c.title}.`;
  }

  const certainty: LeoCertainty = isCandidate
    ? c.confidence === "high"
      ? "LIKELY"
      : "POSSIBLE"
    : isExternal
      ? "PROVEN"
      : "PROVEN";

  const actions = [
    createShowEvidenceAction({ system: "LEO", entityType: "commitment", id: c.id }),
    createInspectAction({ system: "LEO", entityType: "commitment", id: c.id }),
    createAcknowledgeAction({ sourceKind: "commitment", sourceKey: c.id }),
  ];
  if (c.status === "OPEN" && !isCandidate) {
    actions.push(
      createRemindLaterAction({
        sourceKind: "commitment",
        sourceKey: c.id,
      }),
    );
  }
  if (isCandidate && c.status === "OPEN") {
    actions.push(
      createCreateCommitmentAction({
        system: "LEO",
        entityType: "commitment_candidate",
        id: c.id,
      }),
    );
  }

  return {
    cardId: `commitment:${c.id}`,
    kind: "COMMITMENT",
    priority: c.priority,
    certainty,
    title: isCandidate ? `Possible: ${c.title}` : isExternal ? `External: ${c.title}` : c.title,
    subtitle: c.counterparty,
    whyItMatters: isCandidate
      ? "Candidate commitment — needs owner confirmation before treating as a promise."
      : derivedDueState === "OVERDUE"
        ? "This commitment is overdue."
        : derivedDueState === "DUE_TODAY" || derivedDueState === "DUE_SOON"
          ? "This commitment is approaching."
          : isExternal
            ? "External-party commitment record — not an owner promise."
            : null,
    reason: isCandidate
      ? "Extracted candidate — not an explicit owner obligation until confirmed."
      : isExternal
        ? "Persisted external-party commitment — not phrased as an owner promise."
        : "Persisted explicit owner commitment record.",
    evidenceRefs: [`leo:commitment:${c.id}`],
    sourceSystem: "LEO",
    actions,
    spokenSummary: boundSpokenSummary(spoken),
    commitmentId: c.id,
    commitmentKind: c.kind,
    status: c.status,
    dueAt: c.dueAt,
    timezone: c.timezone,
    counterparty: c.counterparty,
    category: c.category,
    sourceType: c.sourceType,
    sourceRef: c.sourceRef,
    acknowledgedAt: c.acknowledgedAt,
    completedAt: c.completedAt,
    relatedRefs: c.relatedRefs,
    derivedDueState,
    confidence: c.confidence,
  };
}

export function mapClientCareSignalToResultCard(
  signal: LeoClientCareSignal,
): LeoClientResultCard {
  const spoken = `${signal.title}. ${signal.recommendedNextStep ?? "Review when ready."}`;
  return {
    cardId: `client:${signal.key}`,
    kind: "CLIENT",
    priority: signal.attentionEligible ? "HIGH" : "NORMAL",
    certainty: signal.isHeuristic ? "POSSIBLE" : "PROVEN",
    title: signal.title,
    subtitle: signal.status,
    whyItMatters: signal.summary,
    reason: signal.evidence,
    evidenceRefs: [signal.key],
    sourceSystem: "LEONIX",
    actions: [
      createInspectAction({
        system: "LEONIX",
        entityType: signal.source.toLowerCase(),
        id: signal.entityRef.id ?? signal.key,
      }),
      createPrepareDraftAction({
        system: "LEONIX",
        entityType: signal.source.toLowerCase(),
        id: signal.entityRef.id ?? signal.key,
        label: "Prepare follow-up",
      }),
      createAcknowledgeAction({ sourceKind: "client_care", sourceKey: signal.key }),
    ],
    spokenSummary: boundSpokenSummary(spoken),
    entityRef: signal.entityRef,
    displayName: signal.title,
    businessName: null,
    status: signal.status,
    waitingParty: signal.waitingParty,
    lastInteractionAt: signal.lastContactedAt,
    followUpAt: signal.followUpAt,
    source: signal.source,
  };
}

export function mapProjectSnapshotToResultCard(
  snap: LeoProjectExecutiveSnapshot,
): LeoProjectResultCard {
  const sha = snap.leoHead.sha;
  const deploy = snap.latestLeoPreview ?? snap.latestProduction;
  const whatChanged = snap.recentChanges[0]
    ? snap.recentChanges[0].message.slice(0, 200)
    : snap.leoHead.message;
  const spoken = sha
    ? `LEO branch is at ${sha.slice(0, 7)}. ${whatChanged ? `Latest change: ${whatChanged}` : ""}`
    : "Project status is partially unknown.";

  return {
    cardId: `project:${snap.repository}`,
    kind: "PROJECT",
    priority: "NORMAL",
    certainty: sha ? "PROVEN" : "UNKNOWN",
    title: snap.repository,
    subtitle: snap.leoBranch,
    whyItMatters: "Connected project brain evidence for Leonix development.",
    reason: sha ? "Repository head evidence present." : "Repository head unavailable.",
    evidenceRefs: [
      `github:repo:${snap.repository}`,
      ...(sha ? [`github:commit:${sha}`] : []),
    ],
    sourceSystem: "GITHUB",
    actions: [
      createOpenGithubAction({ repositoryFullName: snap.repository, sha }),
      createOpenVercelAction({
        deploymentId: deploy?.deploymentId ?? null,
        deploymentUrl: deploy?.url ?? null,
      }),
      createInspectAction({ system: "GITHUB", entityType: "repository", id: snap.repository }),
      createShowEvidenceAction({
        system: "GITHUB",
        entityType: "repository",
        id: snap.repository,
      }),
    ],
    spokenSummary: boundSpokenSummary(spoken),
    repository: snap.repository,
    projectName: snap.raw.vercel?.projectName ?? null,
    branch: snap.leoBranch,
    commitSha: sha,
    commitMessage: snap.leoHead.message,
    deploymentId: deploy?.deploymentId ?? null,
    deploymentUrl: deploy?.url ?? null,
    deploymentState: deploy?.readyState ?? deploy?.state ?? null,
    environment: deploy?.target ?? null,
    // No deterministic launch-risk classifier in current evidence — stay null.
    launchRisk: null,
    whatChanged: whatChanged ?? null,
  };
}

export function mapPreparedActionToResultCard(
  prepared: LeoPreparedAction,
): LeoPreparedActionResultCard {
  const spoken = `Prepared “${prepared.title}”. It has not been executed.`;
  // Guard against executed-sounding language in spoken/visual title path.
  const safeTitle = prepared.title
    .replace(/\b(sent|published|deployed|executed)\b/gi, "prepared")
    .slice(0, 200);

  return {
    cardId: `prepared:${prepared.id}`,
    kind: "PREPARED_ACTION",
    priority: "NORMAL",
    certainty: "PROVEN",
    title: safeTitle,
    subtitle: "PREPARED · NOT_EXECUTED",
    whyItMatters: prepared.purpose,
    reason: "YELLOW preparation artifact — reversible draft only.",
    evidenceRefs: prepared.sourceEvidenceRefs.slice(0, 20),
    sourceSystem: "LEO",
    actions: [
      createShowEvidenceAction({ system: "LEO", entityType: "preparation", id: prepared.id }),
      createInspectAction({ system: "LEO", entityType: "preparation", id: prepared.id }),
    ],
    spokenSummary: boundSpokenSummary(spoken),
    preparationId: prepared.id,
    preparationKind: prepared.preparationKind,
    preparationStatus: prepared.status,
    executionAllowed: false,
    draftBodyPreview: prepared.draftBody ? prepared.draftBody.slice(0, 400) : null,
    targetRef: prepared.targetRef,
  };
}

export function composeSpokenSummaryFromCards(cards: LeoResultCard[]): string {
  if (cards.length === 0) return "No structured results to summarize.";
  if (cards.length === 1) return cards[0].spokenSummary;
  return boundSpokenSummary(
    `${cards.length} items to review. ${cards[0].spokenSummary}`,
  );
}
