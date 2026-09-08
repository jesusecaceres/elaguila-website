/**
 * Program 7, Gate 7J — Institutional Learning.
 *
 * Doctrine:
 * - Read-only aggregation across businesses from existing Program 1–7 data.
 * - Never auto-creates recommendations, never auto-mutates business state.
 * - Surfaces patterns (e.g., "commitments with X characteristic tend to be blocked")
 *   as reviewable observations for staff — not as conclusions or actions.
 * - Never claims causation across businesses.
 * - Never exposes one business's data to another business's owner.
 *
 * This module is server-only and uses getAdminSupabase() for cross-business reads.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";

export type LearningPattern = {
  patternKey: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  businessCount: number;
  observedCount: number;
  observedAt: string;
};

export type InstitutionalLearningSummary = {
  totalBusinessesWithOutcomes: number;
  totalOutcomesRecorded: number;
  improvedOutcomes: number;
  unchangedOutcomes: number;
  declinedOutcomes: number;
  inconclusiveOutcomes: number;
  totalReflections: number;
  capabilityTransferredReflections: number;
  patterns: LearningPattern[];
  assembledAt: string;
};

export async function buildInstitutionalLearningSummary(): Promise<InstitutionalLearningSummary> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const [
    { count: totalOutcomesRecorded },
    { count: improvedOutcomes },
    { count: unchangedOutcomes },
    { count: declinedOutcomes },
    { count: inconclusiveOutcomes },
    { count: totalReflections },
    { count: capabilityTransferredReflections },
    { data: distinctBusinesses },
  ] = await Promise.all([
    supabase.from("business_outcomes").select("*", { count: "exact", head: true }),
    supabase.from("business_outcomes").select("*", { count: "exact", head: true }).eq("result", "improved"),
    supabase.from("business_outcomes").select("*", { count: "exact", head: true }).eq("result", "unchanged"),
    supabase.from("business_outcomes").select("*", { count: "exact", head: true }).eq("result", "declined"),
    supabase.from("business_outcomes").select("*", { count: "exact", head: true }).eq("result", "inconclusive"),
    supabase.from("business_outcome_reflections").select("*", { count: "exact", head: true }),
    supabase.from("business_outcome_reflections").select("*", { count: "exact", head: true }).eq("capability_transferred", true),
    supabase.from("business_outcomes").select("business_id"),
  ]);

  const businessIds = new Set<string>();
  for (const row of distinctBusinesses ?? []) {
    businessIds.add(String((row as Record<string, unknown>).business_id));
  }

  const patterns: LearningPattern[] = [];

  if ((improvedOutcomes ?? 0) > 0) {
    patterns.push({
      patternKey: "outcomes_improved_pattern",
      titleEs: "Resultados mejorados",
      titleEn: "Improved outcomes",
      descriptionEs: `${improvedOutcomes ?? 0} resultados marcados como mejorados en ${businessIds.size} negocios.`,
      descriptionEn: `${improvedOutcomes ?? 0} outcomes marked as improved across ${businessIds.size} businesses.`,
      businessCount: businessIds.size,
      observedCount: improvedOutcomes ?? 0,
      observedAt: now,
    });
  }

  if ((capabilityTransferredReflections ?? 0) > 0) {
    patterns.push({
      patternKey: "capability_transferred_pattern",
      titleEs: "Capacidad transferida",
      titleEn: "Capability transferred",
      descriptionEs: `${capabilityTransferredReflections ?? 0} reflexiones marcan transferencia de capacidad.`,
      descriptionEn: `${capabilityTransferredReflections ?? 0} reflections mark capability transfer.`,
      businessCount: businessIds.size,
      observedCount: capabilityTransferredReflections ?? 0,
      observedAt: now,
    });
  }

  if ((declinedOutcomes ?? 0) > 0) {
    patterns.push({
      patternKey: "outcomes_declined_pattern",
      titleEs: "Resultados empeorados",
      titleEn: "Declined outcomes",
      descriptionEs: `${declinedOutcomes ?? 0} resultados marcados como empeorados. Revisar para aprendizaje.`,
      descriptionEn: `${declinedOutcomes ?? 0} outcomes marked as declined. Review for learning.`,
      businessCount: businessIds.size,
      observedCount: declinedOutcomes ?? 0,
      observedAt: now,
    });
  }

  return {
    totalBusinessesWithOutcomes: businessIds.size,
    totalOutcomesRecorded: totalOutcomesRecorded ?? 0,
    improvedOutcomes: improvedOutcomes ?? 0,
    unchangedOutcomes: unchangedOutcomes ?? 0,
    declinedOutcomes: declinedOutcomes ?? 0,
    inconclusiveOutcomes: inconclusiveOutcomes ?? 0,
    totalReflections: totalReflections ?? 0,
    capabilityTransferredReflections: capabilityTransferredReflections ?? 0,
    patterns,
    assembledAt: now,
  };
}
