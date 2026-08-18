/**
 * LEO-11 internal tool adapters — wrap proven LEO services (no logic duplication).
 */
import "server-only";

import { summarizeLeoAdminCapabilities } from "@/app/leo/_lib/leoAdminCapabilitiesAdapter";
import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { buildLeoDecisionBrief } from "@/app/leo/_lib/leoDecisionEngine";
import {
  leoListActiveMemoryForSubject,
  leoListRecentMemory,
} from "@/app/leo/_lib/leoLivingBookService";
import {
  composeLeoProjectIntelligenceSummary,
  getLeoProjectSnapshot,
} from "@/app/leo/_lib/leoProjectIntelligenceService";
import { getLeoListingReasonChain } from "@/app/leo/_lib/leoReasonChain";
import { runLeoPreparation } from "@/app/leo/_lib/leoPreparationService";
import { getLeoToolCatalog } from "@/app/leo/_lib/leoToolCatalog";
import { readLeoGithubRepository } from "@/app/leo/_lib/leoGithubProjectAdapter";
import { readLeoVercelDeployments } from "@/app/leo/_lib/leoVercelProjectAdapter";
import { evaluateLeoWatcherRequest } from "@/app/leo/_lib/leoWatcherEngine";
import { isLeoWatcherKind } from "@/app/leo/_lib/leoWatcherRegistry";
import type {
  LeoConversationEvidence,
  LeoDecisionContext,
  LeoPreparationKind,
  LeoToolId,
  LeoToolOperationMode,
} from "@/app/leo/_lib/leoTypes";

export type LeoToolAdapterSuccess = {
  ok: true;
  summary: string;
  evidence: LeoConversationEvidence[];
  data: unknown;
  unknowns: string[];
  limitations: string[];
};

export type LeoToolAdapterFailure = {
  ok: false;
  errorCode: string;
  summary: string;
  limitations: string[];
  unknowns?: string[];
};

export type LeoToolAdapterResult = LeoToolAdapterSuccess | LeoToolAdapterFailure;

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function invokeLeoToolAdapter(args: {
  toolId: LeoToolId;
  operation: LeoToolOperationMode;
  parameters?: Record<string, unknown>;
  nowMs: number;
}): Promise<LeoToolAdapterResult> {
  const { toolId, operation, parameters = {}, nowMs } = args;

  switch (toolId) {
    case "leo.attention.read": {
      const brief = await getLeoAttentionBrief({ nowMs });
      return {
        ok: true,
        summary: `${brief.items.length} attention priorit${brief.items.length === 1 ? "y" : "ies"}; ${brief.actionableCount} actionable.`,
        evidence: brief.items.slice(0, 8).map((i) => ({
          sourceKind: "attention_item",
          sourceRef: i.id,
          summary: i.title,
          availability: "LIVE" as const,
        })),
        data: brief,
        unknowns: [],
        limitations: [...brief.limitations],
      };
    }

    case "leo.clientCare.read": {
      const watch = await getLeoClientCareWatch({ nowMs });
      return {
        ok: true,
        summary: `${watch.signals.length} client-care item${watch.signals.length === 1 ? "" : "s"} from bounded sources.`,
        evidence: watch.signals.slice(0, 10).map((s) => ({
          sourceKind: "client_care_signal",
          sourceRef: s.key,
          summary: s.title,
          availability: "LIVE" as const,
        })),
        data: watch,
        unknowns: [],
        limitations: [...watch.limitations],
      };
    }

    case "leo.reasonChain.read": {
      const listingId = asString(parameters.listingId);
      if (!listingId) {
        return {
          ok: false,
          errorCode: "MISSING_LISTING_ID",
          summary: "listingId is required for listing reason chain.",
          limitations: ["Provide an explicit listingId parameter."],
          unknowns: ["listingId"],
        };
      }
      const chain = await getLeoListingReasonChain(listingId);
      return {
        ok: true,
        summary: chain.primaryReason
          ? `Listing reason quality ${chain.provenanceQuality}.`
          : "Original listing reason unavailable — LEO will not invent a cause.",
        evidence: [
          {
            sourceKind: "listing_reason_chain",
            sourceRef: listingId,
            summary: chain.primaryReason?.humanReadableReason?.slice(0, 160) ?? "reason unavailable",
            availability: chain.primaryReason ? "LIVE" : "UNAVAILABLE",
          },
        ],
        data: chain,
        unknowns: chain.primaryReason ? [] : ["listing_flag_reason"],
        limitations: chain.observabilityGap ? ["Observability gap noted."] : [],
      };
    }

    case "leo.memory.read": {
      const subjectType = asString(parameters.subjectType);
      const subjectKey = asString(parameters.subjectKey);
      const records =
        subjectType && subjectKey
          ? await leoListActiveMemoryForSubject(subjectType, subjectKey, 20)
          : await leoListRecentMemory(12);
      return {
        ok: true,
        summary:
          records.length === 0
            ? "No active executive memories found. LEO never invents memory."
            : `Found ${records.length} memory record(s).`,
        evidence: records.slice(0, 10).map((r) => ({
          sourceKind: "leo_memory",
          sourceRef: r.id,
          summary: r.statement.slice(0, 160),
          availability: "LIVE" as const,
        })),
        data: records,
        unknowns: records.length === 0 ? ["memory"] : [],
        limitations: [],
      };
    }

    case "leo.decision.analyze": {
      const ctx = parameters.decisionContext as LeoDecisionContext | undefined;
      if (!ctx || typeof ctx !== "object") {
        return {
          ok: false,
          errorCode: "MISSING_DECISION_CONTEXT",
          summary: "decisionContext is required for decision analysis.",
          limitations: ["Provide a structured decisionContext parameter."],
          unknowns: ["decisionContext"],
        };
      }
      const brief = buildLeoDecisionBrief({ ...ctx, nowMs: ctx.nowMs ?? nowMs });
      return {
        ok: true,
        summary: `Decision ${brief.recommendationState}; governance ${brief.governance.level}.`,
        evidence: [
          {
            sourceKind: "decision_brief",
            sourceRef: brief.decisionKey,
            summary: brief.question.slice(0, 160),
            availability: "LIVE",
          },
        ],
        data: brief,
        unknowns: [...brief.unknowns],
        limitations: [...brief.limitations],
      };
    }

    case "leo.watcher.run": {
      const kindRaw = asString(parameters.watcherKind);
      if (!kindRaw || !isLeoWatcherKind(kindRaw)) {
        return {
          ok: false,
          errorCode: "UNSUPPORTED_WATCHER",
          summary: "Supported watcherKind required.",
          limitations: ["Use a registered on-demand watcher kind."],
        };
      }
      // Watcher engine is pure; service layer usually loads evidence first.
      // For tool bus v0, run with empty evidence bundle → truthful empty findings.
      const result = evaluateLeoWatcherRequest(
        { watcherKind: kindRaw, nowMs, maxFindings: 10 },
        {},
      );
      if (!("findings" in result)) {
        return {
          ok: false,
          errorCode: "WATCHER_FAILED",
          summary: result.message ?? "Watcher evaluation failed.",
          limitations: ["On-demand watcher could not run with current evidence."],
        };
      }
      return {
        ok: true,
        summary: `Watcher ${kindRaw}: ${result.totalFindings} finding(s).`,
        evidence: result.findings.slice(0, 10).map((f) => ({
          sourceKind: "watcher_finding",
          sourceRef: f.key,
          summary: f.summary,
          availability: "LIVE" as const,
        })),
        data: result,
        unknowns: [],
        limitations: [
          ...result.limitations,
          "Tool invocation used on-demand watcher without preloaded external writes.",
        ],
      };
    }

    case "leo.preparation.prepare": {
      if (operation !== "PREPARE") {
        return {
          ok: false,
          errorCode: "OPERATION_MISMATCH",
          summary: "preparation.prepare requires PREPARE operation.",
          limitations: [],
        };
      }
      const prepKind = (asString(parameters.preparationKind) ??
        "INTERNAL_TASK_DRAFT") as LeoPreparationKind;
      const result = await runLeoPreparation({
        preparationKind: prepKind,
        watcherKind: null,
        nowMs,
        question: asString(parameters.question),
      });
      if (!result.preparation.ok || !result.preparation.prepared) {
        return {
          ok: false,
          errorCode: "PREPARATION_BLOCKED",
          summary: result.preparation.message,
          limitations: result.preparation.governance.limitations,
        };
      }
      const prepared = result.preparation.prepared;
      return {
        ok: true,
        summary: `YELLOW preparation ready: ${prepared.preparationKind}. Status: PREPARED, NOT_EXECUTED.`,
        evidence: prepared.sourceEvidenceRefs.slice(0, 8).map((ref) => ({
          sourceKind: "preparation_evidence",
          sourceRef: ref,
          summary: ref.slice(0, 120),
          availability: "LIVE" as const,
        })),
        data: prepared,
        unknowns: [...prepared.unknowns],
        limitations: [...prepared.limitations],
      };
    }

    case "leo.capabilities.read": {
      const catalog = getLeoToolCatalog(nowMs);
      return {
        ok: true,
        summary: `Tool catalog: ${catalog.available.length} available, ${catalog.notConfigured.length} not configured, ${catalog.partial.length} partial.`,
        evidence: catalog.humanGroups.map((g) => ({
          sourceKind: "tool_catalog_group",
          sourceRef: g.label,
          summary: `${g.label} — ${g.status}`,
          availability: g.status === "available" ? ("LIVE" as const) : ("UNAVAILABLE" as const),
        })),
        data: catalog,
        unknowns: [],
        limitations: [],
      };
    }

    case "leo.adminCapabilities.read": {
      const summary = summarizeLeoAdminCapabilities();
      return {
        ok: true,
        summary: summary.summary,
        evidence: summary.actions.slice(0, 20).map((a) => ({
          sourceKind: "admin_os_action",
          sourceRef: a.key,
          summary: `${a.label}: ${a.status} / ${a.riskLevel} — ${a.leoNote}`,
          availability:
            a.leoAvailability === "AVAILABLE"
              ? ("LIVE" as const)
              : a.leoAvailability === "PARTIAL"
                ? ("PARTIAL" as const)
                : ("UNAVAILABLE" as const),
        })),
        data: summary,
        unknowns: [],
        limitations: [
          "LEO does not execute Admin actions.",
          "PLANNED Admin actions are not available.",
          "NEEDS LIVE PROOF Admin actions are not fully verified.",
        ],
      };
    }

    case "leo.project.github.read": {
      const g = await readLeoGithubRepository({
        branch: asString(parameters.branch),
      });
      if (!g.ok) {
        return {
          ok: false,
          errorCode: g.errorCode,
          summary: g.limitations[0] ?? "GitHub read unavailable.",
          limitations: g.limitations,
        };
      }
      return {
        ok: true,
        summary: `GitHub ${g.snapshot.fullName} branch ${g.snapshot.branch ?? "unknown"} head ${
          g.snapshot.headSha?.slice(0, 7) ?? "unknown"
        }.`,
        evidence: [
          {
            sourceKind: "github_repo",
            sourceRef: g.snapshot.fullName,
            summary: `branch=${g.snapshot.branch}; sha=${g.snapshot.headSha}`,
            availability: "LIVE",
          },
          ...g.snapshot.recentCommits.slice(0, 5).map((c) => ({
            sourceKind: "github_commit",
            sourceRef: c.sha,
            summary: c.message,
            availability: "LIVE" as const,
          })),
        ],
        data: g.snapshot,
        unknowns: [],
        limitations: g.snapshot.limitations,
      };
    }

    case "leo.project.vercel.read": {
      const v = await readLeoVercelDeployments();
      if (!v.ok) {
        return {
          ok: false,
          errorCode: v.errorCode,
          summary: v.limitations[0] ?? "Vercel read unavailable.",
          limitations: v.limitations,
        };
      }
      const latest = v.deployments[0];
      return {
        ok: true,
        summary: latest
          ? `Vercel ${v.projectName}: latest deployment ${latest.deploymentId.slice(0, 8)} platform-state ${
              latest.readyState ?? "unknown"
            } (not system health).`
          : `Vercel ${v.projectName}: no recent deployments returned.`,
        evidence: v.deployments.slice(0, 8).map((d) => ({
          sourceKind: "vercel_deployment",
          sourceRef: d.deploymentId,
          summary: `target=${d.target}; readyState=${d.readyState}; sha=${d.gitCommitSha}`,
          availability: "LIVE" as const,
          limitationNote:
            "READY means platform deployment state — not full application health.",
        })),
        data: v,
        unknowns: [],
        limitations: v.limitations,
      };
    }

    case "leo.project.snapshot.read": {
      const snapshot = await getLeoProjectSnapshot({
        branch: asString(parameters.branch),
        nowMs,
      });
      return {
        ok: true,
        summary: composeLeoProjectIntelligenceSummary(snapshot),
        evidence: [
          ...(snapshot.github?.headSha
            ? [
                {
                  sourceKind: "github_head",
                  sourceRef: snapshot.github.headSha,
                  summary: `branch ${snapshot.github.branch} @ ${snapshot.github.headSha.slice(0, 7)}`,
                  availability: "LIVE" as const,
                },
              ]
            : []),
          ...snapshot.correlations.slice(0, 5).map((c) => ({
            sourceKind: "sha_correlation",
            sourceRef: c.sha,
            summary: `sha ${c.sha.slice(0, 7)} → ${c.vercelDeployments.length} Vercel deployment(s)`,
            availability: "LIVE" as const,
          })),
        ],
        data: snapshot,
        unknowns: [],
        limitations: snapshot.limitations,
      };
    }

    default:
      return {
        ok: false,
        errorCode: "ADAPTER_NOT_IMPLEMENTED",
        summary: "No adapter for this tool.",
        limitations: [],
      };
  }
}
