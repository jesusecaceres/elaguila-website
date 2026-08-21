/**
 * LEO-9 Owner Executive Console — /admin/leo
 * Owner_admin only. Evidence-first. No AI theater. No execution.
 * LEO-9B: Ask LEO first, compact priorities, owner language.
 */
import { redirect } from "next/navigation";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { leoListRecentMemory } from "@/app/leo/_lib/leoLivingBookService";
import { getLeoSelfIntelligence } from "@/app/leo/_lib/leoSelfIntelligenceService";
import { buildLeoSystemHealthSnapshot } from "@/app/leo/_lib/leoSystemHealth";
import type { LeoAttentionBrief, LeoClientCareWatchResult, LeoMemoryRecord } from "@/app/leo/_lib/leoTypes";
import { adminCardBase, adminContentArea } from "@/app/admin/_components/adminTheme";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";

import { LeoAttentionPanel } from "./_components/LeoAttentionPanel";
import { LeoCapabilityStrip } from "./_components/LeoCapabilityStrip";
import { LeoClientCarePanel } from "./_components/LeoClientCarePanel";
import { LeoMorningBriefPanel } from "./_components/LeoMorningBrief";
import { LeoConversationPanel } from "./_components/LeoConversationPanel";
import { LeoExecutiveHeader } from "./_components/LeoExecutiveHeader";
import { LeoGovernanceLegend } from "./_components/LeoGovernanceLegend";
import { LeoMemoryPanel } from "./_components/LeoMemoryPanel";
import { LeoNotificationSettings } from "./_components/LeoNotificationSettings";
import { LeoPwaShell } from "./_components/LeoPwaShell";
import {
  LeoSelfIntelligencePanel,
  type LeoSelfIntelligenceLoad,
} from "./_components/LeoSelfIntelligencePanel";
import { LeoSystemHealthCard } from "./_components/LeoSystemHealthCard";

export const dynamic = "force-dynamic";

type AttentionLoad =
  | { ok: true; brief: LeoAttentionBrief }
  | { ok: false; limitation: string };

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

async function loadAttention(): Promise<AttentionLoad> {
  try {
    const brief = await getLeoAttentionBrief({ topN: 3 });
    return { ok: true, brief };
  } catch {
    return {
      ok: false,
      limitation: "Attention data is currently unavailable.",
    };
  }
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

export default async function LeoExecutiveConsolePage() {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    if (access.reason === "unauthenticated") {
      redirect("/admin/login");
    }
    redirect("/admin?leo_access_denied=1");
  }

  const [attention, care, memory, selfIntelligence] = await Promise.all([
    loadAttention(),
    loadClientCare(),
    loadMemory(),
    loadSelfIntelligence(),
  ]);

  const systemHealth = buildLeoSystemHealthSnapshot({
    supabasePersistence: isSupabaseAdminConfigured() ? "HEALTHY" : "NOT_CONFIGURED",
    supabaseConfigured: isSupabaseAdminConfigured(),
    googleWorkspaceConfigured: isLeoGoogleWorkspaceConfigured(),
    webPushConfigured: isWebPushConfigured(),
  });

  return (
    <div className={`${adminContentArea} pt-[max(0px,env(safe-area-inset-top))]`}>
      <LeoPwaShell>
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 sm:gap-5">
          <LeoExecutiveHeader />

          <LeoMorningBriefPanel />

          <LeoSelfIntelligencePanel load={selfIntelligence} />

          <div className="min-w-0 lg:max-w-none">
            <LeoConversationPanel />
          </div>

          <div className="grid min-w-0 gap-4 sm:gap-5">
            <LeoAttentionPanel load={attention} />

            <LeoClientCarePanel load={care} />

            <LeoMemoryPanel load={memory} />
          </div>

          <section className={`${adminCardBase} min-w-0 space-y-4 p-3 sm:p-4`} aria-labelledby="leo-controls-heading">
            <h2 id="leo-controls-heading" className="text-sm font-bold text-[#1E1810]">
              LEO Controls &amp; Capabilities
            </h2>
            <LeoSystemHealthCard health={systemHealth} />
            <LeoNotificationSettings />
            <LeoGovernanceLegend />
            <LeoCapabilityStrip />
          </section>
        </div>
      </LeoPwaShell>
    </div>
  );
}
