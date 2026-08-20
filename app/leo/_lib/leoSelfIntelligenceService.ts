/**
 * LEO-20A — Self-Intelligence owner-only orchestration.
 * Reuses canonical snapshots; no new source DB queries beyond existing services;
 * no persistence; no AI call.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { collectLeoExecutiveReportingSnapshot } from "@/app/leo/_lib/leoExecutiveReportingService";
import { isLeoAiCredentialPresent } from "@/app/leo/_lib/leoAiConfigPresence";
import {
  buildLeoIntelligenceRuntimeObservation,
} from "@/app/leo/_lib/leoIntelligenceRuntimeHealth";
import { getLeoProjectExecutiveSnapshot } from "@/app/leo/_lib/leoProjectIntelligenceService";
import { isLeoGithubConfigured, isLeoVercelConfigured } from "@/app/leo/_lib/leoProjectConfig";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { buildLeoSystemHealthSnapshot } from "@/app/leo/_lib/leoSystemHealth";
import {
  intelligenceRuntimeConfigSystemHealthState,
  mapIntelligenceRuntimeToSystemHealthComponent,
} from "@/app/leo/_lib/leoIntelligenceRuntimeHealth";
import {
  assembleLeonixInternalIntelligenceProfile,
  composeLeoSelfIntelligenceConversationSummary,
} from "@/app/leo/_lib/leoSelfIntelligenceProfile";
import type { LeonixInternalIntelligenceProfile } from "@/app/leo/_lib/leoSelfIntelligenceTypes";
import type { LeoSelfIntelligenceAdapterInput } from "@/app/leo/_lib/leoSelfIntelligenceAdapters";

export type LeoSelfIntelligenceServiceOptions = {
  nowMs?: number;
};

export type LeoSelfIntelligenceResult = {
  profile: LeonixInternalIntelligenceProfile;
  conversationSummary: string;
};

async function buildAdapterInput(nowMs: number): Promise<LeoSelfIntelligenceAdapterInput> {
  // Reuse executive reporting once — avoid a second reporting fetch via Attention service.
  const [reportingRes, careRes, projectRes] = await Promise.allSettled([
    collectLeoExecutiveReportingSnapshot({ nowMs }),
    getLeoClientCareWatch({ nowMs }),
    getLeoProjectExecutiveSnapshot({ nowMs }),
  ]);

  const reporting = reportingRes.status === "fulfilled" ? reportingRes.value : null;
  const clientCare = careRes.status === "fulfilled" ? careRes.value : null;
  const project = projectRes.status === "fulfilled" ? projectRes.value : null;

  const configPresent = isLeoAiCredentialPresent();
  // Current-state config observation only — no live provider call.
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

  return {
    nowMs,
    reporting,
    attention: null,
    clientCare,
    systemHealth,
    project,
    intelligenceRuntime,
    intelligenceConfigPresent: configPresent,
  };
}

/**
 * Owner-only. Dynamic Self-Intelligence profile — not persisted.
 */
export async function getLeoSelfIntelligence(
  options: LeoSelfIntelligenceServiceOptions = {},
): Promise<LeoSelfIntelligenceResult> {
  await requireLeoOwnerAccess();
  const nowMs = options.nowMs ?? Date.now();
  const input = await buildAdapterInput(nowMs);
  const profile = assembleLeonixInternalIntelligenceProfile(input);
  return {
    profile,
    conversationSummary: composeLeoSelfIntelligenceConversationSummary(profile),
  };
}

/** Fail-soft for Morning Brief — never throws the brief away. */
export async function getLeoSelfIntelligenceForMorningBrief(
  options: LeoSelfIntelligenceServiceOptions = {},
): Promise<LeoSelfIntelligenceResult | null> {
  try {
    return await getLeoSelfIntelligence(options);
  } catch {
    return null;
  }
}
