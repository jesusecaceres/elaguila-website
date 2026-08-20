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

  const [attentionRes, careRes, commRes, commitRes, receiptRes, projectRes] =
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
    ]);

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
