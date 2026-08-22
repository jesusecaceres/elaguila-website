/**
 * LEO-22D — Classified cockpit loaders. Known causes before generic unavailable.
 */
import "server-only";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { leoListGovernedActionProposalCardsForOwner } from "@/app/leo/_lib/leoActionProposalService";
import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import {
  classifyLeoKnownLoadError,
  ownerMessageForAuthIdentity,
  type LeoCockpitHealthTruth,
  type LeoCockpitLoadResult,
} from "@/app/leo/_lib/leoCockpitHealth";
import type { LeoGovernedActionProposalCard } from "@/app/leo/_lib/leoGovernedActionProposalReadModel";
import type { LeoAttentionRuntimeBrief } from "@/app/leo/_lib/leoAttentionRuntime";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

function truth(
  health: LeoCockpitHealthTruth["health"],
  label: string,
  explanation: string,
  sourceId: string,
  nextStep: string | null,
): LeoCockpitHealthTruth {
  return { health, label, explanation, sourceId, nextStep };
}

export async function loadLeoAttentionCockpit(): Promise<
  LeoCockpitLoadResult<LeoAttentionRuntimeBrief>
> {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    return {
      ok: false,
      health: "AUTH_REQUIRED",
      data: null,
      truth: truth(
        "AUTH_REQUIRED",
        "Attention",
        "Owner access is required to load attention.",
        "leo.attention",
        "Sign in as owner admin.",
      ),
    };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      health: "NOT_CONFIGURED",
      data: null,
      truth: truth(
        "NOT_CONFIGURED",
        "Attention",
        "Leonix persistence is not configured, so ACK-filtered attention cannot be assembled.",
        "leo.attention",
        "Configure server-side Supabase admin credentials.",
      ),
    };
  }
  try {
    const brief = await getLeoAttentionBrief({ topN: 3 });
    return {
      ok: true,
      health: "HEALTHY",
      data: brief,
      truth: truth(
        "HEALTHY",
        "Attention",
        brief.visibleItems.length === 0
          ? "Attention is healthy. No current items qualify from available evidence."
          : "Attention assembled from available Leonix evidence.",
        "leo.attention",
        null,
      ),
    };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    const health = classifyLeoKnownLoadError(code);
    const auth = health === "AUTH_REQUIRED";
    return {
      ok: false,
      health,
      data: null,
      truth: truth(
        health,
        "Attention",
        auth
          ? ownerMessageForAuthIdentity()
          : "Attention could not be assembled from available evidence. This is not a fabricated empty inbox.",
        "leo.attention",
        auth ? "Sign out and sign back in as owner so the auth user id cookie is set." : null,
      ),
    };
  }
}

export async function loadLeoGovernedActionsCockpit(): Promise<
  LeoCockpitLoadResult<{ cards: LeoGovernedActionProposalCard[] }>
> {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    return {
      ok: false,
      health: "AUTH_REQUIRED",
      data: null,
      truth: truth(
        "AUTH_REQUIRED",
        "Governed Actions",
        "Owner access is required to list governed action proposals.",
        "leo.governed_actions",
        "Sign in as owner admin.",
      ),
    };
  }
  if (!access.admin.authUserId?.trim()) {
    return {
      ok: false,
      health: "AUTH_REQUIRED",
      data: null,
      truth: truth(
        "AUTH_REQUIRED",
        "Governed Actions",
        ownerMessageForAuthIdentity(),
        "leo.governed_actions",
        "Sign out and sign back in as owner so proposals can be scoped to your identity.",
      ),
    };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      health: "NOT_CONFIGURED",
      data: null,
      truth: truth(
        "NOT_CONFIGURED",
        "Governed Actions",
        "Proposal persistence is not configured in this environment.",
        "leo.governed_actions",
        "Configure server-side Supabase admin credentials.",
      ),
    };
  }
  try {
    const res = await leoListGovernedActionProposalCardsForOwner({ limit: 40 });
    if (!res.ok) {
      const health = classifyLeoKnownLoadError(res.error);
      return {
        ok: false,
        health,
        data: null,
        truth: truth(
          health,
          "Governed Actions",
          health === "AUTH_REQUIRED"
            ? ownerMessageForAuthIdentity()
            : "Governed action proposals could not be loaded from persistence.",
          "leo.governed_actions",
          health === "AUTH_REQUIRED"
            ? "Sign out and sign back in as owner."
            : "Retry after persistence is healthy. Execution is not enabled by this message.",
        ),
      };
    }
    return {
      ok: true,
      health: "HEALTHY",
      data: { cards: res.cards },
      truth: truth(
        "HEALTHY",
        "Governed Actions",
        res.cards.length === 0
          ? "Proposal store is healthy. There are no governed action proposals right now."
          : "Governed action proposals loaded from the canonical store.",
        "leo.governed_actions",
        null,
      ),
    };
  } catch {
    return {
      ok: false,
      health: "UNAVAILABLE",
      data: null,
      truth: truth(
        "UNAVAILABLE",
        "Governed Actions",
        "Governed action proposals are temporarily unavailable after known checks failed.",
        "leo.governed_actions",
        "Retry shortly. This does not execute any action.",
      ),
    };
  }
}
