/**
 * LEO-13 deterministic email triage — fixture-safe, no server-only, no AI.
 * Unread alone does not mean needs reply. Direction requires owner identity + thread evidence.
 */
import type {
  LeoEmailMessageEvidence,
  LeoEmailThreadEvidence,
  LeoEmailTriageResult,
  LeoEmailTriageState,
} from "@/app/leo/_lib/leoTypes";

function normalizeEmail(v: string | null | undefined): string | null {
  const t = (v ?? "").trim().toLowerCase();
  return t || null;
}

function extractAddress(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const angle = raw.match(/<([^>]+)>/);
  const candidate = (angle?.[1] ?? raw).trim().toLowerCase();
  if (!candidate.includes("@")) return null;
  return candidate;
}

function isFromOwner(
  message: LeoEmailMessageEvidence,
  ownerEmail: string | null,
): boolean | null {
  if (!ownerEmail) return null;
  const from = extractAddress(message.sender);
  if (!from) return null;
  return from === ownerEmail;
}

function isInboundToOwner(
  message: LeoEmailMessageEvidence,
  ownerEmail: string | null,
): boolean | null {
  if (!ownerEmail) return null;
  const fromOwner = isFromOwner(message, ownerEmail);
  if (fromOwner === true) return false;
  if (fromOwner === null) return null;
  const recipients = [
    ...(message.recipients ?? []),
    ...(message.to ?? []),
    ...(message.cc ?? []),
  ]
    .map(extractAddress)
    .filter(Boolean) as string[];
  if (recipients.length === 0) return null;
  return recipients.includes(ownerEmail);
}

/**
 * Triage a single message with optional thread context.
 */
export function triageLeoEmailMessage(input: {
  message: LeoEmailMessageEvidence;
  thread?: LeoEmailThreadEvidence | null;
  ownerEmail?: string | null;
  nowMs?: number;
}): LeoEmailTriageResult {
  const ownerEmail = normalizeEmail(input.ownerEmail);
  const msg = input.message;
  const unread = Boolean(
    msg.readState === "UNREAD" ||
      msg.labelIds?.some((l) => l.toUpperCase() === "UNREAD"),
  );

  const limitations: string[] = [
    "Unread alone does not mean a reply is required.",
    "No overdue/SLA/sentiment inference from age alone.",
  ];
  const unknowns: string[] = [];

  if (!ownerEmail) {
    unknowns.push("owner_email_not_configured");
    limitations.push(
      "Owner email not configured — direction-sensitive triage cannot be confirmed.",
    );
    if (unread) {
      return {
        messageId: msg.messageId,
        threadId: msg.threadId,
        state: "POSSIBLE_REPLY_NEEDED",
        unread,
        directionProven: false,
        limitations,
        unknowns,
      };
    }
    return {
      messageId: msg.messageId,
      threadId: msg.threadId,
      state: "UNKNOWN",
      unread,
      directionProven: false,
      limitations,
      unknowns,
    };
  }

  const threadMessages =
    input.thread?.messages?.length && input.thread.messages.length > 0
      ? [...input.thread.messages].sort((a, b) =>
          (a.receivedAt ?? "").localeCompare(b.receivedAt ?? ""),
        )
      : [msg];

  if (threadMessages.length <= 1 && !input.thread?.messages?.length) {
    // Insufficient thread evidence: unread inbound → POSSIBLE_REPLY_NEEDED only.
    const inbound = isInboundToOwner(msg, ownerEmail);
    if (unread && inbound !== false) {
      return {
        messageId: msg.messageId,
        threadId: msg.threadId,
        state: "POSSIBLE_REPLY_NEEDED",
        unread,
        directionProven: false,
        limitations: [
          ...limitations,
          "Thread direction not fully proven — treating as possible reply needed only.",
        ],
        unknowns: ["thread_direction_incomplete"],
      };
    }
    if (!unread) {
      return {
        messageId: msg.messageId,
        threadId: msg.threadId,
        state: "INFORMATIONAL",
        unread,
        directionProven: false,
        limitations,
        unknowns: ["thread_direction_incomplete"],
      };
    }
    return {
      messageId: msg.messageId,
      threadId: msg.threadId,
      state: "UNREAD",
      unread,
      directionProven: false,
      limitations,
      unknowns: ["thread_direction_incomplete"],
    };
  }

  // Classify each message direction when possible.
  type Dir = "OWNER" | "OTHER" | "UNKNOWN";
  const classified = threadMessages.map((m) => {
    const fromOwner = isFromOwner(m, ownerEmail);
    let dir: Dir = "UNKNOWN";
    if (fromOwner === true) dir = "OWNER";
    else if (fromOwner === false) dir = "OTHER";
    return { m, dir };
  });

  if (classified.some((c) => c.dir === "UNKNOWN")) {
    unknowns.push("some_message_directions_unknown");
  }

  const known = classified.filter((c) => c.dir !== "UNKNOWN");
  if (known.length === 0) {
    return {
      messageId: msg.messageId,
      threadId: msg.threadId,
      state: unread ? "POSSIBLE_REPLY_NEEDED" : "UNKNOWN",
      unread,
      directionProven: false,
      limitations,
      unknowns: [...unknowns, "no_proven_direction"],
    };
  }

  const latest = known[known.length - 1];
  const earlier = known.slice(0, -1);
  const lastOwnerIdx = [...known].map((c) => c.dir).lastIndexOf("OWNER");
  const lastOtherIdx = [...known].map((c) => c.dir).lastIndexOf("OTHER");

  let state: LeoEmailTriageState = "UNKNOWN";
  let directionProven = true;

  if (latest.dir === "OWNER") {
    if (lastOtherIdx >= 0 && lastOtherIdx < known.length - 1) {
      state = "OWNER_REPLIED";
    } else if (earlier.some((c) => c.dir === "OTHER")) {
      state = "OWNER_REPLIED";
    } else {
      // Owner message without proven prior inbound → waiting on other only if other participants exist.
      const hasOtherParticipant = Boolean(
        msg.recipients?.length ||
          msg.to?.length ||
          classified.some((c) => c.dir === "OTHER"),
      );
      state = hasOtherParticipant ? "WAITING_ON_OTHER" : "INFORMATIONAL";
    }
  } else if (latest.dir === "OTHER") {
    if (lastOwnerIdx >= 0 && lastOwnerIdx < known.length - 1) {
      state = "WAITING_ON_OWNER";
    } else if (lastOwnerIdx === -1) {
      // Inbound without proven owner outbound in thread.
      state = unread ? "POSSIBLE_REPLY_NEEDED" : "RECENT";
      directionProven = false;
    } else {
      state = "WAITING_ON_OWNER";
    }
  }

  if (state === "UNKNOWN" && unread) {
    state = "UNREAD";
  }

  return {
    messageId: msg.messageId,
    threadId: msg.threadId,
    state,
    unread,
    directionProven,
    limitations,
    unknowns,
  };
}

/** Batch triage for recent messages (each independently unless threads provided). */
export function triageLeoEmailMessages(input: {
  messages: LeoEmailMessageEvidence[];
  threadsById?: Record<string, LeoEmailThreadEvidence>;
  ownerEmail?: string | null;
  nowMs?: number;
}): LeoEmailTriageResult[] {
  return input.messages.map((message) =>
    triageLeoEmailMessage({
      message,
      thread: message.threadId ? input.threadsById?.[message.threadId] ?? null : null,
      ownerEmail: input.ownerEmail,
      nowMs: input.nowMs,
    }),
  );
}
