/**
 * LEO-4 Attention Engine v0 — deterministic prioritization over LEO observations.
 *
 * Pure scoring/grouping. No DB writes, no AI, no Living Book writes, no N+1 Reason Chain.
 * Top-N is a MAXIMUM, not a quota.
 */
import type {
  LeoAttentionBrief,
  LeoAttentionDisposition,
  LeoAttentionFactor,
  LeoAttentionItem,
  LeoAttentionLevel,
  LeoObservation,
  LeoObservationKind,
} from "@/app/leo/_lib/leoTypes";

/** Centralized weights — do not scatter magic numbers. */
export const ATTENTION_WEIGHTS = {
  actionabilityBase: 12,
  countPerUnit: 2,
  countCap: 10,
  trustSafety: 8,
  customerFacing: 5,
  partialAvailability: -2,
  unknownAvailability: -3,
  ageBucketHours: 24,
  agePerBucket: 1,
  ageCap: 4,
  /** CRITICAL requires this score AND an explicit critical rule match. */
  criticalScoreFloor: 50,
  highScoreFloor: 28,
  normalScoreFloor: 14,
  /** Explicit client-care follow-up overdue boost (not SLA invention). */
  clientCareFollowUpOverdue: 6,
} as const;

export const LEO_ATTENTION_DEFAULT_TOP_N = 3;

const LEO_4_NOT_CLAIMING = [
  "Not inventing dollar/revenue impact",
  "Not inventing customer churn or anger",
  "Not fabricating CRITICAL without an explicit critical rule",
  "Not a Living Book write",
  "Not AI-weighted prioritization",
  "Not a padded top-3 quota",
] as const;

export type LeoAttentionEngineOptions = {
  /** Maximum actionable+informational items to return. Default 3. Not a quota. */
  topN?: number;
  /** Clock for age factors — injectable for deterministic fixtures. */
  nowMs?: number;
};

type Candidate = {
  rootCauseKey: string;
  title: string;
  summary: string;
  kinds: LeoObservationKind[];
  sourceKeys: string[];
  observations: LeoObservation[];
  affectedCount: number | null;
  customerFacing: boolean;
  revenueEvidence: boolean;
  mayRequireOwnerAttention: boolean;
  availabilityWorst: LeoObservation["availability"];
  limitationNotes: string[];
  oldestObservedAtMs: number | null;
};

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function rootCauseKeyFor(obs: LeoObservation): string {
  if (obs.kind === "review_queue_preview") {
    const flag = nonEmpty(obs.flagSourceKind) ?? "unspecified";
    return `review_queue_preview:${flag}`;
  }
  // Client-care entity rows group by care kind (not one attention item per lead).
  if (obs.kind.startsWith("client_care_")) {
    return obs.kind;
  }
  if (obs.kind === "executive_reporting") {
    return obs.key;
  }
  return obs.kind;
}

function isAggregateZero(obs: LeoObservation): boolean {
  if (obs.kind === "review_queue_preview" && obs.entityRef?.id) return false;
  if (obs.kind.startsWith("client_care_") && obs.entityRef?.id) return false;
  if (typeof obs.count === "number" && obs.count <= 0) return true;
  return false;
}

function isInformationalOnly(obs: LeoObservation): boolean {
  if (obs.availability === "UNAVAILABLE") return true;
  if (obs.kind === "snapshot_limitation") return true;
  if (obs.kind === "users_needing_help_proxy") return true;
  if (obs.kind === "client_care_limitation") return true;
  return false;
}

function customerFacingKind(kind: LeoObservationKind): boolean {
  return (
    kind === "leads_needing_reply" ||
    kind === "pending_listings_review" ||
    kind === "pending_reports" ||
    kind === "listings_expiring_soon" ||
    kind === "listings_expired" ||
    kind === "review_queue_preview" ||
    kind === "client_care_follow_up_overdue" ||
    kind === "client_care_follow_up_due" ||
    kind === "client_care_needs_reply" ||
    kind === "client_care_waiting_on_customer" ||
    kind === "client_care_open_support" ||
    kind === "client_care_stale_active_lead"
  );
}

function trustSafetyKind(kind: LeoObservationKind, flagSourceKind?: string | null): boolean {
  if (kind === "pending_reports") return true;
  if (kind === "review_queue_preview" && (flagSourceKind === "user_report" || flagSourceKind === "ai_moderation")) {
    return true;
  }
  return false;
}

function recommendedStep(kinds: LeoObservationKind[]): string | null {
  const primary = kinds[0];
  switch (primary) {
    case "leads_needing_reply":
    case "client_care_needs_reply":
      return "Open Launch Leads inbox for new/needs_reply items.";
    case "client_care_follow_up_overdue":
    case "client_care_follow_up_due":
      return "Open Launch Leads inbox and handle scheduled follow-ups.";
    case "client_care_waiting_on_customer":
      return "Monitor waiting_on_client leads; do not invent chase deadlines.";
    case "client_care_stale_active_lead":
      return "Review stale active leads; set or clear follow_up_at deliberately.";
    case "client_care_open_support":
      return "Open Admin support tickets and update or close as appropriate.";
    case "pending_listings_review":
    case "review_queue_preview":
      return "Open classifieds review queue.";
    case "pending_reports":
      return "Open listing reports queue.";
    case "listings_expiring_soon":
    case "listings_expired":
      return "Inspect expiration in classifieds queue (best-effort sample).";
    case "users_needing_help_proxy":
      return "Treat as proxy only — inspect users/support with real ticket truth.";
    case "snapshot_limitation":
    case "client_care_limitation":
      return "Do not treat as an emergency — source is outside AdminDashboardSnapshot.";
    case "executive_reporting":
      return "Open Executive Reports in Command Center, then the canonical admin route.";
    default:
      return null;
  }
}

function worstAvailability(
  a: LeoObservation["availability"],
  b: LeoObservation["availability"],
): LeoObservation["availability"] {
  const rank: Record<LeoObservation["availability"], number> = {
    LIVE: 0,
    PARTIAL: 1,
    UNKNOWN: 2,
    UNAVAILABLE: 3,
  };
  return rank[a] >= rank[b] ? a : b;
}

/**
 * Deterministic root-cause grouping.
 * Groups only when the same rootCauseKey is shared — never semantic similarity.
 */
export function groupLeoAttentionCandidates(observations: LeoObservation[]): Candidate[] {
  const map = new Map<string, Candidate>();

  for (const obs of observations) {
    if (isAggregateZero(obs)) continue;

    const key = rootCauseKeyFor(obs);
    const existing = map.get(key);
    const count =
      typeof obs.count === "number"
        ? obs.count
        : (obs.kind === "review_queue_preview" || obs.kind.startsWith("client_care_")) &&
            obs.entityRef?.id
          ? 1
          : null;

    if (!existing) {
      map.set(key, {
        rootCauseKey: key,
        title: obs.title,
        summary: obs.summary,
        kinds: [obs.kind],
        sourceKeys: [obs.key],
        observations: [obs],
        affectedCount: count,
        customerFacing: customerFacingKind(obs.kind),
        revenueEvidence: false,
        mayRequireOwnerAttention: obs.mayRequireOwnerAttention === true,
        availabilityWorst: obs.availability,
        limitationNotes: nonEmpty(obs.limitationNote) ? [obs.limitationNote!] : [],
        oldestObservedAtMs: obs.provenance.observedAt
          ? Date.parse(obs.provenance.observedAt)
          : null,
      });
      continue;
    }

    existing.sourceKeys.push(obs.key);
    existing.observations.push(obs);
    if (!existing.kinds.includes(obs.kind)) existing.kinds.push(obs.kind);
    existing.availabilityWorst = worstAvailability(existing.availabilityWorst, obs.availability);
    existing.mayRequireOwnerAttention = existing.mayRequireOwnerAttention || obs.mayRequireOwnerAttention === true;
    existing.customerFacing = existing.customerFacing || customerFacingKind(obs.kind);
    if (nonEmpty(obs.limitationNote)) existing.limitationNotes.push(obs.limitationNote!);

    if (obs.provenance.observedAt) {
      const t = Date.parse(obs.provenance.observedAt);
      if (Number.isFinite(t)) {
        existing.oldestObservedAtMs =
          existing.oldestObservedAtMs == null ? t : Math.min(existing.oldestObservedAtMs, t);
      }
    }

    if (count != null) {
      existing.affectedCount = (existing.affectedCount ?? 0) + count;
    }

    // Prefer a clearer group title for multi-item review previews.
    if (obs.kind === "review_queue_preview" && existing.observations.length > 1) {
      const flag = nonEmpty(obs.flagSourceKind) ?? "unspecified";
      existing.title = `Review queue items (${flag})`;
      existing.summary = `${existing.affectedCount ?? existing.observations.length} review-queue preview rows share flag source "${flag}".`;
    }
    if (obs.kind.startsWith("client_care_") && existing.observations.length > 1) {
      existing.title = `Client care — ${obs.kind.replace(/^client_care_/, "").replace(/_/g, " ")}`;
      existing.summary = `${existing.affectedCount ?? existing.observations.length} client-care signals share kind ${obs.kind}.`;
    }
  }

  return [...map.values()].sort((a, b) => a.rootCauseKey.localeCompare(b.rootCauseKey));
}

function scoreCandidate(c: Candidate, nowMs: number): {
  score: number;
  factors: LeoAttentionFactor[];
  informational: boolean;
} {
  const factors: LeoAttentionFactor[] = [];
  const informational =
    c.availabilityWorst === "UNAVAILABLE" ||
    c.kinds.every((k) => k === "snapshot_limitation" || k === "users_needing_help_proxy") ||
    c.observations.every(isInformationalOnly);

  if (informational) {
    factors.push({
      factor: "informational_only",
      value: 2,
      evidence: `availability=${c.availabilityWorst}; kinds=${c.kinds.join(",")}`,
      reason: "Source is unavailable, proxy, or an explicit snapshot limitation — not treated as an emergency.",
    });
    return { score: 2, factors, informational: true };
  }

  let score = 0;
  factors.push({
    factor: "actionability",
    value: ATTENTION_WEIGHTS.actionabilityBase,
    evidence: `kinds=${c.kinds.join(",")}`,
    reason: "Observation represents an actionable operational signal.",
  });
  score += ATTENTION_WEIGHTS.actionabilityBase;

  const count = c.affectedCount ?? 0;
  if (count > 0) {
    const countPts = Math.min(count * ATTENTION_WEIGHTS.countPerUnit, ATTENTION_WEIGHTS.countCap);
    factors.push({
      factor: "count_tier",
      value: countPts,
      evidence: `affectedCount=${count}`,
      reason: "Verified affected count increases operational attention (capped; not dollar impact).",
    });
    score += countPts;
  }

  if (c.kinds.some((k) => trustSafetyKind(k, c.observations[0]?.flagSourceKind))) {
    factors.push({
      factor: "trust_safety",
      value: ATTENTION_WEIGHTS.trustSafety,
      evidence: "pending reports and/or review preview with report/AI flag source",
      reason: "Trust/safety-adjacent signal from canonical report or moderation provenance.",
    });
    score += ATTENTION_WEIGHTS.trustSafety;
  }

  if (c.kinds.includes("client_care_follow_up_overdue")) {
    factors.push({
      factor: "explicit_follow_up_overdue",
      value: ATTENTION_WEIGHTS.clientCareFollowUpOverdue,
      evidence: "client_care_follow_up_overdue from explicit follow_up_at",
      reason: "Explicit overdue follow-up increases operational attention (not invented SLA).",
    });
    score += ATTENTION_WEIGHTS.clientCareFollowUpOverdue;
  }

  if (c.customerFacing) {
    factors.push({
      factor: "customer_facing",
      value: ATTENTION_WEIGHTS.customerFacing,
      evidence: "customer-facing observation kind",
      reason: "Signal is customer-facing; severity is not invented beyond that.",
    });
    score += ATTENTION_WEIGHTS.customerFacing;
  }

  if (c.availabilityWorst === "PARTIAL") {
    factors.push({
      factor: "partial_availability",
      value: ATTENTION_WEIGHTS.partialAvailability,
      evidence: "availability=PARTIAL",
      reason: "Partial truth reduces score confidence — does not invent urgency.",
    });
    score += ATTENTION_WEIGHTS.partialAvailability;
  } else if (c.availabilityWorst === "UNKNOWN") {
    factors.push({
      factor: "unknown_availability",
      value: ATTENTION_WEIGHTS.unknownAvailability,
      evidence: "availability=UNKNOWN",
      reason: "Unknown provenance reduces score — does not invent a cause.",
    });
    score += ATTENTION_WEIGHTS.unknownAvailability;
  }

  if (c.oldestObservedAtMs != null && Number.isFinite(c.oldestObservedAtMs)) {
    const ageHours = Math.max(0, (nowMs - c.oldestObservedAtMs) / (1000 * 60 * 60));
    const buckets = Math.floor(ageHours / ATTENTION_WEIGHTS.ageBucketHours);
    const agePts = Math.min(buckets * ATTENTION_WEIGHTS.agePerBucket, ATTENTION_WEIGHTS.ageCap);
    if (agePts > 0) {
      factors.push({
        factor: "age",
        value: agePts,
        evidence: `oldestObservedAt ageHours≈${Math.round(ageHours)}`,
        reason: "Known age from observation timestamp (capped).",
      });
      score += agePts;
    }
  }

  return { score, factors, informational: false };
}

/**
 * Explicit CRITICAL rule — difficult to reach.
 * Current LEO-1 inputs do not establish outage/dollar severity; require extreme
 * trust backlog evidence only.
 */
export function matchesCriticalRule(c: Candidate, score: number): boolean {
  if (score < ATTENTION_WEIGHTS.criticalScoreFloor) return false;
  const reportCount =
    c.kinds.includes("pending_reports") && typeof c.affectedCount === "number" ? c.affectedCount : 0;
  // Extreme pending-report backlog only — still not a fabricated outage claim.
  return reportCount >= 50;
}

function toLevel(score: number, critical: boolean, informational: boolean): LeoAttentionLevel {
  if (informational) return "INFORMATIONAL";
  if (critical) return "CRITICAL";
  if (score >= ATTENTION_WEIGHTS.highScoreFloor) return "HIGH";
  if (score >= ATTENTION_WEIGHTS.normalScoreFloor) return "NORMAL";
  return "INFORMATIONAL";
}

function toDisposition(c: Candidate, informational: boolean): LeoAttentionDisposition {
  if (informational) return "INFORMATIONAL";
  if (c.mayRequireOwnerAttention) return "OWNER_ATTENTION";
  if (c.customerFacing) return "STAFF_ATTENTION";
  return "UNKNOWN_OWNER";
}

function levelRank(level: LeoAttentionLevel): number {
  switch (level) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 3;
    case "NORMAL":
      return 2;
    default:
      return 1;
  }
}

function buildItem(c: Candidate, nowMs: number): LeoAttentionItem {
  const { score, factors, informational } = scoreCandidate(c, nowMs);
  const critical = !informational && matchesCriticalRule(c, score);
  const level = toLevel(score, critical, informational);
  const ageHours =
    c.oldestObservedAtMs != null && Number.isFinite(c.oldestObservedAtMs)
      ? Math.max(0, (nowMs - c.oldestObservedAtMs) / (1000 * 60 * 60))
      : null;

  return {
    id: c.rootCauseKey,
    title: c.title,
    summary: c.summary,
    level,
    disposition: toDisposition(c, informational),
    score,
    sourceObservationKeys: [...c.sourceKeys].sort(),
    observationKinds: [...c.kinds],
    factors,
    affectedCount: c.affectedCount,
    rootCauseKey: c.rootCauseKey,
    customerFacing: c.customerFacing,
    revenueEvidence: false,
    ageHours,
    limitationNote: c.limitationNotes[0] ?? null,
    recommendedNextStep: recommendedStep(c.kinds),
  };
}

/**
 * Deterministic sort:
 * 1) score desc
 * 2) level severity desc
 * 3) oldest age first when known
 * 4) stable id tie-break
 */
export function sortLeoAttentionItems(items: LeoAttentionItem[]): LeoAttentionItem[] {
  return [...items].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const lr = levelRank(b.level) - levelRank(a.level);
    if (lr !== 0) return lr;
    const ageA = a.ageHours ?? -1;
    const ageB = b.ageHours ?? -1;
    if (ageA !== ageB) return ageB - ageA;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Build an executive attention brief from LEO observations.
 * topN is a maximum — never pads to fill.
 */
export function buildLeoAttentionBrief(
  observations: LeoObservation[],
  options: LeoAttentionEngineOptions = {},
): LeoAttentionBrief {
  const topN = Math.max(0, options.topN ?? LEO_ATTENTION_DEFAULT_TOP_N);
  const nowMs = options.nowMs ?? Date.now();
  const generatedAt = new Date(nowMs).toISOString();

  const candidates = groupLeoAttentionCandidates(observations);
  const scored = candidates.map((c) => buildItem(c, nowMs));
  const sorted = sortLeoAttentionItems(scored);

  const actionable = sorted.filter((i) => i.level !== "INFORMATIONAL");
  const informational = sorted.filter((i) => i.level === "INFORMATIONAL");

  // Prefer actionable items in the brief; fill remaining slots with informational only if room.
  const selected: LeoAttentionItem[] = [];
  for (const item of actionable) {
    if (selected.length >= topN) break;
    selected.push(item);
  }
  if (selected.length < topN) {
    for (const item of informational) {
      if (selected.length >= topN) break;
      selected.push(item);
    }
  }

  const limitations: string[] = [];
  if (observations.some((o) => o.availability === "UNAVAILABLE")) {
    limitations.push("One or more observation sources are UNAVAILABLE — not treated as emergencies.");
  }
  if (observations.some((o) => o.kind === "users_needing_help_proxy")) {
    limitations.push("Users-needing-help remains a labeled proxy, not ticket volume.");
  }
  limitations.push("No monetization/payment attention from LEO-1 snapshot (not on AdminDashboardSnapshot).");
  limitations.push("No per-listing Reason Chain N+1 — review detail remains a separate drill-down.");

  return {
    generatedAt,
    items: selected,
    totalSignalsConsidered: observations.length,
    groupsCreated: candidates.length,
    actionableCount: actionable.length,
    informationalCount: informational.length,
    topN,
    limitations,
    notClaiming: LEO_4_NOT_CLAIMING,
  };
}
