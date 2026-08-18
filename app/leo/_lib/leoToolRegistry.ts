/**
 * LEO-11 Universal Tool Registry — canonical static catalog.
 * Server-owned. Client/AI/external content cannot register tools.
 * No dynamic eval. No arbitrary module loading.
 */
import type {
  LeoToolAvailability,
  LeoToolDefinition,
  LeoToolId,
  LeoToolOperationMode,
} from "@/app/leo/_lib/leoTypes";

/** Allowlisted Leonix repository for GitHub reads. */
export const LEO_GITHUB_ALLOWED_REPO = {
  owner: "jesusecaceres",
  name: "elaguila-website",
  fullName: "jesusecaceres/elaguila-website",
} as const;

/** Allowlisted Vercel project identity. */
export const LEO_VERCEL_ALLOWED_PROJECT = {
  name: "leonix-media",
} as const;

export const LEO_PROJECT_BOUNDS = {
  maxRecentCommits: 10,
  maxRecentDeployments: 10,
  fetchTimeoutMs: 12_000,
} as const;

const INTERNAL_LIMITATIONS = [
  "Read/analyze/prepare only in LEO-11 — no consequential writes or external effects.",
  "Tool definitions never contain secrets.",
] as const;

function def(
  partial: Omit<LeoToolDefinition, "ownerOnly" | "serverOnly" | "supportsExecution"> & {
    supportsExecution?: false;
  },
): LeoToolDefinition {
  return {
    ...partial,
    ownerOnly: true,
    serverOnly: true,
    supportsExecution: false,
  };
}

/**
 * Immutable static registry. Runtime availability for project tools is resolved
 * by getLeoToolCatalog() — missing credentials become NOT_CONFIGURED.
 */
export const LEO_TOOL_REGISTRY: Record<LeoToolId, LeoToolDefinition> = {
  "leo.attention.read": def({
    id: "leo.attention.read",
    name: "Attention brief",
    description: "Read the current executive attention brief from Leonix evidence.",
    category: "EXECUTIVE_INTELLIGENCE",
    operationModes: ["READ"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "READ",
    readScopes: ["attention_brief"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: false,
    evidenceRequirements: ["admin_executive_truth", "optional_client_care"],
    limitations: [...INTERNAL_LIMITATIONS],
    verified: true,
    version: "11.0.0",
  }),
  "leo.clientCare.read": def({
    id: "leo.clientCare.read",
    name: "Client Care watch",
    description: "Read who is waiting / follow-up signals from bounded care sources.",
    category: "CUSTOMER_CARE",
    operationModes: ["READ"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "READ",
    readScopes: ["client_care_signals"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: false,
    evidenceRequirements: ["client_care_leads", "support_tickets"],
    limitations: [...INTERNAL_LIMITATIONS, "Does not send outreach."],
    verified: true,
    version: "11.0.0",
  }),
  "leo.reasonChain.read": def({
    id: "leo.reasonChain.read",
    name: "Listing reason chain",
    description: "Explain why a listing is flagged using persisted evidence only.",
    category: "EXECUTIVE_INTELLIGENCE",
    operationModes: ["READ"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "READ",
    readScopes: ["listing_reason_chain"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: false,
    evidenceRequirements: ["listing_id"],
    limitations: [...INTERNAL_LIMITATIONS, "Will not invent missing flag reasons."],
    verified: true,
    version: "11.0.0",
  }),
  "leo.memory.read": def({
    id: "leo.memory.read",
    name: "Living Book memory",
    description: "Read explicitly recorded Living Leonix Book records.",
    category: "MEMORY",
    operationModes: ["READ"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "READ",
    readScopes: ["leo_memory_records"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: false,
    evidenceRequirements: ["memory_subject_or_recent"],
    limitations: [...INTERNAL_LIMITATIONS, "Never invents memory."],
    verified: true,
    version: "11.0.0",
  }),
  "leo.decision.analyze": def({
    id: "leo.decision.analyze",
    name: "Decision support",
    description: "Analyze a structured decision context with challenges — no execution.",
    category: "DECISION",
    operationModes: ["ANALYZE"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "ANALYZE",
    readScopes: ["decision_brief"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: true,
    evidenceRequirements: ["decision_context"],
    limitations: [...INTERNAL_LIMITATIONS],
    verified: true,
    version: "11.0.0",
  }),
  "leo.watcher.run": def({
    id: "leo.watcher.run",
    name: "On-demand watcher",
    description: "Run a registered on-demand watcher over current Leonix evidence.",
    category: "EXECUTIVE_INTELLIGENCE",
    operationModes: ["ANALYZE"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "ANALYZE",
    readScopes: ["watcher_findings"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: false,
    evidenceRequirements: ["watcher_kind"],
    limitations: [...INTERNAL_LIMITATIONS, "Not background monitoring."],
    verified: true,
    version: "11.0.0",
  }),
  "leo.preparation.prepare": def({
    id: "leo.preparation.prepare",
    name: "Preparation drafts",
    description: "Prepare YELLOW draft artifacts (follow-up, briefs, plans) — not executed.",
    category: "PREPARATION",
    operationModes: ["PREPARE"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "PREPARE_DRAFT",
    readScopes: ["preparation_evidence"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: true,
    evidenceRequirements: ["preparation_kind"],
    limitations: [...INTERNAL_LIMITATIONS, "Prepared work remains NOT_EXECUTED."],
    verified: true,
    version: "11.0.0",
  }),
  "leo.capabilities.read": def({
    id: "leo.capabilities.read",
    name: "Tool catalog",
    description: "List LEO tools with truthful availability and governance modes.",
    category: "EXECUTIVE_INTELLIGENCE",
    operationModes: ["READ"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "READ",
    readScopes: ["tool_catalog"],
    writeScopes: [],
    externalSystem: "NONE",
    supportsPreparation: false,
    evidenceRequirements: [],
    limitations: [...INTERNAL_LIMITATIONS],
    verified: true,
    version: "11.0.0",
  }),
  "leo.adminCapabilities.read": def({
    id: "leo.adminCapabilities.read",
    name: "Admin action capabilities",
    description:
      "Read Admin OS action registry status/risk truth. Does not execute Admin actions.",
    category: "ADMIN_OPERATIONS",
    operationModes: ["READ"],
    availability: "AVAILABLE",
    requiredGovernanceAction: "READ",
    readScopes: ["admin_os_action_registry"],
    writeScopes: [],
    externalSystem: "ADMIN_OS",
    supportsPreparation: false,
    evidenceRequirements: [],
    limitations: [
      ...INTERNAL_LIMITATIONS,
      "Admin registry remains canonical — LEO does not execute these actions.",
      "PLANNED / NEEDS LIVE PROOF statuses are not treated as fully operational.",
    ],
    verified: true,
    version: "11.0.0",
  }),
  "leo.project.github.read": def({
    id: "leo.project.github.read",
    name: "GitHub project read",
    description: "Read allowlisted Leonix repository/branch/commit metadata.",
    category: "PROJECT_INTELLIGENCE",
    operationModes: ["READ"],
    availability: "NOT_CONFIGURED",
    requiredGovernanceAction: "READ",
    readScopes: ["github_repo_meta", "github_commits"],
    writeScopes: [],
    externalSystem: "GITHUB",
    supportsPreparation: false,
    evidenceRequirements: ["LEO_GITHUB_TOKEN"],
    limitations: [
      ...INTERNAL_LIMITATIONS,
      "Allowlisted repo only: jesusecaceres/elaguila-website.",
      "No GitHub writes (branch/commit/PR/issue).",
    ],
    verified: false,
    version: "11.0.0",
  }),
  "leo.project.vercel.read": def({
    id: "leo.project.vercel.read",
    name: "Vercel project read",
    description: "Read allowlisted Vercel project deployment metadata.",
    category: "PROJECT_INTELLIGENCE",
    operationModes: ["READ"],
    availability: "NOT_CONFIGURED",
    requiredGovernanceAction: "READ",
    readScopes: ["vercel_deployments"],
    writeScopes: [],
    externalSystem: "VERCEL",
    supportsPreparation: false,
    evidenceRequirements: ["LEO_VERCEL_TOKEN"],
    limitations: [
      ...INTERNAL_LIMITATIONS,
      "Allowlisted project: leonix-media.",
      "READY means platform deployment state — not full application health.",
      "No deploy/redeploy/promote/rollback/env writes.",
    ],
    verified: false,
    version: "11.0.0",
  }),
  "leo.project.snapshot.read": def({
    id: "leo.project.snapshot.read",
    name: "Project intelligence snapshot",
    description: "Combine GitHub + Vercel evidence with exact SHA correlation when available.",
    category: "PROJECT_INTELLIGENCE",
    operationModes: ["READ"],
    availability: "NOT_CONFIGURED",
    requiredGovernanceAction: "READ",
    readScopes: ["project_snapshot"],
    writeScopes: [],
    externalSystem: null,
    supportsPreparation: false,
    evidenceRequirements: ["github_and_or_vercel"],
    limitations: [
      ...INTERNAL_LIMITATIONS,
      "Does not claim site/database/system health from deployment READY alone.",
    ],
    verified: false,
    version: "11.0.0",
  }),
};

export function isLeoToolId(v: unknown): v is LeoToolId {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(LEO_TOOL_REGISTRY, v);
}

export function getLeoToolDefinition(toolId: string): LeoToolDefinition | null {
  if (!isLeoToolId(toolId)) return null;
  return LEO_TOOL_REGISTRY[toolId];
}

export function listLeoToolDefinitions(): LeoToolDefinition[] {
  return Object.values(LEO_TOOL_REGISTRY);
}

export function toolSupportsOperation(
  defn: LeoToolDefinition,
  operation: LeoToolOperationMode,
): boolean {
  return defn.operationModes.includes(operation);
}

/** Map operation mode → governance action kind for assessment. */
export function governanceActionForOperation(
  defn: LeoToolDefinition,
  operation: LeoToolOperationMode,
): LeoToolDefinition["requiredGovernanceAction"] {
  if (operation === "PREPARE") return "PREPARE_DRAFT";
  if (operation === "WRITE" || operation === "EXECUTE") {
    // Fail closed: consequential modes require explicit write/execute kinds — use OTHER so
    // governance stays non-GREEN unless a future tool declares a safer mapped kind.
    return "OTHER";
  }
  if (operation === "ANALYZE") return "ANALYZE";
  return defn.requiredGovernanceAction === "PREPARE_DRAFT" ? "READ" : defn.requiredGovernanceAction;
}

export function isInvokableAvailability(a: LeoToolAvailability): boolean {
  return a === "AVAILABLE" || a === "PARTIAL";
}

export type LeoToolGateResult =
  | {
      ok: true;
      toolId: LeoToolId;
      operation: LeoToolOperationMode;
      governanceAction: LeoToolDefinition["requiredGovernanceAction"];
    }
  | {
      ok: false;
      errorCode:
        | "UNKNOWN_TOOL"
        | "UNSUPPORTED_OPERATION"
        | "WRITE_EXECUTE_BLOCKED"
        | "TOOL_UNAVAILABLE"
        | "NOT_CONFIGURED";
      toolId: string;
      operation: LeoToolOperationMode;
    };

/**
 * Pure pre-invocation gate — registry membership, operation, availability.
 * Does not call adapters. Used by service + verifiers.
 */
export function evaluateLeoToolRequestGate(input: {
  toolId: string;
  operation: LeoToolOperationMode;
  runtimeAvailability?: LeoToolAvailability;
}): LeoToolGateResult {
  if (!isLeoToolId(input.toolId)) {
    return {
      ok: false,
      errorCode: "UNKNOWN_TOOL",
      toolId: input.toolId,
      operation: input.operation,
    };
  }
  const defn = LEO_TOOL_REGISTRY[input.toolId];
  if (input.operation === "WRITE" || input.operation === "EXECUTE") {
    return {
      ok: false,
      errorCode: "WRITE_EXECUTE_BLOCKED",
      toolId: input.toolId,
      operation: input.operation,
    };
  }
  if (!toolSupportsOperation(defn, input.operation)) {
    return {
      ok: false,
      errorCode: "UNSUPPORTED_OPERATION",
      toolId: input.toolId,
      operation: input.operation,
    };
  }
  const availability = input.runtimeAvailability ?? defn.availability;
  if (availability === "NOT_CONFIGURED") {
    return {
      ok: false,
      errorCode: "NOT_CONFIGURED",
      toolId: input.toolId,
      operation: input.operation,
    };
  }
  if (!isInvokableAvailability(availability)) {
    return {
      ok: false,
      errorCode: "TOOL_UNAVAILABLE",
      toolId: input.toolId,
      operation: input.operation,
    };
  }
  return {
    ok: true,
    toolId: input.toolId,
    operation: input.operation,
    governanceAction: governanceActionForOperation(defn, input.operation),
  };
}

