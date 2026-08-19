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
import type { LeoAttentionBrief, LeoClientCareWatchResult, LeoMemoryRecord } from "@/app/leo/_lib/leoTypes";
import { adminCardBase, adminContentArea } from "@/app/admin/_components/adminTheme";

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
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 sm:gap-5">
        <LeoExecutiveHeader />

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
          <LeoGovernanceLegend />
          <LeoCapabilityStrip />
        </section>
      </div>
    </div>
  );
}
