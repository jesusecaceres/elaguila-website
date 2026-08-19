/**
 * LEO-14.4 commitment intelligence — pure, fixture-safe.
 * No DB, no network, no AI. Orchestrates already-retrieved commitment rows.
 */
import {
  deriveCommitmentCardDueState,
  mapCommitmentToResultCard,
  boundSpokenSummary,
} from "@/app/leo/_lib/leoResultCards";
import { deriveLeoCommitmentDueState } from "@/app/leo/_lib/leoPersistenceSemantics";
import type {
  LeoAttentionLevel,
  LeoCommitment,
  LeoCommitmentCardDueState,
  LeoCommitmentQueryKind,
  LeoCommitmentResultCard,
} from "@/app/leo/_lib/leoTypes";

const PRIORITY_RANK: Record<LeoAttentionLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  INFORMATIONAL: 3,
};

const DUE_RANK: Record<LeoCommitmentCardDueState, number> = {
  OVERDUE: 0,
  DUE_TODAY: 1,
  DUE_SOON: 2,
  FUTURE: 3,
  NO_DUE_DATE: 4,
};

export type LeoCommitmentIntelligenceCounts = {
  matched: number;
  confirmedOpen: number;
  confirmedOverdue: number;
  confirmedDueToday: number;
  confirmedDueSoon: number;
  confirmedNoDueDate: number;
  candidates: number;
  candidateOverdue: number;
  external: number;
  completed: number;
  cancelled: number;
};

export type LeoCommitmentIntelligenceResult = {
  generatedAt: string;
  queryKind: LeoCommitmentQueryKind;
  availability: "AVAILABLE" | "EMPTY" | "UNAVAILABLE" | "MATCHED_EMPTY";
  matched: LeoCommitment[];
  cards: LeoCommitmentResultCard[];
  counts: LeoCommitmentIntelligenceCounts;
  summary: string;
  spokenSummary: string;
  unknowns: string[];
  limitations: string[];
};

function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Deterministic query parser — no AI. */
export function parseLeoCommitmentQueryKind(question: string): LeoCommitmentQueryKind {
  const q = normalizeQuestion(question);

  if (/\bwhat am i forgetting\b|\bwhat am i forgetting\?/.test(q) || q === "what am i forgetting") {
    return "FORGETTING";
  }
  if (/\bwhat can wait\b/.test(q)) return "CAN_WAIT";

  if (
    /\bwhat did i promise\b|\bwhat have i promised\b|\bwhat did i commit\b|\bmy promises\b/.test(q)
  ) {
    return "PROMISED";
  }

  if (
    /\bwhat commitments are overdue\b|\bcommitments? (that are )?overdue\b|\bwhat is overdue\b|\bwhat's overdue\b/.test(
      q,
    )
  ) {
    return "OVERDUE";
  }
  if (/\bwhat is due today\b|\bwhat's due today\b|\bcommitments? due today\b/.test(q)) {
    return "DUE_TODAY";
  }
  if (
    /\bwhat is due soon\b|\bwhat's due soon\b|\bcommitments? due soon\b|\bdue soon\b/.test(q)
  ) {
    return "DUE_SOON";
  }
  if (
    /\bcommitments? with no due date\b|\bno due date\b|\bwithout (a )?due date\b/.test(q)
  ) {
    return "NO_DUE_DATE";
  }
  if (
    /\bwhat did i complete\b|\bcompleted commitments?\b|\bcommitments? (i )?completed\b/.test(q)
  ) {
    return "COMPLETED";
  }
  if (/\bcancelled commitments?\b|\bcanceled commitments?\b/.test(q)) {
    return "CANCELLED";
  }
  if (/\ball commitments?\b/.test(q)) return "ALL";

  if (/\b(linked to|for|from)\b.+\b(person|source|counterparty)\b/.test(q)) {
    return "BY_COUNTERPARTY";
  }

  if (
    /\bopen commitments?\b|\bmy commitments?\b|\bwhat commitments do i have\b|\bwhat commitments\b/.test(
      q,
    )
  ) {
    return "OPEN";
  }

  return "OPEN";
}

export function isConfirmedOwnerCommitment(c: LeoCommitment): boolean {
  return c.kind === "EXPLICIT_OWNER";
}

export function isCandidateCommitment(c: LeoCommitment): boolean {
  return c.kind === "EXTRACTED_CANDIDATE";
}

export function cardDueStateForCommitment(
  c: LeoCommitment,
  nowMs: number,
): LeoCommitmentCardDueState {
  // Card-level classification reuses the shared 48h horizon (same as deriveLeoCommitmentDueState).
  void deriveLeoCommitmentDueState(c, nowMs);
  return deriveCommitmentCardDueState(c.dueAt, nowMs, c.status);
}

function sortCommitments(a: LeoCommitment, b: LeoCommitment, nowMs: number): number {
  const da = cardDueStateForCommitment(a, nowMs);
  const db = cardDueStateForCommitment(b, nowMs);
  const dueCmp = DUE_RANK[da] - DUE_RANK[db];
  if (dueCmp !== 0) return dueCmp;
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;
  const aDue = a.dueAt ?? "";
  const bDue = b.dueAt ?? "";
  if (aDue && bDue && aDue !== bDue) return aDue.localeCompare(bDue);
  return a.createdAt.localeCompare(b.createdAt);
}

function filterByQuery(
  commitments: LeoCommitment[],
  queryKind: LeoCommitmentQueryKind,
  nowMs: number,
): LeoCommitment[] {
  switch (queryKind) {
    case "COMPLETED":
      return commitments.filter((c) => c.status === "COMPLETED");
    case "CANCELLED":
      return commitments.filter((c) => c.status === "CANCELLED");
    case "ALL":
      return [...commitments];
    case "PROMISED":
      return commitments.filter(
        (c) => c.status === "OPEN" && c.kind === "EXPLICIT_OWNER",
      );
    case "OVERDUE":
      return commitments.filter((c) => {
        if (c.status !== "OPEN") return false;
        return cardDueStateForCommitment(c, nowMs) === "OVERDUE";
      });
    case "DUE_TODAY":
      return commitments.filter((c) => {
        if (c.status !== "OPEN") return false;
        return cardDueStateForCommitment(c, nowMs) === "DUE_TODAY";
      });
    case "DUE_SOON":
      return commitments.filter((c) => {
        if (c.status !== "OPEN") return false;
        return cardDueStateForCommitment(c, nowMs) === "DUE_SOON";
      });
    case "NO_DUE_DATE":
      return commitments.filter((c) => {
        if (c.status !== "OPEN") return false;
        return cardDueStateForCommitment(c, nowMs) === "NO_DUE_DATE";
      });
    case "FORGETTING":
      return commitments.filter((c) => {
        if (c.status !== "OPEN") return false;
        const due = cardDueStateForCommitment(c, nowMs);
        return (
          due === "OVERDUE" ||
          due === "DUE_TODAY" ||
          due === "DUE_SOON" ||
          c.kind === "EXTRACTED_CANDIDATE"
        );
      });
    case "CAN_WAIT":
      return commitments.filter((c) => {
        if (c.status !== "OPEN") return false;
        if (c.kind === "EXTRACTED_CANDIDATE") return false;
        const due = cardDueStateForCommitment(c, nowMs);
        return (
          due === "FUTURE" ||
          due === "NO_DUE_DATE" ||
          c.priority === "INFORMATIONAL" ||
          c.priority === "NORMAL"
        );
      });
    case "BY_COUNTERPARTY":
    case "BY_SOURCE":
    case "OPEN":
    default:
      return commitments.filter((c) => c.status === "OPEN");
  }
}

function emptyCounts(): LeoCommitmentIntelligenceCounts {
  return {
    matched: 0,
    confirmedOpen: 0,
    confirmedOverdue: 0,
    confirmedDueToday: 0,
    confirmedDueSoon: 0,
    confirmedNoDueDate: 0,
    candidates: 0,
    candidateOverdue: 0,
    external: 0,
    completed: 0,
    cancelled: 0,
  };
}

export function countLeoCommitmentIntelligence(
  commitments: LeoCommitment[],
  nowMs: number,
): LeoCommitmentIntelligenceCounts {
  const counts = emptyCounts();
  for (const c of commitments) {
    if (c.status === "COMPLETED") counts.completed += 1;
    if (c.status === "CANCELLED") counts.cancelled += 1;
    if (c.kind === "EXTERNAL_PARTY") counts.external += 1;
    if (c.kind === "EXTRACTED_CANDIDATE") {
      counts.candidates += 1;
      if (c.status === "OPEN" && cardDueStateForCommitment(c, nowMs) === "OVERDUE") {
        counts.candidateOverdue += 1;
      }
    }
    if (c.kind === "EXPLICIT_OWNER" && c.status === "OPEN") {
      counts.confirmedOpen += 1;
      const due = cardDueStateForCommitment(c, nowMs);
      if (due === "OVERDUE") counts.confirmedOverdue += 1;
      if (due === "DUE_TODAY") counts.confirmedDueToday += 1;
      if (due === "DUE_SOON") counts.confirmedDueSoon += 1;
      if (due === "NO_DUE_DATE") counts.confirmedNoDueDate += 1;
    }
  }
  counts.matched = commitments.length;
  return counts;
}

export function composeLeoCommitmentExecutiveSummary(input: {
  queryKind: LeoCommitmentQueryKind;
  availability: LeoCommitmentIntelligenceResult["availability"];
  counts: LeoCommitmentIntelligenceCounts;
  matched: LeoCommitment[];
}): string {
  const { queryKind, availability, counts } = input;
  const limitation =
    "This answer covers recorded LEO commitments, not every obligation across Leonix.";

  if (availability === "UNAVAILABLE") {
    return `Commitment records are currently unavailable. ${limitation}`;
  }

  if (availability === "EMPTY" || availability === "MATCHED_EMPTY" || counts.matched === 0) {
    return `No recorded commitments match that request. ${limitation}`;
  }

  if (queryKind === "FORGETTING") {
    const parts: string[] = [
      "Based on your recorded commitments,",
    ];
    if (counts.confirmedOverdue > 0) {
      parts.push(
        `${counts.confirmedOverdue} confirmed item${counts.confirmedOverdue === 1 ? "" : "s"} ${counts.confirmedOverdue === 1 ? "is" : "are"} overdue`,
      );
    }
    if (counts.confirmedDueToday + counts.confirmedDueSoon > 0) {
      const n = counts.confirmedDueToday + counts.confirmedDueSoon;
      parts.push(`${n} due soon or today`);
    }
    if (counts.candidates > 0) {
      parts.push(
        `${counts.candidates} possible commitment${counts.candidates === 1 ? "" : "s"} waiting for confirmation`,
      );
    }
    if (parts.length === 1) {
      return `Based on your recorded commitments, nothing urgent is currently flagged. ${limitation}`;
    }
    return `${parts[0]} ${parts.slice(1).join("; ")}. ${limitation}`;
  }

  if (queryKind === "PROMISED") {
    return counts.confirmedOpen === 0
      ? `No confirmed owner promises are recorded as open. ${limitation}`
      : `You have ${counts.confirmedOpen} confirmed open commitment${counts.confirmedOpen === 1 ? "" : "s"}${
          counts.confirmedOverdue
            ? `; ${counts.confirmedOverdue} overdue`
            : ""
        }. ${limitation}`;
  }

  if (queryKind === "OVERDUE") {
    if (counts.confirmedOverdue === 0 && counts.candidateOverdue > 0) {
      return `No confirmed commitments are overdue. ${counts.candidateOverdue} possible commitment${counts.candidateOverdue === 1 ? "" : "s"} with overdue dates still need confirmation. ${limitation}`;
    }
    if (counts.confirmedOverdue === 0) {
      return `No confirmed commitments are overdue. ${limitation}`;
    }
    return `You have ${counts.confirmedOverdue} confirmed overdue commitment${counts.confirmedOverdue === 1 ? "" : "s"}${
      counts.candidateOverdue
        ? ` and ${counts.candidateOverdue} possible commitment${counts.candidateOverdue === 1 ? "" : "s"} waiting for confirmation`
        : ""
    }. ${limitation}`;
  }

  if (queryKind === "COMPLETED") {
    return `You have ${counts.matched} completed commitment${counts.matched === 1 ? "" : "s"} recorded. ${limitation}`;
  }
  if (queryKind === "CANCELLED") {
    return `You have ${counts.matched} cancelled commitment${counts.matched === 1 ? "" : "s"} recorded. ${limitation}`;
  }
  if (queryKind === "CAN_WAIT") {
    return `Based on due dates and priority, ${counts.matched} recorded commitment${counts.matched === 1 ? "" : "s"} can wait relative to overdue or due-soon items. ${limitation}`;
  }

  const openConfirmed = counts.confirmedOpen;
  const details: string[] = [];
  if (counts.confirmedOverdue > 0) {
    details.push(
      `${counts.confirmedOverdue} ${counts.confirmedOverdue === 1 ? "is" : "are"} overdue`,
    );
  }
  if (counts.confirmedDueToday > 0) {
    details.push(`${counts.confirmedDueToday} due today`);
  }
  if (counts.confirmedDueSoon > 0) {
    details.push(`${counts.confirmedDueSoon} due soon`);
  }
  if (counts.confirmedNoDueDate > 0) {
    details.push(`${counts.confirmedNoDueDate} with no due date`);
  }
  let sentence = `You have ${openConfirmed} confirmed open commitment${openConfirmed === 1 ? "" : "s"}.`;
  if (details.length > 0) {
    sentence = `You have ${openConfirmed} confirmed open commitment${openConfirmed === 1 ? "" : "s"}. ${details.join("; ")}.`;
  }
  if (counts.candidates > 0) {
    sentence += ` ${counts.candidates} possible commitment${counts.candidates === 1 ? "" : "s"} still need confirmation.`;
  }
  if (counts.external > 0) {
    sentence += ` ${counts.external} external-party commitment${counts.external === 1 ? "" : "s"} recorded.`;
  }
  return `${sentence} ${limitation}`;
}

export function composeLeoCommitmentSpokenSummary(input: {
  queryKind: LeoCommitmentQueryKind;
  availability: LeoCommitmentIntelligenceResult["availability"];
  counts: LeoCommitmentIntelligenceCounts;
}): string {
  const { availability, counts } = input;
  if (availability === "UNAVAILABLE") {
    return "Commitment records are currently unavailable.";
  }
  if (counts.matched === 0) {
    return "No recorded commitments match that request.";
  }
  const bits: string[] = [];
  if (counts.confirmedOverdue > 0) {
    bits.push(
      `${counts.confirmedOverdue} overdue commitment${counts.confirmedOverdue === 1 ? "" : "s"}`,
    );
  }
  if (counts.confirmedDueToday > 0) {
    bits.push(`${counts.confirmedDueToday} due today`);
  }
  if (counts.confirmedDueSoon > 0) {
    bits.push(`${counts.confirmedDueSoon} due soon`);
  }
  if (counts.candidates > 0) {
    bits.push(
      `${counts.candidates} possible commitment${counts.candidates === 1 ? "" : "s"} that still need confirmation`,
    );
  }
  if (bits.length === 0) {
    bits.push(
      `${counts.matched} recorded commitment${counts.matched === 1 ? "" : "s"} matching the request`,
    );
  }
  if (bits.length === 1) {
    return boundSpokenSummary(`You have ${bits[0]}.`);
  }
  if (bits.length === 2) {
    return boundSpokenSummary(`You have ${bits[0]} and ${bits[1]}.`);
  }
  return boundSpokenSummary(
    `You have ${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}.`,
  );
}

/**
 * Pure commitment intelligence over already-fetched rows.
 */
export function buildLeoCommitmentIntelligence(input: {
  commitments: LeoCommitment[];
  queryKind: LeoCommitmentQueryKind;
  nowMs: number;
  maxResults: number;
  availability?: "AVAILABLE" | "EMPTY" | "UNAVAILABLE";
}): LeoCommitmentIntelligenceResult {
  const nowMs = input.nowMs;
  const generatedAt = new Date(nowMs).toISOString();
  const limitations: string[] = [
    "This answer covers recorded LEO commitments, not every obligation across Leonix.",
    "OVERDUE / DUE_TODAY / DUE_SOON are derived from dueAt — never persisted statuses.",
    "Due timestamps use absolute ISO time when timezone metadata is absent.",
    `DUE_SOON horizon is ${48} hours from now (shared with deriveLeoCommitmentDueState).`,
    "EXTRACTED_CANDIDATE is never counted as a confirmed owner promise.",
  ];
  const unknowns: string[] = [];

  if (input.availability === "UNAVAILABLE") {
    return {
      generatedAt,
      queryKind: input.queryKind,
      availability: "UNAVAILABLE",
      matched: [],
      cards: [],
      counts: emptyCounts(),
      summary: composeLeoCommitmentExecutiveSummary({
        queryKind: input.queryKind,
        availability: "UNAVAILABLE",
        counts: emptyCounts(),
        matched: [],
      }),
      spokenSummary: composeLeoCommitmentSpokenSummary({
        queryKind: input.queryKind,
        availability: "UNAVAILABLE",
        counts: emptyCounts(),
      }),
      unknowns: ["commitment_persistence_unavailable"],
      limitations: [
        ...limitations,
        "Commitment table/query unavailable — not claiming zero commitments.",
      ],
    };
  }

  const filtered = filterByQuery(input.commitments, input.queryKind, nowMs).sort((a, b) =>
    sortCommitments(a, b, nowMs),
  );
  const capped = filtered.slice(0, Math.max(1, input.maxResults));
  if (filtered.length > capped.length) {
    limitations.push(
      `Showing ${capped.length} of ${filtered.length} matching recorded commitments (bounded).`,
    );
  }

  const cards = capped.map((c) => mapCommitmentToResultCard({ commitment: c, nowMs }));
  const counts = countLeoCommitmentIntelligence(capped, nowMs);
  // Recompute confirmed due counts from matched set for summary accuracy on filtered queries
  const fullCounts = countLeoCommitmentIntelligence(capped, nowMs);

  const availability =
    input.availability === "EMPTY" && input.commitments.length === 0
      ? "EMPTY"
      : capped.length === 0
        ? "MATCHED_EMPTY"
        : "AVAILABLE";

  return {
    generatedAt,
    queryKind: input.queryKind,
    availability,
    matched: capped,
    cards,
    counts: fullCounts,
    summary: composeLeoCommitmentExecutiveSummary({
      queryKind: input.queryKind,
      availability,
      counts: fullCounts,
      matched: capped,
    }),
    spokenSummary: composeLeoCommitmentSpokenSummary({
      queryKind: input.queryKind,
      availability,
      counts: fullCounts,
    }),
    unknowns,
    limitations: [...new Set(limitations)],
  };
}
