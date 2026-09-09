/**
 * LEO-9 / LEO-22A Owner Executive Console — /admin/leo
 * Conversation-first operating shell. Evidence workspace is secondary.
 * Owner_admin only. No execution. CAPABILITY ≠ AUTHORITY.
 */
import { redirect } from "next/navigation";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { loadLeoAttentionCockpit, loadLeoGovernedActionsCockpit } from "@/app/leo/_lib/leoCockpitLoaders";
import { getLeoGoogleWorkspaceCapabilityTruth } from "@/app/leo/_lib/leoGoogleWorkspaceCapabilityTruth";
import { getLeoProjectConfigDiagnostic } from "@/app/leo/_lib/leoProjectConfig";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { leoListRecentMemory } from "@/app/leo/_lib/leoLivingBookService";
import { getLeoSelfIntelligence } from "@/app/leo/_lib/leoSelfIntelligenceService";
import { getLeoExecutiveReportingSnapshot } from "@/app/leo/_lib/leoExecutiveReportingService";
import { buildLeoSystemHealthSnapshot } from "@/app/leo/_lib/leoSystemHealth";
import type { LeoClientCareWatchResult, LeoMemoryRecord } from "@/app/leo/_lib/leoTypes";
import { adminCardBase, adminContentArea } from "@/app/admin/_components/adminTheme";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";

import { LeoAttentionPanel } from "./_components/LeoAttentionPanel";
import { LeoCapabilityStrip } from "./_components/LeoCapabilityStrip";
import { LeoClientCarePanel } from "./_components/LeoClientCarePanel";
import { LeoMorningBriefPanel } from "./_components/LeoMorningBrief";
import { LeoGovernanceLegend } from "./_components/LeoGovernanceLegend";
import { LeoGovernedActionsPanel, type LeoGovernedActionsLoad } from "./_components/LeoGovernedActionsPanel";
import { LeoMemoryPanel } from "./_components/LeoMemoryPanel";
import { LeoNotificationSettings } from "./_components/LeoNotificationSettings";
import { LeoOperatingShell } from "./_components/LeoOperatingShell";
import { LeoPwaShell } from "./_components/LeoPwaShell";
import { LeoSpokenSessionProvider } from "./_components/LeoSpokenSession";
import {
  LeoSelfIntelligencePanel,
  type LeoSelfIntelligenceLoad,
} from "./_components/LeoSelfIntelligencePanel";
import { LeoSystemHealthCard } from "./_components/LeoSystemHealthCard";
import { LeoExecutiveReportsPanel } from "./_components/LeoExecutiveReportsPanel";
import { LeoWorkspaceProvider } from "./_components/LeoWorkspaceController";

export const dynamic = "force-dynamic";

type CareLoad =
  | { ok: true; watch: LeoClientCareWatchResult }
  | { ok: false; limitation: string };

type MemoryLoad =
  | { ok: true; records: LeoMemoryRecord[] }
  | { ok: false; limitation: string };

async function loadSelfIntelligence(): Promise<LeoSelfIntelligenceLoad> {
  try {
    const result = await getLeoSelfIntelligence();
    return { ok: true, profile: result.profile };
  } catch {
    return {
      ok: false,
      limitation:
        "Self-Intelligence is temporarily unavailable. Core LEO functions remain available.",
    };
  }
}

async function loadAttention() {
  const loaded = await loadLeoAttentionCockpit();
  if (loaded.ok) {
    return { ok: true as const, brief: loaded.data, truth: loaded.truth };
  }
  return { ok: false as const, limitation: loaded.truth.explanation, truth: loaded.truth };
}

async function loadClientCare(): Promise<CareLoad> {
  try {
    const watch = await getLeoClientCareWatch();
    return { ok: true, watch };
  } catch {
    return {
      ok: false,
      limitation: "Client Care data is currently unavailable.",
    };
  }
}

async function loadMemory(): Promise<MemoryLoad> {
  try {
    const records = await leoListRecentMemory(8);
    return { ok: true, records };
  } catch {
    return {
      ok: false,
      limitation: "Living Leonix Book storage is not available in this environment yet.",
    };
  }
}

async function loadGovernedActions(): Promise<LeoGovernedActionsLoad> {
  const loaded = await loadLeoGovernedActionsCockpit();
  if (loaded.ok) {
    return { ok: true, cards: loaded.data.cards, truth: loaded.truth };
  }
  return { ok: false, limitation: loaded.truth.explanation, truth: loaded.truth };
}

export default async function LeoExecutiveConsolePage() {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    if (access.reason === "unauthenticated") {
      redirect("/admin/login");
    }
    redirect("/admin?leo_access_denied=1");
  }

  const [attention, care, memory, selfIntelligence, governedActions, googleTruth, reporting] =
    await Promise.all([
      loadAttention(),
      loadClientCare(),
      loadMemory(),
      loadSelfIntelligence(),
      loadGovernedActions(),
      getLeoGoogleWorkspaceCapabilityTruth(),
      getLeoExecutiveReportingSnapshot({ limit: 8 }).then(
        (snapshot) => ({ ok: true as const, snapshot }),
        () => ({ ok: false as const, limitation: "Executive reporting is unavailable right now." }),
      ),
    ]);

  const project = getLeoProjectConfigDiagnostic();
  const systemHealth = buildLeoSystemHealthSnapshot({
    supabasePersistence: isSupabaseAdminConfigured() ? "HEALTHY" : "NOT_CONFIGURED",
    supabaseConfigured: isSupabaseAdminConfigured(),
    googleWorkspaceConfigured: isLeoGoogleWorkspaceConfigured(),
    githubConfigured: project.github.connectorConnected,
    vercelConfigured: project.vercel.connectorConnected,
    projectGithub: project.github.projectIntelligenceConfigured
      ? "HEALTHY"
      : project.github.connectorConnected
        ? "DEGRADED"
        : "NOT_CONFIGURED",
    projectVercel: project.vercel.projectIntelligenceConfigured
      ? "HEALTHY"
      : project.vercel.connectorConnected
        ? "DEGRADED"
        : "NOT_CONFIGURED",
    webPushConfigured: isWebPushConfigured(),
  });

  const home = (
    <div className="min-w-0 space-y-4">
      <LeoMorningBriefPanel />
    </div>
  );

  return (
    <div className={`${adminContentArea} pt-[max(0px,env(safe-area-inset-top))]`}>
      <LeoPwaShell>
        <LeoWorkspaceProvider>
          <LeoSpokenSessionProvider>
          <LeoOperatingShell
            slots={{
              HOME: home,
              ATTENTION: <LeoAttentionPanel load={attention} />,
              CLIENTS: <LeoClientCarePanel load={care} />,
              GOVERNED_ACTIONS: <LeoGovernedActionsPanel initialLoad={governedActions} />,
              MEMORY: <LeoMemoryPanel load={memory} />,
              SELF_INTELLIGENCE: <LeoSelfIntelligencePanel load={selfIntelligence} />,
              TECHNOLOGY: <LeoSystemHealthCard health={systemHealth} />,
              REPORTS: <LeoExecutiveReportsPanel load={reporting} />,
            }}
          />
          <section
            className={`${adminCardBase} mx-auto mt-4 w-full max-w-6xl min-w-0 space-y-4 p-3 sm:p-4`}
            aria-labelledby="leo-controls-heading"
            data-leo-utility-controls
          >
            <h2 id="leo-controls-heading" className="text-sm font-bold text-[#1E1810]">
              LEO Controls &amp; Capabilities
            </h2>
            <LeoNotificationSettings />
            <LeoGovernanceLegend />
            <LeoCapabilityStrip project={project} google={googleTruth} />
          </section>
          </LeoSpokenSessionProvider>
        </LeoWorkspaceProvider>
      </LeoPwaShell>
    </div>
  );
}
