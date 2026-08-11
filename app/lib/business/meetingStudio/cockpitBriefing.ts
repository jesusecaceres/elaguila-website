/**
 * Program 5 — Lion's Cockpit briefing assembler. Deterministic, server-only.
 * Consumes existing truth from Living Book, Health Map, Stewardship, Field Discovery,
 * AI Research, and real entitlements. Does NOT create another AI research run.
 * Separates truth classes: CONFIRMED, OWNER-STATED, STAFF OBSERVATION, SYSTEM-DERIVED,
 * AI INFERENCE, UNKNOWN, CONTRADICTION.
 */
import "server-only";

import { listFactsForBusiness, listUnknownsForBusiness, listContradictionsForBusiness } from "../livingBook/repository";
import { getLatestCompletedRun, getFullRun } from "../healthMap/repository";
import { listRecommendationsForBusiness, listTestsForRecommendation } from "../stewardship/repository";
import { listSourceLinksForBusiness, listSourceFilesForBusiness } from "../fieldDiscovery/repository";
import { listResearchRunsForBusiness, listBriefingDraftsForBusiness } from "../aiResearch/repository";
import { listCommitmentsForBusiness } from "../promiseKeeper/repository";
import { listProposalsForBusiness } from "../proposals/repository";
import type { CockpitBriefing, CockpitBriefingItem } from "./types";

function shapeFactItems(facts: { id: string; factKey: string; displayValue: string | null; sourceClass: string; lastVerifiedAt: string | null }[]): CockpitBriefingItem[] {
  return facts.map((f) => ({
    key: f.factKey,
    label: f.factKey,
    value: f.displayValue ?? "—",
    source: f.sourceClass,
    lastVerifiedAt: f.lastVerifiedAt,
  }));
}

export async function assembleCockpitBriefing(businessId: string, businessName: string, primaryLanguage: string | null): Promise<CockpitBriefing> {
  const [facts, unknowns, contradictions, latestHealthRun, recommendations, sourceLinks, sourceFiles, researchRuns, briefingDrafts, commitments, proposals] = await Promise.all([
    listFactsForBusiness(businessId),
    listUnknownsForBusiness(businessId),
    listContradictionsForBusiness(businessId),
    getLatestCompletedRun(businessId),
    listRecommendationsForBusiness(businessId),
    listSourceLinksForBusiness(businessId),
    listSourceFilesForBusiness(businessId),
    listResearchRunsForBusiness(businessId),
    listBriefingDraftsForBusiness(businessId),
    listCommitmentsForBusiness(businessId),
    listProposalsForBusiness(businessId),
  ]);

  const confirmedFacts = facts.filter((f) => f.confirmationState === "owner_confirmed" || f.confirmationState === "staff_confirmed");
  const ownerStatedFacts = facts.filter((f) => f.sourceClass === "owner_statement");
  const staffObservedFacts = facts.filter((f) => f.sourceClass === "staff_observation");
  const systemDerivedFacts = facts.filter((f) => f.sourceClass === "system_derived");
  const aiInferenceFacts = facts.filter((f) => f.sourceClass === "ai_inference");

  const truthClasses = {
    confirmed: shapeFactItems(confirmedFacts),
    ownerStated: shapeFactItems(ownerStatedFacts),
    staffObservation: shapeFactItems(staffObservedFacts),
    systemDerived: shapeFactItems(systemDerivedFacts),
    aiInference: shapeFactItems(aiInferenceFacts),
    unknown: unknowns.map((u) => ({
      key: u.id,
      label: u.questionLabel,
      value: u.status === "answered" ? u.resolution ?? "Answered" : "Open",
      source: "unknown",
      lastVerifiedAt: null,
    })),
    contradiction: contradictions.map((c) => ({
      key: c.id,
      label: `${c.claimALabel} vs ${c.claimBLabel}`,
      value: c.status,
      source: "contradiction",
      lastVerifiedAt: null,
    })),
  };

  let healthMap: CockpitBriefing["healthMap"] = null;
  if (latestHealthRun) {
    const full = await getFullRun(latestHealthRun.id);
    healthMap = {
      latestRunDate: latestHealthRun.completedAt ?? null,
      strongCount: latestHealthRun.strongCount,
      needsAttentionCount: latestHealthRun.needsAttentionCount,
      insufficientInfoCount: latestHealthRun.insufficientInformationCount,
      contradictionBlockedCount: latestHealthRun.contradictionBlockedCount,
      dimensions: (full?.dimensionResults ?? []).map((d) => ({
        key: d.dimensionKey,
        status: d.status,
        explanationEn: d.explanationEn,
      })),
    };
  }

  const currentRec = recommendations.find((r) => r.isCurrent) ?? null;
  let recTests: { testKey: string; result: string; explanationEn: string }[] = [];
  if (currentRec) {
    const tests = await listTestsForRecommendation(currentRec.id);
    recTests = tests.map((t) => ({
      testKey: t.testKey,
      result: t.result,
      explanationEn: t.explanationEn,
    }));
  }

  const recommendation: CockpitBriefing["recommendation"] = currentRec
    ? {
        candidateKey: currentRec.candidateKey,
        status: currentRec.status,
        verifiedNeedEn: currentRec.verifiedNeedEn,
        primaryIntervention: currentRec.primaryIntervention,
        costBand: currentRec.costBand,
        expectedEffort: currentRec.expectedEffort,
        rejectedHigherCostReasonEn: currentRec.rejectedHigherCostReasonEn,
        sixTests: recTests,
      }
    : null;

  const latestRun = researchRuns[0] ?? null;
  const latestDraft = latestRun ? briefingDrafts.find((d) => d.researchRunId === latestRun.id) ?? null : null;
  const researchFreshness: CockpitBriefing["researchFreshness"] = {
    latestRunDate: latestRun?.createdAt ?? null,
    latestRunStatus: latestRun?.status ?? null,
    latestDraftReviewStatus: latestDraft?.reviewStatus ?? null,
    sourceLinkCount: sourceLinks.length,
    sourceFileCount: sourceFiles.length,
  };

  const activeCommitments = commitments.filter((c) => c.status === "active" || c.status === "planned" || c.status === "blocked");
  const blockedCommitments = commitments.filter((c) => c.status === "blocked");
  const nextDueCommitment = activeCommitments
    .filter((c) => c.dueAt)
    .sort((a, b) => (a.dueAt! < b.dueAt! ? -1 : 1))[0];

  const commitmentsSummary: CockpitBriefing["commitments"] = {
    activeCount: activeCommitments.length,
    blockedCount: blockedCommitments.length,
    nextDueDate: nextDueCommitment?.dueAt ?? null,
  };

  const whatNotToSell: string[] = [];
  if (currentRec) {
    if (currentRec.primaryIntervention === "free_owner_action") whatNotToSell.push("This business needs a free owner action, not a paid product.");
    if (currentRec.primaryIntervention === "education_guided_self_service") whatNotToSell.push("Guided self-service is the recommended path — do not push managed services.");
    if (currentRec.primaryIntervention === "no_action_yet") whatNotToSell.push("No action is recommended yet — do not sell prematurely.");
    if (currentRec.rejectedHigherCostReasonEn) whatNotToSell.push(currentRec.rejectedHigherCostReasonEn);
  }
  if (healthMap && healthMap.contradictionBlockedCount > 0) {
    whatNotToSell.push("Health Map has contradiction-blocked dimensions — resolve before selling.");
  }

  const suggestedTopics: { es: string; en: string }[] = [];
  if (unknowns.filter((u) => u.status === "open").length > 0) {
    suggestedTopics.push({ es: "Resolver incertidumbres abiertas", en: "Resolve open unknowns" });
  }
  if (contradictions.filter((c) => c.status === "open").length > 0) {
    suggestedTopics.push({ es: "Abordar contradicciones", en: "Address contradictions" });
  }
  if (currentRec) {
    suggestedTopics.push({ es: `Revisar: ${currentRec.candidateKey}`, en: `Review: ${currentRec.candidateKey}` });
  }
  if (activeCommitments.length > 0) {
    suggestedTopics.push({ es: "Seguimiento de compromisos", en: "Commitment follow-up" });
  }
  if (proposals.filter((p) => p.isCurrent && p.status === "draft").length > 0) {
    suggestedTopics.push({ es: "Revisar borrador de propuesta", en: "Review proposal draft" });
  }

  return {
    businessId,
    businessName,
    primaryLanguage,
    truthClasses,
    healthMap,
    recommendation,
    researchFreshness,
    entitlements: null,
    commitments: commitmentsSummary,
    whatNotToSell,
    suggestedTopics,
    generatedAt: new Date().toISOString(),
  };
}
