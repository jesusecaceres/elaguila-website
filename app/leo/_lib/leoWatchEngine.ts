/**
 * LEO-16 watch engine — pure deterministic evaluation over canonical snapshots.
 * No DB, network, AI, or external calls.
 */
import {
  cardDueStateForCommitment,
  isCandidateCommitment,
  isConfirmedOwnerCommitment,
} from "@/app/leo/_lib/leoCommitmentIntelligence";
import { isLeoAttentionAckSuppressing } from "@/app/leo/_lib/leoPersistenceSemantics";
import { leoSystemHealthFingerprint } from "@/app/leo/_lib/leoSystemHealth";
import { stableWatchFingerprint } from "@/app/leo/_lib/leoNotificationPolicy";
import { LEO_MORNING_BRIEF_WINDOW } from "@/app/leo/_lib/leoWatchDefinitions";
import { mapExecutiveReportingToWatchCandidates } from "@/app/leo/_lib/leoExecutiveReportingWatchPolicy";
import type {
  LeoWatchEngineInput,
  LeoWatchEngineOutput,
  LeoWatchResult,
  LeoWatchSeverity,
} from "@/app/leo/_lib/leoTypes";

const DEEP_LINK = "/admin/leo";

function ymdInTimezone(nowMs: number, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(nowMs));
  } catch {
    return new Date(nowMs).toISOString().slice(0, 10);
  }
}

function hourInTimezone(nowMs: number, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date(nowMs));
    const h = parts.find((p) => p.type === "hour")?.value;
    const n = h != null ? Number(h) : NaN;
    return Number.isFinite(n) ? n : new Date(nowMs).getUTCHours();
  } catch {
    return new Date(nowMs).getUTCHours();
  }
}

function baseResult(
  partial: Omit<LeoWatchResult, "generatedAt" | "changed" | "shouldNotify" | "deepLink" | "suppressionReason"> & {
    deepLink?: string;
  },
  input: LeoWatchEngineInput,
): LeoWatchResult {
  const prior = input.priorFingerprints[partial.fingerprint];
  const changed = prior == null || prior !== partial.fingerprint;
  const deepLink =
    partial.deepLink &&
    partial.deepLink.startsWith("/admin") &&
    !partial.deepLink.startsWith("//") &&
    !partial.deepLink.includes("://")
      ? partial.deepLink.split("#")[0].slice(0, 200)
      : DEEP_LINK;
  return {
    ...partial,
    generatedAt: new Date(input.nowMs).toISOString(),
    changed,
    shouldNotify: changed && partial.severity !== "INFORMATIONAL",
    deepLink,
    suppressionReason: null,
  };
}

function suppressed(input: LeoWatchEngineInput, sourceKey: string): boolean {
  return input.suppressedSourceKeys.has(sourceKey);
}

function evaluateMorningBrief(input: LeoWatchEngineInput): LeoWatchResult[] {
  const brief = input.morningBrief;
  if (!brief) {
    return [
      baseResult(
        {
          kind: "MORNING_BRIEF",
          status: "UNAVAILABLE",
          severity: "INFORMATIONAL",
          fingerprint: stableWatchFingerprint(["MORNING_BRIEF", "unavailable"]),
          headline: "Morning brief unavailable",
          summary: "Morning brief could not be generated from available sources.",
          evidenceRefs: [],
          limitations: ["Morning brief source unavailable."],
          notificationCategory: "morning_brief",
        },
        input,
      ),
    ];
  }

  const dayKey = ymdInTimezone(input.nowMs, input.timezone);
  const priorityKeys = brief.topPriorities
    .slice(0, 5)
    .map((p) => p.evidenceRef ?? p.cardId ?? p.what)
    .sort()
    .join("|");
  const fingerprint = stableWatchFingerprint([
    "MORNING_BRIEF",
    dayKey,
    brief.overallState,
    priorityKeys,
  ]);

  const h = hourInTimezone(input.nowMs, input.timezone);
  const inWindow = h >= LEO_MORNING_BRIEF_WINDOW.startHour && h < LEO_MORNING_BRIEF_WINDOW.endHour;

  const result = baseResult(
    {
      kind: "MORNING_BRIEF",
      status: "OK",
      severity: brief.topPriorities.some((p) => p.priority === "DO_NOW") ? "HIGH" : "NORMAL",
      fingerprint,
      headline: brief.headline.slice(0, 200),
      summary: brief.spokenSummary.slice(0, 500),
      evidenceRefs: brief.topPriorities.map((p) => p.evidenceRef ?? p.cardId).filter(Boolean) as string[],
      limitations: brief.limitations.slice(0, 5),
      notificationCategory: "morning_brief",
    },
    input,
  );

  if (!inWindow) {
    return [{ ...result, shouldNotify: false, suppressionReason: "outside_morning_brief_window" }];
  }
  return [result];
}

function evaluateClientCare(input: LeoWatchEngineInput): LeoWatchResult[] {
  const watch = input.clientCare;
  if (!watch) {
    return [
      baseResult(
        {
          kind: "CLIENT_CARE",
          status: "UNAVAILABLE",
          severity: "INFORMATIONAL",
          fingerprint: stableWatchFingerprint(["CLIENT_CARE", "unavailable"]),
          headline: "Client care unavailable",
          summary: "Client care watch could not run.",
          evidenceRefs: [],
          limitations: ["Client care source unavailable."],
          notificationCategory: "watch",
        },
        input,
      ),
    ];
  }

  const out: LeoWatchResult[] = [];
  for (const signal of watch.signals) {
    if (!signal.attentionEligible) continue;
    const sourceKey = `client_care:${signal.key}`;
    if (suppressed(input, sourceKey)) continue;

    const severity: LeoWatchSeverity =
      signal.kind === "FOLLOW_UP_OVERDUE" ? "CRITICAL" : signal.kind === "NEEDS_REPLY" ? "HIGH" : "NORMAL";
    const fingerprint = stableWatchFingerprint([
      "CLIENT_CARE",
      signal.key,
      signal.kind,
      signal.entityRef?.id ?? signal.key,
    ]);

    out.push(
      baseResult(
        {
          kind: "CLIENT_CARE",
          status: "OK",
          severity,
          fingerprint,
          headline: signal.title.slice(0, 200),
          summary: signal.summary.slice(0, 500),
          evidenceRefs: [signal.key],
          limitations: signal.limitationNote ? [signal.limitationNote] : [],
          notificationCategory: severity === "CRITICAL" ? "critical" : "needs_you",
          eligibleOutsideQuietHours: severity === "CRITICAL",
        },
        input,
      ),
    );
  }
  return out;
}

function evaluateCommunication(input: LeoWatchEngineInput): LeoWatchResult[] {
  const comm = input.communication;
  if (!comm) {
    return [
      baseResult(
        {
          kind: "COMMUNICATION",
          status: "UNAVAILABLE",
          severity: "INFORMATIONAL",
          fingerprint: stableWatchFingerprint(["COMMUNICATION", "unavailable"]),
          headline: "Email watch unavailable",
          summary: "Gmail intelligence is unavailable.",
          evidenceRefs: [],
          limitations: ["Communication snapshot unavailable."],
          notificationCategory: "watch",
        },
        input,
      ),
    ];
  }

  const out: LeoWatchResult[] = [];
  for (const card of comm.gmail.emailCards ?? []) {
    const label = card.attentionLabel ?? "UNKNOWN";
    if (label === "AUTOMATED" || label === "INFORMATIONAL") continue;

    const messageId = card.messageId ?? card.cardId;
    const sourceKey = `email:${messageId}`;
    if (suppressed(input, sourceKey)) continue;

    const severity: LeoWatchSeverity =
      label === "WAITING_ON_US" ? "HIGH" : label === "LIKELY_REPLY_NEEDED" ? "HIGH" : "NORMAL";
    const fingerprint = stableWatchFingerprint(["COMMUNICATION", messageId, label]);

    out.push(
      baseResult(
        {
          kind: "COMMUNICATION",
          status: "OK",
          severity,
          fingerprint,
          headline: (card.subject ?? card.title).slice(0, 200),
          summary: "New email may need your reply.".slice(0, 500),
          evidenceRefs: [messageId],
          limitations: [],
          notificationCategory: "needs_you",
        },
        input,
      ),
    );
  }
  return out;
}

function evaluateCommitments(input: LeoWatchEngineInput): LeoWatchResult[] {
  const commitments = input.commitments ?? [];
  const out: LeoWatchResult[] = [];

  for (const c of commitments) {
    if (c.status !== "OPEN") continue;
    const dueState = cardDueStateForCommitment(c, input.nowMs);
    const sourceKey = `commitment:${c.id}`;
    if (suppressed(input, sourceKey)) continue;

    if (isConfirmedOwnerCommitment(c)) {
      if (dueState !== "OVERDUE" && dueState !== "DUE_TODAY" && dueState !== "DUE_SOON") continue;
      const severity: LeoWatchSeverity =
        dueState === "OVERDUE" ? "CRITICAL" : dueState === "DUE_TODAY" ? "HIGH" : "NORMAL";
      const fingerprint = stableWatchFingerprint(["COMMITMENTS", c.id, "EXPLICIT_OWNER", dueState, c.status]);

      out.push(
        baseResult(
          {
            kind: "COMMITMENTS",
            status: "OK",
            severity,
            fingerprint,
            headline:
              dueState === "OVERDUE"
                ? `Overdue commitment: ${c.title}`.slice(0, 200)
                : `Commitment due: ${c.title}`.slice(0, 200),
            summary:
              dueState === "OVERDUE"
                ? "A confirmed owner commitment is overdue."
                : dueState === "DUE_TODAY"
                  ? "A confirmed commitment is due today."
                  : "A confirmed commitment is due soon.",
            evidenceRefs: [c.id],
            limitations: [],
            notificationCategory: dueState === "OVERDUE" ? "critical" : "needs_you",
            eligibleOutsideQuietHours: dueState === "OVERDUE",
          },
          input,
        ),
      );
    } else if (isCandidateCommitment(c) && dueState === "OVERDUE") {
      const fingerprint = stableWatchFingerprint(["COMMITMENTS", c.id, "EXTRACTED_CANDIDATE", dueState]);
      out.push(
        baseResult(
          {
            kind: "COMMITMENTS",
            status: "OK",
            severity: "NORMAL",
            fingerprint,
            headline: `Possible commitment needs confirmation`.slice(0, 200),
            summary: `"${c.title}" may be overdue — confirm before treating as a promise.`.slice(0, 500),
            evidenceRefs: [c.id],
            limitations: ["Candidate commitment — not a confirmed promise."],
            notificationCategory: "watch",
          },
          input,
        ),
      );
    }
  }
  return out;
}

function evaluateReceipts(input: LeoWatchEngineInput): LeoWatchResult[] {
  const receipts = input.receipts ?? [];
  const out: LeoWatchResult[] = [];

  for (const r of receipts) {
    const sourceKey = `receipt:${r.id}`;
    if (suppressed(input, sourceKey)) continue;

    if (r.lifecycleState === "PREPARED") continue;

    if (
      r.lifecycleState !== "FAILED" &&
      r.lifecycleState !== "AWAITING_APPROVAL" &&
      r.lifecycleState !== "NOT_EXECUTED"
    ) {
      continue;
    }

    const severity: LeoWatchSeverity =
      r.lifecycleState === "FAILED" ? "HIGH" : r.lifecycleState === "AWAITING_APPROVAL" ? "HIGH" : "NORMAL";
    const fingerprint = stableWatchFingerprint(["ACTION_RECEIPTS", r.id, r.lifecycleState]);

    out.push(
      baseResult(
        {
          kind: "ACTION_RECEIPTS",
          status: "OK",
          severity,
          fingerprint,
          headline:
            r.lifecycleState === "FAILED"
              ? `LEO action failed: ${r.actionType}`.slice(0, 200)
              : r.lifecycleState === "AWAITING_APPROVAL"
                ? `Approval needed: ${r.actionType}`.slice(0, 200)
                : `LEO action not executed: ${r.actionType}`.slice(0, 200),
          summary:
            r.lifecycleState === "FAILED"
              ? "A LEO action failed and may need review."
              : r.lifecycleState === "AWAITING_APPROVAL"
                ? "A prepared LEO action awaits your approval."
                : "A LEO action was not executed.",
          evidenceRefs: [r.id],
          limitations: [],
          notificationCategory: "needs_you",
        },
        input,
      ),
    );
  }
  return out;
}

function evaluateAttention(input: LeoWatchEngineInput): LeoWatchResult[] {
  const brief = input.attention;
  if (!brief) {
    return [
      baseResult(
        {
          kind: "ATTENTION",
          status: "UNAVAILABLE",
          severity: "INFORMATIONAL",
          fingerprint: stableWatchFingerprint(["ATTENTION", "unavailable"]),
          headline: "Attention watch unavailable",
          summary: "Attention brief unavailable.",
          evidenceRefs: [],
          limitations: [],
          notificationCategory: "watch",
        },
        input,
      ),
    ];
  }

  const items = brief.items ?? [];
  const out: LeoWatchResult[] = [];

  for (const item of items) {
    if (item.level === "INFORMATIONAL") continue;
    const sourceKey = `attention:${item.id}`;
    if (suppressed(input, sourceKey)) continue;
    if (item.id.startsWith("executive_signal:")) continue;

    const severity: LeoWatchSeverity =
      item.level === "CRITICAL" ? "CRITICAL" : item.level === "HIGH" ? "HIGH" : "NORMAL";
    const fingerprint = stableWatchFingerprint(["ATTENTION", item.id, item.level]);

    out.push(
      baseResult(
        {
          kind: "ATTENTION",
          status: "OK",
          severity,
          fingerprint,
          headline: item.title.slice(0, 200),
          summary: item.summary.slice(0, 500),
          evidenceRefs: [item.id],
          limitations: item.limitationNote ? [item.limitationNote] : [],
          notificationCategory: severity === "CRITICAL" ? "critical" : "needs_you",
          eligibleOutsideQuietHours: severity === "CRITICAL",
        },
        input,
      ),
    );
  }
  return out;
}

function evaluateProjectHealth(input: LeoWatchEngineInput): LeoWatchResult[] {
  const project = input.project;
  if (!project) {
    return [
      baseResult(
        {
          kind: "PROJECT_HEALTH",
          status: "UNAVAILABLE",
          severity: "INFORMATIONAL",
          fingerprint: stableWatchFingerprint(["PROJECT_HEALTH", "unavailable"]),
          headline: "Project health unavailable",
          summary: "Project intelligence unavailable.",
          evidenceRefs: [],
          limitations: [],
          notificationCategory: "watch",
        },
        input,
      ),
    ];
  }

  const qa = project.qaAdvice;
  if (!qa || qa.state === "NO_PROJECT_ACTION" || qa.state === "UNKNOWN") {
    return [];
  }

  const needsAttention = /review|mismatch|failed|behind|ahead|qa|investigate|wait/i.test(qa.summary ?? "");
  if (!needsAttention) return [];

  const fingerprint = stableWatchFingerprint([
    "PROJECT_HEALTH",
    project.leoHead.sha ?? "none",
    qa.state,
    (qa.summary ?? "").slice(0, 80),
  ]);

  return [
    baseResult(
      {
        kind: "PROJECT_HEALTH",
        status: "DEGRADED",
        severity: "HIGH",
        fingerprint,
        headline: (qa.summary ?? "Project may need attention").slice(0, 200),
        summary: (qa.nextStep ?? "Review project/deployment state in LEO.").slice(0, 500),
        evidenceRefs: [project.leoHead.sha ?? "project"],
        limitations: project.notClaiming.slice(0, 3),
        notificationCategory: "watch",
      },
      input,
    ),
  ];
}

function evaluateSystemHealth(input: LeoWatchEngineInput): LeoWatchResult[] {
  const health = input.systemHealth;
  if (!health) return [];

  const fp = leoSystemHealthFingerprint(health);
  if (fp === "SYSTEM_HEALTH:healthy") return [];

  const degraded = health.components.filter(
    (c) => c.state === "DEGRADED" || c.state === "UNAVAILABLE",
  );
  const headline =
    degraded[0]?.ownerMessage ??
    degraded[0]?.label ??
    "Some LEO systems are degraded";

  return [
    baseResult(
      {
        kind: "SYSTEM_HEALTH",
        status: health.overall === "UNAVAILABLE" ? "UNAVAILABLE" : "DEGRADED",
        severity: health.overall === "UNAVAILABLE" ? "CRITICAL" : "HIGH",
        fingerprint: fp,
        headline: headline.slice(0, 200),
        summary: degraded.map((c) => c.label).join(", ").slice(0, 500),
        evidenceRefs: degraded.map((c) => c.key),
        limitations: health.limitations,
        notificationCategory: "watch",
        eligibleOutsideQuietHours: health.overall === "UNAVAILABLE",
      },
      input,
    ),
  ];
}

function evaluateExecutiveReporting(input: LeoWatchEngineInput): LeoWatchResult[] {
  const snap = input.executiveReporting;
  if (!snap) return [];

  const candidates = mapExecutiveReportingToWatchCandidates(snap);
  const out: LeoWatchResult[] = [];

  for (const cand of candidates) {
    if (suppressed(input, cand.sourceKey) || suppressed(input, cand.signalId)) continue;
    out.push(
      baseResult(
        {
          kind: "EXECUTIVE_REPORTING",
          status: cand.status,
          severity: cand.severity,
          fingerprint: cand.fingerprint,
          headline: cand.headline,
          summary: cand.summary,
          evidenceRefs: cand.evidenceRefs,
          limitations: [],
          notificationCategory: cand.severity === "CRITICAL" ? "critical" : "needs_you",
          eligibleOutsideQuietHours: cand.eligibleOutsideQuietHours,
          deepLink: cand.deepLink,
        },
        input,
      ),
    );
  }

  return out.map((result) => {
    const cand = candidates.find((c) => c.fingerprint === result.fingerprint);
    if (cand && !cand.pushEligible) {
      return { ...result, shouldNotify: false, suppressionReason: "report_only" };
    }
    return result;
  });
}

function suppressExecutiveReportingCoveredByMorningBrief(
  results: LeoWatchResult[],
  input: LeoWatchEngineInput,
): LeoWatchResult[] {
  const morning = results.find((r) => r.kind === "MORNING_BRIEF");
  if (!morning?.shouldNotify) return results;
  const covered = new Set(
    (input.morningBrief?.topPriorities ?? [])
      .map((p) => p.evidenceRef)
      .filter((v): v is string => Boolean(v)),
  );
  if (covered.size === 0) return results;
  return results.map((result) => {
    if (result.kind !== "EXECUTIVE_REPORTING") return result;
    const signalId = result.evidenceRefs[0];
    if (signalId && covered.has(signalId)) {
      return { ...result, shouldNotify: false, suppressionReason: "covered_by_morning_brief" };
    }
    return result;
  });
}

/** Pure watch evaluation — all kinds, fail-soft per source. */
export function runLeoWatchEngine(input: LeoWatchEngineInput): LeoWatchEngineOutput {
  const limitations: string[] = [
    "Scheduled watches observe — they do not execute external actions.",
    "Notifications inform — delivery to push provider is not proof the owner saw them.",
  ];

  const results: LeoWatchResult[] = suppressExecutiveReportingCoveredByMorningBrief(
    [
      ...evaluateMorningBrief(input),
      ...evaluateClientCare(input),
      ...evaluateCommunication(input),
      ...evaluateCommitments(input),
      ...evaluateReceipts(input),
      ...evaluateAttention(input),
      ...evaluateProjectHealth(input),
      ...evaluateSystemHealth(input),
      ...evaluateExecutiveReporting(input),
    ],
    input,
  );

  return { results, limitations };
}

/** Build suppressed source keys from attention ack records. */
export function buildSuppressedSourceKeysFromAcks(
  acks: Array<{
    sourceKind: string;
    sourceKey: string;
    disposition: string;
    snoozeUntil?: string | null;
    expiresAt?: string | null;
  }>,
  nowMs: number,
): Set<string> {
  const out = new Set<string>();
  for (const ack of acks) {
    if (
      isLeoAttentionAckSuppressing(
        {
          id: "",
          ownerAuthUserId: "",
          sourceKind: ack.sourceKind,
          sourceKey: ack.sourceKey,
          disposition: ack.disposition as "ACKNOWLEDGED" | "DISMISSED" | "SNOOZED",
          snoozeUntil: ack.snoozeUntil ?? null,
          note: null,
          createdAt: "",
          updatedAt: "",
          expiresAt: ack.expiresAt ?? null,
        },
        nowMs,
      )
    ) {
      out.add(`${ack.sourceKind}:${ack.sourceKey}`);
      out.add(ack.sourceKey);
    }
  }
  return out;
}

export function resolveSafeLeoAlertPath(answerPath: string | null | undefined): string {
  const raw = String(answerPath ?? "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return DEEP_LINK;
  }
  if (raw === DEEP_LINK || raw.startsWith(`${DEEP_LINK}?`) || raw.startsWith(`${DEEP_LINK}/`)) {
    return raw.split("#")[0].slice(0, 200);
  }
  return DEEP_LINK;
}
