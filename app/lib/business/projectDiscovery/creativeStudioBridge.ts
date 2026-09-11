/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — "Create Creative Studio Project" bridge for
 * Logo/Brand and Print Collateral blueprints (MD <logo_execution_bridge>, <print_collateral>'s own
 * execution destination, <creative_studio_bridge>). Mirrors the EXISTING Opportunity/Growth-Solution
 * -> Creative Studio bridge routes exactly (createJob(), never a second creative system).
 *
 * Idempotent: a double-click for the SAME approved blueprint version returns the already-created
 * job rather than a duplicate (application-layer check backed by the migration's own partial unique
 * index on business_creative_jobs.source_project_blueprint_id).
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { createJob, getJobByBlueprintId, type CreativeActor } from "@/app/lib/business/creativeStudio/repository";
import { CREATIVE_DOCTRINE_VERSION, CREATIVE_TEMPLATE_VERSION, type CreativeAssetType, type CreativeJob, type CreativeLanguage } from "@/app/lib/business/creativeStudio/types";
import { setBlueprintHandoff, type BusinessProjectBlueprint } from "./blueprintRepository";
import type { LogoBrandBlueprintPacket, PrintCollateralBlueprintPacket } from "./specializedBlueprintEngine";

const PROJECT_TYPE_TO_ASSET_TYPE: Record<string, CreativeAssetType> = {
  logo_brand_identity: "logo_direction",
  business_cards: "print_collateral_direction",
  flyer: "print_collateral_direction",
  banner_signage: "print_collateral_direction",
  referral_materials: "print_collateral_direction",
};

async function getBusinessPrimaryLanguage(businessId: string): Promise<CreativeLanguage> {
  const supabase = getAdminSupabase();
  const { data } = await supabase.from("businesses").select("primary_language").eq("id", businessId).maybeSingle();
  return data?.primary_language === "en" ? "en_primary_es_support" : "es_primary_en_support";
}

export type CreativeStudioBridgeResult =
  | { ok: true; job: CreativeJob; alreadyExisted: boolean }
  | { ok: false; reason: "not_approved" | "unsupported_project_type" | "job_create_failed" };

export async function createCreativeStudioProjectFromBlueprint(
  businessId: string,
  blueprint: BusinessProjectBlueprint<LogoBrandBlueprintPacket | PrintCollateralBlueprintPacket>,
  actor: CreativeActor,
): Promise<CreativeStudioBridgeResult> {
  if (blueprint.status !== "approved_for_build") return { ok: false, reason: "not_approved" };

  const assetType = PROJECT_TYPE_TO_ASSET_TYPE[blueprint.packet.projectType];
  if (!assetType) return { ok: false, reason: "unsupported_project_type" };

  const existing = await getJobByBlueprintId(businessId, blueprint.id);
  if (existing) return { ok: true, job: existing, alreadyExisted: true };

  const language = await getBusinessPrimaryLanguage(businessId);
  const job = await createJob(
    businessId,
    {
      sourceRecommendationId: null,
      sourceProposalId: null,
      sourceOpportunityId: null,
      sourceProjectBlueprintId: blueprint.id,
      assetType,
      language,
      format: "FULL_PAGE",
      archetype: "AUTHORITY_TRADITIONAL_UPGRADED",
      layoutVariant: "A",
      inputSnapshotId: null,
      doctrineVersion: CREATIVE_DOCTRINE_VERSION,
      templateVersion: CREATIVE_TEMPLATE_VERSION,
      providerKey: "gemini",
      modelKey: "gemini-2.5-flash",
      creativeLane: "LANE_A_TRADITIONAL_UPGRADED",
      riskClass: "NORMAL",
      createdActorType: actor.type,
      createdByRosterId: actor.rosterId,
      createdByAuthUserId: actor.authUserId,
      createdByEmail: actor.email,
      createdByRole: actor.role,
    },
    actor,
  );
  if (!job) return { ok: false, reason: "job_create_failed" };

  // Job is durable (never rolled back, matching the opportunity/growth-solution bridges' own
  // convention) — a handoff-write failure never loses the already-created job; the blueprint's
  // handoff fields can be corrected via a retry of the same "Create Creative Studio Project" action
  // (which now finds the existing job and reports alreadyExisted instead of creating a second one).
  await setBlueprintHandoff(businessId, blueprint.id, {
    handoffStatus: "assigned",
    handoffNotes: `Creative Studio job ${job.id}`,
  }).catch(() => undefined);

  return { ok: true, job, alreadyExisted: false };
}
