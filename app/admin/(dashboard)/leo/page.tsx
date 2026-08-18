/**
 * LEO-9 Owner Executive Console — /admin/leo
 * Owner_admin only. Evidence-first. No AI theater. No execution.
 */
import { redirect } from "next/navigation";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { leoListRecentMemory } from "@/app/leo/_lib/leoLivingBookService";
import type { LeoAttentionBrief, LeoClientCareWatchResult, LeoMemoryRecord } from "@/app/leo/_lib/leoTypes";
import { adminContentArea } from "@/app/admin/_components/adminTheme";

import { LeoAttentionPanel } from "./_components/LeoAttentionPanel";
import { LeoCapabilityStrip } from "./_components/LeoCapabilityStrip";
import { LeoClientCarePanel } from "./_components/LeoClientCarePanel";
import { LeoConversationPanel } from "./_components/LeoConversationPanel";
import { LeoExecutiveHeader } from "./_components/LeoExecutiveHeader";
import { LeoGovernanceLegend } from "./_components/LeoGovernanceLegend";
import { LeoMemoryPanel } from "./_components/LeoMemoryPanel";

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

  const [attention, care, memory] = await Promise.all([loadAttention(), loadClientCare(), loadMemory()]);

  return (
    <div className={adminContentArea}>
      <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-6 sm:gap-8">
        <LeoExecutiveHeader />

        <LeoAttentionPanel load={attention} />

        <LeoConversationPanel />

        <LeoClientCarePanel load={care} />

        <LeoMemoryPanel load={memory} />

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <LeoGovernanceLegend />
          <LeoCapabilityStrip />
        </div>
      </div>
    </div>
  );
}
