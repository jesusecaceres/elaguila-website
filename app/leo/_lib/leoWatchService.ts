/**
 * LEO-16 scheduled watch orchestration — server/cron gated, fail-soft, no external actions.
 */
import "server-only";

import { getLeoExecutiveTruthSnapshot } from "@/app/leo/_lib/leoAdminTruthAdapter";
import { buildLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionEngine";
import { listLeoAttentionAcksForOwner } from "@/app/leo/_lib/leoAttentionAckRepository";
import {
  applyOwnerDispositionsToAttentionBrief,
} from "@/app/leo/_lib/leoAttentionRuntime";
import { fetchLeoClientCareSourceRecords } from "@/app/leo/_lib/leoClientCareAdapter";
import {
  buildLeoClientCareSignals,
  leoClientCareSignalsToObservations,
} from "@/app/leo/_lib/leoClientCareWatcher";
import { listLeoCommitmentsForOwner } from "@/app/leo/_lib/leoCommitmentRepository";
import { readLeoCalendarEvents } from "@/app/leo/_lib/leoCalendarAdapter";
import { buildLeoCalendarIntelligence } from "@/app/leo/_lib/leoCalendarIntelligence";
import { triageLeoEmailMessages } from "@/app/leo/_lib/leoEmailTriageEngine";
import {
  buildLeoGmailConversationUnits,
  countLeoGmailExecutiveLabels,
  mapLeoGmailConversationToEmailCard,
} from "@/app/leo/_lib/leoGmailTriageUpgrade";
import {
  getLeoGoogleAccountEmail,
  getLeoGoogleWorkspaceConfigDiagnostic,
  isLeoGoogleWorkspaceConfigured,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { buildLeoGoogleConnectionDiagnostic } from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";
import { readLeoGmailInbox } from "@/app/leo/_lib/leoGmailAdapter";
import { buildLeoMorningBrief, resolveLeoMorningBriefTimezone } from "@/app/leo/_lib/leoMorningBrief";
import {
  applyPolicyToWatchResults,
} from "@/app/leo/_lib/leoNotificationPolicy";
import {
  dispatchLeoAlertPush,
  getLastNotifiedAtByFingerprint,
  listActiveLeoNotificationSubscriptions,
} from "@/app/leo/_lib/leoNotificationService";
import { loadLeoProjectExecutiveSnapshotForScheduledWatch } from "@/app/leo/_lib/leoProjectIntelligenceService";
import { listLeoDurableToolReceiptsForActor } from "@/app/leo/_lib/leoToolReceiptRepository";
import { isLeoGithubConfigured, isLeoVercelConfigured } from "@/app/leo/_lib/leoProjectConfig";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";
import { buildLeoSystemHealthSnapshot } from "@/app/leo/_lib/leoSystemHealth";
import {
  buildSuppressedSourceKeysFromAcks,
  runLeoWatchEngine,
} from "@/app/leo/_lib/leoWatchEngine";
import { LEO_WATCH_KINDS } from "@/app/leo/_lib/leoWatchDefinitions";
import { collectLeoExecutiveReportingSnapshot } from "@/app/leo/_lib/leoExecutiveReportingService";
import { mapExecutiveSignalsToAttentionObservations } from "@/app/leo/_lib/leoExecutiveReportingWatchPolicy";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type {
  LeoCommunicationExecutiveSnapshot,
  LeoProjectExecutiveSnapshot,
  LeoWatchCronRunSummary,
  LeoWatchResult,
} from "@/app/leo/_lib/leoTypes";

/** Server-resolved owner for cron — never from client query string. */
export function resolveLeoCronOwnerAuthUserId(): string | null {
  const id = process.env.LEO_OWNER_AUTH_USER_ID?.trim();
  return id || null;
}

async function loadCommunicationForWatch(nowMs: number): Promise<LeoCommunicationExecutiveSnapshot | null> {
  try {
    if (!isLeoGoogleWorkspaceConfigured()) return null;
    const [gmailResult, calendarResult] = await Promise.all([
      readLeoGmailInbox({ maxResults: 40 }),
      readLeoCalendarEvents({ nowMs, maxResults: 12 }),
    ]);
    const ownerEmail = getLeoGoogleAccountEmail();
    const triage = triageLeoEmailMessages({
      messages: gmailResult.messages,
      threadsById: {},
      ownerEmail,
      nowMs,
    });
    const units = buildLeoGmailConversationUnits({ messages: gmailResult.messages, triage });
    const emailCards = units.map(mapLeoGmailConversationToEmailCard);
    const calIntel = buildLeoCalendarIntelligence({
      events: calendarResult.events,
      nowMs,
      windowReadSuccessfully: calendarResult.windowReadSuccessfully,
      windowLabel: `${calendarResult.timeMin} → ${calendarResult.timeMax}`,
    });
    const config = getLeoGoogleWorkspaceConfigDiagnostic();
    const runtimeDiagnostic = buildLeoGoogleConnectionDiagnostic({
      config,
      gmailAvailability: gmailResult.availability,
      calendarAvailability: calendarResult.availability,
      gmailErrorCode: gmailResult.errorCode,
      calendarErrorCode: calendarResult.errorCode,
    });
    return {
      observedAt: new Date(nowMs).toISOString(),
      overallAvailability:
        gmailResult.availability === "AVAILABLE" && calendarResult.availability === "AVAILABLE"
          ? "AVAILABLE"
          : "PARTIAL",
      ownerQuestion: null,
      subtype: null,
      gmail: {
        availability: gmailResult.availability,
        recentMessages: gmailResult.messages,
        triage,
        errorCode: gmailResult.errorCode,
        emailCards,
        executiveCounts: countLeoGmailExecutiveLabels(emailCards),
        spokenSummary: null,
        threadEnrichment: {
          requested: 0,
          succeeded: 0,
          failed: 0,
          maxUniqueThreads: 0,
          maxConcurrency: 0,
        },
      },
      calendar: {
        availability: calendarResult.availability,
        todayEvents: calIntel.todayEvents,
        tomorrowEvents: calIntel.tomorrowEvents,
        nextEvent: calIntel.nextEvent,
        upcomingEvents: calIntel.upcomingEvents,
        errorCode: calendarResult.errorCode,
      },
      runtimeDiagnostic,
      configurationState: config,
      unknowns: [],
      limitations: [],
      notClaiming: [],
    };
  } catch {
    return null;
  }
}

async function loadProjectForWatch(nowMs: number): Promise<LeoProjectExecutiveSnapshot | null> {
  try {
    return await loadLeoProjectExecutiveSnapshotForScheduledWatch({ nowMs });
  } catch {
    return null;
  }
}

async function loadPriorFingerprints(ownerAuthUserId: string): Promise<Record<string, string>> {
  if (!isSupabaseAdminConfigured()) return {};
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leo_watch_runs")
    .select("fingerprint, watch_kind, created_at")
    .eq("owner_auth_user_id", ownerAuthUserId)
    .order("created_at", { ascending: false })
    .limit(400);
  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    const fp = String(row.fingerprint);
    if (!out[fp]) out[fp] = fp;
  }
  return out;
}

async function persistWatchRun(ownerAuthUserId: string, result: LeoWatchResult, startedAt: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("leo_watch_runs").insert({
    owner_auth_user_id: ownerAuthUserId,
    watch_kind: result.kind,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    status: result.status,
    severity: result.severity,
    fingerprint: result.fingerprint.slice(0, 512),
    changed: result.changed,
    should_notify: result.shouldNotify,
    headline: result.headline?.slice(0, 200) ?? null,
    summary: result.summary?.slice(0, 1000) ?? null,
    deep_link: result.deepLink.slice(0, 200),
    error_class: result.status === "UNAVAILABLE" ? "source_unavailable" : null,
  });
  void error;
}

export async function runLeoScheduledWatches(options?: {
  ownerAuthUserId?: string;
  nowMs?: number;
  timezone?: string | null;
  dispatchPush?: boolean;
}): Promise<LeoWatchCronRunSummary> {
  const ownerAuthUserId = options?.ownerAuthUserId?.trim() || resolveLeoCronOwnerAuthUserId();
  const nowMs = options?.nowMs ?? Date.now();
  const timezone = resolveLeoMorningBriefTimezone(options?.timezone);
  const startedAt = new Date(nowMs).toISOString();
  const errors: string[] = [];

  if (!ownerAuthUserId) {
    return {
      ranAt: startedAt,
      ownerAuthUserId: "",
      watchesEvaluated: 0,
      notificationsPrepared: 0,
      notificationsAttempted: 0,
      notificationsDelivered: 0,
      notificationsFailed: 0,
      notificationsSuppressed: 0,
      errors: ["LEO_OWNER_AUTH_USER_ID not configured"],
    };
  }

  const [
    careBundle,
    commitmentsRes,
    receiptsRes,
    acksRes,
    communication,
    project,
    reportingRes,
  ] = await Promise.allSettled([
    fetchLeoClientCareSourceRecords(),
    listLeoCommitmentsForOwner(ownerAuthUserId, { status: "OPEN", limit: 40 }),
    listLeoDurableToolReceiptsForActor(ownerAuthUserId, 20),
    listLeoAttentionAcksForOwner(ownerAuthUserId),
    loadCommunicationForWatch(nowMs),
    loadProjectForWatch(nowMs),
    collectLeoExecutiveReportingSnapshot({ nowMs }),
  ]);

  let clientCare = null;
  if (careBundle.status === "fulfilled") {
    clientCare = buildLeoClientCareSignals({
      leads: careBundle.value.leads,
      supportTickets: careBundle.value.supportTickets,
      nowMs,
      limitations: careBundle.value.limitations,
      leadsAvailability: careBundle.value.leadsAvailability,
      supportAvailability: careBundle.value.supportAvailability,
    });
  } else {
    errors.push("client_care_failed");
  }

  const reportingSnap = reportingRes.status === "fulfilled" ? reportingRes.value : null;
  if (reportingRes.status === "rejected") errors.push("executive_reporting_failed");

  let attention = null;
  try {
    const snapshot = await getLeoExecutiveTruthSnapshot();
    const observations = [...snapshot.observations];
    if (clientCare) {
      observations.push(...leoClientCareSignalsToObservations(clientCare.signals));
    }
    if (reportingSnap) {
      observations.push(...mapExecutiveSignalsToAttentionObservations(reportingSnap.signals));
    }
    const brief = buildLeoAttentionBrief(observations, { topN: 8, nowMs });
    const acks =
      acksRes.status === "fulfilled" ? acksRes.value.acks : [];
    attention = applyOwnerDispositionsToAttentionBrief({
      brief,
      acks,
      dispositionAvailability: acksRes.status === "fulfilled" ? acksRes.value.availability : "UNAVAILABLE",
      nowMs,
    });
  } catch {
    errors.push("attention_failed");
  }

  const commitments =
    commitmentsRes.status === "fulfilled" ? commitmentsRes.value.commitments : [];
  const receipts = receiptsRes.status === "fulfilled" ? receiptsRes.value.receipts : [];
  const commSnap = communication.status === "fulfilled" ? communication.value : null;
  const projectSnap = project.status === "fulfilled" ? project.value : null;

  const systemHealth = buildLeoSystemHealthSnapshot({
    nowMs,
    gmail: commSnap?.gmail.availability,
    calendar: commSnap?.calendar.availability,
    supabasePersistence: isSupabaseAdminConfigured() ? "HEALTHY" : "NOT_CONFIGURED",
    supabaseConfigured: isSupabaseAdminConfigured(),
    googleWorkspaceConfigured: isLeoGoogleWorkspaceConfigured(),
    githubConfigured: isLeoGithubConfigured(),
    vercelConfigured: isLeoVercelConfigured(),
    webPushConfigured: isWebPushConfigured(),
    commitmentPersistence:
      commitmentsRes.status === "fulfilled" && commitmentsRes.value.availability === "AVAILABLE"
        ? "HEALTHY"
        : "UNAVAILABLE",
    receiptPersistence:
      receiptsRes.status === "fulfilled" && receiptsRes.value.availability === "AVAILABLE"
        ? "HEALTHY"
        : "UNAVAILABLE",
    watchPersistence: isSupabaseAdminConfigured() ? "HEALTHY" : "NOT_CONFIGURED",
    reportingAdapters: reportingSnap?.adapterHealth.map((h) => ({
      domain: h.domain,
      label: h.label,
      availability: h.availability,
    })),
  });

  const morningBrief = buildLeoMorningBrief({
    nowMs,
    timezone,
    attention: attention
      ? { availability: "AVAILABLE", brief: attention }
      : { availability: "UNAVAILABLE", brief: null, limitation: "Attention unavailable." },
    clientCare: clientCare
      ? { availability: "AVAILABLE", watch: clientCare }
      : { availability: "UNAVAILABLE", watch: null, limitation: "Client care unavailable." },
    communication: commSnap
      ? { availability: "AVAILABLE", snapshot: commSnap }
      : { availability: "UNAVAILABLE", snapshot: null, limitation: "Communication unavailable." },
    commitments: {
      availability: commitmentsRes.status === "fulfilled" ? commitmentsRes.value.availability : "UNAVAILABLE",
      commitments,
    },
    receipts: {
      availability: receiptsRes.status === "fulfilled" ? receiptsRes.value.availability : "UNAVAILABLE",
      receipts,
    },
    project: projectSnap
      ? { availability: "AVAILABLE", snapshot: projectSnap }
      : { availability: "UNAVAILABLE", snapshot: null, limitation: "Project intelligence unavailable." },
    executiveReporting: reportingSnap
      ? {
          availability:
            reportingSnap.overallAvailability === "UNAVAILABLE"
              ? "UNAVAILABLE"
              : reportingSnap.overallAvailability === "NOT_IMPLEMENTED"
                ? "NOT_CONFIGURED"
                : reportingSnap.overallAvailability === "EMPTY"
                  ? "EMPTY"
                  : reportingSnap.overallAvailability === "PARTIAL"
                    ? "PARTIAL"
                    : "AVAILABLE",
          attention: reportingSnap.attention
            .filter((s) => !["LEADS", "CLIENTS", "CONTACTS", "NEWSLETTER"].includes(s.domain))
            .slice(0, 4)
            .map((s) => ({
              title: s.title,
              summary: s.summary,
              domain: s.domain,
              severity: s.severity,
              evidenceRef: s.signalId,
              deepLink: s.deepLink ?? null,
            })),
          limitation:
            reportingSnap.overallAvailability === "UNAVAILABLE"
              ? "Company-wide admin reporting unavailable."
              : null,
        }
      : {
          availability: "UNAVAILABLE",
          attention: [],
          limitation: "Company-wide admin reporting unavailable.",
        },
  });

  const acks = acksRes.status === "fulfilled" ? acksRes.value.acks : [];
  const suppressedKeys = buildSuppressedSourceKeysFromAcks(
    acks.map((a) => ({
      sourceKind: a.sourceKind,
      sourceKey: a.sourceKey,
      disposition: a.disposition,
      snoozeUntil: a.snoozeUntil,
      expiresAt: a.expiresAt,
    })),
    nowMs,
  );

  const priorFingerprints = await loadPriorFingerprints(ownerAuthUserId);
  const engineOut = runLeoWatchEngine({
    nowMs,
    timezone,
    priorFingerprints,
    suppressedSourceKeys: suppressedKeys,
    morningBrief,
    clientCare,
    communication: commSnap,
    commitments,
    receipts,
    attention,
    project: projectSnap,
    systemHealth,
    executiveReporting: reportingSnap
      ? { signals: reportingSnap.signals, adapterHealth: reportingSnap.adapterHealth }
      : null,
  });

  const subs = await listActiveLeoNotificationSubscriptions(ownerAuthUserId);
  const lastNotified = await getLastNotifiedAtByFingerprint(ownerAuthUserId);
  const policyResults = applyPolicyToWatchResults(engineOut.results, {
    nowMs,
    timezone,
    hasSubscription: subs.length > 0,
    lastNotifiedByFingerprint: lastNotified,
  });

  let notificationsPrepared = 0;
  let notificationsAttempted = 0;
  let notificationsDelivered = 0;
  let notificationsFailed = 0;
  let notificationsSuppressed = 0;

  for (const result of policyResults) {
    await persistWatchRun(ownerAuthUserId, result, startedAt);
    if (result.shouldNotify) {
      notificationsPrepared += 1;
      if (options?.dispatchPush !== false) {
        const stats = await dispatchLeoAlertPush({ ownerAuthUserId, result });
        notificationsAttempted += stats.attempted;
        notificationsDelivered += stats.delivered;
        notificationsFailed += stats.failed;
      }
    } else if (result.changed) {
      notificationsSuppressed += 1;
    }
  }

  return {
    ranAt: startedAt,
    ownerAuthUserId,
    watchesEvaluated: LEO_WATCH_KINDS.length,
    notificationsPrepared,
    notificationsAttempted,
    notificationsDelivered,
    notificationsFailed,
    notificationsSuppressed,
    errors,
  };
}
