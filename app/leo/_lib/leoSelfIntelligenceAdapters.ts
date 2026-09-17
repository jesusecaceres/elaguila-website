/**
 * LEO-20A — Bounded Self-Intelligence dimension adapters.
 * Pure deterministic interpretation of canonical snapshots — no source DB queries.
 */
import type { LeoAttentionRuntimeBrief } from "@/app/leo/_lib/leoAttentionRuntime";
import type { LeoExecutiveReportingSnapshot, LeoExecutiveSignal } from "@/app/leo/_lib/leoExecutiveReportingTypes";
import type { LeoIntelligenceRuntimeObservation } from "@/app/leo/_lib/leoTypes";
import type { LeoSystemHealthSnapshot } from "@/app/leo/_lib/leoTypes";
import type { LeoClientCareWatchResult, LeoProjectExecutiveSnapshot } from "@/app/leo/_lib/leoTypes";
import type {
  LeoSelfIntelligenceCoverage,
  LeoSelfIntelligenceDimensionResult,
  LeoSelfIntelligenceEpistemic,
  LeoSelfIntelligenceFreshness,
  LeoSelfIntelligenceHealthState,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

export type LeoSelfIntelligenceAdapterInput = {
  nowMs: number;
  reporting: LeoExecutiveReportingSnapshot | null;
  attention: LeoAttentionRuntimeBrief | null;
  clientCare: LeoClientCareWatchResult | null;
  systemHealth: LeoSystemHealthSnapshot | null;
  project: LeoProjectExecutiveSnapshot | null;
  intelligenceRuntime: LeoIntelligenceRuntimeObservation | null;
  intelligenceConfigPresent: boolean;
};

function freshnessFromGeneratedAt(
  generatedAt: string | null | undefined,
  nowMs: number,
): LeoSelfIntelligenceFreshness {
  if (!generatedAt) return "UNKNOWN";
  const t = Date.parse(generatedAt);
  if (!Number.isFinite(t)) return "UNKNOWN";
  const ageMs = nowMs - t;
  if (ageMs < 2 * 60 * 60 * 1000) return "CURRENT";
  if (ageMs < 24 * 60 * 60 * 1000) return "AGING";
  return "STALE";
}

function worstState(
  a: LeoSelfIntelligenceHealthState,
  b: LeoSelfIntelligenceHealthState,
): LeoSelfIntelligenceHealthState {
  const rank: Record<LeoSelfIntelligenceHealthState, number> = {
    CRITICAL: 5,
    NEEDS_ATTENTION: 4,
    WATCH: 3,
    UNKNOWN: 2,
    HEALTHY: 1,
    NOT_MEASURED: 0,
  };
  return rank[a] >= rank[b] ? a : b;
}

function opsDomains(s: LeoExecutiveSignal): boolean {
  return (
    s.domain === "LEADS" ||
    s.domain === "CONTACTS" ||
    s.domain === "NEWSLETTER" ||
    s.domain === "MODERATION" ||
    s.domain === "CLIENTS" ||
    s.signalType === "QUEUE" ||
    s.signalType === "ATTENTION" ||
    s.signalType === "APPROVAL" ||
    s.signalType === "FAILURE"
  );
}

function revenueDomains(s: LeoExecutiveSignal): boolean {
  return (
    s.domain === "PAYMENTS" ||
    s.domain === "REVENUE" ||
    s.domain === "SALES" ||
    s.signalType === "PAYMENT" ||
    s.signalType === "REVENUE"
  );
}

function productDomains(s: LeoExecutiveSignal): boolean {
  return (
    s.domain === "LISTINGS" ||
    s.domain === "MODERATION" ||
    s.domain === "OFFERS" ||
    s.signalType === "MODERATION" ||
    s.signalType === "CONTENT"
  );
}

/**
 * OPERATIONS — queues, attention, client care, operational exec signals.
 * Absence of signals ≠ HEALTHY unless coverage is known.
 */
export function adaptLeoSelfIntelligenceOperations(
  input: LeoSelfIntelligenceAdapterInput,
): LeoSelfIntelligenceDimensionResult {
  const limitations: string[] = [];
  const evidenceRefs: string[] = [];
  let coverage: LeoSelfIntelligenceCoverage = "NONE";
  let state: LeoSelfIntelligenceHealthState = "NOT_MEASURED";
  let reason = "No operational sensor coverage available to Self-Intelligence.";
  let epistemic: LeoSelfIntelligenceEpistemic = "UNKNOWN";
  let confidence: LeoSelfIntelligenceDimensionResult["confidence"] = "NONE";
  let lastObservedAt: string | null = null;

  const hasReporting = input.reporting != null;
  const hasAttention = input.attention != null;
  const hasCare = input.clientCare != null;

  if (!hasReporting && !hasAttention && !hasCare) {
    return {
      dimension: "OPERATIONS",
      state: "NOT_MEASURED",
      reason,
      evidenceRefs,
      freshness: "UNKNOWN",
      confidence: "NONE",
      epistemic: "UNKNOWN",
      limitations: ["Operations adapter requires executive reporting, attention, or client care snapshots."],
      coverage: "NONE",
      lastObservedAt: null,
    };
  }

  coverage = hasReporting && (hasAttention || hasCare) ? "KNOWN" : "PARTIAL";
  if (coverage === "PARTIAL") {
    limitations.push("Operations coverage is partial — not all operational sensors were available.");
  }

  lastObservedAt =
    input.reporting?.generatedAt ??
    (input.attention ? new Date(input.nowMs).toISOString() : null) ??
    input.clientCare?.generatedAt ??
    null;

  const signals = (input.reporting?.signals ?? []).filter(opsDomains);
  const attentionItems = input.attention?.visibleItems ?? [];
  const careSignals = (input.clientCare?.signals ?? []).filter((s) => s.attentionEligible);

  for (const s of signals.slice(0, 12)) evidenceRefs.push(s.signalId);
  for (const a of attentionItems.slice(0, 8)) evidenceRefs.push(a.id);
  for (const c of careSignals.slice(0, 8)) evidenceRefs.push(c.key);

  const criticalSignals = signals.filter((s) => s.severity === "CRITICAL" && s.ownerAttentionRequired);
  const highSignals = signals.filter(
    (s) => (s.severity === "HIGH" || s.severity === "CRITICAL") && s.ownerAttentionRequired,
  );
  const careUrgent = careSignals.filter(
    (s) =>
      (s.overdueByDays != null && s.overdueByDays > 0) ||
      /critical|urgent|overdue/i.test(`${s.kind} ${s.title} ${s.status}`),
  );
  const careCritical = careSignals.filter((s) => /critical/i.test(`${s.kind} ${s.title}`));

  if (criticalSignals.length > 0 || careCritical.length > 0) {
    state = "CRITICAL";
    reason = `Critical operational queues or risks are active (${criticalSignals.length || careCritical.length} evidence items).`;
    epistemic = "CONFIRMED";
    confidence = "HIGH";
  } else if (highSignals.length > 0 || attentionItems.length >= 3 || careUrgent.length > 0) {
    state = "NEEDS_ATTENTION";
    reason = `Meaningful operational attention is required (${highSignals.length} high executive signals; ${attentionItems.length} attention items; ${careUrgent.length} client-care risks).`;
    epistemic = "CONFIRMED";
    confidence = "HIGH";
  } else if (attentionItems.length > 0 || signals.some((s) => s.ownerAttentionRequired)) {
    state = "WATCH";
    reason = "Non-critical operational items exist and should be watched.";
    epistemic = "KNOWN";
    confidence = "MEDIUM";
  } else if (coverage === "KNOWN" && signals.length + attentionItems.length + careSignals.length === 0) {
    // Empty with known coverage → HEALTHY (sources reported empty/available)
    const reportingOk =
      input.reporting?.overallAvailability === "AVAILABLE" ||
      input.reporting?.overallAvailability === "EMPTY" ||
      input.reporting?.overallAvailability === "PARTIAL";
    if (reportingOk) {
      state = "HEALTHY";
      reason =
        "Operational sensors are present and currently show no owner-attention queues or critical care risks.";
      epistemic = "KNOWN";
      confidence = "MEDIUM";
      limitations.push(
        "HEALTHY means no active attention queues in available sensors — not proof that all Leonix operations are perfect.",
      );
    } else {
      state = "UNKNOWN";
      reason = "Operational sources are present but availability is inconclusive.";
      epistemic = "UNKNOWN";
      confidence = "LOW";
    }
  } else if (coverage === "PARTIAL") {
    state = "UNKNOWN";
    reason = "Some operational sensors are missing; current state cannot be fully concluded.";
    epistemic = "UNKNOWN";
    confidence = "LOW";
  } else {
    state = "WATCH";
    reason = "Operational evidence is limited; treating as WATCH rather than assuming HEALTHY.";
    epistemic = "INFERRED";
    confidence = "LOW";
    limitations.push("Absence of negative evidence is not automatically HEALTHY when coverage is thin.");
  }

  return {
    dimension: "OPERATIONS",
    state,
    reason,
    evidenceRefs: [...new Set(evidenceRefs)].slice(0, 20),
    freshness: freshnessFromGeneratedAt(lastObservedAt, input.nowMs),
    confidence,
    epistemic,
    limitations,
    coverage,
    lastObservedAt,
  };
}

/**
 * REVENUE_MONETIZATION_HEALTH — read-only payment/revenue executive signals.
 * Does not recreate Revenue OS. No invented MRR/ARR/LTV.
 */
export function adaptLeoSelfIntelligenceRevenue(
  input: LeoSelfIntelligenceAdapterInput,
): LeoSelfIntelligenceDimensionResult {
  const limitations: string[] = [
    "Self-Intelligence reads payment/revenue executive signals only — it does not own Revenue OS.",
    "MRR/ARR/LTV/conversion rates are not invented when absent from canonical sources.",
  ];
  if (!input.reporting) {
    return {
      dimension: "REVENUE_MONETIZATION_HEALTH",
      state: "NOT_MEASURED",
      reason: "No executive reporting snapshot available for payment/revenue health.",
      evidenceRefs: [],
      freshness: "UNKNOWN",
      confidence: "NONE",
      epistemic: "UNKNOWN",
      limitations,
      coverage: "NONE",
      lastObservedAt: null,
    };
  }

  const payHealth = input.reporting.adapterHealth.find(
    (h) => h.domain === "PAYMENTS" || h.domain === "REVENUE" || h.domain === "SALES",
  );
  const signals = input.reporting.signals.filter(revenueDomains);
  const evidenceRefs = signals.slice(0, 12).map((s) => s.signalId);

  if (
    payHealth?.availability === "NOT_IMPLEMENTED" &&
    signals.length === 0 &&
    !input.reporting.domainSummaries.some(
      (d) =>
        (d.domain === "PAYMENTS" || d.domain === "REVENUE") &&
        (d.adapterStatus === "LIVE" || d.adapterStatus === "PARTIAL"),
    )
  ) {
    return {
      dimension: "REVENUE_MONETIZATION_HEALTH",
      state: "NOT_MEASURED",
      reason: "Payment/revenue executive adapter coverage is not implemented for Self-Intelligence.",
      evidenceRefs,
      freshness: freshnessFromGeneratedAt(input.reporting.generatedAt, input.nowMs),
      confidence: "NONE",
      epistemic: "UNKNOWN",
      limitations,
      coverage: "NONE",
      lastObservedAt: input.reporting.generatedAt,
    };
  }

  const coverage: LeoSelfIntelligenceCoverage =
    payHealth?.availability === "AVAILABLE" || signals.length > 0 ? "PARTIAL" : "PARTIAL";

  const failures = signals.filter(
    (s) =>
      s.signalType === "FAILURE" ||
      s.severity === "CRITICAL" ||
      (s.severity === "HIGH" && s.ownerAttentionRequired),
  );

  let state: LeoSelfIntelligenceHealthState = "UNKNOWN";
  let reason = "Payment/revenue sensors exist but the current monetization state is inconclusive.";
  let epistemic: LeoSelfIntelligenceEpistemic = "UNKNOWN";
  let confidence: LeoSelfIntelligenceDimensionResult["confidence"] = "LOW";

  if (failures.some((s) => s.severity === "CRITICAL")) {
    state = "CRITICAL";
    reason = "Critical payment/revenue failure signals are present.";
    epistemic = "CONFIRMED";
    confidence = "HIGH";
  } else if (failures.length > 0) {
    state = "NEEDS_ATTENTION";
    reason = `Payment/monetization issues need attention (${failures.length} high/failure signals).`;
    epistemic = "CONFIRMED";
    confidence = "HIGH";
  } else if (signals.some((s) => s.ownerAttentionRequired || s.status === "DEGRADED")) {
    state = "WATCH";
    reason = "Non-critical monetization warnings are present.";
    epistemic = "KNOWN";
    confidence = "MEDIUM";
  } else if (
    payHealth?.availability === "AVAILABLE" ||
    payHealth?.availability === "EMPTY" ||
    (signals.length === 0 &&
      input.reporting.domainSummaries.some((d) => d.domain === "PAYMENTS" && d.adapterStatus === "LIVE"))
  ) {
    state = "HEALTHY";
    reason =
      "Live payment reporting is present and currently shows no owner-attention payment failures in the executive snapshot.";
    epistemic = "KNOWN";
    confidence = "MEDIUM";
    limitations.push(
      "HEALTHY here means no active payment-failure attention in the executive snapshot — not full financial performance analysis.",
    );
  } else if (payHealth?.availability === "UNAVAILABLE") {
    state = "UNKNOWN";
    reason = "Payment reporting adapter is unavailable; monetization health cannot be concluded.";
    epistemic = "UNKNOWN";
    confidence = "LOW";
  }

  return {
    dimension: "REVENUE_MONETIZATION_HEALTH",
    state,
    reason,
    evidenceRefs,
    freshness: freshnessFromGeneratedAt(input.reporting.generatedAt, input.nowMs),
    confidence,
    epistemic,
    limitations,
    coverage,
    lastObservedAt: input.reporting.generatedAt,
  };
}

/**
 * TECHNOLOGY_READINESS — system health + AI runtime + project intelligence.
 * WORKER DEGRADED ≠ LEO DOWN. Optional missing integrations ≠ CRITICAL by default.
 */
export function adaptLeoSelfIntelligenceTechnology(
  input: LeoSelfIntelligenceAdapterInput,
): LeoSelfIntelligenceDimensionResult {
  const limitations: string[] = [
    "WORKER DEGRADED does not mean LEO is down when deterministic Leonix truth remains available.",
    "Missing optional integrations are WATCH/UNKNOWN — not CRITICAL — unless they block a current core function.",
  ];
  const evidenceRefs: string[] = [];
  let coverage: LeoSelfIntelligenceCoverage = "NONE";

  if (!input.systemHealth && !input.project && input.intelligenceRuntime == null && !input.intelligenceConfigPresent) {
    return {
      dimension: "TECHNOLOGY_READINESS",
      state: "NOT_MEASURED",
      reason: "No system health, project intelligence, or AI runtime evidence available.",
      evidenceRefs,
      freshness: "UNKNOWN",
      confidence: "NONE",
      epistemic: "UNKNOWN",
      limitations,
      coverage: "NONE",
      lastObservedAt: null,
    };
  }

  coverage = input.systemHealth ? "KNOWN" : "PARTIAL";
  let state: LeoSelfIntelligenceHealthState = "HEALTHY";
  const reasons: string[] = [];

  if (input.systemHealth) {
    evidenceRefs.push(`system_health:${input.systemHealth.overall}`);
    for (const c of input.systemHealth.components) {
      if (c.state === "UNAVAILABLE" || c.state === "DEGRADED") {
        evidenceRefs.push(`system_health:${c.key}:${c.state}`);
      }
    }
    if (input.systemHealth.overall === "UNAVAILABLE") {
      state = worstState(state, "CRITICAL");
      reasons.push("Core system health reports UNAVAILABLE components.");
    } else if (input.systemHealth.overall === "DEGRADED") {
      state = worstState(state, "NEEDS_ATTENTION");
      reasons.push("System health is DEGRADED.");
    } else if (input.systemHealth.overall === "NOT_CONFIGURED") {
      state = worstState(state, "WATCH");
      reasons.push("Important dependencies remain NOT_CONFIGURED.");
    }
  }

  if (input.intelligenceRuntime) {
    evidenceRefs.push(`intelligence_runtime:${input.intelligenceRuntime.failureClass}`);
    if (input.intelligenceRuntime.workerDegraded) {
      state = worstState(state, "WATCH");
      reasons.push(
        "Intelligence worker is degraded; LEO remains operational via deterministic answers.",
      );
    }
  } else if (!input.intelligenceConfigPresent) {
    evidenceRefs.push("intelligence_runtime:not_configured");
    state = worstState(state, "WATCH");
    reasons.push("Intelligence worker is not configured (optional capability).");
  }

  if (input.project) {
    evidenceRefs.push(`project:${input.project.repository}`);
    if (input.project.configurationState && "githubConfigured" in (input.project.configurationState as object)) {
      // keep generic
    }
    if (input.project.limitations.length > 0) {
      limitations.push(...input.project.limitations.slice(0, 2));
    }
    const corr = input.project.correlation;
    if (corr && typeof corr === "object" && "status" in corr) {
      const status = String((corr as { status?: string }).status ?? "");
      if (/fail|mismatch|behind/i.test(status)) {
        state = worstState(state, "WATCH");
        reasons.push("Project correlation indicates deployment/branch mismatch risk.");
        evidenceRefs.push(`project_correlation:${status}`);
      }
    }
  } else {
    limitations.push("Project intelligence snapshot unavailable — tech readiness coverage partial.");
    if (coverage === "KNOWN") coverage = "PARTIAL";
  }

  const reason =
    reasons.length > 0
      ? reasons.join(" ")
      : "Technology sensors are present and currently show stable readiness within known coverage.";

  const confidence =
    coverage === "KNOWN" ? "MEDIUM" : coverage === "PARTIAL" ? "LOW" : "NONE";
  const epistemic: LeoSelfIntelligenceEpistemic =
    state === "HEALTHY" || state === "WATCH" || state === "NEEDS_ATTENTION" || state === "CRITICAL"
      ? "KNOWN"
      : "UNKNOWN";

  return {
    dimension: "TECHNOLOGY_READINESS",
    state: state === "HEALTHY" && reasons.length === 0 ? "HEALTHY" : state,
    reason,
    evidenceRefs: [...new Set(evidenceRefs)].slice(0, 20),
    freshness: freshnessFromGeneratedAt(
      input.systemHealth?.generatedAt ?? input.project?.observedAt ?? null,
      input.nowMs,
    ),
    confidence,
    epistemic,
    limitations,
    coverage,
    lastObservedAt: input.systemHealth?.generatedAt ?? input.project?.observedAt ?? null,
  };
}

/**
 * PRODUCT_OPERATIONAL_HEALTH — listings/moderation/project operational signals.
 * Does NOT claim full customer journey, SEO, or mobile UX health.
 */
export function adaptLeoSelfIntelligenceProductOperational(
  input: LeoSelfIntelligenceAdapterInput,
): LeoSelfIntelligenceDimensionResult {
  const limitations: string[] = [
    "Product operational health is NOT full customer-journey, checkout-funnel, SEO, or mobile UX analysis.",
    "Only listing/moderation/project operational signals available to LEO are interpreted.",
  ];
  if (!input.reporting && !input.project) {
    return {
      dimension: "PRODUCT_OPERATIONAL_HEALTH",
      state: "NOT_MEASURED",
      reason: "No listing/moderation reporting or project operational evidence available.",
      evidenceRefs: [],
      freshness: "UNKNOWN",
      confidence: "NONE",
      epistemic: "UNKNOWN",
      limitations,
      coverage: "NONE",
      lastObservedAt: null,
    };
  }

  const signals = (input.reporting?.signals ?? []).filter(productDomains);
  const evidenceRefs = signals.slice(0, 12).map((s) => s.signalId);
  if (input.project) evidenceRefs.push(`project:${input.project.repository}`);

  const listingDomain = input.reporting?.domainSummaries.find((d) => d.domain === "LISTINGS");
  const moderationDomain = input.reporting?.domainSummaries.find((d) => d.domain === "MODERATION");
  const hasLiveProductSensor =
    listingDomain?.adapterStatus === "LIVE" ||
    moderationDomain?.adapterStatus === "LIVE" ||
    signals.length > 0 ||
    input.project != null;

  if (!hasLiveProductSensor) {
    return {
      dimension: "PRODUCT_OPERATIONAL_HEALTH",
      state: "NOT_MEASURED",
      reason: "No live listing/moderation adapter coverage for product operational interpretation.",
      evidenceRefs,
      freshness: freshnessFromGeneratedAt(input.reporting?.generatedAt ?? null, input.nowMs),
      confidence: "NONE",
      epistemic: "UNKNOWN",
      limitations,
      coverage: "NONE",
      lastObservedAt: input.reporting?.generatedAt ?? null,
    };
  }

  const critical = signals.filter((s) => s.severity === "CRITICAL");
  const high = signals.filter((s) => s.severity === "HIGH" && s.ownerAttentionRequired);

  let state: LeoSelfIntelligenceHealthState = "HEALTHY";
  let reason =
    "Listing/moderation operational sensors are present and show no critical product queues.";
  let epistemic: LeoSelfIntelligenceEpistemic = "KNOWN";
  let confidence: LeoSelfIntelligenceDimensionResult["confidence"] = "MEDIUM";

  if (critical.length > 0) {
    state = "CRITICAL";
    reason = "Critical listing/moderation operational failures are present.";
    epistemic = "CONFIRMED";
    confidence = "HIGH";
  } else if (high.length > 0 || signals.some((s) => s.ownerAttentionRequired)) {
    state = "NEEDS_ATTENTION";
    reason = "Product operational queues (listings/moderation) need owner attention.";
    epistemic = "CONFIRMED";
    confidence = "HIGH";
  } else if (signals.some((s) => s.status === "DEGRADED")) {
    state = "WATCH";
    reason = "Product operational signals show non-critical degradation.";
    epistemic = "KNOWN";
    confidence = "MEDIUM";
  } else if (signals.length === 0 && !input.project) {
    state = "UNKNOWN";
    reason = "Product sensors are registered but current signal set is empty/inconclusive.";
    epistemic = "UNKNOWN";
    confidence = "LOW";
  }

  return {
    dimension: "PRODUCT_OPERATIONAL_HEALTH",
    state,
    reason,
    evidenceRefs: [...new Set(evidenceRefs)].slice(0, 20),
    freshness: freshnessFromGeneratedAt(
      input.reporting?.generatedAt ?? input.project?.observedAt ?? null,
      input.nowMs,
    ),
    confidence,
    epistemic,
    limitations,
    coverage: "PARTIAL",
    lastObservedAt: input.reporting?.generatedAt ?? input.project?.observedAt ?? null,
  };
}

export function adaptLeoSelfIntelligenceV1Dimensions(
  input: LeoSelfIntelligenceAdapterInput,
): LeoSelfIntelligenceDimensionResult[] {
  return [
    adaptLeoSelfIntelligenceOperations(input),
    adaptLeoSelfIntelligenceRevenue(input),
    adaptLeoSelfIntelligenceTechnology(input),
    adaptLeoSelfIntelligenceProductOperational(input),
  ];
}
