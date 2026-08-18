/**
 * LEO-8 Watcher Engine — deterministic on-demand evaluation over existing LEO evidence.
 * No timers, cron, AI, DB writes, or external calls.
 */
import { buildLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionEngine";
import {
  buildLeoClientCareSignals,
  type LeoClientCareLeadRecord,
  type LeoClientCareSupportRecord,
} from "@/app/leo/_lib/leoClientCareWatcher";
import { buildLeoDecisionBrief } from "@/app/leo/_lib/leoDecisionEngine";
import { getLeoWatcherEntry, isLeoWatcherKind } from "@/app/leo/_lib/leoWatcherRegistry";
import type {
  LeoAttentionBrief,
  LeoClientCareSignal,
  LeoClientCareWatchResult,
  LeoMemoryRecord,
  LeoObservation,
  LeoPreparationKind,
  LeoWatcherFinding,
  LeoWatcherKind,
  LeoWatcherRunRequest,
  LeoWatcherRunResult,
} from "@/app/leo/_lib/leoTypes";

const LEO_8_WATCHER_NOT_CLAIMING = [
  "Not a background monitor or cron",
  "Not inventing urgency, sentiment, or financial risk",
  "Not granting execution permission",
  "Not a real-time system-health claim",
] as const;

export type LeoWatcherEvidenceBundle = {
  clientCare?: LeoClientCareWatchResult | null;
  /** Raw records for building client care if watch result not prebuilt. */
  clientCareLeads?: LeoClientCareLeadRecord[];
  clientCareSupport?: LeoClientCareSupportRecord[];
  attentionObservations?: LeoObservation[];
  attentionBrief?: LeoAttentionBrief | null;
  memoryRecords?: LeoMemoryRecord[];
};

export type LeoWatcherEngineError = {
  ok: false;
  error: "unsupported_watcher" | "missing_decision_context";
  message: string;
};

function suggestPrep(kind: LeoWatcherKind, signalKind?: string): LeoPreparationKind | null {
  if (kind === "FOLLOW_UP" || signalKind === "FOLLOW_UP_OVERDUE" || signalKind === "FOLLOW_UP_DUE") {
    return "FOLLOW_UP_DRAFT";
  }
  if (kind === "CLIENT_CARE") return "CLIENT_CARE_PLAN";
  if (kind === "ATTENTION") return "REVIEW_PLAN";
  if (kind === "DECISION_REVIEW") return "DECISION_BRIEF";
  if (kind === "MEMORY_CONTRADICTION") return "MEETING_BRIEF";
  return "INTERNAL_TASK_DRAFT";
}

function ensureClientCare(
  bundle: LeoWatcherEvidenceBundle,
  nowMs: number,
): LeoClientCareWatchResult {
  if (bundle.clientCare) return bundle.clientCare;
  return buildLeoClientCareSignals({
    leads: bundle.clientCareLeads ?? [],
    supportTickets: bundle.clientCareSupport ?? [],
    nowMs,
  });
}

function ensureAttention(bundle: LeoWatcherEvidenceBundle, nowMs: number): LeoAttentionBrief {
  if (bundle.attentionBrief) return bundle.attentionBrief;
  return buildLeoAttentionBrief(bundle.attentionObservations ?? [], { topN: 3, nowMs });
}

function findingsFromClientCare(
  watch: LeoClientCareWatchResult,
  watcherKind: LeoWatcherKind,
  filter?: (s: LeoClientCareSignal) => boolean,
): LeoWatcherFinding[] {
  const signals = filter ? watch.signals.filter(filter) : watch.signals;
  return signals.map((s) => ({
    key: `watcher:${watcherKind}:${s.key}`,
    watcherKind,
    findingType: (watcherKind === "FOLLOW_UP" ? "follow_up" : "signal") as LeoWatcherFinding["findingType"],
    title: s.title,
    summary: s.summary,
    evidenceRefs: [s.key],
    detectedAt: s.observedAt,
    affectedCount: 1,
    attentionLevel: s.kind === "FOLLOW_UP_OVERDUE" ? "HIGH" : s.kind === "NEEDS_REPLY" ? "NORMAL" : "INFORMATIONAL",
    governanceLevel: null,
    suggestedPreparationKind: suggestPrep(watcherKind, s.kind),
    limitations: s.limitationNote ? [s.limitationNote] : [],
  }));
}

/**
 * Pure watcher evaluation over a provided evidence bundle.
 * Unsupported watcher kinds fail closed via evaluateLeoWatcherRequest.
 */
export function runLeoWatcherOnEvidence(
  request: LeoWatcherRunRequest,
  bundle: LeoWatcherEvidenceBundle,
): LeoWatcherRunResult {
  const nowMs = request.nowMs ?? Date.now();
  const ranAt = new Date(nowMs).toISOString();
  const entry = getLeoWatcherEntry(request.watcherKind);
  const max = Math.max(0, request.maxFindings ?? 20);
  const limitations = [...entry.limitations];

  let findings: LeoWatcherFinding[] = [];

  switch (request.watcherKind) {
    case "CLIENT_CARE": {
      const watch = ensureClientCare(bundle, nowMs);
      findings = findingsFromClientCare(watch, "CLIENT_CARE");
      limitations.push(...watch.limitations);
      break;
    }
    case "FOLLOW_UP": {
      const watch = ensureClientCare(bundle, nowMs);
      findings = findingsFromClientCare(
        watch,
        "FOLLOW_UP",
        (s) => s.kind === "FOLLOW_UP_DUE" || s.kind === "FOLLOW_UP_OVERDUE",
      );
      limitations.push(...watch.limitations);
      break;
    }
    case "ATTENTION": {
      const brief = ensureAttention(bundle, nowMs);
      findings = brief.items.map((item) => ({
        key: `watcher:ATTENTION:${item.id}`,
        watcherKind: "ATTENTION" as const,
        findingType: "attention_item" as const,
        title: item.title,
        summary: item.summary,
        evidenceRefs: item.sourceObservationKeys,
        detectedAt: brief.generatedAt,
        affectedCount: item.affectedCount,
        attentionLevel: item.level,
        governanceLevel: null,
        suggestedPreparationKind: suggestPrep("ATTENTION"),
        limitations: item.limitationNote ? [item.limitationNote] : [],
      }));
      limitations.push(...brief.limitations);
      break;
    }
    case "DECISION_REVIEW": {
      const ctx = request.decisionContext;
      if (!ctx) {
        limitations.push("decisionContext required — no decision invented.");
        break;
      }
      const brief = buildLeoDecisionBrief({ ...ctx, nowMs });
      findings = [
        {
          key: `watcher:DECISION_REVIEW:${brief.decisionKey}`,
          watcherKind: "DECISION_REVIEW",
          findingType: "decision_review",
          title: brief.question,
          summary: `recommendationState=${brief.recommendationState}; governance=${brief.governance.level}; challenges=${brief.challenges.length}`,
          evidenceRefs: [brief.decisionKey, ...brief.governance.auditPrep.ruleIds],
          detectedAt: brief.generatedAt,
          affectedCount: brief.options.length,
          attentionLevel: brief.governance.level === "RED" ? "HIGH" : "NORMAL",
          governanceLevel: brief.governance.level,
          suggestedPreparationKind: "DECISION_BRIEF",
          limitations: [...brief.limitations],
        },
      ];
      break;
    }
    case "MEMORY_CONTRADICTION": {
      const records = request.memoryRecords ?? bundle.memoryRecords ?? [];
      const contradicted = records.filter((r) => r.contradictsIds.length > 0);
      findings = contradicted.map((r) => ({
        key: `watcher:MEMORY_CONTRADICTION:${r.id}`,
        watcherKind: "MEMORY_CONTRADICTION" as const,
        findingType: "memory_contradiction" as const,
        title: `Contradiction links on ${r.subject.subjectType}:${r.subject.subjectKey}`,
        summary: `${r.epistemicType}: ${r.statement.slice(0, 160)} (contradictsIds=${r.contradictsIds.length})`,
        evidenceRefs: [r.id, ...r.contradictsIds],
        detectedAt: r.updatedAt,
        affectedCount: r.contradictsIds.length,
        attentionLevel: "NORMAL",
        governanceLevel: null,
        suggestedPreparationKind: "MEETING_BRIEF",
        limitations: ["Only pre-linked contradictions — no semantic invention."],
      }));
      if (records.length === 0) {
        limitations.push("No memory records provided to contradiction watcher.");
      }
      break;
    }
  }

  findings = findings.slice(0, max);

  return {
    watcherKind: request.watcherKind,
    ranAt,
    findings,
    totalFindings: findings.length,
    limitations,
    notClaiming: LEO_8_WATCHER_NOT_CLAIMING,
  };
}

/**
 * Fail-closed entry for unsupported watcher kinds.
 */
export function evaluateLeoWatcherRequest(
  request: { watcherKind: string; maxFindings?: number; nowMs?: number; decisionContext?: LeoWatcherRunRequest["decisionContext"]; memoryRecords?: LeoMemoryRecord[] | null },
  bundle: LeoWatcherEvidenceBundle,
): LeoWatcherRunResult | LeoWatcherEngineError {
  if (!isLeoWatcherKind(request.watcherKind)) {
    return {
      ok: false,
      error: "unsupported_watcher",
      message: `Watcher kind '${request.watcherKind}' is not supported.`,
    };
  }
  if (request.watcherKind === "DECISION_REVIEW" && !request.decisionContext) {
    return {
      ok: false,
      error: "missing_decision_context",
      message: "DECISION_REVIEW requires explicit decisionContext.",
    };
  }
  return runLeoWatcherOnEvidence(
    {
      watcherKind: request.watcherKind,
      maxFindings: request.maxFindings,
      nowMs: request.nowMs,
      decisionContext: request.decisionContext,
      memoryRecords: request.memoryRecords,
    },
    bundle,
  );
}
