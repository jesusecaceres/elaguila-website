/**
 * EXEC-REPORTS-02 — map company reporting signals into LEO-16 watch candidates.
 * Pure. No DB, network, or source-system queries.
 *
 * Reporting snapshot is the only company-source input. Watches must not
 * re-query newsletter, payments, contacts, moderation, or Iglesias.
 */
import { leoExecutiveDomainEntry } from "@/app/leo/_lib/leoExecutiveReportingRegistry";
import { sanitizeExecutiveDeepLink } from "@/app/leo/_lib/leoExecutiveReportingAdapter";
import type {
  LeoExecutiveAdapterHealth,
  LeoExecutiveReportingCoverage,
  LeoExecutiveReportingSnapshot,
  LeoExecutiveSignal,
  LeoExecutiveSignalType,
  LeoExecutiveDomain,
} from "@/app/leo/_lib/leoExecutiveReportingTypes";
import type { LeoObservation, LeoWatchSeverity } from "@/app/leo/_lib/leoTypes";

export const LEO_EXECUTIVE_SIGNAL_ACK_KIND = "executive_signal";

/** Domains already covered by Client Care / dashboard attention — do not duplicate cards. */
export const LEO_EXECUTIVE_ATTENTION_SKIP_DOMAINS: readonly LeoExecutiveDomain[] = [
  "LEADS",
  "CLIENTS",
  "CONTACTS",
  "MODERATION",
  "LISTINGS",
];

export type LeoExecutiveWatchCandidate = {
  signalId: string;
  sourceKey: string;
  fingerprint: string;
  severity: LeoWatchSeverity;
  headline: string;
  summary: string;
  deepLink: string;
  evidenceRefs: string[];
  status: "OK" | "DEGRADED" | "UNAVAILABLE";
  pushEligible: boolean;
  eligibleOutsideQuietHours: boolean;
};

export function executiveSignalAckKey(signalId: string): string {
  return `${LEO_EXECUTIVE_SIGNAL_ACK_KIND}:${signalId}`;
}

export function isExecutiveDomainWatchEnabled(domain: LeoExecutiveDomain): boolean {
  return leoExecutiveDomainEntry(domain)?.supportsWatch === true;
}

/**
 * Whether a signal may enter watch evaluation (not the same as push).
 * NOT_IMPLEMENTED never enters. UNKNOWN is not treated as healthy or empty.
 */
export function isExecutiveSignalWatchCompatible(signal: LeoExecutiveSignal): boolean {
  if (!isExecutiveDomainWatchEnabled(signal.domain)) return false;
  if (signal.availability === "NOT_IMPLEMENTED") return false;
  if (signal.availability === "UNKNOWN") return false;
  return true;
}

function metricLike(signalType: LeoExecutiveSignalType): boolean {
  return signalType === "METRIC" || signalType === "TREND" || signalType === "SUCCESS" || signalType === "REVENUE";
}

/**
 * Domain-aware push policy. Reports can exist without alerts.
 */
export function isExecutiveSignalPushEligible(signal: LeoExecutiveSignal): boolean {
  if (!isExecutiveSignalWatchCompatible(signal)) return false;
  if (signal.availability === "EMPTY") return false;
  if (signal.severity === "INFORMATIONAL") return false;
  if (metricLike(signal.signalType) && !signal.ownerAttentionRequired) return false;

  if (signal.domain === "NEWSLETTER" && signal.signalType === "METRIC") return false;
  if (signal.domain === "REVENUE" && signal.signalType === "REVENUE" && !signal.ownerAttentionRequired) {
    return false;
  }

  if (signal.signalType === "AI_RESULT") {
    return signal.ownerAttentionRequired && (signal.severity === "HIGH" || signal.severity === "CRITICAL");
  }

  if (signal.signalType === "FAILURE" && (signal.severity === "HIGH" || signal.severity === "CRITICAL")) {
    return true;
  }

  if (
    signal.domain === "PAYMENTS" &&
    signal.signalType === "FAILURE" &&
    (signal.severity === "HIGH" || signal.severity === "CRITICAL")
  ) {
    return true;
  }

  if (
    signal.domain === "MODERATION" &&
    (signal.signalType === "QUEUE" || signal.signalType === "MODERATION" || signal.signalType === "APPROVAL") &&
    (signal.severity === "HIGH" || signal.severity === "CRITICAL") &&
    signal.ownerAttentionRequired
  ) {
    return true;
  }

  if (
    signal.domain === "CONTACTS" &&
    signal.ownerAttentionRequired &&
    (signal.severity === "HIGH" || signal.severity === "CRITICAL")
  ) {
    return true;
  }

  if (signal.signalType === "SYSTEM_HEALTH" && signal.status === "UNAVAILABLE" && signal.severity === "CRITICAL") {
    return true;
  }

  if (signal.ownerAttentionRequired && (signal.severity === "CRITICAL" || signal.severity === "HIGH")) {
    return true;
  }

  return false;
}

function mapSeverity(signal: LeoExecutiveSignal): LeoWatchSeverity {
  if (signal.severity === "CRITICAL" || signal.severity === "HIGH" || signal.severity === "NORMAL") {
    return signal.severity;
  }
  return "INFORMATIONAL";
}

function candidateFromSignal(signal: LeoExecutiveSignal): LeoExecutiveWatchCandidate {
  return {
    signalId: signal.signalId,
    sourceKey: executiveSignalAckKey(signal.signalId),
    fingerprint: `EXECUTIVE_REPORTING:${signal.fingerprint}`,
    severity: mapSeverity(signal),
    headline: signal.title.slice(0, 200),
    summary: signal.summary.slice(0, 500),
    deepLink: sanitizeExecutiveDeepLink(signal.deepLink) ?? "/admin/leo",
    evidenceRefs: [signal.signalId, ...signal.evidenceRefs].slice(0, 8),
    status: signal.availability === "UNAVAILABLE" ? "UNAVAILABLE" : "OK",
    pushEligible: isExecutiveSignalPushEligible(signal),
    eligibleOutsideQuietHours: signal.severity === "CRITICAL",
  };
}

function healthCandidate(h: LeoExecutiveAdapterHealth): LeoExecutiveWatchCandidate | null {
  if (h.availability === "NOT_IMPLEMENTED" || h.availability === "EMPTY" || h.availability === "UNKNOWN") {
    return null;
  }
  if (h.availability !== "UNAVAILABLE") return null;
  const signalId = `health:${h.domain}`;
  return {
    signalId,
    sourceKey: executiveSignalAckKey(signalId),
    fingerprint: `EXECUTIVE_REPORTING:health:${h.domain}:UNAVAILABLE`,
    severity: "HIGH",
    headline: `${h.label} reporting unavailable`,
    summary: h.limitation ?? `${h.label} adapter is unavailable — not treated as zero or healthy.`,
    deepLink: "/admin/leo",
    evidenceRefs: [signalId],
    status: "UNAVAILABLE",
    pushEligible: true,
    eligibleOutsideQuietHours: false,
  };
}

export function mapExecutiveReportingToWatchCandidates(
  snapshot: Pick<LeoExecutiveReportingSnapshot, "signals" | "adapterHealth">,
): LeoExecutiveWatchCandidate[] {
  const out: LeoExecutiveWatchCandidate[] = [];
  const seen = new Set<string>();

  for (const signal of snapshot.signals) {
    if (!isExecutiveSignalWatchCompatible(signal)) continue;
    const cand = candidateFromSignal(signal);
    if (!cand.pushEligible && cand.status !== "UNAVAILABLE") continue;
    if (seen.has(cand.fingerprint)) continue;
    seen.add(cand.fingerprint);
    out.push(cand);
  }

  for (const health of snapshot.adapterHealth) {
    const cand = healthCandidate(health);
    if (!cand) continue;
    if (seen.has(cand.fingerprint)) continue;
    seen.add(cand.fingerprint);
    out.push(cand);
  }

  return out;
}

export function buildLeoExecutiveReportingCoverage(
  snapshot: Pick<LeoExecutiveReportingSnapshot, "adapterHealth" | "adapterCounts" | "domainSummaries">,
  registeredDomainCount: number,
): LeoExecutiveReportingCoverage {
  const watchEnabledDomains = snapshot.domainSummaries.filter((d) => d.adapterStatus !== "RESERVED" && isExecutiveDomainWatchEnabled(d.domain)).length;
  return {
    totalRegisteredDomains: registeredDomainCount,
    liveAdapterCount: snapshot.adapterHealth.length,
    available: snapshot.adapterCounts.available,
    partial: snapshot.adapterCounts.partial,
    empty: snapshot.adapterCounts.empty,
    unavailable: snapshot.adapterCounts.unavailable,
    notImplemented: snapshot.adapterCounts.notImplemented,
    unknown: snapshot.adapterCounts.unknown,
    watchEnabledDomains,
  };
}

function toTruthAvailability(
  a: LeoExecutiveSignal["availability"],
): LeoObservation["availability"] {
  if (a === "AVAILABLE") return "LIVE";
  if (a === "PARTIAL") return "PARTIAL";
  if (a === "UNAVAILABLE") return "UNAVAILABLE";
  return "UNKNOWN";
}

/** Bounded Attention cards — skip domains already represented by Client Care / listings. */
export function mapExecutiveSignalsToAttentionObservations(
  signals: LeoExecutiveSignal[],
): LeoObservation[] {
  const out: LeoObservation[] = [];
  for (const signal of signals) {
    if ((LEO_EXECUTIVE_ATTENTION_SKIP_DOMAINS as readonly string[]).includes(signal.domain)) continue;
    if (!isExecutiveSignalPushEligible(signal)) continue;
    const availability = toTruthAvailability(signal.availability);
    out.push({
      key: executiveSignalAckKey(signal.signalId),
      kind: "executive_reporting",
      title: signal.title.slice(0, 200),
      summary: signal.summary.slice(0, 400),
      availability,
      provenance: {
        sourceSystem: "leo",
        sourceType: "dashboard_snapshot",
        sourceId: signal.signalId,
        availability,
      },
      count: signal.count ?? undefined,
      mayRequireOwnerAttention: true,
      entityRef: { entityType: "other", id: signal.signalId },
      limitationNote: signal.availability === "UNAVAILABLE" ? signal.summary : null,
    });
  }
  return out;
}

