/**
 * Package B — orchestrates the read-only editorial source + deterministic match engine + Lion
 * Code/readiness adapter + repository into "generate/refresh suggested opportunities for this
 * business". Server-only. Never sends anything, never charges anything, never publishes anything
 * — it only ever inserts rows in the "suggested" lifecycle state for staff to review.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { BroadBusinessType } from "@/app/lib/business/types";
import { listActiveEditorialOpportunitySources } from "./editorialSource";
import { matchBusinessToAllSources, type OpportunityMatchBusinessInput } from "./matchEngine";
import { evaluateOpportunityReadiness } from "./readinessAdapter";
import { createOpportunity, findExistingOpportunityBySourceKey } from "./repository";
import type { CreateOpportunityInput, CreativeOpportunity, OpportunityActor } from "./types";

async function getBusinessMatchInput(businessId: string): Promise<OpportunityMatchBusinessInput> {
  const supabase = getAdminSupabase();
  const [{ data: business }, { data: areas }] = await Promise.all([
    supabase.from("businesses").select("broad_business_type").eq("id", businessId).maybeSingle(),
    supabase.from("business_service_areas").select("city_hint, is_primary").eq("business_id", businessId),
  ]);

  const primaryArea = (areas ?? []).find((a: { is_primary: boolean }) => a.is_primary) ?? (areas ?? [])[0];

  return {
    broadBusinessType: (business?.broad_business_type as BroadBusinessType | undefined) ?? null,
    primaryCity: (primaryArea?.city_hint as string | undefined) ?? null,
  };
}

/**
 * Idempotent per (businessId, sourceKey) — re-running this never creates a duplicate suggestion
 * for a source the business has already been matched against; it only surfaces genuinely new
 * matches (e.g. a newly added registry entry, or newly-confirmed business category/city).
 */
export async function generateOpportunitySuggestions(
  businessId: string,
  actor: OpportunityActor,
): Promise<{ created: CreativeOpportunity[]; skippedExisting: number }> {
  const [businessInput, readiness, sources] = await Promise.all([
    getBusinessMatchInput(businessId),
    evaluateOpportunityReadiness(businessId),
    Promise.resolve(listActiveEditorialOpportunitySources()),
  ]);

  const candidates = matchBusinessToAllSources(businessInput, sources);
  const created: CreativeOpportunity[] = [];
  let skippedExisting = 0;

  for (const candidate of candidates) {
    const existing = await findExistingOpportunityBySourceKey(businessId, candidate.source.key);
    if (existing) {
      skippedExisting += 1;
      continue;
    }

    const input: CreateOpportunityInput = {
      opportunityType: candidate.source.opportunityType,
      titleEs: candidate.source.titleEs,
      titleEn: candidate.source.titleEn,
      summaryEs: `Coincidencia con "${candidate.source.themeEs}" para este negocio.`,
      summaryEn: `Match with "${candidate.source.themeEn}" for this business.`,
      matchReasons: candidate.matchReasons,
      confidence: candidate.confidence,
      readinessRecommended: readiness.recommendedForAction,
      readinessExplanationEs: readiness.explanationEs,
      readinessExplanationEn: readiness.explanationEn,
      sourceType: candidate.source.sourceType,
      sourceKey: candidate.source.key,
      sourceTitle: candidate.source.titleEn,
      activeFrom: candidate.source.activeFrom,
      activeUntil: candidate.source.activeUntil,
    };

    const opportunity = await createOpportunity(businessId, input, actor);
    if (opportunity) created.push(opportunity);
  }

  return { created, skippedExisting };
}
