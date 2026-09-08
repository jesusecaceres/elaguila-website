/**
 * EXEC-REPORTS-01 — canonical read-only executive reporting contract.
 *
 * SOURCE SYSTEM → SOURCE-SPECIFIC ADAPTER → LeoExecutiveSignal → Command Center / LEO / watches.
 * Each source remains canonical. This layer reads and summarizes; it does not copy warehouses.
 *
 * Architecture requirement: any NEW admin feature that produces metrics, queues, flags,
 * moderation, AI results, sales, customer status, operational status, or failures must either:
 *   A. provide a LeoExecutiveReportingAdapter, or
 *   B. explicitly document why it has no executive reporting value.
 *
 * When that feature is operationally important (queue, flag, payment failure, moderation,
 * automation/AI result needing review, system health, customer/client risk), the adapter
 * MUST emit watchCompatible executive signals. Trivial admin pages must not spam alerts.
 *
 * GREEN READ only. Report output != authority.
 */

import type { LeoTruthAvailability } from "@/app/leo/_lib/leoTypes";

export type LeoExecutiveReportingAvailability =
  | "AVAILABLE"
  | "PARTIAL"
  | "EMPTY"
  | "UNAVAILABLE"
  | "NOT_IMPLEMENTED"
  | "UNKNOWN";

export type LeoExecutiveDomain =
  | "CLIENTS"
  | "LEADS"
  | "CONTACTS"
  | "NEWSLETTER"
  | "SALES"
  | "REVENUE"
  | "PAYMENTS"
  | "LISTINGS"
  | "MODERATION"
  | "IGLESIAS"
  | "PRAYER_WALL"
  | "OFFERS"
  | "JOBS"
  | "COMMUNITY"
  | "BUSINESS_TOOLS"
  | "ANALYTICS"
  | "SYSTEM"
  | "AUTOMATION"
  | "PROJECTS"
  | "LEO";

export type LeoExecutiveSignalType =
  | "ATTENTION"
  | "QUEUE"
  | "MODERATION"
  | "METRIC"
  | "REVENUE"
  | "LEAD"
  | "CUSTOMER"
  | "CONTENT"
  | "PAYMENT"
  | "AUTOMATION"
  | "SYSTEM_HEALTH"
  | "AI_RESULT"
  | "APPROVAL"
  | "FAILURE"
  | "SUCCESS"
  | "TREND";

export type LeoExecutiveSeverity = "CRITICAL" | "HIGH" | "NORMAL" | "INFORMATIONAL";

export type LeoExecutiveSignalStatus =
  | "OPEN"
  | "PENDING"
  | "NEEDS_ATTENTION"
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "EMPTY"
  | "NOT_IMPLEMENTED"
  | "INFORMATIONAL";

/**
 * 1 critical failure → 2 customer risk → 3 money → 4 moderation →
 * 5 overdue queue → 6 operational change → 7 metric/trend → 8 informational success
 */
export type LeoExecutivePriorityRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type LeoExecutiveMetric = {
  value: number;
  unit: string;
  period?: string | null;
  previousValue?: number | null;
  delta?: number | null;
};

export type LeoExecutiveSignal = {
  signalId: string;
  domain: LeoExecutiveDomain;
  sourceKind: string;
  sourceRef?: string | null;
  generatedAt: string;
  title: string;
  summary: string;
  signalType: LeoExecutiveSignalType;
  severity: LeoExecutiveSeverity;
  status: LeoExecutiveSignalStatus;
  count?: number | null;
  metric?: LeoExecutiveMetric | null;
  delta?: number | null;
  category?: string | null;
  ownerAttentionRequired: boolean;
  actionable: boolean;
  deepLink?: string | null;
  evidenceRefs: string[];
  availability: LeoExecutiveReportingAvailability;
  metadataSummary?: string | null;
  /** LEO-16 watch-ready fingerprint — no timestamps. */
  fingerprint: string;
  priorityRank: LeoExecutivePriorityRank;
};

export type LeoExecutiveAdapterHealth = {
  domain: LeoExecutiveDomain;
  label: string;
  availability: LeoExecutiveReportingAvailability;
  limitation: string | null;
};

export type LeoExecutiveAdapterResult = {
  domain: LeoExecutiveDomain;
  availability: LeoExecutiveReportingAvailability;
  signals: LeoExecutiveSignal[];
  limitations: string[];
  generatedAt: string;
};

export type LeoExecutiveReportingAdapterInput = {
  nowMs: number;
  limit: number;
};

export type LeoExecutiveReportingAdapter = {
  domain: LeoExecutiveDomain;
  getExecutiveSignals(input: LeoExecutiveReportingAdapterInput): Promise<LeoExecutiveAdapterResult>;
};

export type LeoExecutiveDomainSummary = {
  domain: LeoExecutiveDomain;
  label: string;
  availability: LeoExecutiveReportingAvailability;
  attentionCount: number;
  signalCount: number;
  canonicalAdminRoute: string;
  adapterStatus: "LIVE" | "PARTIAL" | "RESERVED" | "NOT_IMPLEMENTED";
};

export type LeoExecutiveReportingSnapshot = {
  generatedAt: string;
  overallAvailability: LeoExecutiveReportingAvailability;
  signals: LeoExecutiveSignal[];
  attention: LeoExecutiveSignal[];
  operations: LeoExecutiveSignal[];
  performance: LeoExecutiveSignal[];
  systemHealth: LeoExecutiveSignal[];
  domainSummaries: LeoExecutiveDomainSummary[];
  adapterHealth: LeoExecutiveAdapterHealth[];
  adapterCounts: {
    available: number;
    partial: number;
    empty: number;
    unavailable: number;
    notImplemented: number;
    unknown: number;
  };
  limitations: string[];
  /** Watch-ready projection — no extra fetch required. */
  watchCompatible: LeoExecutiveWatchCompatibleSignal[];
  /** Bounded coverage — how much of Admin actually reports upward. Not a 100% claim. */
  coverage: LeoExecutiveReportingCoverage;
};

export type LeoExecutiveReportingCoverage = {
  totalRegisteredDomains: number;
  liveAdapterCount: number;
  available: number;
  partial: number;
  empty: number;
  unavailable: number;
  notImplemented: number;
  unknown: number;
  watchEnabledDomains: number;
};

export type LeoExecutiveWatchCompatibleSignal = {
  domain: LeoExecutiveDomain;
  fingerprint: string;
  severity: LeoExecutiveSeverity;
  ownerAttentionRequired: boolean;
  availability: LeoExecutiveReportingAvailability;
  deepLink: string | null;
  title: string;
};

/**
 * Future AI-worker reporting contract only.
 * Do not implement category AI workers in EXEC-REPORTS-01.
 * Future workers MUST report results upward through this shape.
 */
export type LeoExecutiveAiWorkerOutcome =
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED"
  | "REQUIRES_HUMAN"
  | "SKIPPED";

export type LeoExecutiveAiWorkerReportInput = {
  workerKind: string;
  domain: LeoExecutiveDomain;
  runId: string;
  outcome: LeoExecutiveAiWorkerOutcome;
  confidence?: number | null;
  reviewedCount: number;
  autoApprovedCount: number;
  flaggedCount: number;
  blockedCount: number;
  failedCount: number;
  requiresHumanCount: number;
  summary: string;
  generatedAt: string;
};

export function mapTruthAvailabilityToReporting(
  a: LeoTruthAvailability | undefined,
): LeoExecutiveReportingAvailability {
  if (!a) return "UNKNOWN";
  if (a === "LIVE") return "AVAILABLE";
  if (a === "PARTIAL") return "PARTIAL";
  if (a === "UNAVAILABLE") return "UNAVAILABLE";
  return "UNKNOWN";
}
