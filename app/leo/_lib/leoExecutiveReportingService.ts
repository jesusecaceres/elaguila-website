/**
 * EXEC-REPORTS-01 aggregator — fail-soft, read-only, no warehouse copy.
 *
 * One broken admin source must not take down executive reporting.
 * GREEN READ: never approve, reject, publish, charge, send, delete, or deploy.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { LEO_EXECUTIVE_LIVE_ADAPTERS } from "@/app/leo/_lib/leoExecutiveReportingAdapters";
import { sanitizeExecutiveDeepLink } from "@/app/leo/_lib/leoExecutiveReportingAdapter";
import {
  LEO_EXECUTIVE_DOMAIN_REGISTRY,
  leoExecutiveDomainEntry,
} from "@/app/leo/_lib/leoExecutiveReportingRegistry";
import type {
  LeoExecutiveAdapterHealth,
  LeoExecutiveDomainSummary,
  LeoExecutiveReportingAvailability,
  LeoExecutiveReportingSnapshot,
  LeoExecutiveSignal,
  LeoExecutiveWatchCompatibleSignal,
} from "@/app/leo/_lib/leoExecutiveReportingTypes";
import type { LeoBriefSectionResultCard, LeoResultCard } from "@/app/leo/_lib/leoTypes";
import {
  buildLeoExecutiveReportingCoverage,
  isExecutiveSignalWatchCompatible,
} from "@/app/leo/_lib/leoExecutiveReportingWatchPolicy";

export const LEO_EXECUTIVE_REPORTING_MAX_TOTAL_SIGNALS = 48;

function overallFromHealth(health: LeoExecutiveAdapterHealth[]): LeoExecutiveReportingAvailability {
  if (health.length === 0) return "UNKNOWN";
  if (health.every((h) => h.availability === "UNAVAILABLE")) return "UNAVAILABLE";
  if (health.every((h) => h.availability === "NOT_IMPLEMENTED")) return "NOT_IMPLEMENTED";
  if (health.every((h) => h.availability === "EMPTY")) return "EMPTY";
  if (health.some((h) => h.availability === "UNAVAILABLE" || h.availability === "PARTIAL" || h.availability === "NOT_IMPLEMENTED")) {
    if (health.some((h) => h.availability === "AVAILABLE" || h.availability === "EMPTY")) return "PARTIAL";
    return "PARTIAL";
  }
  return "AVAILABLE";
}

function bucketCounts(health: LeoExecutiveAdapterHealth[]) {
  const counts = {
    available: 0,
    partial: 0,
    empty: 0,
    unavailable: 0,
    notImplemented: 0,
    unknown: 0,
  };
  for (const h of health) {
    if (h.availability === "AVAILABLE") counts.available += 1;
    else if (h.availability === "PARTIAL") counts.partial += 1;
    else if (h.availability === "EMPTY") counts.empty += 1;
    else if (h.availability === "UNAVAILABLE") counts.unavailable += 1;
    else if (h.availability === "NOT_IMPLEMENTED") counts.notImplemented += 1;
    else counts.unknown += 1;
  }
  return counts;
}

function rankSignals(a: LeoExecutiveSignal, b: LeoExecutiveSignal): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
  const sev = { CRITICAL: 0, HIGH: 1, NORMAL: 2, INFORMATIONAL: 3 };
  if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
  return a.title.localeCompare(b.title);
}

function toWatchCompatible(s: LeoExecutiveSignal): LeoExecutiveWatchCompatibleSignal | null {
  if (!isExecutiveSignalWatchCompatible(s)) return null;
  return {
    domain: s.domain,
    fingerprint: s.fingerprint,
    severity: s.severity,
    ownerAttentionRequired: s.ownerAttentionRequired,
    availability: s.availability,
    deepLink: sanitizeExecutiveDeepLink(s.deepLink),
    title: s.title,
  };
}

export function mapLeoExecutiveSignalToResultCard(signal: LeoExecutiveSignal): LeoBriefSectionResultCard {
  const priority =
    signal.severity === "CRITICAL" ? "CRITICAL" : signal.severity === "HIGH" ? "HIGH" : signal.severity === "NORMAL" ? "NORMAL" : "INFORMATIONAL";
  const action = signal.deepLink
    ? [
        {
          actionId: `open:${signal.signalId}`,
          type: "OPEN_INTERNAL" as const,
          label: "Open admin",
          iconSemantic: "open",
          targetRef: {
            system: "LEONIX" as const,
            entityType: "admin_route",
            id: signal.signalId,
            url: signal.deepLink,
          },
          governanceLevel: "GREEN" as const,
          executionType: "NAVIGATE" as const,
          toolId: null,
          enabled: true,
          disabledReason: null,
          requiresConfirmation: false,
          receiptBehavior: "NONE" as const,
        },
      ]
    : [];
  return {
    cardId: `exec:${signal.signalId}`,
    kind: "BRIEF_SECTION",
    priority,
    certainty: signal.availability === "AVAILABLE" || signal.availability === "EMPTY" ? "PROVEN" : "POSSIBLE",
    title: signal.title,
    subtitle: signal.domain,
    whyItMatters: signal.summary,
    reason: signal.metadataSummary ?? null,
    evidenceRefs: signal.evidenceRefs,
    sourceSystem: "LEONIX",
    actions: action,
    spokenSummary: signal.title,
    sectionKey: signal.domain,
    itemCount: signal.count ?? 0,
  };
}

export { composeLeoExecutiveReportingSummary } from "@/app/leo/_lib/leoExecutiveReportingAdapter";

/**
 * Admin Command Center + internal collectors. Does not require LEO owner role
 * (Command Center is already admin-gated). LEO conversation uses the owner-gated wrapper.
 */
export async function collectLeoExecutiveReportingSnapshot(options?: {
  nowMs?: number;
  limit?: number;
}): Promise<LeoExecutiveReportingSnapshot> {
  const nowMs = options?.nowMs ?? Date.now();
  const limit = options?.limit ?? 8;
  const generatedAt = new Date(nowMs).toISOString();

  const settled = await Promise.allSettled(
    LEO_EXECUTIVE_LIVE_ADAPTERS.map((adapter) =>
      adapter.getExecutiveSignals({ nowMs, limit }),
    ),
  );

  const adapterHealth: LeoExecutiveAdapterHealth[] = [];
  const allSignals: LeoExecutiveSignal[] = [];
  const limitations: string[] = [];

  for (let i = 0; i < settled.length; i++) {
    const adapter = LEO_EXECUTIVE_LIVE_ADAPTERS[i];
    const result = settled[i];
    const entry = leoExecutiveDomainEntry(adapter.domain);
    if (result.status === "rejected") {
      adapterHealth.push({
        domain: adapter.domain,
        label: entry?.label ?? adapter.domain,
        availability: "UNAVAILABLE",
        limitation: "Adapter failed — source is not treated as zero or healthy.",
      });
      limitations.push(`${adapter.domain} adapter failed.`);
      continue;
    }
    const value = result.value;
    adapterHealth.push({
      domain: value.domain,
      label: entry?.label ?? value.domain,
      availability: value.availability,
      limitation: value.limitations[0] ?? null,
    });
    limitations.push(...value.limitations);
    allSignals.push(...value.signals);
  }

  const seen = new Set<string>();
  const deduped: LeoExecutiveSignal[] = [];
  for (const s of allSignals) {
    if (seen.has(s.signalId) || seen.has(s.fingerprint)) continue;
    seen.add(s.signalId);
    seen.add(s.fingerprint);
    deduped.push(s);
  }
  deduped.sort(rankSignals);
  const signals = deduped.slice(0, LEO_EXECUTIVE_REPORTING_MAX_TOTAL_SIGNALS);

  const attention = signals.filter((s) => s.ownerAttentionRequired);
  const systemHealth = signals.filter((s) => s.signalType === "SYSTEM_HEALTH");
  const performance = signals.filter(
    (s) => s.signalType === "METRIC" || s.signalType === "REVENUE" || s.signalType === "TREND",
  );
  const operations = signals.filter(
    (s) =>
      !s.ownerAttentionRequired &&
      s.signalType !== "SYSTEM_HEALTH" &&
      s.signalType !== "METRIC" &&
      s.signalType !== "REVENUE" &&
      s.signalType !== "TREND",
  );

  const domainSummaries: LeoExecutiveDomainSummary[] = LEO_EXECUTIVE_DOMAIN_REGISTRY.map((reg) => {
    const health = adapterHealth.find((h) => h.domain === reg.domain);
    const domainSignals = signals.filter((s) => s.domain === reg.domain);
    return {
      domain: reg.domain,
      label: reg.label,
      availability: health?.availability ?? (reg.adapterStatus === "RESERVED" ? "NOT_IMPLEMENTED" : "UNKNOWN"),
      attentionCount: domainSignals.filter((s) => s.ownerAttentionRequired).length,
      signalCount: domainSignals.length,
      canonicalAdminRoute: reg.canonicalAdminRoute,
      adapterStatus: reg.adapterStatus,
    };
  });

  return {
    generatedAt,
    overallAvailability: overallFromHealth(adapterHealth),
    signals,
    attention,
    operations,
    performance,
    systemHealth,
    domainSummaries,
    adapterHealth,
    adapterCounts: bucketCounts(adapterHealth),
    limitations: [...new Set(limitations)].slice(0, 20),
    watchCompatible: signals.map(toWatchCompatible).filter((s): s is LeoExecutiveWatchCompatibleSignal => s != null),
    coverage: buildLeoExecutiveReportingCoverage(
      {
        adapterHealth,
        adapterCounts: bucketCounts(adapterHealth),
        domainSummaries,
      },
      LEO_EXECUTIVE_DOMAIN_REGISTRY.length,
    ),
  };
}

export async function getLeoExecutiveReportingSnapshot(options?: {
  nowMs?: number;
  limit?: number;
}): Promise<LeoExecutiveReportingSnapshot> {
  await requireLeoOwnerAccess();
  return collectLeoExecutiveReportingSnapshot(options);
}

export function filterExecutiveSnapshotByQuestion(
  snap: LeoExecutiveReportingSnapshot,
  question: string,
): LeoExecutiveReportingSnapshot {
  const q = question.trim().toLowerCase();
  let domains: Set<string> | null = null;
  if (/\bnewsletter/.test(q) || /\bsubscribers?\b/.test(q)) domains = new Set(["NEWSLETTER"]);
  else if (/\biglesias\b/.test(q) || /\bchurch\b/.test(q) || /\bprayer\b/.test(q)) {
    domains = new Set(["IGLESIAS", "PRAYER_WALL"]);
  } else if (/\bpayment|\brevenue|\bsales\b/.test(q)) {
    domains = new Set(["PAYMENTS", "REVENUE", "SALES"]);
  } else if (/\bsupport\b|\bcontact\b/.test(q)) domains = new Set(["CONTACTS"]);
  else if (/\bleads?\b/.test(q)) domains = new Set(["LEADS", "CLIENTS"]);
  else if (/\bmoderat|\breports?\b|\bqueue/.test(q) && !/\ball reports\b/.test(q) && !/\badmin report/.test(q)) {
    domains = new Set(["MODERATION", "LISTINGS"]);
  }
  if (!domains) return snap;
  const signals = snap.signals.filter((s) => domains!.has(s.domain));
  return {
    ...snap,
    signals,
    attention: signals.filter((s) => s.ownerAttentionRequired),
    operations: snap.operations.filter((s) => domains!.has(s.domain)),
    performance: snap.performance.filter((s) => domains!.has(s.domain)),
    systemHealth: snap.systemHealth.filter((s) => domains!.has(s.domain)),
    watchCompatible: snap.watchCompatible.filter((s) => domains!.has(s.domain)),
  };
}

export function executiveSignalsToResultCards(signals: LeoExecutiveSignal[]): LeoResultCard[] {
  return signals.slice(0, 12).map(mapLeoExecutiveSignalToResultCard);
}
