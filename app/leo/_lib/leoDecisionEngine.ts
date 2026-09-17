/**
 * LEO-6 Decision Engine — deterministic decision briefs + challenge structure.
 *
 * No LLM. No fabricated strategic recommendations. No Living Book writes.
 */
import { assessLeoGovernance } from "@/app/leo/_lib/leoGovernanceEngine";
import type {
  LeoCreateMemoryInput,
  LeoDecisionBrief,
  LeoDecisionChallenge,
  LeoDecisionContext,
  LeoDecisionRecommendationState,
} from "@/app/leo/_lib/leoTypes";

const LEO_6_NOT_CLAIMING = [
  "Not inventing market, competitor, legal, or sentiment data",
  "Not fabricating a strategic recommendation without explicit support",
  "Not executing the decision",
  "Not auto-writing Living Book ACTIVE_DECISION memory",
] as const;

function buildChallenges(ctx: LeoDecisionContext): LeoDecisionChallenge[] {
  const challenges: LeoDecisionChallenge[] = [];

  for (const unknown of ctx.unknowns) {
    challenges.push({
      category: "missing_evidence",
      statement: "Evidence gap must be considered before committing.",
      evidence: `unknown=${unknown}`,
    });
  }

  for (const assumption of ctx.assumptions) {
    challenges.push({
      category: "unsupported_assumption",
      statement: "Assumption is labeled and not proven as fact.",
      evidence: `assumption=${assumption}`,
    });
  }

  for (const contradiction of ctx.contradictions) {
    challenges.push({
      category: "unresolved_contradiction",
      statement: "Unresolved contradiction exists in provided context.",
      evidence: `contradiction=${contradiction}`,
    });
  }

  for (const opt of ctx.options) {
    if (opt.irreversible === true) {
      challenges.push({
        category: "irreversible_consequence",
        statement: "Option is marked irreversible — explicit owner consideration required.",
        evidence: `optionId=${opt.id}; irreversible=true`,
      });
    }
    if (opt.financialExposure === true) {
      challenges.push({
        category: "financial_exposure",
        statement: "Option carries explicit financial exposure flag.",
        evidence: `optionId=${opt.id}; financialExposure=true`,
      });
    }
    if (opt.customerImpact === true) {
      challenges.push({
        category: "customer_impact",
        statement: "Option carries explicit customer-impact flag.",
        evidence: `optionId=${opt.id}; customerImpact=true`,
      });
    }
  }

  if (ctx.reversible === false) {
    challenges.push({
      category: "irreversible_consequence",
      statement: "Decision context marks overall reversibility as false.",
      evidence: "context.reversible=false",
    });
  }

  if (ctx.deadlineAt) {
    challenges.push({
      category: "deadline_dependency",
      statement: "An explicit deadline was provided and must be weighed.",
      evidence: `deadlineAt=${ctx.deadlineAt}`,
    });
  }

  if (ctx.ownerRequiredHint === true || ctx.options.some((o) => o.requiresOwnerApproval === true)) {
    challenges.push({
      category: "governance_dependency",
      statement: "Owner approval dependency is indicated by provided context.",
      evidence: "ownerRequiredHint or option.requiresOwnerApproval",
    });
  }

  if (ctx.risks.some((r) => /operational|dependency/i.test(r))) {
    for (const r of ctx.risks) {
      if (/operational|dependency/i.test(r)) {
        challenges.push({
          category: "operational_dependency",
          statement: "Operational dependency risk was explicitly provided.",
          evidence: `risk=${r}`,
        });
      }
    }
  }

  // Deterministic order
  return challenges.sort(
    (a, b) => a.category.localeCompare(b.category) || a.evidence.localeCompare(b.evidence),
  );
}

function resolveRecommendation(
  ctx: LeoDecisionContext,
  governanceLevel: string,
): {
  state: LeoDecisionRecommendationState;
  supportedOptionId: string | null;
  ownerDecisionRequired: boolean;
} {
  if (governanceLevel === "NEVER") {
    return { state: "BLOCKED_BY_GOVERNANCE", supportedOptionId: null, ownerDecisionRequired: true };
  }
  if (governanceLevel === "RED") {
    return { state: "OWNER_JUDGMENT_REQUIRED", supportedOptionId: null, ownerDecisionRequired: true };
  }

  const supportedId = ctx.explicitlySupportedOptionId?.trim() || null;
  if (supportedId) {
    const exists = ctx.options.some((o) => o.id === supportedId);
    if (exists && ctx.unknowns.length === 0 && ctx.contradictions.length === 0) {
      return {
        state: "SUPPORTED_OPTION",
        supportedOptionId: supportedId,
        ownerDecisionRequired: ctx.ownerRequiredHint === true,
      };
    }
  }

  if (ctx.unknowns.length > 0 || ctx.facts.length === 0) {
    return { state: "INSUFFICIENT_EVIDENCE", supportedOptionId: null, ownerDecisionRequired: true };
  }

  return { state: "OWNER_JUDGMENT_REQUIRED", supportedOptionId: null, ownerDecisionRequired: true };
}

/**
 * Build an executive decision brief from explicit structured context.
 */
export function buildLeoDecisionBrief(ctx: LeoDecisionContext): LeoDecisionBrief {
  const nowMs = ctx.nowMs ?? Date.now();
  const generatedAt = new Date(nowMs).toISOString();
  const actionKind = ctx.actionKind ?? "ANALYZE";
  const trustSources = ctx.trustSources ?? ["SYSTEM_POLICY", "TRUSTED_INTERNAL_STATE"];

  const governance = assessLeoGovernance({
    actionKind,
    trustSources,
    nowMs,
  });

  const challenges = buildChallenges(ctx);
  const rec = resolveRecommendation(ctx, governance.level);

  const limitations = [
    ...governance.limitations,
    "Decision brief separates facts, assumptions, unknowns, and contradictions as provided — nothing invented.",
    "Challenge items are derived only from provided context flags and lists.",
  ];

  return {
    decisionKey: ctx.decisionKey,
    question: ctx.question,
    options: [...ctx.options],
    facts: [...ctx.facts],
    assumptions: [...ctx.assumptions],
    unknowns: [...ctx.unknowns],
    contradictions: [...ctx.contradictions],
    risks: [...ctx.risks],
    challenges,
    reversible: ctx.reversible,
    governance,
    recommendationState: rec.state,
    supportedOptionId: rec.supportedOptionId,
    ownerDecisionRequired: rec.ownerDecisionRequired || governance.approvalRequired,
    limitations,
    generatedAt,
    notClaiming: LEO_6_NOT_CLAIMING,
  };
}

/**
 * Prepare a Living Book memory input for an ACTIVE_DECISION — does NOT write.
 * Owner must call Living Book service separately to persist.
 */
export function prepareLeoDecisionMemoryInput(
  brief: LeoDecisionBrief,
  subjectKey: string,
): LeoCreateMemoryInput {
  return {
    epistemicType: "active_decision",
    subject: {
      subjectType: "decision",
      subjectKey,
    },
    statement: `Decision brief prepared: ${brief.decisionKey} — ${brief.question}`,
    confidence: "medium",
    status: "draft",
    source: {
      system: "leo",
      actorType: "leo",
      reference: {
        decisionKey: brief.decisionKey,
        recommendationState: brief.recommendationState,
        governanceLevel: brief.governance.level,
        preparedOnly: true,
      },
    },
    evidence: [
      {
        kind: "decision_brief",
        id: brief.decisionKey,
        summary: `governance=${brief.governance.level}; recommendation=${brief.recommendationState}`,
        system: "leo",
      },
    ],
  };
}
