/**
 * LEO-17B — Conversation → governed action proposal bridge (pure).
 *
 * Converts recognized consequential conversation intents into proposal candidates.
 * Does NOT send email, mutate calendar, or execute providers.
 * Ambiguous referents and incomplete targets fail closed.
 */
import type { LeoActionProposalActionFamily } from "@/app/leo/_lib/leoActionProposalTypes";
import type {
  LeoActionIntentKind,
  LeoActiveConversationContext,
  LeoGovernanceAssessment,
} from "@/app/leo/_lib/leoTypes";
import type { LeoReferentResolution } from "@/app/leo/_lib/leoConversationReferents";

export const LEO_17B_BRIDGE_NOT_CLAIMING = [
  "Not SENT",
  "Not SCHEDULED",
  "Not EXECUTED",
  "Not VERIFIED",
  "Conversation POST is not owner approval",
] as const;

export type LeoConnectedActionFamily = LeoActionProposalActionFamily;

export type LeoProposalTruthLabel =
  | "Prepared"
  | "Needs approval"
  | "Needs information"
  | "Awaiting confirmation"
  | "Cancelled"
  | "Expired"
  | "Failed";

export type LeoConversationProposalCandidate =
  | {
      status: "NOT_CONNECTED_ACTION";
    }
  | {
      status: "CLARIFICATION_NEEDED";
      actionFamily: LeoConnectedActionFamily;
      clarification: string;
      missing: string[];
    }
  | {
      status: "NEEDS_INFORMATION";
      actionFamily: LeoConnectedActionFamily;
      governanceActionKind: LeoActionIntentKind;
      missing: string[];
      normalizedTarget: Record<string, unknown>;
      structuredPayload: Record<string, unknown>;
      referentSnapshot: Record<string, unknown>;
      truthLabel: LeoProposalTruthLabel;
      summary: string;
    }
  | {
      status: "PROPOSABLE";
      actionFamily: LeoConnectedActionFamily;
      governanceActionKind: LeoActionIntentKind;
      normalizedTarget: Record<string, unknown>;
      structuredPayload: Record<string, unknown>;
      referentSnapshot: Record<string, unknown>;
      truthLabel: LeoProposalTruthLabel;
      summary: string;
      awaitingApproval: boolean;
    };

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Read / summarize / draft-only phrases must not become RED proposals. */
export function isLeoConnectedActionExcludedReadOrDraft(question: string): boolean {
  const n = normalize(question);
  if (/\b(summarize|summary|what('s| is) on my calendar|show (my )?calendar|inbox status)\b/.test(n)) {
    return true;
  }
  // Explicit draft without send stays YELLOW preparation.
  if (/\bdraft\b/.test(n) && !/\bsend\b/.test(n) && !/\breply\b/.test(n)) {
    return true;
  }
  return false;
}

/**
 * Infer LEO-17A action family from natural language.
 * Returns null when the utterance is not a connected consequential write candidate.
 */
export function inferLeoConnectedActionFamily(
  question: string,
): LeoConnectedActionFamily | null {
  if (isLeoConnectedActionExcludedReadOrDraft(question)) return null;
  const n = normalize(question);

  if (
    /\breply to (that|this|the|it)\b/.test(n) ||
    /\breply to (that|this|the) (email|message|thread)\b/.test(n) ||
    /\bsend (a )?reply\b/.test(n)
  ) {
    return "GMAIL_REPLY";
  }

  if (
    /\bsend (this|the|it)\b/.test(n) ||
    /\bsend (an? )?email\b/.test(n) ||
    /\bsend \S+ (an? )?email\b/.test(n) ||
    /\bsend (a )?message\b/.test(n) ||
    /\bemail .+ (saying|about|that)\b/.test(n)
  ) {
    return "GMAIL_SEND";
  }

  if (
    /\b(move|reschedule|update|change) (that|this|the|my) (meeting|event|calendar)\b/.test(n) ||
    /\b(move|reschedule) (that|this|it)\b/.test(n) ||
    /\bupdate (that|this|the) (meeting|event)\b/.test(n)
  ) {
    return "CALENDAR_UPDATE";
  }

  if (
    /\bschedule (a |an )?(meeting|event|call)\b/.test(n) ||
    /\bbook (a |an )?(meeting|event|call)\b/.test(n) ||
    /\bcreate (a |an )?(calendar )?event\b/.test(n) ||
    /\bset up (a |an )?(meeting|call)\b/.test(n)
  ) {
    return "CALENDAR_CREATE";
  }

  return null;
}

export function isLeoConnectedActionQuestion(question: string): boolean {
  return inferLeoConnectedActionFamily(question) != null;
}

/** Map family → governance action kind (all RED via existing rules). */
export function governanceActionKindForConnectedFamily(
  family: LeoConnectedActionFamily,
): LeoActionIntentKind {
  if (family === "GMAIL_SEND" || family === "GMAIL_REPLY") return "SEND_EXTERNAL";
  // Calendar create/update are consequential external side effects; OTHER defaults RED.
  return "OTHER";
}

export function leoProposalTruthLabelForState(
  proposalState: string | null | undefined,
  incomplete: boolean,
): LeoProposalTruthLabel {
  if (incomplete) return "Needs information";
  switch (proposalState) {
    case "AWAITING_APPROVAL":
      return "Needs approval";
    case "APPROVED":
      return "Awaiting confirmation";
    case "PREPARED":
    case "DRAFT":
      return "Prepared";
    case "CANCELLED":
      return "Cancelled";
    case "EXPIRED":
      return "Expired";
    case "FAILED":
      return "Failed";
    default:
      return "Prepared";
  }
}

function extractDisplayNameAfterTo(question: string): string | null {
  const toMatch = question.match(
    /\b(?:to|for)\s+([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)?)\b/,
  );
  if (toMatch?.[1]) {
    const name = toMatch[1].trim();
    if (!/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)$/i.test(name)) {
      return name.slice(0, 80);
    }
  }
  const sendName = question.match(
    /\bsend\s+([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)?)\s+(?:an?\s+)?(?:email|message)\b/i,
  );
  if (sendName?.[1]) {
    const name = sendName[1].trim();
    if (!/^(an|a|the|this|that|it)$/i.test(name)) {
      return name.slice(0, 80);
    }
  }
  return null;
}

/** Exact email only when already present in the utterance — never invented. */
function extractExactEmail(question: string): string | null {
  const m = question.match(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i);
  return m?.[1]?.trim().toLowerCase() ?? null;
}

function extractSubjectHint(question: string): string | null {
  const about = question.match(/\babout\s+(.+)$/i);
  if (about?.[1]) return about[1].trim().slice(0, 200);
  const saying = question.match(/\bsaying\s+["“]?(.+?)["”]?$/i);
  if (saying?.[1]) return saying[1].trim().slice(0, 200);
  return null;
}

function extractBodyHint(question: string): string | null {
  const saying = question.match(/\bsaying\s+["“]?(.+?)["”]?$/i);
  if (saying?.[1]) return saying[1].trim().slice(0, 2000);
  return null;
}

function extractMeetingTitle(question: string): string | null {
  const m = question.match(/\b(?:meeting|event|call)\s+(?:with\s+)?(.+?)(?:\s+on\s+|\s+at\s+|$)/i);
  if (!m?.[1]) return null;
  const t = m[1].trim();
  if (/^(friday|monday|tuesday|wednesday|thursday|saturday|sunday|today|tomorrow)$/i.test(t)) {
    return null;
  }
  return t.slice(0, 200);
}

function extractDayHint(question: string): string | null {
  const m = question.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/i,
  );
  return m?.[1]?.toLowerCase() ?? null;
}

function referentSnapshotFrom(
  resolution: LeoReferentResolution | null | undefined,
  context: LeoActiveConversationContext | null | undefined,
): Record<string, unknown> {
  const snap: Record<string, unknown> = {};
  if (resolution?.status === "RESOLVED") {
    snap.referentStatus = "RESOLVED";
    snap.kind = resolution.kind;
    snap.threadId = resolution.threadId;
    snap.messageId = resolution.messageId;
    snap.eventId = resolution.eventId;
    snap.cardId = resolution.cardId;
    snap.label = resolution.label;
  } else if (resolution?.status === "AMBIGUOUS") {
    snap.referentStatus = "AMBIGUOUS";
  } else {
    snap.referentStatus = "NONE";
  }
  if (context?.focusThreadId) snap.focusThreadId = context.focusThreadId;
  if (context?.focusMessageId) snap.focusMessageId = context.focusMessageId;
  if (context?.focusEventId) snap.focusEventId = context.focusEventId;
  return snap;
}

/**
 * Build a proposal candidate from conversation + optional referent resolution.
 * Never invents recipient emails or event ids.
 */
export function buildLeoConversationProposalCandidate(input: {
  question: string;
  referent?: LeoReferentResolution | null;
  context?: LeoActiveConversationContext | null;
  entityId?: string | null;
}): LeoConversationProposalCandidate {
  const family = inferLeoConnectedActionFamily(input.question);
  if (!family) return { status: "NOT_CONNECTED_ACTION" };

  if (input.referent?.status === "AMBIGUOUS") {
    return {
      status: "CLARIFICATION_NEEDED",
      actionFamily: family,
      clarification: input.referent.clarification,
      missing: ["unambiguous_referent"],
    };
  }

  const governanceActionKind = governanceActionKindForConnectedFamily(family);
  const referentSnapshot = referentSnapshotFrom(input.referent, input.context);
  const resolved = input.referent?.status === "RESOLVED" ? input.referent : null;
  const missing: string[] = [];

  if (family === "GMAIL_SEND") {
    const exactEmail = extractExactEmail(input.question);
    const displayName = extractDisplayNameAfterTo(input.question);
    const subject = extractSubjectHint(input.question);
    const body = extractBodyHint(input.question);
    if (!exactEmail) missing.push("exact_recipient_email");
    if (!subject && !body) missing.push("message_content");

    const structuredPayload = {
      recipient: exactEmail,
      subject: subject,
      body: body,
      replyToThreadId: null,
      sourceEvidenceRefs: resolved?.messageId
        ? [`gmail:message:${resolved.messageId}`]
        : ([] as string[]),
    };
    const normalizedTarget = {
      recipientEmail: exactEmail,
      recipientDisplayName: displayName,
    };

    if (missing.length > 0) {
      return {
        status: "NEEDS_INFORMATION",
        actionFamily: family,
        governanceActionKind,
        missing,
        normalizedTarget,
        structuredPayload,
        referentSnapshot,
        truthLabel: "Needs information",
        summary: composeNeedsInformationSummary(family, missing, displayName),
      };
    }

    return {
      status: "PROPOSABLE",
      actionFamily: family,
      governanceActionKind,
      normalizedTarget,
      structuredPayload,
      referentSnapshot,
      truthLabel: "Needs approval",
      summary:
        `Prepared Gmail send proposal to ${exactEmail}. Needs your approval. Not sent.`,
      awaitingApproval: true,
    };
  }

  if (family === "GMAIL_REPLY") {
    const threadId =
      resolved?.threadId ??
      input.context?.focusThreadId ??
      (resolved?.kind === "EMAIL" ? input.entityId ?? null : null);
    const recipient =
      extractExactEmail(input.question) ??
      (typeof resolved?.label === "string" && resolved.label.includes("@")
        ? extractExactEmail(resolved.label)
        : null);
    const body = extractBodyHint(input.question);

    // Reply requires proven thread id; recipient email must be proven, not guessed from "John".
    if (!threadId) missing.push("exact_thread_id");
    if (!recipient) missing.push("exact_recipient_email");
    if (!body) missing.push("reply_body");

    const structuredPayload = {
      recipient,
      threadId,
      body,
      subject: null,
      sourceEvidenceRefs: threadId ? [`gmail:thread:${threadId}`] : ([] as string[]),
    };
    const normalizedTarget = {
      threadId,
      recipientEmail: recipient,
      messageId: resolved?.messageId ?? input.context?.focusMessageId ?? null,
    };

    if (missing.length > 0) {
      return {
        status: "NEEDS_INFORMATION",
        actionFamily: family,
        governanceActionKind,
        missing,
        normalizedTarget,
        structuredPayload,
        referentSnapshot,
        truthLabel: "Needs information",
        summary: composeNeedsInformationSummary(family, missing, null),
      };
    }

    return {
      status: "PROPOSABLE",
      actionFamily: family,
      governanceActionKind,
      normalizedTarget,
      structuredPayload,
      referentSnapshot,
      truthLabel: "Needs approval",
      summary: `Prepared Gmail reply proposal for thread ${threadId}. Needs your approval. Not sent.`,
      awaitingApproval: true,
    };
  }

  if (family === "CALENDAR_CREATE") {
    const title = extractMeetingTitle(input.question);
    const dayHint = extractDayHint(input.question);
    // Without proven ISO start/end/timezone/attendee emails, remain incomplete.
    missing.push("exact_start");
    missing.push("exact_end");
    missing.push("timezone");
    if (!title) missing.push("title");
    missing.push("attendee_emails");

    const structuredPayload = {
      title: title ?? (dayHint ? `Meeting (${dayHint})` : null),
      start: null,
      end: null,
      timezone: null,
      attendees: null,
      location: null,
      description: null,
      sourceEvidenceRefs: [] as string[],
    };
    const normalizedTarget = {
      dayHint,
      title: structuredPayload.title,
    };

    return {
      status: "NEEDS_INFORMATION",
      actionFamily: family,
      governanceActionKind,
      missing,
      normalizedTarget,
      structuredPayload,
      referentSnapshot,
      truthLabel: "Needs information",
      summary: composeNeedsInformationSummary(family, missing, null),
    };
  }

  // CALENDAR_UPDATE
  {
    const eventId =
      resolved?.eventId ??
      input.context?.focusEventId ??
      (resolved?.kind === "CALENDAR" ? input.entityId ?? null : null);
    if (!eventId) missing.push("exact_event_id");
    // Patch content is not proven from NL alone in this gate.
    missing.push("proven_patch_fields");

    const structuredPayload = {
      eventId,
      patch: {},
      sourceEvidenceRefs: eventId ? [`calendar:event:${eventId}`] : ([] as string[]),
    };
    const normalizedTarget = { eventId };

    return {
      status: "NEEDS_INFORMATION",
      actionFamily: family,
      governanceActionKind,
      missing,
      normalizedTarget,
      structuredPayload,
      referentSnapshot,
      truthLabel: "Needs information",
      summary: composeNeedsInformationSummary(family, missing, null),
    };
  }
}

function composeNeedsInformationSummary(
  family: LeoConnectedActionFamily,
  missing: string[],
  displayName: string | null,
): string {
  const friendly = missing
    .map((m) => {
      switch (m) {
        case "exact_recipient_email":
          return displayName
            ? `exact email for ${displayName} (name alone is not enough)`
            : "exact recipient email";
        case "message_content":
          return "subject or body content";
        case "exact_thread_id":
          return "which email thread to reply to";
        case "reply_body":
          return "reply body text";
        case "exact_start":
        case "exact_end":
          return "exact date/time";
        case "timezone":
          return "timezone";
        case "attendee_emails":
          return "attendee email addresses";
        case "title":
          return "meeting title";
        case "exact_event_id":
          return "which meeting to update";
        case "proven_patch_fields":
          return "exact fields to change";
        default:
          return m.replace(/_/g, " ");
      }
    })
    .slice(0, 6);

  const familyLabel =
    family === "GMAIL_SEND"
      ? "send email"
      : family === "GMAIL_REPLY"
        ? "reply"
        : family === "CALENDAR_CREATE"
          ? "schedule meeting"
          : "update meeting";

  return (
    `Needs information before a governed ${familyLabel} proposal can be approved: ${friendly.join("; ")}. ` +
    `This is RED. Not sent. Not scheduled. Conversation is not approval.`
  );
}

export function composeConnectedProposalAnswerSummary(input: {
  candidate: Extract<
    LeoConversationProposalCandidate,
    { status: "NEEDS_INFORMATION" | "PROPOSABLE" }
  >;
  governance: LeoGovernanceAssessment;
  proposalState?: string | null;
  proposalId?: string | null;
}): string {
  const label = leoProposalTruthLabelForState(
    input.proposalState ?? null,
    input.candidate.status === "NEEDS_INFORMATION",
  );
  const idPart = input.proposalId ? ` Proposal id ${input.proposalId.slice(0, 8)}….` : "";
  if (input.candidate.status === "NEEDS_INFORMATION") {
    return `${label}. ${input.candidate.summary}${idPart}`;
  }
  return (
    `${label}. ${input.candidate.summary} Governance: ${input.governance.level}.` +
    ` Provider execution is not enabled yet.${idPart}`
  );
}
