/**
 * Program 6, Gate 6L — Creative Research Packet Assembler.
 * Consumes approved data from Program 4 (Field Discovery, AI Research, Living Book).
 * Does NOT build a second web crawler. Reuses existing truth boundary.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { SnapshotCategory } from "./types";

export interface ResearchPacketResult {
  categories: readonly SnapshotCategory[];
  missingTruth: readonly string[];
  staleItems: readonly string[];
  contradictedItems: readonly string[];
  unapprovedInferences: readonly string[];
  readyForCreative: boolean;
}

export async function assembleResearchPacket(businessId: string): Promise<ResearchPacketResult> {
  const supabase = getAdminSupabase();
  const categories: SnapshotCategory[] = [];
  const missingTruth: string[] = [];
  const staleItems: string[] = [];
  const contradictedItems: string[] = [];
  const unapprovedInferences: string[] = [];
  const now = new Date().toISOString();

  // 1. Identity from businesses table
  const { data: business } = await supabase
    .from("businesses")
    .select("id, display_name, normalized_name, primary_language, broad_business_type, operating_model, business_stage")
    .eq("id", businessId)
    .maybeSingle();

  if (business) {
    categories.push({
      category: "identity",
      truthStatus: "KNOWN",
      data: {
        displayName: business.display_name,
        normalizedName: business.normalized_name,
        primaryLanguage: business.primary_language,
        broadBusinessType: business.broad_business_type,
        operatingModel: business.operating_model,
        businessStage: business.business_stage,
      },
      evidenceRefs: [],
      snapshotTimestamp: now,
    });
  } else {
    missingTruth.push("Business identity not found.");
  }

  // 2. Approved facts from Living Business Book
  const { data: facts } = await supabase
    .from("business_facts")
    .select("id, field_key, display_value, status, source_class, confirmation_state, last_verified_at")
    .eq("business_id", businessId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (facts && facts.length > 0) {
    const verifiedFacts = facts.filter((f) => f.confirmation_state === "owner_confirmed" || f.confirmation_state === "staff_confirmed");
    const unverifiedFacts = facts.filter((f) => f.confirmation_state === "unconfirmed");

    categories.push({
      category: "approved_contacts_location",
      truthStatus: verifiedFacts.length > 0 ? "KNOWN" : "UNKNOWN",
      data: { facts: verifiedFacts.map((f) => ({ fieldKey: f.field_key, displayValue: f.display_value, sourceClass: f.source_class })) },
      evidenceRefs: verifiedFacts.map((f) => ({ factId: f.id, sourceClass: f.source_class, approvalState: f.confirmation_state, evidenceId: null })),
      snapshotTimestamp: now,
    });

    if (unverifiedFacts.length > 0) {
      unapprovedInferences.push(`${unverifiedFacts.length} unverified facts should not be printed as confirmed truth.`);
    }

    // Check for stale facts (last_verified_at older than 90 days)
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - 90);
    for (const f of facts) {
      if (f.last_verified_at && new Date(f.last_verified_at) < staleThreshold) {
        staleItems.push(`Fact ${f.field_key} last verified ${f.last_verified_at}.`);
      }
    }
  } else {
    missingTruth.push("No approved business facts found in Living Business Book.");
  }

  // 3. Contradictions
  const { data: contradictions } = await supabase
    .from("business_contradictions")
    .select("id, description")
    .eq("business_id", businessId)
    .eq("status", "active");

  if (contradictions && contradictions.length > 0) {
    for (const c of contradictions) {
      contradictedItems.push(`Contradiction: ${c.description}`);
    }
  }

  // 4. Approved recommendations from Stewardship Engine
  const { data: recommendations } = await supabase
    .from("business_recommendations")
    .select("id, dimension_key, status, verified_need_es, verified_need_en")
    .eq("business_id", businessId)
    .eq("status", "approved")
    .eq("is_current", true);

  if (recommendations && recommendations.length > 0) {
    categories.push({
      category: "source_recommendation",
      truthStatus: "KNOWN",
      data: { recommendations: recommendations.map((r) => ({ id: r.id, dimensionKey: r.dimension_key, needEs: r.verified_need_es, needEn: r.verified_need_en })) },
      evidenceRefs: recommendations.map((r) => ({ factId: null, sourceClass: "stewardship", approvalState: "approved", evidenceId: r.id })),
      snapshotTimestamp: now,
    });
  }

  // 5. AI Research briefings (for context only, not as fact)
  const { data: briefings } = await supabase
    .from("business_ai_briefing_drafts")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("status", "approved");

  if (briefings && briefings.length > 0) {
    categories.push({
      category: "ai_research_context",
      truthStatus: "UNAPPROVED_INFERENCE",
      data: { briefingCount: briefings.length },
      evidenceRefs: [],
      snapshotTimestamp: now,
    });
    unapprovedInferences.push("AI research briefings are context only, not printable facts.");
  }

  const readyForCreative = missingTruth.length === 0 && contradictedItems.length === 0;

  return {
    categories,
    missingTruth,
    staleItems,
    contradictedItems,
    unapprovedInferences,
    readyForCreative,
  };
}
