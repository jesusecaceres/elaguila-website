/**
 * LEO-14.11 Morning CEO Brief service — owner-only orchestration.
 * Aggregates canonical intelligence sources with fail-soft parallel fetch.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { getLeoCommunicationExecutiveSnapshot } from "@/app/leo/_lib/leoCommunicationIntelligenceService";
import { leoListCommitments } from "@/app/leo/_lib/leoCommitmentService";
import { leoListRecentToolReceipts } from "@/app/leo/_lib/leoToolReceiptService";
import { getLeoProjectExecutiveSnapshot } from "@/app/leo/_lib/leoProjectIntelligenceService";
import {
  buildLeoMorningBrief,
  resolveLeoMorningBriefTimezone,
  type LeoMorningBriefBuildInput,
} from "@/app/leo/_lib/leoMorningBrief";
import { businessRefFromClientCareEntity } from "@/app/leo/_lib/leoBusinessConciergeBridge";
import { fetchLeoBusinessConciergeEnrichmentForRefs } from "@/app/leo/_lib/leoBusinessConciergeBridgeService";
import { collectLeoExecutiveReportingSnapshot } from "@/app/leo/_lib/leoExecutiveReportingService";
import { leoIntelligenceRuntimeMorningBriefWarning } from "@/app/leo/_lib/leoIntelligenceRuntimeHealth";
import { isLeoAiCredentialPresent } from "@/app/leo/_lib/leoAiConfigPresence";
import {
  buildLeoIntelligenceRuntimeObservation,
  intelligenceRuntimeConfigSystemHealthState,
  mapIntelligenceRuntimeToSystemHealthComponent,
} from "@/app/leo/_lib/leoIntelligenceRuntimeHealth";
import { assembleLeonixInternalIntelligenceProfile } from "@/app/leo/_lib/leoSelfIntelligenceProfile";
import { buildLeoSystemHealthSnapshot } from "@/app/leo/_lib/leoSystemHealth";
import { isLeoGithubConfigured, isLeoVercelConfigured } from "@/app/leo/_lib/leoProjectConfig";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { LeoBusinessConciergeBusinessRef, LeoMorningBrief, LeoMorningBriefAvailability } from "@/app/leo/_lib/leoTypes";

export type LeoMorningBriefServiceOptions = {
  nowMs?: number;
  timezone?: string | null;
};

function toBriefAvailability(
  ok: boolean,
  configured?: boolean,
): LeoMorningBriefAvailability {
  if (ok) return "AVAILABLE";
  if (configured === false) return "NOT_CONFIGURED";
  return "UNAVAILABLE";
}

export async function getLeoMorningBrief(
  options: LeoMorningBriefServiceOptions = {},
): Promise<LeoMorningBrief> {
  await requireLeoOwnerAccess();
  const nowMs = options.nowMs ?? Date.now();
  const timezone = resolveLeoMorningBriefTimezone(options.timezone);

  const [attentionRes, careRes, commRes, commitRes, receiptRes, projectRes, execRes] =
    await Promise.allSettled([
      getLeoAttentionBrief({ topN: 8, nowMs }),
      getLeoClientCareWatch({ nowMs }),
      getLeoCommunicationExecutiveSnapshot({
        nowMs,
        maxMessages: 40,
        maxEvents: 12,
        question: "Morning brief",
      }),
      leoListCommitments({ status: "OPEN", limit: 40 }),
      leoListRecentToolReceipts(20),
      getLeoProjectExecutiveSnapshot({ nowMs }),
      collectLeoExecutiveReportingSnapshot({ nowMs, limit: 6 }),
    ]);

  // Exception-only Self-Intelligence from already-fetched snapshots (no second reporting fetch).
  let selfIntelligence: {
    materialIssue: string | null;
    importantBlindSpot: string | null;
    topNextMove: string | null;
  } | null = null;
  try {
    const reporting = execRes.status === "fulfilled" ? execRes.value : null;
    const clientCare = careRes.status === "fulfilled" ? careRes.value : null;
    const project = projectRes.status === "fulfilled" ? projectRes.value : null;
    const configPresent = isLeoAiCredentialPresent();
    const intelligenceRuntime = buildLeoIntelligenceRuntimeObservation({
      configPresent,
      callAttempted: false,
      callSucceeded: false,
      validationSucceeded: false,
      validationRejected: false,
      fallbackUsed: false,
      failureClass: configPresent ? "NONE" : "NOT_CONNECTED",
      reasoningMode: "DETERMINISTIC",
      nowMs,
    });
    const intelComponent = mapIntelligenceRuntimeToSystemHealthComponent(
      intelligenceRuntime,
      configPresent,
    );
    const systemHealth = buildLeoSystemHealthSnapshot({
      nowMs,
      supabaseConfigured: isSupabaseAdminConfigured(),
      supabasePersistence: isSupabaseAdminConfigured() ? "HEALTHY" : "NOT_CONFIGURED",
      googleWorkspaceConfigured: isLeoGoogleWorkspaceConfigured(),
      githubConfigured: isLeoGithubConfigured(),
      vercelConfigured: isLeoVercelConfigured(),
      webPushConfigured: isWebPushConfigured(),
      intelligenceReasoning:
        intelComponent.state !== "UNKNOWN"
          ? intelComponent.state
          : intelligenceRuntimeConfigSystemHealthState(),
      intelligenceReasoningMessage: intelComponent.ownerMessage,
      reportingAdapters: reporting?.adapterHealth.map((h) => ({
        domain: h.domain,
        label: h.label,
        availability: h.availability,
      })),
    });
    const profile = assembleLeonixInternalIntelligenceProfile({
      nowMs,
      reporting,
      attention: null,
      clientCare,
      systemHealth,
      project,
      intelligenceRuntime,
      intelligenceConfigPresent: configPresent,
    });
    const materialDim = profile.healthMap.find(
      (d) => d.state === "CRITICAL" || d.state === "NEEDS_ATTENTION",
    );
    const importantBlind = profile.blindSpots.find(
      (b) => b.dimension === "CUSTOMER_JOURNEY" || b.dimension === "DISCOVERY_SEO",
    );
    const topMove =
      profile.topNextMove &&
      (profile.topNextMove.severity === "CRITICAL" || profile.topNextMove.severity === "HIGH")
        ? profile.topNextMove
        : null;
    if (materialDim || importantBlind || topMove) {
      selfIntelligence = {
        materialIssue: materialDim
          ? `${materialDim.dimension.replace(/_/g, " ")} is ${materialDim.state.replace(/_/g, " ")} — ${materialDim.reason}`
          : null,
        importantBlindSpot: importantBlind
          ? `${importantBlind.dimension.replace(/_/g, " ")} is not currently measurable.`
          : null,
        topNextMove: topMove ? topMove.title : null,
      };
    }
  } catch {
    selfIntelligence = null;
  }

  const buildInput: LeoMorningBriefBuildInput = {
    nowMs,
    timezone,
    attention:
      attentionRes.status === "fulfilled"
        ? {
            availability: "AVAILABLE",
            brief: attentionRes.value,
            limitation:
              attentionRes.value.dispositionAvailability === "UNAVAILABLE"
                ? "Owner attention dispositions could not be loaded — showing canonical attention items."
                : null,
          }
        : {
            availability: "UNAVAILABLE",
            brief: null,
            limitation: "Attention brief unavailable.",
          },
    clientCare:
      careRes.status === "fulfilled"
        ? { availability: "AVAILABLE", watch: careRes.value }
        : {
            availability: "UNAVAILABLE",
            watch: null,
            limitation: "Client Care watch unavailable.",
          },
    communication:
      commRes.status === "fulfilled"
        ? {
            availability:
              commRes.value.overallAvailability === "NOT_CONFIGURED"
                ? "NOT_CONFIGURED"
                : commRes.value.overallAvailability === "AVAILABLE"
                  ? "AVAILABLE"
                  : commRes.value.overallAvailability === "PARTIAL"
                    ? "PARTIAL"
                    : "UNAVAILABLE",
            snapshot: commRes.value,
            limitation:
              commRes.value.overallAvailability === "UNAVAILABLE"
                ? "Gmail/Calendar executive snapshot unavailable."
                : null,
          }
        : {
            availability: "UNAVAILABLE",
            snapshot: null,
            limitation: "Communication intelligence unavailable.",
          },
    commitments:
      commitRes.status === "fulfilled"
        ? {
            availability:
              commitRes.value.availability === "UNAVAILABLE"
                ? "UNAVAILABLE"
                : commitRes.value.commitments.length === 0
                  ? "EMPTY"
                  : "AVAILABLE",
            commitments: commitRes.value.commitments,
            limitation:
              commitRes.value.availability === "UNAVAILABLE"
                ? "Commitment persistence unavailable — not claiming zero commitments."
                : null,
          }
        : {
            availability: "UNAVAILABLE",
            commitments: [],
            limitation: "Commitment list unavailable.",
          },
    receipts:
      receiptRes.status === "fulfilled"
        ? {
            availability:
              receiptRes.value.availability === "UNAVAILABLE"
                ? "UNAVAILABLE"
                : receiptRes.value.receipts.length === 0
                  ? "EMPTY"
                  : "AVAILABLE",
            receipts: receiptRes.value.receipts,
            limitation:
              receiptRes.value.availability === "UNAVAILABLE"
                ? "Receipt persistence unavailable."
                : null,
          }
        : {
            availability: "UNAVAILABLE",
            receipts: [],
            limitation: "Receipt list unavailable.",
          },
    project:
      projectRes.status === "fulfilled"
        ? {
            availability:
              !projectRes.value.configurationState.github.configured &&
              !projectRes.value.configurationState.vercel.configured
                ? "NOT_CONFIGURED"
                : "AVAILABLE",
            snapshot: projectRes.value,
          }
        : {
            availability: toBriefAvailability(false),
            snapshot: null,
            limitation: "Project intelligence unavailable.",
          },
    executiveReporting:
      execRes.status === "fulfilled"
        ? {
            availability:
              execRes.value.overallAvailability === "UNAVAILABLE"
                ? "UNAVAILABLE"
                : execRes.value.overallAvailability === "NOT_IMPLEMENTED"
                  ? "NOT_CONFIGURED"
                  : execRes.value.overallAvailability === "EMPTY"
                    ? "EMPTY"
                    : execRes.value.overallAvailability === "PARTIAL"
                      ? "PARTIAL"
                      : "AVAILABLE",
            attention: execRes.value.attention
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
              execRes.value.overallAvailability === "UNAVAILABLE"
                ? "Company-wide admin reporting unavailable."
                : null,
          }
        : {
            availability: "UNAVAILABLE",
            attention: [],
            limitation: "Company-wide admin reporting unavailable.",
          },
    intelligenceRuntimeWarning: leoIntelligenceRuntimeMorningBriefWarning({}),
    selfIntelligence,
  };

  const careWatch =
    careRes.status === "fulfilled" ? careRes.value : null;
  const conciergeRefs: LeoBusinessConciergeBusinessRef[] = [];
  if (careWatch) {
    for (const signal of careWatch.signals) {
      if (!signal.attentionEligible) continue;
      const ref = businessRefFromClientCareEntity(
        signal.entityRef.entityType,
        signal.entityRef.id,
      );
      if (ref && ref.kind === "lead") {
        conciergeRefs.push(ref);
      }
      if (conciergeRefs.length >= 2) break;
    }
  }
  if (conciergeRefs.length > 0) {
    const enrichment = await fetchLeoBusinessConciergeEnrichmentForRefs(conciergeRefs, nowMs);
    buildInput.conciergeByRef = Object.fromEntries(enrichment.entries());
  }

  return buildLeoMorningBrief(buildInput);
}
