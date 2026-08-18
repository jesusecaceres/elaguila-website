/**
 * LEO-11 Tool Invocation Service — owner access, registry, governance, receipts.
 * AI cannot invoke arbitrary tools. No eval/shell. No external writes in v0.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { assessLeoGovernance } from "@/app/leo/_lib/leoGovernanceEngine";
import { invokeLeoToolAdapter } from "@/app/leo/_lib/leoToolAdapters";
import { getLeoToolCatalog } from "@/app/leo/_lib/leoToolCatalog";
import {
  evaluateLeoToolRequestGate,
  getLeoToolDefinition,
  governanceActionForOperation,
  isLeoToolId,
} from "@/app/leo/_lib/leoToolRegistry";
import { isLeoGithubConfigured, isLeoVercelConfigured } from "@/app/leo/_lib/leoProjectConfig";
import type {
  LeoToolAvailability,
  LeoToolInvocationRequest,
  LeoToolOperationMode,
  LeoToolReceipt,
  LeoToolResult,
} from "@/app/leo/_lib/leoTypes";

function projectToolsRuntimeAvailability(): {
  github: LeoToolAvailability;
  vercel: LeoToolAvailability;
  snapshot: LeoToolAvailability;
} {
  const github = isLeoGithubConfigured() ? "AVAILABLE" : "NOT_CONFIGURED";
  const vercel = isLeoVercelConfigured() ? "AVAILABLE" : "NOT_CONFIGURED";
  const snapshot =
    github === "AVAILABLE" || vercel === "AVAILABLE" ? "AVAILABLE" : "NOT_CONFIGURED";
  return { github, vercel, snapshot };
}

function receiptId(nowMs: number): string {
  return `leo-tool-${nowMs.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function runtimeAvailabilityFor(toolId: string): LeoToolAvailability {
  const defn = getLeoToolDefinition(toolId);
  if (!defn) return "UNAVAILABLE";
  const project = projectToolsRuntimeAvailability();
  if (toolId === "leo.project.github.read") return project.github;
  if (toolId === "leo.project.vercel.read") return project.vercel;
  if (toolId === "leo.project.snapshot.read") return project.snapshot;
  return defn.availability;
}

function makeReceipt(args: {
  toolId: string;
  operation: LeoToolOperationMode;
  governanceLevel: LeoToolReceipt["governanceLevel"];
  startedAt: string;
  completedAt: string;
  status: LeoToolReceipt["status"];
  evidenceCount: number;
  limitations: string[];
  errorCode?: string | null;
}): LeoToolReceipt {
  return {
    receiptId: receiptId(Date.parse(args.startedAt) || Date.now()),
    toolId: args.toolId,
    requestedOperation: args.operation,
    governanceLevel: args.governanceLevel,
    startedAt: args.startedAt,
    completedAt: args.completedAt,
    status: args.status,
    evidenceCount: args.evidenceCount,
    writePerformed: false,
    externalEffectPerformed: false,
    limitations: args.limitations,
    errorCode: args.errorCode ?? null,
  };
}

function blockedResult(args: {
  toolId: string;
  operation: LeoToolOperationMode;
  availability: LeoToolAvailability;
  summary: string;
  errorCode: string;
  nowMs: number;
  governanceAction?: Parameters<typeof assessLeoGovernance>[0]["actionKind"];
  limitations?: string[];
}): LeoToolResult {
  const startedAt = new Date(args.nowMs).toISOString();
  const governance = assessLeoGovernance({
    actionKind: args.governanceAction ?? "OTHER",
    nowMs: args.nowMs,
  });
  const completedAt = new Date(args.nowMs).toISOString();
  return {
    ok: false,
    toolId: args.toolId,
    operation: args.operation,
    availability: args.availability,
    governance,
    receipt: makeReceipt({
      toolId: args.toolId,
      operation: args.operation,
      governanceLevel: governance.level,
      startedAt,
      completedAt,
      status: args.availability === "NOT_CONFIGURED" ? "UNAVAILABLE" : "BLOCKED",
      evidenceCount: 0,
      limitations: args.limitations ?? [args.summary],
      errorCode: args.errorCode,
    }),
    summary: args.summary,
    evidence: [],
    data: null,
    unknowns: [],
    limitations: args.limitations ?? [args.summary],
  };
}

/**
 * Invoke a registered LEO tool under owner access + deterministic governance.
 */
export async function invokeLeoTool(
  request: LeoToolInvocationRequest,
): Promise<LeoToolResult> {
  await requireLeoOwnerAccess();
  const nowMs = request.nowMs ?? Date.now();
  const startedAt = new Date(nowMs).toISOString();
  const operation = request.operation;
  const toolIdRaw = request.toolId;
  const availability = isLeoToolId(toolIdRaw)
    ? runtimeAvailabilityFor(toolIdRaw)
    : ("UNAVAILABLE" as LeoToolAvailability);

  const gate = evaluateLeoToolRequestGate({
    toolId: toolIdRaw,
    operation,
    runtimeAvailability: isLeoToolId(toolIdRaw) ? availability : undefined,
  });

  if (!gate.ok) {
    return blockedResult({
      toolId: toolIdRaw,
      operation,
      availability,
      summary:
        gate.errorCode === "UNKNOWN_TOOL"
          ? `Unknown tool '${toolIdRaw}' — not in LEO registry.`
          : gate.errorCode === "UNSUPPORTED_OPERATION"
            ? `Operation ${operation} is not supported by tool ${toolIdRaw}.`
            : gate.errorCode === "WRITE_EXECUTE_BLOCKED"
              ? "WRITE/EXECUTE tool operations are blocked in this gate."
              : gate.errorCode === "NOT_CONFIGURED"
                ? `Tool ${toolIdRaw} is not configured in this environment.`
                : `Tool ${toolIdRaw} is unavailable.`,
      errorCode: gate.errorCode,
      nowMs,
      governanceAction:
        gate.errorCode === "WRITE_EXECUTE_BLOCKED"
          ? "OTHER"
          : getLeoToolDefinition(toolIdRaw)
            ? governanceActionForOperation(getLeoToolDefinition(toolIdRaw)!, operation)
            : "OTHER",
      limitations:
        gate.errorCode === "WRITE_EXECUTE_BLOCKED"
          ? [
              "LEO-11 does not perform WRITE/EXECUTE tool operations.",
              "No writePerformed. No externalEffectPerformed.",
            ]
          : undefined,
    });
  }

  const governance = assessLeoGovernance({
    actionKind: gate.governanceAction,
    nowMs,
  });

  if (governance.level === "NEVER") {
    return {
      ok: false,
      toolId: gate.toolId,
      operation,
      availability,
      governance,
      receipt: makeReceipt({
        toolId: gate.toolId,
        operation,
        governanceLevel: "NEVER",
        startedAt,
        completedAt: new Date(nowMs).toISOString(),
        status: "BLOCKED",
        evidenceCount: 0,
        limitations: governance.limitations,
        errorCode: "GOVERNANCE_NEVER",
      }),
      summary: "Blocked by NEVER governance.",
      evidence: [],
      data: null,
      unknowns: [],
      limitations: governance.limitations,
    };
  }

  try {
    const adapted = await invokeLeoToolAdapter({
      toolId: gate.toolId,
      operation,
      parameters: request.parameters,
      nowMs,
    });
    const completedAt = new Date(Date.now()).toISOString();

    if (!adapted.ok) {
      return {
        ok: false,
        toolId: gate.toolId,
        operation,
        availability,
        governance,
        receipt: makeReceipt({
          toolId: gate.toolId,
          operation,
          governanceLevel: governance.level,
          startedAt,
          completedAt,
          status: adapted.errorCode.includes("NOT_CONFIGURED") ? "UNAVAILABLE" : "FAILED",
          evidenceCount: 0,
          limitations: adapted.limitations,
          errorCode: adapted.errorCode,
        }),
        summary: adapted.summary,
        evidence: [],
        data: null,
        unknowns: adapted.unknowns ?? [],
        limitations: adapted.limitations,
      };
    }

    return {
      ok: true,
      toolId: gate.toolId,
      operation,
      availability,
      governance,
      receipt: makeReceipt({
        toolId: gate.toolId,
        operation,
        governanceLevel: governance.level,
        startedAt,
        completedAt,
        status: adapted.limitations.length ? "PARTIAL" : "SUCCEEDED",
        evidenceCount: adapted.evidence.length,
        limitations: adapted.limitations,
        errorCode: null,
      }),
      summary: adapted.summary,
      evidence: adapted.evidence,
      data: adapted.data,
      unknowns: adapted.unknowns,
      limitations: adapted.limitations,
    };
  } catch {
    return {
      ok: false,
      toolId: gate.toolId,
      operation,
      availability,
      governance,
      receipt: makeReceipt({
        toolId: gate.toolId,
        operation,
        governanceLevel: governance.level,
        startedAt,
        completedAt: new Date(Date.now()).toISOString(),
        status: "FAILED",
        evidenceCount: 0,
        limitations: ["Tool adapter failed safely."],
        errorCode: "ADAPTER_FAILED",
      }),
      summary: "Tool invocation failed safely.",
      evidence: [],
      data: null,
      unknowns: [],
      limitations: ["Tool adapter failed safely — no secrets exposed."],
    };
  }
}

export { getLeoToolCatalog };
