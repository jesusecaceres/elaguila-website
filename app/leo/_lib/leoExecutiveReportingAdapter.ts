/**
 * EXEC-REPORTS-01 adapter helpers — read-only, bounded, no mutation.
 */
import { createHash } from "node:crypto";

import type {
  LeoExecutiveDomain,
  LeoExecutivePriorityRank,
  LeoExecutiveReportingAdapterInput,
  LeoExecutiveReportingAvailability,
  LeoExecutiveSeverity,
  LeoExecutiveSignal,
  LeoExecutiveSignalStatus,
  LeoExecutiveSignalType,
} from "@/app/leo/_lib/leoExecutiveReportingTypes";

export const LEO_EXECUTIVE_REPORTING_MAX_SIGNALS_PER_ADAPTER = 12;
export const LEO_EXECUTIVE_REPORTING_MAX_SUMMARY = 280;
export const LEO_EXECUTIVE_REPORTING_MAX_TITLE = 140;

export function boundExecutiveText(value: string, max: number): string {
  const t = value.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Internal admin paths only. Never accept external URLs from source text. */
export function sanitizeExecutiveDeepLink(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t.startsWith("/admin")) return null;
  if (t.startsWith("//")) return null;
  if (/^[a-z]+:/i.test(t)) return null;
  if (t.includes("://")) return null;
  return t.slice(0, 240);
}

export function executiveSignalFingerprint(parts: Array<string | number | null | undefined>): string {
  const raw = parts.map((p) => String(p ?? "")).join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function buildLeoExecutiveSignal(input: {
  domain: LeoExecutiveDomain;
  sourceKind: string;
  sourceRef?: string | null;
  nowMs: number;
  title: string;
  summary: string;
  signalType: LeoExecutiveSignalType;
  severity: LeoExecutiveSeverity;
  status: LeoExecutiveSignalStatus;
  count?: number | null;
  metric?: LeoExecutiveSignal["metric"];
  category?: string | null;
  ownerAttentionRequired: boolean;
  actionable: boolean;
  deepLink?: string | null;
  evidenceRefs?: string[];
  availability: LeoExecutiveReportingAvailability;
  metadataSummary?: string | null;
  priorityRank: LeoExecutivePriorityRank;
}): LeoExecutiveSignal {
  const fingerprint = executiveSignalFingerprint([
    input.domain,
    input.signalType,
    input.sourceKind,
    input.sourceRef ?? "",
    input.status,
    input.count ?? "",
    input.severity,
    input.metric?.value ?? "",
  ]);
  return {
    signalId: `${input.domain}:${input.sourceKind}:${input.sourceRef ?? "root"}`,
    domain: input.domain,
    sourceKind: input.sourceKind,
    sourceRef: input.sourceRef ?? null,
    generatedAt: new Date(input.nowMs).toISOString(),
    title: boundExecutiveText(input.title, LEO_EXECUTIVE_REPORTING_MAX_TITLE),
    summary: boundExecutiveText(input.summary, LEO_EXECUTIVE_REPORTING_MAX_SUMMARY),
    signalType: input.signalType,
    severity: input.severity,
    status: input.status,
    count: input.count ?? null,
    metric: input.metric ?? null,
    delta: input.metric?.delta ?? null,
    category: input.category ?? null,
    ownerAttentionRequired: input.ownerAttentionRequired,
    actionable: input.actionable,
    deepLink: sanitizeExecutiveDeepLink(input.deepLink),
    evidenceRefs: (input.evidenceRefs ?? []).slice(0, 8),
    availability: input.availability,
    metadataSummary: input.metadataSummary
      ? boundExecutiveText(input.metadataSummary, 160)
      : null,
    fingerprint,
    priorityRank: input.priorityRank,
  };
}

export function emptyAdapterResult(
  domain: LeoExecutiveDomain,
  availability: LeoExecutiveReportingAvailability,
  nowMs: number,
  limitation: string,
): {
  domain: LeoExecutiveDomain;
  availability: LeoExecutiveReportingAvailability;
  signals: LeoExecutiveSignal[];
  limitations: string[];
  generatedAt: string;
} {
  return {
    domain,
    availability,
    signals: [],
    limitations: [limitation],
    generatedAt: new Date(nowMs).toISOString(),
  };
}

export function composeLeoExecutiveReportingSummary(
  snap: import("@/app/leo/_lib/leoExecutiveReportingTypes").LeoExecutiveReportingSnapshot,
): string {
  const attn = snap.attention.length;
  if (snap.overallAvailability === "UNAVAILABLE") {
    return "Executive reporting sources could not be loaded. This is not an all-clear.";
  }
  if (attn === 0) {
    const parts: string[] = [];
    if (snap.adapterCounts.unavailable > 0) {
      parts.push(
        `${snap.adapterCounts.unavailable} reporting source${snap.adapterCounts.unavailable === 1 ? "" : "s"} unavailable`,
      );
    }
    if (snap.adapterCounts.notImplemented > 0) {
      parts.push(`${snap.adapterCounts.notImplemented} reserved without live queues`);
    }
    if (parts.length > 0) {
      return `No owner-attention queues from available sources. ${parts.join("; ")}.`;
    }
    return "No owner-attention queues from available Leonix admin sources right now.";
  }
  const titles = snap.attention.slice(0, 3).map((s) => s.title.toLowerCase());
  return `${attn} item${attn === 1 ? "" : "s"} need you across Leonix admin: ${titles.join(", ")}.`;
}

export function clampAdapterLimit(input: LeoExecutiveReportingAdapterInput): number {
  const n = input.limit;
  if (!Number.isFinite(n) || n < 1) return 6;
  return Math.min(n, LEO_EXECUTIVE_REPORTING_MAX_SIGNALS_PER_ADAPTER);
}

/**
 * CONTRACT ONLY — maps a future AI-worker result into executive signals.
 * Do not call this from a category AI worker in EXEC-REPORTS-01; none exist.
 */
export function mapLeoExecutiveAiWorkerReportToSignals(
  report: import("@/app/leo/_lib/leoExecutiveReportingTypes").LeoExecutiveAiWorkerReportInput,
  nowMs: number,
): import("@/app/leo/_lib/leoExecutiveReportingTypes").LeoExecutiveSignal[] {
  const human = report.requiresHumanCount + report.flaggedCount + report.blockedCount;
  return [
    buildLeoExecutiveSignal({
      domain: report.domain,
      sourceKind: `ai_worker:${report.workerKind}`,
      sourceRef: report.runId,
      nowMs,
      title: `AI worker ${report.workerKind}: ${report.outcome.toLowerCase().replace(/_/g, " ")}`,
      summary: boundExecutiveText(report.summary, LEO_EXECUTIVE_REPORTING_MAX_SUMMARY),
      signalType: "AI_RESULT",
      severity: report.outcome === "FAILED" || human > 0 ? "HIGH" : "INFORMATIONAL",
      status: human > 0 ? "NEEDS_ATTENTION" : report.outcome === "FAILED" ? "UNAVAILABLE" : "INFORMATIONAL",
      count: report.reviewedCount,
      ownerAttentionRequired: human > 0 || report.outcome === "FAILED",
      actionable: human > 0,
      evidenceRefs: [`ai_worker:${report.runId}`],
      availability: report.outcome === "FAILED" ? "UNAVAILABLE" : "AVAILABLE",
      metadataSummary: `reviewed=${report.reviewedCount} autoApproved=${report.autoApprovedCount} flagged=${report.flaggedCount} blocked=${report.blockedCount} failed=${report.failedCount} human=${report.requiresHumanCount}`,
      priorityRank: report.outcome === "FAILED" ? 1 : human > 0 ? 4 : 8,
    }),
  ];
}
