/**
 * Business Development & Growth Engine, Section J — client-safe Growth Roadmap projection.
 *
 * Reads from the exact same tables as the internal operator view (no second database, no copy of
 * business truth) and projects only the fields MD §14.2 allows a client to see: Already Strong,
 * Let's Confirm, Recommended Next Steps, Projects, Campaigns, Results. Deliberately never includes
 * rationale, evidence_refs, review notes, actor/roster identity, internal scoring, or an
 * unpromoted AI suggestion — those fields simply never leave the repository layer below.
 */
import "server-only";

import { listGrowthCampaignsForBusiness, listGrowthSolutionsForBusiness } from "./repository";
import type { GrowthClientSafeProjection } from "./types";

export async function buildClientSafeGrowthProjection(businessId: string): Promise<GrowthClientSafeProjection> {
  const [solutions, campaigns] = await Promise.all([
    listGrowthSolutionsForBusiness(businessId),
    listGrowthCampaignsForBusiness(businessId),
  ]);

  // "Already Strong" has no dedicated storage yet in Gate A (it is derived from Health Map /
  // assessment strengths in Gate B/C) — an empty, truthful list rather than an invented one.
  const alreadyStrong: GrowthClientSafeProjection["alreadyStrong"] = [];

  // "Let's Confirm" surfaces solutions still needing more information — title only, never the
  // internal rationale/evidence.
  const letsConfirm = solutions
    .filter((s) => s.readiness === "needs_more_information" || s.readiness === "needs_preparation")
    .map((s) => ({ textEs: s.titleEs, textEn: s.titleEn }));

  const recommendedNextSteps = solutions
    .filter((s) => s.state === "approved" || s.state === "suggested")
    .map((s) => ({ titleEs: s.titleEs, titleEn: s.titleEn, priority: s.priority }));

  const projects = solutions
    .filter((s) => s.state === "in_progress" || s.state === "approved")
    .map((s) => ({ titleEs: s.titleEs, titleEn: s.titleEn, state: s.state }));

  const campaignsProjection = campaigns.map((c) => ({ objectiveEs: c.objectiveEs, objectiveEn: c.objectiveEn, status: c.status }));

  // "Results" — Gate A has no outcome-linking column yet on business_growth_campaigns; a
  // completed campaign is truthfully surfaced by objective/status only until Outcomes wiring
  // lands in a later gate. No fabricated metric is ever invented here.
  const results = campaigns
    .filter((c) => c.status === "complete")
    .map((c) => ({ textEs: c.objectiveEs, textEn: c.objectiveEn }));

  return {
    alreadyStrong,
    letsConfirm,
    recommendedNextSteps,
    projects,
    campaigns: campaignsProjection,
    results,
  };
}
