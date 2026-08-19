/**
 * LEO-14.3 Gmail executive triage upgrade — pure helpers (fixture-safe).
 * Extends proven triage; does not replace it. No AI, no network, no DB.
 */
import { createAcknowledgeAction } from "@/app/leo/_lib/leoExecutiveActions";
import {
  boundSpokenSummary,
  mapEmailEvidenceToResultCard,
  parseEmailSender,
} from "@/app/leo/_lib/leoResultCards";
import type {
  LeoAttentionLevel,
  LeoCertainty,
  LeoEmailAttentionLabel,
  LeoEmailDirection,
  LeoEmailMessageEvidence,
  LeoEmailResultCard,
  LeoEmailSenderClass,
  LeoEmailTriageResult,
  LeoEmailTriageState,
} from "@/app/leo/_lib/leoTypes";

/** Hard caps for Google API / latency protection. */
export const LEO_GMAIL_THREAD_ENRICHMENT = {
  maxUniqueThreads: 8,
  maxConcurrency: 3,
} as const;

const NO_REPLY_LOCAL =
  /^(no[\-_]?reply|do[\-_]?not[\-_]?reply|noreply|donotreply|mailer[\-_]?daemon)$/i;
const AUTOMATED_LOCAL =
  /^(notifications?|alerts?|automated|auto[\-_]?notify|bounce|postmaster|newsletter)$/i;
const AUTOMATED_DOMAIN_HINT =
  /^(notifications?|noreply|no\-reply|mailer\-daemon|bounce)\./i;

export type LeoSenderClassResult = {
  senderClass: LeoEmailSenderClass;
  certainty: LeoCertainty;
  reason: string;
};

/** Deterministic automated / no-reply classifier — no brand guessing. */
export function classifyLeoEmailSenderClass(
  senderRaw: string | null | undefined,
): LeoSenderClassResult {
  const parsed = parseEmailSender(senderRaw);
  const address = parsed.address;
  if (!address) {
    return {
      senderClass: "UNKNOWN",
      certainty: "UNKNOWN",
      reason: "Sender address unavailable.",
    };
  }
  const [local = "", domain = ""] = address.split("@");
  const localNorm = local.trim().toLowerCase();
  const domainNorm = domain.trim().toLowerCase();

  if (NO_REPLY_LOCAL.test(localNorm) || localNorm.includes("noreply") || localNorm.includes("no-reply")) {
    return {
      senderClass: "NO_REPLY",
      certainty: "LIKELY",
      reason: "Sender local-part matches explicit no-reply pattern.",
    };
  }
  if (localNorm.includes("donotreply") || localNorm.includes("do-not-reply")) {
    return {
      senderClass: "NO_REPLY",
      certainty: "LIKELY",
      reason: "Sender local-part matches do-not-reply pattern.",
    };
  }
  if (AUTOMATED_LOCAL.test(localNorm) || AUTOMATED_DOMAIN_HINT.test(domainNorm)) {
    return {
      senderClass: "AUTOMATED",
      certainty: "LIKELY",
      reason: "Sender local-part/domain matches mechanical notification pattern.",
    };
  }
  // Absence of automation markers is NOT proof of HUMAN.
  return {
    senderClass: "UNKNOWN",
    certainty: "UNKNOWN",
    reason: "No explicit automated/no-reply pattern; human not proven.",
  };
}

export type LeoExecutiveEmailAttention = {
  attentionLabel: LeoEmailAttentionLabel;
  direction: LeoEmailDirection;
  certainty: LeoCertainty;
  priority: LeoAttentionLevel;
  reason: string;
  whyItMatters: string | null;
};

function isAutomatedOrNoReply(c: LeoEmailSenderClass): boolean {
  return c === "AUTOMATED" || c === "NO_REPLY";
}

/**
 * Map triage + sender class into executive attention labels.
 * Unread alone never forces LIKELY_REPLY_NEEDED.
 */
export function classifyLeoExecutiveEmailAttention(input: {
  triage: LeoEmailTriageResult;
  senderClass: LeoEmailSenderClass;
}): LeoExecutiveEmailAttention {
  const { triage, senderClass } = input;
  const auto = isAutomatedOrNoReply(senderClass);

  if (auto) {
    return {
      attentionLabel: senderClass === "NO_REPLY" ? "AUTOMATED" : "AUTOMATED",
      direction: "INBOUND",
      certainty: "LIKELY",
      priority: "INFORMATIONAL",
      reason:
        senderClass === "NO_REPLY"
          ? "Sender matches no-reply pattern — not a human waiting for a reply."
          : "Sender matches automated notification pattern.",
      whyItMatters: "Automated/system noise — deprioritized.",
    };
  }

  if (triage.state === "WAITING_ON_OWNER" && triage.directionProven && !auto) {
    return {
      attentionLabel: "WAITING_ON_US",
      direction: "INBOUND",
      certainty: "PROVEN",
      priority: "CRITICAL",
      reason:
        "Thread direction proves latest meaningful message is inbound after owner outbound.",
      whyItMatters: "Someone appears to be waiting for your reply.",
    };
  }

  if (triage.state === "OWNER_REPLIED") {
    return {
      attentionLabel: "INFORMATIONAL",
      direction: "OUTBOUND",
      certainty: triage.directionProven ? "PROVEN" : "LIKELY",
      priority: "INFORMATIONAL",
      reason: "Latest meaningful message appears owner outbound.",
      whyItMatters: null,
    };
  }

  if (triage.state === "POSSIBLE_REPLY_NEEDED" && !auto) {
    return {
      attentionLabel: "LIKELY_REPLY_NEEDED",
      direction: triage.directionProven ? "INBOUND" : "UNKNOWN",
      certainty: "POSSIBLE",
      priority: "HIGH",
      reason:
        "Inbound evidence suggests a reply may be needed, but thread direction is not fully proven.",
      whyItMatters: "May need attention — not proven waiting.",
    };
  }

  if (triage.state === "INFORMATIONAL" || triage.state === "RECENT" || triage.state === "WAITING_ON_OTHER") {
    return {
      attentionLabel: "INFORMATIONAL",
      direction: triage.state === "WAITING_ON_OTHER" ? "OUTBOUND" : "UNKNOWN",
      certainty: "LIKELY",
      priority: triage.unread ? "NORMAL" : "INFORMATIONAL",
      reason: `Triage state ${triage.state}; unread alone does not require a reply.`,
      whyItMatters: triage.unread ? "Unread informational message." : null,
    };
  }

  if (triage.state === "UNREAD") {
    return {
      attentionLabel: "NEEDS_REVIEW",
      direction: "UNKNOWN",
      certainty: "POSSIBLE",
      priority: "NORMAL",
      reason: "Unread without proven reply requirement.",
      whyItMatters: "Worth a glance — reply not proven required.",
    };
  }

  return {
    attentionLabel: "NEEDS_REVIEW",
    direction: "UNKNOWN",
    certainty: "UNKNOWN",
    priority: "NORMAL",
    reason: `Insufficient evidence for a stronger classification (triage=${triage.state}).`,
    whyItMatters: null,
  };
}

const PRIORITY_RANK: Record<LeoAttentionLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  INFORMATIONAL: 3,
};

const LABEL_TIE_RANK: Record<LeoEmailAttentionLabel, number> = {
  WAITING_ON_US: 0,
  LIKELY_REPLY_NEEDED: 1,
  NEEDS_REVIEW: 2,
  INFORMATIONAL: 3,
  AUTOMATED: 4,
  RECEIPT: 5,
  SYSTEM: 6,
  UNKNOWN: 7,
};

export type LeoGmailConversationUnit = {
  threadKey: string;
  message: LeoEmailMessageEvidence;
  triage: LeoEmailTriageResult;
  senderClass: LeoSenderClassResult;
  attention: LeoExecutiveEmailAttention;
};

/** Prefer unread + recent for enrichment candidates; do not claim HUMAN yet. */
export function selectLeoGmailThreadEnrichmentCandidates(
  messages: LeoEmailMessageEvidence[],
  maxUniqueThreads = LEO_GMAIL_THREAD_ENRICHMENT.maxUniqueThreads,
): string[] {
  const scored: { threadId: string; score: number; receivedAt: string }[] = [];
  const seen = new Set<string>();
  for (const m of messages) {
    const tid = m.threadId?.trim();
    if (!tid || seen.has(tid)) continue;
    seen.add(tid);
    const unread = m.readState === "UNREAD" || m.labelIds?.some((l) => l.toUpperCase() === "UNREAD");
    const sender = classifyLeoEmailSenderClass(m.sender);
    let score = 0;
    if (unread) score += 40;
    if (!isAutomatedOrNoReply(sender.senderClass)) score += 20;
    else score -= 10;
    scored.push({ threadId: tid, score, receivedAt: m.receivedAt ?? "" });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.receivedAt || "").localeCompare(a.receivedAt || "");
  });
  return scored.slice(0, maxUniqueThreads).map((s) => s.threadId);
}

/** One conversation card per thread — latest message by receivedAt. */
export function dedupeLeoGmailMessagesByThread(
  messages: LeoEmailMessageEvidence[],
): LeoEmailMessageEvidence[] {
  const byThread = new Map<string, LeoEmailMessageEvidence>();
  const noThread: LeoEmailMessageEvidence[] = [];
  for (const m of messages) {
    const tid = m.threadId?.trim();
    if (!tid) {
      noThread.push(m);
      continue;
    }
    const prev = byThread.get(tid);
    if (!prev) {
      byThread.set(tid, m);
      continue;
    }
    if ((m.receivedAt ?? "") > (prev.receivedAt ?? "")) {
      byThread.set(tid, m);
    }
  }
  return [...byThread.values(), ...noThread];
}

export function buildLeoGmailConversationUnits(input: {
  messages: LeoEmailMessageEvidence[];
  triage: LeoEmailTriageResult[];
}): LeoGmailConversationUnit[] {
  const triageByMessage = new Map(input.triage.map((t) => [t.messageId, t]));
  const deduped = dedupeLeoGmailMessagesByThread(input.messages);
  const units: LeoGmailConversationUnit[] = [];
  for (const message of deduped) {
    const triage =
      triageByMessage.get(message.messageId) ??
      ({
        messageId: message.messageId,
        threadId: message.threadId,
        state: "UNKNOWN" as LeoEmailTriageState,
        unread: message.readState === "UNREAD",
        directionProven: false,
        limitations: ["Triage result missing for message."],
        unknowns: ["triage_missing"],
      } satisfies LeoEmailTriageResult);
    const senderClass = classifyLeoEmailSenderClass(message.sender);
    const attention = classifyLeoExecutiveEmailAttention({
      triage,
      senderClass: senderClass.senderClass,
    });
    units.push({
      threadKey: message.threadId?.trim() || `msg:${message.messageId}`,
      message,
      triage,
      senderClass,
      attention,
    });
  }
  units.sort((a, b) => {
    const pr = PRIORITY_RANK[a.attention.priority] - PRIORITY_RANK[b.attention.priority];
    if (pr !== 0) return pr;
    const lr =
      LABEL_TIE_RANK[a.attention.attentionLabel] - LABEL_TIE_RANK[b.attention.attentionLabel];
    if (lr !== 0) return lr;
    // Recency tie-break — automated newer must not outrank proven waiting (already handled by priority).
    return (b.message.receivedAt ?? "").localeCompare(a.message.receivedAt ?? "");
  });
  return units;
}

export function mapLeoGmailConversationToEmailCard(
  unit: LeoGmailConversationUnit,
): LeoEmailResultCard {
  const base = mapEmailEvidenceToResultCard({
    message: unit.message,
    triage: unit.triage,
    priority: unit.attention.priority,
  });
  // Spoken summaries must not read raw email addresses.
  const whoSpoken = base.senderDisplayName?.trim() || "Someone";
  let spoken = base.spokenSummary;
  if (unit.attention.attentionLabel === "WAITING_ON_US") {
    spoken = boundSpokenSummary(`${whoSpoken} appears to be waiting for a response.`);
  } else if (unit.attention.attentionLabel === "AUTOMATED") {
    spoken = boundSpokenSummary(`Automated message: ${base.title}.`);
  } else if (unit.attention.attentionLabel === "LIKELY_REPLY_NEEDED") {
    spoken = boundSpokenSummary(
      `${whoSpoken} may need a reply, but that is not fully proven.`,
    );
  }

  const actions = [
    ...base.actions,
    createAcknowledgeAction({
      sourceKind: "gmail_thread",
      sourceKey: unit.threadKey,
    }),
  ];

  return {
    ...base,
    cardId: `email:thread:${unit.threadKey}`,
    certainty: unit.attention.certainty,
    priority: unit.attention.priority,
    reason: [unit.attention.reason, unit.senderClass.reason].filter(Boolean).join(" "),
    whyItMatters: unit.attention.whyItMatters,
    spokenSummary: spoken,
    direction: unit.attention.direction,
    senderClass: unit.senderClass.senderClass,
    attentionLabel: unit.attention.attentionLabel,
    relationshipClass: "UNKNOWN",
    actions,
  };
}

export type LeoGmailExecutiveCounts = {
  conversations: number;
  waitingOnUs: number;
  likelyReply: number;
  needsReview: number;
  automated: number;
  informational: number;
  unknown: number;
};

export function countLeoGmailExecutiveLabels(
  cards: LeoEmailResultCard[],
): LeoGmailExecutiveCounts {
  const counts: LeoGmailExecutiveCounts = {
    conversations: cards.length,
    waitingOnUs: 0,
    likelyReply: 0,
    needsReview: 0,
    automated: 0,
    informational: 0,
    unknown: 0,
  };
  for (const c of cards) {
    switch (c.attentionLabel) {
      case "WAITING_ON_US":
        counts.waitingOnUs += 1;
        break;
      case "LIKELY_REPLY_NEEDED":
        counts.likelyReply += 1;
        break;
      case "NEEDS_REVIEW":
        counts.needsReview += 1;
        break;
      case "AUTOMATED":
      case "RECEIPT":
      case "SYSTEM":
        counts.automated += 1;
        break;
      case "INFORMATIONAL":
        counts.informational += 1;
        break;
      default:
        counts.unknown += 1;
    }
  }
  return counts;
}

export function composeLeoGmailExecutiveSummary(input: {
  counts: LeoGmailExecutiveCounts;
  cards: LeoEmailResultCard[];
  ownerQuestion?: string | null;
  gmailAvailable: boolean;
}): string {
  const { counts, cards, ownerQuestion } = input;
  if (!input.gmailAvailable) {
    return "LEO could not read Gmail right now.";
  }
  if (counts.conversations === 0) {
    return "No recent conversations were found in the bounded Gmail fetch.";
  }

  const q = (ownerQuestion ?? "").toLowerCase();
  if (/waiting on my reply/.test(q)) {
    if (counts.waitingOnUs === 0) {
      return counts.likelyReply > 0
        ? `${counts.likelyReply} conversation(s) may need a reply, but thread direction is not fully proven.`
        : "No conversations are currently proven as waiting on your reply.";
    }
    const names = cards
      .filter((c) => c.attentionLabel === "WAITING_ON_US")
      .map((c) => c.senderDisplayName || c.senderAddress || "Someone")
      .slice(0, 3);
    return `${counts.waitingOnUs} conversation(s) are proven waiting on your reply${
      names.length ? `: ${names.join("; ")}` : ""
    }.`;
  }

  const parts: string[] = [
    `${counts.conversations} recent conversation${counts.conversations === 1 ? "" : "s"} found.`,
  ];
  if (counts.waitingOnUs > 0) {
    const who = cards.find((c) => c.attentionLabel === "WAITING_ON_US");
    const name = who?.senderDisplayName || who?.senderAddress;
    parts.push(
      name
        ? `${counts.waitingOnUs} appear${counts.waitingOnUs === 1 ? "s" : ""} to need a response${
            counts.waitingOnUs === 1 ? ` (${name})` : ""
          }.`
        : `${counts.waitingOnUs} appear to need a response.`,
    );
  }
  if (counts.likelyReply > 0) {
    parts.push(
      `${counts.likelyReply} may need a reply but direction is not fully proven.`,
    );
  }
  if (counts.needsReview > 0) {
    parts.push(`${counts.needsReview} need${counts.needsReview === 1 ? "s" : ""} review.`);
  }
  if (counts.automated > 0) {
    parts.push(
      `${counts.automated} ${counts.automated === 1 ? "is" : "are"} automated.`,
    );
  }
  if (counts.informational > 0 && counts.waitingOnUs === 0 && counts.likelyReply === 0) {
    parts.push(
      `${counts.informational} informational.`,
    );
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function composeLeoGmailSpokenSummary(input: {
  counts: LeoGmailExecutiveCounts;
  cards: LeoEmailResultCard[];
}): string {
  const { counts, cards } = input;
  if (counts.conversations === 0) {
    return "No recent conversations to summarize.";
  }
  const bits: string[] = [];
  const attention =
    counts.waitingOnUs + counts.likelyReply + counts.needsReview;
  if (attention > 0) {
    bits.push(
      `${attention} conversation${attention === 1 ? "" : "s"} need${
        attention === 1 ? "s" : ""
      } your attention.`,
    );
  } else {
    bits.push(`${counts.conversations} conversations reviewed.`);
  }
  const waiting = cards.find((c) => c.attentionLabel === "WAITING_ON_US");
  if (waiting) {
    const who = waiting.senderDisplayName || "Someone";
    bits.push(`${who} appears to be waiting for a response.`);
  }
  if (counts.automated > 0) {
    bits.push(
      `${counts.automated} other message${counts.automated === 1 ? " is" : "s are"} automated.`,
    );
  }
  return boundSpokenSummary(bits.join(" "));
}

/**
 * Bounded concurrency runner for thread fetches — pure control flow helper.
 * Caller supplies the async fetch; failures become null without aborting others.
 */
export async function mapPoolLimited<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const cap = Math.max(1, Math.min(concurrency, items.length || 1));
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run(): Promise<void> {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(cap, items.length) }, () => run()));
  return results;
}
