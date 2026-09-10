/**
 * Business Development Analyst — canonical input packet compiler (MD <input_packet>).
 *
 * Deliberately COMPILES existing domain truth rather than duplicating it: the bulk of Business
 * Book / Health / Recommendation / research-freshness / commitments truth is reused wholesale from
 * meetingStudio/cockpitBriefing.ts's assembleCockpitBriefing() — the exact same compiled summary
 * Meeting Prep already uses — rather than re-deriving it from raw tables a second time. Only the
 * pieces the cockpit briefing does not carry (raw research evidence with real source URLs,
 * approved opportunities, active Growth campaigns, outcome history, the current follow-up) are
 * fetched separately, each bounded to a small number of items.
 *
 * No secret, no full raw research payload, and no unrelated business's data ever enters this
 * packet — every read below is scoped to exactly one businessId.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { assembleCockpitBriefing } from "@/app/lib/business/meetingStudio/cockpitBriefing";
import type { CockpitBriefing } from "@/app/lib/business/meetingStudio/types";
import { listOpportunitiesForBusiness } from "@/app/lib/business/opportunity/repository";
import { listResearchRunsForBusiness } from "@/app/lib/business/aiResearch/repository";
import type { AiResearchInputPacket } from "@/app/lib/business/aiResearch/types";
import { listBusinessOutcomes } from "@/app/lib/business/outcomes/repository";
import { getCurrentFollowUp } from "@/app/admin/_lib/businessWorkspaceData";
import { listGrowthCampaignsForBusiness } from "../repository";
import { growthRoadmapTypeForBusinessStage } from "../lifeStage";
import type { BusinessStage } from "@/app/lib/business/types";
import type { GrowthRoadmapType } from "../types";

export type GrowthAnalystRawEvidenceItem = {
  sourceType: "website" | "google_places";
  sourceUrl: string | null;
  observedAt: string;
  claim: string;
  requiresConfirmation: boolean;
};

export type GrowthAnalystInputPacket = {
  businessId: string;
  businessIdentity: {
    displayName: string;
    broadBusinessType: string;
    businessStage: BusinessStage;
    locationHint: string | null;
    primaryLanguage: string | null;
  };
  roadmapType: GrowthRoadmapType;
  cockpitBriefing: CockpitBriefing;
  rawResearchEvidence: readonly GrowthAnalystRawEvidenceItem[];
  approvedOpportunities: readonly {
    titleEs: string;
    titleEn: string;
    summaryEs: string;
    summaryEn: string;
    readinessExplanationEs: string;
    readinessExplanationEn: string;
    confidence: string;
  }[];
  currentFollowUp: { scheduledDate: string; purpose: string; status: string } | null;
  activeCampaigns: readonly { objectiveEs: string; objectiveEn: string; status: string }[];
  outcomeHistory: readonly { metricLabelEs: string; metricLabelEn: string; result: string; confidence: string; causationClaim: string }[];
};

async function loadBusinessIdentity(businessId: string): Promise<GrowthAnalystInputPacket["businessIdentity"] | null> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("businesses")
    .select("display_name, broad_business_type, business_stage, business_primary_language")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { display_name: string; broad_business_type: string; business_stage: BusinessStage; business_primary_language: string | null };

  const { data: areaRow } = await admin
    .from("business_service_areas")
    .select("raw_text, city_hint, is_primary")
    .eq("business_id", businessId)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  const area = areaRow as { raw_text?: string; city_hint?: string | null } | null;

  return {
    displayName: row.display_name,
    broadBusinessType: row.broad_business_type,
    businessStage: row.business_stage,
    locationHint: area?.city_hint?.trim() || area?.raw_text?.trim() || null,
    primaryLanguage: row.business_primary_language,
  };
}

/** Bounded to the latest completed research run only — never the full research history. */
async function loadRawResearchEvidence(businessId: string): Promise<GrowthAnalystRawEvidenceItem[]> {
  const runs = await listResearchRunsForBusiness(businessId);
  const latestCompleted = runs.find((r) => r.status === "completed");
  if (!latestCompleted) return [];

  const packet = latestCompleted.inputSnapshot as Partial<AiResearchInputPacket>;
  const items: GrowthAnalystRawEvidenceItem[] = [];

  if (packet.websiteResearch && packet.websiteResearch.status === "completed") {
    for (const e of packet.websiteResearch.evidence.slice(0, 6)) {
      items.push({
        sourceType: "website",
        sourceUrl: packet.websiteResearch.finalUrl ?? packet.websiteResearch.sourceUrl,
        observedAt: packet.websiteResearch.observedAt,
        claim: e.claim,
        requiresConfirmation: e.requiresConfirmation,
      });
    }
  }
  if (packet.googlePlacesResearch && packet.googlePlacesResearch.status === "completed") {
    for (const e of packet.googlePlacesResearch.evidence.slice(0, 6)) {
      items.push({
        sourceType: "google_places",
        sourceUrl: packet.googlePlacesResearch.mapsUri,
        observedAt: packet.googlePlacesResearch.observedAt,
        claim: e.claim,
        requiresConfirmation: e.requiresConfirmation,
      });
    }
  }
  return items;
}

export async function buildGrowthAnalystInputPacket(businessId: string): Promise<GrowthAnalystInputPacket | null> {
  const identity = await loadBusinessIdentity(businessId);
  if (!identity) return null;

  const [cockpitBriefing, rawResearchEvidence, opportunities, outcomes, currentFollowUp, campaigns] = await Promise.all([
    assembleCockpitBriefing(businessId, identity.displayName, identity.primaryLanguage),
    loadRawResearchEvidence(businessId),
    listOpportunitiesForBusiness(businessId),
    listBusinessOutcomes(businessId),
    getCurrentFollowUp(businessId),
    listGrowthCampaignsForBusiness(businessId),
  ]);

  // The AI briefing draft repository is intentionally NOT queried separately here — the cockpit
  // briefing's truthClasses.aiInference already surfaces reviewed AI-inference items; pulling the
  // raw draft too would duplicate the same content in the prompt for no benefit.

  return {
    businessId,
    businessIdentity: identity,
    roadmapType: growthRoadmapTypeForBusinessStage(identity.businessStage),
    cockpitBriefing,
    rawResearchEvidence,
    approvedOpportunities: opportunities
      .filter((o) => o.lifecycleState === "approved" || o.lifecycleState === "reviewed")
      .slice(0, 8)
      .map((o) => ({
        titleEs: o.titleEs,
        titleEn: o.titleEn,
        summaryEs: o.summaryEs,
        summaryEn: o.summaryEn,
        readinessExplanationEs: o.readinessExplanationEs,
        readinessExplanationEn: o.readinessExplanationEn,
        confidence: o.confidence,
      })),
    currentFollowUp: currentFollowUp
      ? { scheduledDate: currentFollowUp.scheduledDate, purpose: currentFollowUp.purpose, status: currentFollowUp.status }
      : null,
    activeCampaigns: campaigns
      .filter((c) => c.status !== "complete" && c.status !== "cancelled")
      .slice(0, 8)
      .map((c) => ({ objectiveEs: c.objectiveEs, objectiveEn: c.objectiveEn, status: c.status })),
    outcomeHistory: outcomes.slice(0, 8).map((o) => ({
      metricLabelEs: o.metricLabelEs,
      metricLabelEn: o.metricLabelEn,
      result: o.result,
      confidence: o.confidence,
      causationClaim: o.causationClaim,
    })),
  };
}
