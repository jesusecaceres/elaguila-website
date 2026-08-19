/**
 * LEO-14.5 receipt intelligence — pure, fixture-safe.
 * No DB, no network, no AI. Interprets already-fetched durable receipts.
 */
import { boundSpokenSummary } from "@/app/leo/_lib/leoResultCards";
import type {
  LeoDurableToolReceipt,
  LeoPreparedActionResultCard,
  LeoGenericResultCard,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";

export type LeoReceiptQueryKind =
  | "RECENT"
  | "PREPARED"
  | "AWAITING_APPROVAL"
  | "EXECUTED"
  | "VERIFIED"
  | "FAILED"
  | "NOT_EXECUTED"
  | "ALL";

export type LeoReceiptHumanState = {
  label: string;
  executedClaim: boolean;
  verifiedClaim: boolean;
  preparedOnly: boolean;
};

export type LeoReceiptIntelligenceCounts = {
  matched: number;
  prepared: number;
  awaitingApproval: number;
  executed: number;
  verified: number;
  failed: number;
  notExecuted: number;
  cancelled: number;
  internalActions: number;
  externalReadyPrep: number;
};

export type LeoReceiptIntelligenceResult = {
  generatedAt: string;
  queryKind: LeoReceiptQueryKind;
  availability: "AVAILABLE" | "EMPTY" | "UNAVAILABLE" | "MATCHED_EMPTY";
  matched: LeoDurableToolReceipt[];
  cards: LeoResultCard[];
  counts: LeoReceiptIntelligenceCounts;
  summary: string;
  spokenSummary: string;
  unknowns: string[];
  limitations: string[];
};

function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseLeoReceiptQueryKind(question: string): LeoReceiptQueryKind {
  const q = normalizeQuestion(question);
  if (/\bwhat did you prepare\b|\bwhat have you prepared\b|\bpreparations?\b/.test(q)) {
    return "PREPARED";
  }
  if (/\bwaiting for (my )?approval\b|\bawaiting approval\b/.test(q)) {
    return "AWAITING_APPROVAL";
  }
  if (/\bdid (you |that )?execute\b|\bdid that (actually )?(run|execute)\b|\bexecuted\b/.test(q)) {
    return "EXECUTED";
  }
  if (/\bverified\b/.test(q)) return "VERIFIED";
  if (/\bwhat failed\b|\bfailed\b/.test(q)) return "FAILED";
  if (/\bwhat did not execute\b|\bnot executed\b|\bdidn't execute\b/.test(q)) {
    return "NOT_EXECUTED";
  }
  if (/\ball (leo )?receipts\b|\ball (leo )?actions\b/.test(q)) return "ALL";
  return "RECENT";
}

/** Human-readable lifecycle interpretation — never collapses PREPARED/EXECUTED/VERIFIED. */
export function interpretLeoReceiptState(
  receipt: LeoDurableToolReceipt,
): LeoReceiptHumanState {
  const state = receipt.lifecycleState;
  const hadExecution = Boolean(receipt.executedAt) || receipt.executionState === "EXECUTED";

  switch (state) {
    case "REQUESTED":
      return { label: "Requested", executedClaim: false, verifiedClaim: false, preparedOnly: false };
    case "AUTHORIZED":
      return { label: "Authorized", executedClaim: false, verifiedClaim: false, preparedOnly: false };
    case "PREPARED":
      return {
        label: "Prepared — not executed",
        executedClaim: false,
        verifiedClaim: false,
        preparedOnly: true,
      };
    case "AWAITING_APPROVAL":
      return {
        label: "Prepared / awaiting approval",
        executedClaim: false,
        verifiedClaim: false,
        preparedOnly: true,
      };
    case "EXECUTED":
      return {
        label:
          receipt.verificationState === "VERIFIED"
            ? "Executed and verified"
            : "Executed — verification not yet proven",
        executedClaim: true,
        verifiedClaim: receipt.verificationState === "VERIFIED",
        preparedOnly: false,
      };
    case "VERIFIED":
      return {
        label: "Executed and verified",
        executedClaim: true,
        verifiedClaim: true,
        preparedOnly: false,
      };
    case "FAILED":
      return {
        label: hadExecution
          ? "Failed after execution — execution previously recorded"
          : "Failed before execution",
        executedClaim: hadExecution,
        verifiedClaim: false,
        preparedOnly: false,
      };
    case "NOT_EXECUTED":
      return {
        label: "Not executed",
        executedClaim: false,
        verifiedClaim: false,
        preparedOnly: false,
      };
    case "CANCELLED":
      return {
        label: "Cancelled before execution",
        executedClaim: false,
        verifiedClaim: false,
        preparedOnly: false,
      };
    default:
      return { label: "Unknown receipt state", executedClaim: false, verifiedClaim: false, preparedOnly: false };
  }
}

export function mapReceiptToResultCard(receipt: LeoDurableToolReceipt): LeoResultCard {
  const interp = interpretLeoReceiptState(receipt);
  const actionLabel = receipt.actionType.replace(/_/g, " ");
  const spoken = boundSpokenSummary(`${actionLabel}: ${interp.label}.`);

  // Prefer PREPARED_ACTION shape for preparation-like receipts.
  if (interp.preparedOnly || receipt.lifecycleState === "PREPARED") {
    const card: LeoPreparedActionResultCard = {
      cardId: `receipt:${receipt.id}`,
      kind: "PREPARED_ACTION",
      priority: "NORMAL",
      certainty: "PROVEN",
      title: actionLabel,
      subtitle: interp.label,
      whyItMatters: "Durable LEO action receipt — preparation only unless executed.",
      reason: `Lifecycle ${receipt.lifecycleState}; governance ${receipt.governanceLevel}.`,
      evidenceRefs: [`leo:receipt:${receipt.id}`],
      sourceSystem: "LEO",
      actions: [],
      spokenSummary: spoken,
      preparationId: receipt.preparationRef ?? receipt.id,
      preparationKind: "INTERNAL_TASK_DRAFT",
      preparationStatus: "PREPARED",
      executionAllowed: false,
      draftBodyPreview: receipt.requestedPayloadSummary.slice(0, 280),
      targetRef: receipt.preparationRef,
    };
    return card;
  }

  const card: LeoGenericResultCard = {
    cardId: `receipt:${receipt.id}`,
    kind: "GENERIC",
    priority: interp.executedClaim ? "HIGH" : "NORMAL",
    certainty: "PROVEN",
    title: actionLabel,
    subtitle: interp.label,
    whyItMatters: interp.executedClaim
      ? "This LEO action has an execution record."
      : "This LEO action did not claim external execution.",
    reason: [
      `Lifecycle ${receipt.lifecycleState}`,
      `governance ${receipt.governanceLevel}`,
      receipt.safeErrorClass ? `safeError=${receipt.safeErrorClass}` : null,
    ]
      .filter(Boolean)
      .join("; "),
    evidenceRefs: [`leo:receipt:${receipt.id}`],
    sourceSystem: "LEO",
    actions: [],
    spokenSummary: spoken,
  };
  return card;
}

function filterReceipts(
  receipts: LeoDurableToolReceipt[],
  queryKind: LeoReceiptQueryKind,
): LeoDurableToolReceipt[] {
  switch (queryKind) {
    case "PREPARED":
      return receipts.filter(
        (r) => r.lifecycleState === "PREPARED" || r.lifecycleState === "AWAITING_APPROVAL",
      );
    case "AWAITING_APPROVAL":
      return receipts.filter((r) => r.lifecycleState === "AWAITING_APPROVAL");
    case "EXECUTED":
      return receipts.filter(
        (r) =>
          r.lifecycleState === "EXECUTED" ||
          r.lifecycleState === "VERIFIED" ||
          Boolean(r.executedAt),
      );
    case "VERIFIED":
      return receipts.filter((r) => r.lifecycleState === "VERIFIED");
    case "FAILED":
      return receipts.filter((r) => r.lifecycleState === "FAILED");
    case "NOT_EXECUTED":
      return receipts.filter((r) => r.lifecycleState === "NOT_EXECUTED");
    case "ALL":
    case "RECENT":
    default:
      return [...receipts];
  }
}

function emptyCounts(): LeoReceiptIntelligenceCounts {
  return {
    matched: 0,
    prepared: 0,
    awaitingApproval: 0,
    executed: 0,
    verified: 0,
    failed: 0,
    notExecuted: 0,
    cancelled: 0,
    internalActions: 0,
    externalReadyPrep: 0,
  };
}

export function countLeoReceiptIntelligence(
  receipts: LeoDurableToolReceipt[],
): LeoReceiptIntelligenceCounts {
  const counts = emptyCounts();
  counts.matched = receipts.length;
  for (const r of receipts) {
    if (r.lifecycleState === "PREPARED") counts.prepared += 1;
    if (r.lifecycleState === "AWAITING_APPROVAL") counts.awaitingApproval += 1;
    if (r.lifecycleState === "EXECUTED") counts.executed += 1;
    if (r.lifecycleState === "VERIFIED") counts.verified += 1;
    if (r.lifecycleState === "FAILED") counts.failed += 1;
    if (r.lifecycleState === "NOT_EXECUTED") counts.notExecuted += 1;
    if (r.lifecycleState === "CANCELLED") counts.cancelled += 1;
    if (
      r.actionType === "ACKNOWLEDGE" ||
      r.actionType === "DISMISS" ||
      r.actionType === "REMIND_LATER"
    ) {
      counts.internalActions += 1;
    }
    if (r.lifecycleState === "PREPARED" || r.lifecycleState === "AWAITING_APPROVAL") {
      counts.externalReadyPrep += 1;
    }
  }
  return counts;
}

export function composeLeoReceiptExecutiveSummary(input: {
  queryKind: LeoReceiptQueryKind;
  availability: LeoReceiptIntelligenceResult["availability"];
  counts: LeoReceiptIntelligenceCounts;
}): string {
  const { availability, counts } = input;
  if (availability === "UNAVAILABLE") {
    return "Receipt history is currently unavailable. LEO is not claiming an empty action history.";
  }
  if (counts.matched === 0) {
    return "No recorded LEO action receipts match that request.";
  }
  const bits: string[] = [];
  if (counts.prepared + counts.awaitingApproval > 0) {
    bits.push(
      `prepared ${counts.prepared + counts.awaitingApproval} item${counts.prepared + counts.awaitingApproval === 1 ? "" : "s"}`,
    );
  }
  if (counts.verified > 0) {
    bits.push(
      `verified ${counts.verified} internal action${counts.verified === 1 ? "" : "s"}`,
    );
  } else if (counts.executed > 0) {
    bits.push(
      `executed ${counts.executed} action${counts.executed === 1 ? "" : "s"} (verification not yet proven)`,
    );
  }
  if (counts.notExecuted > 0) {
    bits.push(`${counts.notExecuted} not executed`);
  }
  if (counts.failed > 0) {
    bits.push(`${counts.failed} failed`);
  }
  const head =
    bits.length > 0
      ? `I ${bits.join("; ")}.`
      : `${counts.matched} recent LEO action receipt${counts.matched === 1 ? "" : "s"} recorded.`;
  return `${head} Nothing in this history claims an external send or deploy unless a verified execution receipt says so.`;
}

export function composeLeoReceiptSpokenSummary(input: {
  availability: LeoReceiptIntelligenceResult["availability"];
  counts: LeoReceiptIntelligenceCounts;
}): string {
  if (input.availability === "UNAVAILABLE") {
    return "Receipt history is currently unavailable.";
  }
  if (input.counts.matched === 0) {
    return "No recorded LEO actions match that request.";
  }
  const c = input.counts;
  const bits: string[] = [];
  const prep = c.prepared + c.awaitingApproval;
  if (prep > 0) bits.push(`prepared ${prep} item${prep === 1 ? "" : "s"}`);
  if (c.internalActions > 0 && c.verified > 0) {
    bits.push(`acknowledged or updated ${c.verified} internal item${c.verified === 1 ? "" : "s"}`);
  } else if (c.executed > 0) {
    bits.push(`recorded ${c.executed} execution${c.executed === 1 ? "" : "s"}`);
  }
  if (bits.length === 0) {
    return boundSpokenSummary(
      `${c.matched} recent LEO action${c.matched === 1 ? "" : "s"} recorded. No external action was executed.`,
    );
  }
  return boundSpokenSummary(
    `I ${bits.join(" and ")}. No external action was executed.`,
  );
}

export function buildLeoReceiptIntelligence(input: {
  receipts: LeoDurableToolReceipt[];
  nowMs: number;
  maxResults: number;
  queryKind: LeoReceiptQueryKind;
  availability?: "AVAILABLE" | "EMPTY" | "UNAVAILABLE";
}): LeoReceiptIntelligenceResult {
  const generatedAt = new Date(input.nowMs).toISOString();
  const limitations: string[] = [
    "Receipt history is durable LEO audit truth — not a free-form memory of conversation prose.",
    "PREPARED is not EXECUTED. EXECUTED is not VERIFIED. FAILED is not NOT_EXECUTED.",
    "No raw payloads, tokens, or provider error bodies are exposed.",
  ];

  if (input.availability === "UNAVAILABLE") {
    return {
      generatedAt,
      queryKind: input.queryKind,
      availability: "UNAVAILABLE",
      matched: [],
      cards: [],
      counts: emptyCounts(),
      summary: composeLeoReceiptExecutiveSummary({
        queryKind: input.queryKind,
        availability: "UNAVAILABLE",
        counts: emptyCounts(),
      }),
      spokenSummary: composeLeoReceiptSpokenSummary({
        availability: "UNAVAILABLE",
        counts: emptyCounts(),
      }),
      unknowns: ["receipt_persistence_unavailable"],
      limitations: [
        ...limitations,
        "Receipt table/query unavailable — not claiming LEO has done nothing.",
      ],
    };
  }

  const filtered = filterReceipts(input.receipts, input.queryKind);
  const capped = filtered.slice(0, Math.max(1, input.maxResults));
  if (filtered.length > capped.length) {
    limitations.push(
      `Showing ${capped.length} of ${filtered.length} matching receipts (bounded).`,
    );
  }
  const counts = countLeoReceiptIntelligence(capped);
  const availability =
    input.availability === "EMPTY" && input.receipts.length === 0
      ? "EMPTY"
      : capped.length === 0
        ? "MATCHED_EMPTY"
        : "AVAILABLE";

  return {
    generatedAt,
    queryKind: input.queryKind,
    availability,
    matched: capped,
    cards: capped.map(mapReceiptToResultCard),
    counts,
    summary: composeLeoReceiptExecutiveSummary({
      queryKind: input.queryKind,
      availability,
      counts,
    }),
    spokenSummary: composeLeoReceiptSpokenSummary({ availability, counts }),
    unknowns: [],
    limitations: [...new Set(limitations)],
  };
}
