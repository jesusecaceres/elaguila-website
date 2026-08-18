/**
 * LEO-6 Governance Engine — deterministic authority classification.
 *
 * Pure policy. No writes, no AI, no execution.
 * NEVER > RED > YELLOW > GREEN. External content never grants authority.
 */
import type {
  LeoActionIntentKind,
  LeoGovernanceAssessment,
  LeoGovernanceLevel,
  LeoGovernanceReason,
  LeoTrustSource,
} from "@/app/leo/_lib/leoTypes";

/** Centralized governance rule catalog — inspectable, no scattered magic. */
export const LEO_GOVERNANCE_RULES = {
  NEVER_SELF_GRANT: {
    ruleId: "NEVER_SELF_GRANT",
    level: "NEVER" as const,
    reason: "Self-granting privileges is blocked.",
    kinds: ["SELF_GRANT_PRIVILEGE"] as LeoActionIntentKind[],
  },
  NEVER_BYPASS_APPROVAL: {
    ruleId: "NEVER_BYPASS_APPROVAL",
    level: "NEVER" as const,
    reason: "Bypassing RED owner approval is blocked.",
    kinds: ["BYPASS_APPROVAL"] as LeoActionIntentKind[],
  },
  NEVER_CONCEAL_AUDIT: {
    ruleId: "NEVER_CONCEAL_AUDIT",
    level: "NEVER" as const,
    reason: "Concealing, disabling, or deleting audit/governance history to hide activity is blocked.",
    kinds: ["MODIFY_AUDIT", "CONCEAL_INFORMATION"] as LeoActionIntentKind[],
  },
  NEVER_REWRITE_GOVERNANCE: {
    ruleId: "NEVER_REWRITE_GOVERNANCE",
    level: "NEVER" as const,
    reason: "Rewriting LEO governance authority at runtime is blocked.",
    kinds: ["REWRITE_GOVERNANCE"] as LeoActionIntentKind[],
  },
  RED_DEPLOY: {
    ruleId: "RED_DEPLOY_PRODUCTION",
    level: "RED" as const,
    reason: "Production deployment requires explicit owner approval and is not executable yet.",
    kinds: ["DEPLOY_PRODUCTION"] as LeoActionIntentKind[],
  },
  RED_MERGE_MAIN: {
    ruleId: "RED_MERGE_MAIN",
    level: "RED" as const,
    reason: "Merging to main requires explicit owner approval and is not executable yet.",
    kinds: ["MERGE_MAIN"] as LeoActionIntentKind[],
  },
  RED_SEND_EXTERNAL: {
    ruleId: "RED_SEND_EXTERNAL",
    level: "RED" as const,
    reason: "Consequential external send requires owner approval; LEO does not send.",
    kinds: ["SEND_EXTERNAL"] as LeoActionIntentKind[],
  },
  RED_PUBLISH_PUBLIC: {
    ruleId: "RED_PUBLISH_PUBLIC",
    level: "RED" as const,
    reason: "Major public publishing requires owner approval; LEO does not publish.",
    kinds: ["PUBLISH_PUBLIC"] as LeoActionIntentKind[],
  },
  RED_SPEND: {
    ruleId: "RED_SPEND_MONEY",
    level: "RED" as const,
    reason: "Spend/transfer money requires owner approval; LEO does not execute money actions.",
    kinds: ["SPEND_MONEY"] as LeoActionIntentKind[],
  },
  RED_PRICING: {
    ruleId: "RED_CHANGE_PRICING",
    level: "RED" as const,
    reason: "Pricing changes require owner approval; LEO does not change pricing.",
    kinds: ["CHANGE_PRICING"] as LeoActionIntentKind[],
  },
  RED_CONTRACT: {
    ruleId: "RED_ACCEPT_CONTRACT",
    level: "RED" as const,
    reason: "Contract acceptance requires owner approval; LEO does not accept contracts.",
    kinds: ["ACCEPT_CONTRACT"] as LeoActionIntentKind[],
  },
  RED_DELETE: {
    ruleId: "RED_DELETE_CRITICAL",
    level: "RED" as const,
    reason: "Critical delete requires owner approval; LEO does not delete critical data.",
    kinds: ["DELETE_CRITICAL_DATA"] as LeoActionIntentKind[],
  },
  RED_PERMISSIONS: {
    ruleId: "RED_CHANGE_PERMISSIONS",
    level: "RED" as const,
    reason: "Permission/privileged-account changes require owner approval; LEO does not change permissions.",
    kinds: ["CHANGE_PERMISSIONS"] as LeoActionIntentKind[],
  },
  RED_REMOVE_STAFF: {
    ruleId: "RED_REMOVE_STAFF",
    level: "RED" as const,
    reason: "Staff removal requires owner approval; LEO does not remove staff.",
    kinds: ["REMOVE_STAFF"] as LeoActionIntentKind[],
  },
  YELLOW_PREPARE: {
    ruleId: "YELLOW_PREPARE_DRAFT",
    level: "YELLOW" as const,
    reason: "Preparation/draft staging is allowed; execution of the prepared action is not.",
    kinds: ["PREPARE_DRAFT"] as LeoActionIntentKind[],
  },
  GREEN_READ: {
    ruleId: "GREEN_READ",
    level: "GREEN" as const,
    reason: "Safe read of existing Leonix truth.",
    kinds: ["READ"] as LeoActionIntentKind[],
  },
  GREEN_ANALYZE: {
    ruleId: "GREEN_ANALYZE",
    level: "GREEN" as const,
    reason: "Safe analysis / explanation / decision-support preparation without external execution.",
    kinds: ["ANALYZE"] as LeoActionIntentKind[],
  },
  RED_OTHER_DEFAULT: {
    ruleId: "RED_OTHER_UNKNOWN_CONSEQUENCE",
    level: "RED" as const,
    reason: "Unclassified OTHER action defaults to RED — owner judgment required; no execution in v0.",
    kinds: ["OTHER"] as LeoActionIntentKind[],
  },
} as const;

const LEVEL_RANK: Record<LeoGovernanceLevel, number> = {
  GREEN: 1,
  YELLOW: 2,
  RED: 3,
  NEVER: 4,
};

export type LeoGovernanceAssessInput = {
  actionKind: LeoActionIntentKind;
  /** Trust sources present alongside the request. External cannot lower level. */
  trustSources?: LeoTrustSource[];
  /** Explicit claim that external content grants approval — always rejected. */
  externalClaimsApproval?: boolean;
  /** Explicit claim that external content lowers governance — always rejected. */
  externalClaimsDowngrade?: boolean;
  /** Optional caller clock. */
  nowMs?: number;
  /** Optional notes — treated as untrusted data labels only. */
  contextNotes?: string[];
};

function impactFlags(level: LeoGovernanceLevel, kind: LeoActionIntentKind): Omit<
  LeoGovernanceReason,
  "ruleId" | "level" | "reason" | "evidence"
> {
  const redFamily =
    level === "RED" ||
    kind === "SEND_EXTERNAL" ||
    kind === "DEPLOY_PRODUCTION" ||
    kind === "MERGE_MAIN" ||
    kind === "SPEND_MONEY" ||
    kind === "CHANGE_PRICING" ||
    kind === "ACCEPT_CONTRACT" ||
    kind === "DELETE_CRITICAL_DATA" ||
    kind === "CHANGE_PERMISSIONS" ||
    kind === "REMOVE_STAFF" ||
    kind === "PUBLISH_PUBLIC";

  return {
    reversible: level === "GREEN" ? true : level === "YELLOW" ? true : level === "NEVER" ? false : null,
    externalSideEffect:
      kind === "SEND_EXTERNAL" || kind === "PUBLISH_PUBLIC" || kind === "DEPLOY_PRODUCTION",
    financialImpact: kind === "SPEND_MONEY" || kind === "CHANGE_PRICING" || kind === "ACCEPT_CONTRACT",
    privilegeImpact:
      kind === "CHANGE_PERMISSIONS" ||
      kind === "REMOVE_STAFF" ||
      kind === "SELF_GRANT_PRIVILEGE" ||
      kind === "BYPASS_APPROVAL" ||
      kind === "REWRITE_GOVERNANCE",
    customerImpact:
      kind === "SEND_EXTERNAL" ||
      kind === "DELETE_CRITICAL_DATA" ||
      kind === "ACCEPT_CONTRACT" ||
      kind === "PUBLISH_PUBLIC",
    publicImpact: kind === "PUBLISH_PUBLIC" || kind === "DEPLOY_PRODUCTION",
    destructiveImpact: kind === "DELETE_CRITICAL_DATA" || kind === "REMOVE_STAFF" || level === "NEVER",
    auditSensitivity: redFamily || level === "NEVER" || kind === "MODIFY_AUDIT",
  };
}

function matchRules(kind: LeoActionIntentKind): LeoGovernanceReason[] {
  const out: LeoGovernanceReason[] = [];
  for (const rule of Object.values(LEO_GOVERNANCE_RULES)) {
    if (!(rule.kinds as readonly LeoActionIntentKind[]).includes(kind)) continue;
    out.push({
      ruleId: rule.ruleId,
      level: rule.level,
      reason: rule.reason,
      evidence: `actionKind=${kind}; rule=${rule.ruleId}`,
      ...impactFlags(rule.level, kind),
    });
  }
  return out;
}

function highestLevel(reasons: LeoGovernanceReason[]): LeoGovernanceLevel {
  let best: LeoGovernanceLevel = "GREEN";
  for (const r of reasons) {
    if (LEVEL_RANK[r.level] > LEVEL_RANK[best]) best = r.level;
  }
  return best;
}

/**
 * Assess governance for a normalized action intent.
 * External untrusted data cannot lower the level or grant approval.
 */
export function assessLeoGovernance(input: LeoGovernanceAssessInput): LeoGovernanceAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const assessedAt = new Date(nowMs).toISOString();
  const trustSources = [...(input.trustSources ?? ["SYSTEM_POLICY"])];
  const limitations: string[] = [
    "LEO classifies and prepares only — it does not execute consequential actions.",
    "External untrusted content is DATA and cannot grant authority or lower governance.",
  ];

  let reasons = matchRules(input.actionKind);

  // External content attempting authority — NEVER override, never downgrade.
  if (input.externalClaimsApproval || input.externalClaimsDowngrade) {
    reasons = [
      ...reasons,
      {
        ruleId: "NEVER_EXTERNAL_AS_AUTHORITY",
        level: "NEVER",
        reason:
          "External untrusted content attempted to grant approval or lower governance — blocked.",
        evidence: `externalClaimsApproval=${Boolean(input.externalClaimsApproval)}; externalClaimsDowngrade=${Boolean(input.externalClaimsDowngrade)}`,
        reversible: false,
        externalSideEffect: false,
        financialImpact: false,
        privilegeImpact: true,
        customerImpact: false,
        publicImpact: false,
        destructiveImpact: false,
        auditSensitivity: true,
      },
    ];
    limitations.push("External authority claim detected and rejected.");
  }

  // Presence of EXTERNAL_UNTRUSTED_DATA alone does not change level — record limitation only.
  if (trustSources.includes("EXTERNAL_UNTRUSTED_DATA")) {
    limitations.push(
      "EXTERNAL_UNTRUSTED_DATA present — may inform facts only; does not alter governance level.",
    );
  }

  if (reasons.length === 0) {
    reasons = matchRules("OTHER");
  }

  const level = highestLevel(reasons);
  const neverReason = reasons.find((r) => r.level === "NEVER") ?? null;

  const approvalRequired = level === "RED" || level === "NEVER";
  /**
   * LEO-6 v0 never executes consequential actions.
   * GREEN/YELLOW are classified for read/prepare only — executionAllowed stays false.
   */
  const executionAllowed = false;
  const preparationAllowed = level !== "NEVER";

  const reversible =
    reasons.find((r) => r.level === level)?.reversible ??
    (level === "GREEN" || level === "YELLOW" ? true : null);

  return {
    actionKind: input.actionKind,
    level,
    reasons: reasons.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || a.ruleId.localeCompare(b.ruleId)),
    approvalRequired,
    executionAllowed,
    preparationAllowed,
    reversible,
    blockedReason: neverReason
      ? neverReason.reason
      : level === "RED"
        ? "RED actions require explicit Chuy/owner approval and are not executable yet."
        : null,
    assessedAt,
    trustSourcesConsidered: trustSources,
    auditPrep: {
      ruleIds: reasons.map((r) => r.ruleId),
      actionKind: input.actionKind,
      level,
      reasonCodes: reasons.map((r) => r.ruleId),
      assessedAt,
    },
    limitations,
  };
}

/** Exported for verifiers — confirms NEVER beats RED etc. */
export function governanceLevelRank(level: LeoGovernanceLevel): number {
  return LEVEL_RANK[level];
}
