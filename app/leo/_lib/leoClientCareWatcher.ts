/**
 * LEO-5 Client Care Watcher — pure deterministic care-signal derivation.
 *
 * No DB, no AI, no Living Book writes, no outreach.
 */
import type {
  LeoClientCareSignal,
  LeoClientCareSignalKind,
  LeoClientCareSource,
  LeoClientCareWaitingParty,
  LeoClientCareWatchResult,
  LeoEntityRef,
  LeoObservation,
  LeoObservationKind,
  LeoProvenance,
  LeoTruthAvailability,
} from "@/app/leo/_lib/leoTypes";

/** Centralized LEO operational policy — not customer SLA / promise language. */
export const LEO_CLIENT_CARE_POLICY = {
  /** Max active launch leads loaded per adapter pass. */
  maxLeadRows: 100,
  /** Max open/in_progress support tickets loaded per adapter pass. */
  maxSupportRows: 50,
  /**
   * Upcoming follow-up window (hours). LEO operational policy — not a customer promise.
   * follow_up_at within [now, now+window] → FOLLOW_UP_DUE (still active).
   */
  followUpDueWindowHours: 24,
  /**
   * HEURISTIC: active lead with no recent contact older than this many days
   * → STALE_ACTIVE_LEAD. Not an SLA. Not a missed commitment.
   */
  staleActiveLeadDays: 14,
} as const;

const LEO_5_NOT_CLAIMING = [
  "Not inventing customer SLA breaches",
  "Not inventing missed commitments without explicit follow_up_at",
  "Not inventing churn, sentiment, or revenue risk",
  "Not treating Living Book memories as commitments",
  "Not sending email/SMS/notifications",
  "Not writing Living Book memory from care detection",
] as const;

/** Canonical Admin dashboard needs-reply rule (status ∈ new | needs_reply). */
export const CANONICAL_NEEDS_REPLY_STATUSES = ["new", "needs_reply"] as const;

const CLOSED_LEAD_STATUSES = new Set(["won", "lost", "archived", "closed"]);

/** Dedup precedence — strongest wins per entity. */
const SIGNAL_PRECEDENCE: Record<LeoClientCareSignalKind, number> = {
  FOLLOW_UP_OVERDUE: 100,
  FOLLOW_UP_DUE: 90,
  NEEDS_REPLY: 80,
  WAITING_ON_CUSTOMER: 70,
  OPEN_SUPPORT: 60,
  STALE_ACTIVE_LEAD: 40,
  INFORMATIONAL_LIMITATION: 10,
  UNKNOWN: 5,
};

export type LeoClientCareLeadRecord = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  last_contacted_at: string | null;
  follow_up_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  /** Safe non-PII label only (e.g. inquiry_type or business category). */
  safeLabel: string | null;
};

export type LeoClientCareSupportRecord = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  /** Subject truncated for operator identity — not full body. */
  subjectLabel: string | null;
};

export type LeoClientCareWatcherInput = {
  leads: LeoClientCareLeadRecord[];
  supportTickets: LeoClientCareSupportRecord[];
  /** Injected clock for deterministic fixtures. */
  nowMs: number;
  limitations?: string[];
  leadsAvailability?: LeoTruthAvailability;
  supportAvailability?: LeoTruthAvailability;
};

function daysBetween(laterMs: number, earlierMs: number): number {
  return Math.max(0, (laterMs - earlierMs) / (1000 * 60 * 60 * 24));
}

function parseTs(v: string | null | undefined): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

export function isActiveLaunchLead(row: LeoClientCareLeadRecord): boolean {
  if (row.deleted_at) return false;
  if (row.archived_at) return false;
  const status = row.status.trim().toLowerCase();
  if (CLOSED_LEAD_STATUSES.has(status)) return false;
  return true;
}

/** Exact Admin dashboard semantics: status in new | needs_reply. */
export function isCanonicalNeedsReplyStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  return (CANONICAL_NEEDS_REPLY_STATUSES as readonly string[]).includes(s);
}

function provenance(
  sourceType: LeoProvenance["sourceType"],
  availability: LeoTruthAvailability,
  sourceId: string,
  observedAt: string,
): LeoProvenance {
  return {
    sourceSystem: "leo",
    sourceType,
    sourceId,
    observedAt,
    availability,
  };
}

function entityKey(source: LeoClientCareSource, id: string): string {
  return `${source}:${id}`;
}

function makeSignal(args: {
  kind: LeoClientCareSignalKind;
  source: LeoClientCareSource;
  entityId: string;
  entityType: LeoEntityRef["entityType"];
  title: string;
  summary: string;
  status: string;
  observedAt: string;
  createdAt: string | null;
  lastContactedAt: string | null;
  followUpAt: string | null;
  ageDays: number | null;
  overdueByDays: number | null;
  waitingParty: LeoClientCareWaitingParty | null;
  isHeuristic: boolean;
  evidence: string;
  provenance: LeoProvenance;
  limitationNote: string | null;
  recommendedNextStep: string | null;
  attentionEligible: boolean;
  categorySource?: string;
}): LeoClientCareSignal {
  return {
    key: `${args.source}:${args.entityId}:${args.kind}`,
    kind: args.kind,
    source: args.source,
    entityRef: {
      entityType: args.entityType,
      id: args.entityId,
      categorySource: args.categorySource,
    },
    title: args.title,
    summary: args.summary,
    status: args.status,
    observedAt: args.observedAt,
    createdAt: args.createdAt,
    lastContactedAt: args.lastContactedAt,
    followUpAt: args.followUpAt,
    ageDays: args.ageDays,
    overdueByDays: args.overdueByDays,
    waitingParty: args.waitingParty,
    isHeuristic: args.isHeuristic,
    evidence: args.evidence,
    provenance: args.provenance,
    limitationNote: args.limitationNote,
    recommendedNextStep: args.recommendedNextStep,
    attentionEligible: args.attentionEligible,
  };
}

function candidatesForLead(
  row: LeoClientCareLeadRecord,
  nowMs: number,
  observedAt: string,
  availability: LeoTruthAvailability,
): LeoClientCareSignal[] {
  if (!isActiveLaunchLead(row)) return [];

  const out: LeoClientCareSignal[] = [];
  const status = row.status.trim().toLowerCase();
  const label = row.safeLabel?.trim() || "Launch lead";
  const createdMs = parseTs(row.created_at);
  const ageDays = createdMs != null ? daysBetween(nowMs, createdMs) : null;
  const prov = provenance("client_care_leads", availability, "leoClientCareAdapter", observedAt);

  const followMs = parseTs(row.follow_up_at);
  if (followMs != null) {
    if (followMs < nowMs) {
      const overdueByDays = daysBetween(nowMs, followMs);
      out.push(
        makeSignal({
          kind: "FOLLOW_UP_OVERDUE",
          source: "LEAD",
          entityId: row.id,
          entityType: "lead",
          title: `Follow-up overdue — ${label}`,
          summary: `Active launch lead has follow_up_at in the past (overdue by ~${Math.floor(overdueByDays)} day(s)).`,
          status: row.status,
          observedAt,
          createdAt: row.created_at,
          lastContactedAt: row.last_contacted_at,
          followUpAt: row.follow_up_at,
          ageDays,
          overdueByDays,
          waitingParty: null,
          isHeuristic: false,
          evidence: `explicit follow_up_at=${row.follow_up_at}; status=${row.status}; active=true`,
          provenance: prov,
          limitationNote: null,
          recommendedNextStep: "Open Launch Leads inbox and complete or reschedule the follow-up.",
          attentionEligible: true,
          categorySource: "leonix_leads",
        }),
      );
    } else {
      const hoursUntil = (followMs - nowMs) / (1000 * 60 * 60);
      if (hoursUntil <= LEO_CLIENT_CARE_POLICY.followUpDueWindowHours) {
        out.push(
          makeSignal({
            kind: "FOLLOW_UP_DUE",
            source: "LEAD",
            entityId: row.id,
            entityType: "lead",
            title: `Follow-up due — ${label}`,
            summary: `Active launch lead has follow_up_at within the LEO ${LEO_CLIENT_CARE_POLICY.followUpDueWindowHours}h operational due window.`,
            status: row.status,
            observedAt,
            createdAt: row.created_at,
            lastContactedAt: row.last_contacted_at,
            followUpAt: row.follow_up_at,
            ageDays,
            overdueByDays: null,
            waitingParty: null,
            isHeuristic: false,
            evidence: `explicit follow_up_at=${row.follow_up_at}; dueWindowHours=${LEO_CLIENT_CARE_POLICY.followUpDueWindowHours}`,
            provenance: prov,
            limitationNote: "Due window is LEO operational policy, not a customer-promised SLA.",
            recommendedNextStep: "Open Launch Leads inbox and handle the scheduled follow-up.",
            attentionEligible: true,
            categorySource: "leonix_leads",
          }),
        );
      }
    }
  }

  if (isCanonicalNeedsReplyStatus(status)) {
    out.push(
      makeSignal({
        kind: "NEEDS_REPLY",
        source: "LEAD",
        entityId: row.id,
        entityType: "lead",
        title: `Needs reply — ${label}`,
        summary: "Launch lead status is new or needs_reply (canonical Admin dashboard rule).",
        status: row.status,
        observedAt,
        createdAt: row.created_at,
        lastContactedAt: row.last_contacted_at,
        followUpAt: row.follow_up_at,
        ageDays,
        overdueByDays: null,
        waitingParty: "leonix",
        isHeuristic: false,
        evidence: `canonical status ∈ {new, needs_reply}; status=${row.status}`,
        provenance: prov,
        limitationNote: null,
        recommendedNextStep: "Open Launch Leads inbox for new/needs_reply items.",
        attentionEligible: true,
        categorySource: "leonix_leads",
      }),
    );
  }

  if (status === "waiting_on_client") {
    out.push(
      makeSignal({
        kind: "WAITING_ON_CUSTOMER",
        source: "LEAD",
        entityId: row.id,
        entityType: "lead",
        title: `Waiting on customer — ${label}`,
        summary: "Lead status explicitly waiting_on_client.",
        status: row.status,
        observedAt,
        createdAt: row.created_at,
        lastContactedAt: row.last_contacted_at,
        followUpAt: row.follow_up_at,
        ageDays,
        overdueByDays: null,
        waitingParty: "customer",
        isHeuristic: false,
        evidence: "explicit status=waiting_on_client",
        provenance: prov,
        limitationNote: null,
        recommendedNextStep: "Monitor for customer response; do not invent a chase deadline.",
        attentionEligible: true,
        categorySource: "leonix_leads",
      }),
    );
  }

  // HEURISTIC stale — only when no stronger explicit follow-up overdue will win via dedupe.
  const contactMs = parseTs(row.last_contacted_at) ?? createdMs;
  if (contactMs != null) {
    const idleDays = daysBetween(nowMs, contactMs);
    if (idleDays >= LEO_CLIENT_CARE_POLICY.staleActiveLeadDays) {
      out.push(
        makeSignal({
          kind: "STALE_ACTIVE_LEAD",
          source: "LEAD",
          entityId: row.id,
          entityType: "lead",
          title: `Stale active lead — ${label}`,
          summary: `HEURISTIC: active lead idle ≥ ${LEO_CLIENT_CARE_POLICY.staleActiveLeadDays} days since last_contacted_at or created_at.`,
          status: row.status,
          observedAt,
          createdAt: row.created_at,
          lastContactedAt: row.last_contacted_at,
          followUpAt: row.follow_up_at,
          ageDays: idleDays,
          overdueByDays: null,
          waitingParty: null,
          isHeuristic: true,
          evidence: `HEURISTIC staleActiveLeadDays=${LEO_CLIENT_CARE_POLICY.staleActiveLeadDays}; idleDays≈${Math.floor(idleDays)}; contactAnchor=${row.last_contacted_at ?? row.created_at}`,
          provenance: prov,
          limitationNote:
            "LEO operational heuristic — not an SLA and not a missed commitment. Explicit follow_up_at overdue takes precedence when present.",
          recommendedNextStep: "Review active lead; set or clear follow_up_at deliberately.",
          attentionEligible: true,
          categorySource: "leonix_leads",
        }),
      );
    }
  }

  return out;
}

function candidatesForSupport(
  row: LeoClientCareSupportRecord,
  nowMs: number,
  observedAt: string,
  availability: LeoTruthAvailability,
): LeoClientCareSignal[] {
  const status = row.status.trim().toLowerCase();
  if (status !== "open" && status !== "in_progress") return [];

  const createdMs = parseTs(row.created_at);
  const ageDays = createdMs != null ? daysBetween(nowMs, createdMs) : null;
  const label = row.subjectLabel?.trim() || "Support ticket";
  const prov = provenance("client_care_support", availability, "leoClientCareAdapter", observedAt);

  return [
    makeSignal({
      kind: "OPEN_SUPPORT",
      source: "SUPPORT_TICKET",
      entityId: row.id,
      entityType: "support_ticket",
      title: `Open support — ${label}`,
      summary: `Support ticket status is ${status}. No canonical due date/SLA exists on support_tickets.`,
      status: row.status,
      observedAt,
      createdAt: row.created_at,
      lastContactedAt: null,
      followUpAt: null,
      ageDays,
      overdueByDays: null,
      waitingParty: null,
      isHeuristic: false,
      evidence: `status=${row.status}; no due_at/SLA column on support_tickets`,
      provenance: prov,
      limitationNote: "Not an SLA breach — support_tickets has no due date or SLA field.",
      recommendedNextStep: "Open Admin support ticket list and update or close as appropriate.",
      attentionEligible: true,
      categorySource: "support_tickets",
    }),
  ];
}

/**
 * Deterministic dedupe: one strongest signal per canonical entity.
 * Underlying candidate evidence is discarded only for weaker overlapping kinds.
 */
export function dedupeLeoClientCareSignals(signals: LeoClientCareSignal[]): LeoClientCareSignal[] {
  const best = new Map<string, LeoClientCareSignal>();
  for (const s of signals) {
    const ek = entityKey(s.source, s.entityRef.id ?? s.key);
    const prev = best.get(ek);
    if (!prev) {
      best.set(ek, s);
      continue;
    }
    const pPrev = SIGNAL_PRECEDENCE[prev.kind] ?? 0;
    const pNext = SIGNAL_PRECEDENCE[s.kind] ?? 0;
    if (pNext > pPrev) {
      best.set(ek, s);
    } else if (pNext === pPrev && s.key.localeCompare(prev.key) < 0) {
      best.set(ek, s);
    }
  }
  return [...best.values()].sort((a, b) => {
    const pd = (SIGNAL_PRECEDENCE[b.kind] ?? 0) - (SIGNAL_PRECEDENCE[a.kind] ?? 0);
    if (pd !== 0) return pd;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Pure watcher: records → deduped care signals.
 */
export function buildLeoClientCareSignals(input: LeoClientCareWatcherInput): LeoClientCareWatchResult {
  const observedAt = new Date(input.nowMs).toISOString();
  const leadAvail = input.leadsAvailability ?? "LIVE";
  const supportAvail = input.supportAvailability ?? "LIVE";

  const raw: LeoClientCareSignal[] = [];
  for (const lead of input.leads) {
    raw.push(...candidatesForLead(lead, input.nowMs, observedAt, leadAvail));
  }
  for (const ticket of input.supportTickets) {
    raw.push(...candidatesForSupport(ticket, input.nowMs, observedAt, supportAvail));
  }

  const signals = dedupeLeoClientCareSignals(raw);
  const limitations = [...(input.limitations ?? [])];
  limitations.push(
    "Media kit leads and newsletter subscribers are not Client Care v0 workflow entities (no follow_up_at / needs-reply pipeline).",
  );
  limitations.push(
    "Living Book has no formal commitment record type — commitment monitoring is a future gap.",
  );
  limitations.push(
    `Lead scan bounded to ${LEO_CLIENT_CARE_POLICY.maxLeadRows} active rows; support to ${LEO_CLIENT_CARE_POLICY.maxSupportRows} open rows.`,
  );

  return {
    generatedAt: observedAt,
    signals,
    totalRecordsConsidered: input.leads.length + input.supportTickets.length,
    limitations,
    notClaiming: LEO_5_NOT_CLAIMING,
  };
}

const CARE_KIND_TO_OBS: Record<
  Exclude<LeoClientCareSignalKind, "INFORMATIONAL_LIMITATION" | "UNKNOWN">,
  LeoObservationKind
> = {
  FOLLOW_UP_OVERDUE: "client_care_follow_up_overdue",
  FOLLOW_UP_DUE: "client_care_follow_up_due",
  NEEDS_REPLY: "client_care_needs_reply",
  WAITING_ON_CUSTOMER: "client_care_waiting_on_customer",
  OPEN_SUPPORT: "client_care_open_support",
  STALE_ACTIVE_LEAD: "client_care_stale_active_lead",
};

/**
 * Normalize care signals into LEO attention observations (no scoring here).
 */
export function leoClientCareSignalsToObservations(signals: LeoClientCareSignal[]): LeoObservation[] {
  const out: LeoObservation[] = [];
  for (const s of signals) {
    if (!s.attentionEligible) continue;
    if (s.kind === "INFORMATIONAL_LIMITATION" || s.kind === "UNKNOWN") {
      out.push({
        key: s.key,
        kind: "client_care_limitation",
        title: s.title,
        summary: s.summary,
        availability: s.provenance.availability,
        provenance: s.provenance,
        count: 1,
        reasonText: s.evidence,
        entityRef: s.entityRef,
        limitationNote: s.limitationNote,
        mayRequireOwnerAttention: false,
      });
      continue;
    }
    out.push({
      key: s.key,
      kind: CARE_KIND_TO_OBS[s.kind],
      title: s.title,
      summary: s.summary,
      availability: s.provenance.availability,
      provenance: s.provenance,
      count: 1,
      reasonText: s.evidence,
      entityRef: s.entityRef,
      limitationNote: s.limitationNote,
      mayRequireOwnerAttention: s.kind === "FOLLOW_UP_OVERDUE" || s.kind === "NEEDS_REPLY",
    });
  }
  return out;
}
