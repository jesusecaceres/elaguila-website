/**
 * LEO-8 Preparation Engine — YELLOW draft artifacts only.
 * No AI. No sends. No persistence. No governance downgrade.
 */
import { assessLeoGovernance } from "@/app/leo/_lib/leoGovernanceEngine";
import { buildLeoDecisionBrief } from "@/app/leo/_lib/leoDecisionEngine";
import { getLeoWatcherEntry } from "@/app/leo/_lib/leoWatcherRegistry";
import type {
  LeoActionIntentKind,
  LeoPreparedAction,
  LeoPreparationKind,
  LeoPreparationRequest,
  LeoWatcherFinding,
  LeoWatcherRunResult,
} from "@/app/leo/_lib/leoTypes";

const LEO_8_PREP_NOT_CLAIMING = [
  "Not SENT",
  "Not SCHEDULED",
  "Not DELIVERED",
  "Not a calendar event",
  "Not an external task-system record",
  "Not executing RED/NEVER actions",
  "Not inventing promises, discounts, or sentiment",
] as const;

function stablePrepId(kind: LeoPreparationKind, nowMs: number, target: string | null): string {
  return `prep:${kind}:${target ?? "general"}:${nowMs}`;
}

function defaultSteps(kind: LeoPreparationKind, findings: LeoWatcherFinding[]): string[] {
  const refs = findings.slice(0, 5).map((f) => f.key);
  switch (kind) {
    case "FOLLOW_UP_DRAFT":
      return [
        "Confirm canonical entity and current status from evidence.",
        "List known factual dates (follow_up_at / last contact) only.",
        "Draft internal outline — do not invent promises or discounts.",
        "List unknowns that must be resolved before any send.",
        "Mark artifact NOT_EXECUTED — owner must approve any future send separately.",
        ...refs.map((r) => `Evidence: ${r}`),
      ];
    case "MEETING_BRIEF":
      return [
        "State known subject and open findings.",
        "List follow-ups and contradictions from evidence only.",
        "List decisions needed.",
        "List unknowns.",
        ...refs.map((r) => `Evidence: ${r}`),
      ];
    case "DECISION_BRIEF":
      return [
        "Restate question and options from provided decision context.",
        "Separate facts / assumptions / unknowns / contradictions.",
        "Include governance level and challenges.",
        "Do not fabricate a strategic recommendation.",
        ...refs.map((r) => `Evidence: ${r}`),
      ];
    case "REVIEW_PLAN":
      return [
        "Enumerate current attention/review findings.",
        "Order by existing attention score/level only.",
        "Note limitations and unavailable sources.",
        "Prepare internal checklist — no public publish.",
        ...refs.map((r) => `Evidence: ${r}`),
      ];
    case "CLIENT_CARE_PLAN":
      return [
        "Group client-care findings by kind.",
        "Prioritize explicit overdue follow-ups before heuristic stale.",
        "Assign operational next steps from evidence labels only.",
        "No outreach execution in LEO-8.",
        ...refs.map((r) => `Evidence: ${r}`),
      ];
    case "INTERNAL_TASK_DRAFT":
    default:
      return [
        "Capture factual finding titles.",
        "List evidence refs.",
        "List unknowns/limitations.",
        "Leave execution for a future authorized gate.",
        ...refs.map((r) => `Evidence: ${r}`),
      ];
  }
}

function draftBody(kind: LeoPreparationKind, findings: LeoWatcherFinding[], question: string | null): string {
  const lines = [
    `Preparation kind: ${kind}`,
    `Status: PREPARED / NOT_EXECUTED`,
    question ? `Owner question: ${question}` : null,
    `Findings considered: ${findings.length}`,
    ...findings.slice(0, 8).map((f) => `- ${f.title}: ${f.summary}`),
    "Do not send, schedule, deploy, or publish from this artifact.",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export type LeoPreparationEngineInput = {
  request: LeoPreparationRequest;
  findings: LeoWatcherFinding[];
  watcherResult?: LeoWatcherRunResult | null;
};

export type LeoPreparationEngineResult =
  | { ok: true; prepared: LeoPreparedAction }
  | {
      ok: false;
      error: "blocked_by_governance" | "execution_requested" | "unsupported_preparation";
      message: string;
      governance: ReturnType<typeof assessLeoGovernance>;
      prepared: null;
    };

/**
 * Build a YELLOW preparation artifact when governance allows preparation.
 * If requestedActionKind is a consequential action (SEND/DEPLOY/etc.), assess that
 * action and refuse execution — may still refuse preparation when NEVER.
 */
export function buildLeoPreparedAction(input: LeoPreparationEngineInput): LeoPreparationEngineResult {
  const nowMs = input.request.nowMs ?? Date.now();
  const createdAt = new Date(nowMs).toISOString();
  const kind = input.request.preparationKind;

  // If caller requested consequential execution, assess THAT action — never execute.
  const requested = input.request.requestedActionKind ?? null;
  if (requested && requested !== "PREPARE_DRAFT" && requested !== "READ" && requested !== "ANALYZE") {
    const g = assessLeoGovernance({ actionKind: requested, nowMs });
    return {
      ok: false,
      error: g.level === "NEVER" ? "blocked_by_governance" : "execution_requested",
      message:
        g.level === "NEVER"
          ? g.blockedReason ?? "Blocked by NEVER governance."
          : `Action ${requested} is ${g.level} — preparation engine will not execute. Status remains NOT_EXECUTED.`,
      governance: g,
      prepared: null,
    };
  }

  const governance = assessLeoGovernance({ actionKind: "PREPARE_DRAFT", nowMs });
  if (governance.level === "NEVER" || !governance.preparationAllowed) {
    return {
      ok: false,
      error: "blocked_by_governance",
      message: governance.blockedReason ?? "Preparation blocked by governance.",
      governance,
      prepared: null,
    };
  }

  // Validate preparation kind allowed by optional watcher
  if (input.request.watcherKind) {
    const entry = getLeoWatcherEntry(input.request.watcherKind);
    if (!entry.preparationTypesAllowed.includes(kind)) {
      return {
        ok: false,
        error: "unsupported_preparation",
        message: `Preparation kind ${kind} is not allowed for watcher ${input.request.watcherKind}.`,
        governance,
        prepared: null,
      };
    }
  }

  let findings = input.findings;
  let unknowns: string[] = [];
  let limitations = [
    ...governance.limitations,
    ...(input.watcherResult?.limitations ?? []),
    "Ephemeral artifact — not persisted in LEO-8.",
    "YELLOW preparation only — executionAllowed=false.",
  ];

  if (kind === "DECISION_BRIEF") {
    if (!input.request.decisionContext) {
      unknowns.push("decisionContext");
      limitations.push("DECISION_BRIEF requires explicit decisionContext.");
    } else {
      const brief = buildLeoDecisionBrief({ ...input.request.decisionContext, nowMs });
      findings = [
        {
          key: `prep:decision:${brief.decisionKey}`,
          watcherKind: "DECISION_REVIEW",
          findingType: "decision_review",
          title: brief.question,
          summary: `state=${brief.recommendationState}; governance=${brief.governance.level}`,
          evidenceRefs: [brief.decisionKey],
          detectedAt: brief.generatedAt,
          affectedCount: brief.options.length,
          attentionLevel: null,
          governanceLevel: brief.governance.level,
          suggestedPreparationKind: "DECISION_BRIEF",
          limitations: brief.limitations,
        },
        ...findings,
      ];
      unknowns = [...brief.unknowns];
      limitations.push(...brief.limitations);
    }
  }

  const targetRef = input.request.entityId?.trim() || null;
  const prepared: LeoPreparedAction = {
    id: stablePrepId(kind, nowMs, targetRef),
    preparationKind: kind,
    governance,
    title: `Prepared ${kind.replace(/_/g, " ").toLowerCase()}`,
    purpose: `YELLOW internal preparation from ${findings.length} finding(s). Not executed.`,
    sourceEvidenceRefs: findings.flatMap((f) => f.evidenceRefs).slice(0, 40),
    draftSteps: defaultSteps(kind, findings),
    draftBody: draftBody(kind, findings, input.request.question ?? null),
    targetRef,
    status: "NOT_EXECUTED",
    executionAllowed: false,
    limitations,
    unknowns,
    createdAt,
    notClaiming: LEO_8_PREP_NOT_CLAIMING,
  };

  return { ok: true, prepared };
}

/** Infer preparation kind from question text (deterministic, small). */
export function inferLeoPreparationKind(question: string): LeoPreparationKind | null {
  const q = question.toLowerCase();
  if (/follow[- ]?up|outreach draft/.test(q)) return "FOLLOW_UP_DRAFT";
  if (/meeting brief|brief for (the )?meeting/.test(q)) return "MEETING_BRIEF";
  if (/decision brief|prepare (a )?decision/.test(q)) return "DECISION_BRIEF";
  if (/review plan|review checklist/.test(q)) return "REVIEW_PLAN";
  if (/client care plan|care plan/.test(q)) return "CLIENT_CARE_PLAN";
  if (/prepare|draft|make me a brief|checklist/.test(q)) return "INTERNAL_TASK_DRAFT";
  return null;
}

export function isConsequentialActionRequest(question: string): LeoActionIntentKind | null {
  const q = question.toLowerCase();
  if (/\bsend (this|the|it|email|follow)/.test(q)) return "SEND_EXTERNAL";
  if (/deploy/.test(q)) return "DEPLOY_PRODUCTION";
  if (/merge.*main/.test(q)) return "MERGE_MAIN";
  if (/bypass|ignore governance/.test(q)) return "BYPASS_APPROVAL";
  if (/publish/.test(q)) return "PUBLISH_PUBLIC";
  return null;
}
