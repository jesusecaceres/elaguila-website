/**
 * Client Discovery & Project Blueprint Engine, Gate 2 — real (DB-backed) context compiler. Mirrors
 * growthEngine/analyst/inputPacket.ts's own precedent exactly: this file does the actual
 * canonical-truth reuse wiring (MD <canonical_truth_reuse>) — Living Business Book facts + Gate 1's
 * own captured discovery items + intents — and is NOT executed against a live database this gate
 * (per standing resource-control doctrine); only the PURE evaluation functions in
 * websiteDiscoveryLogic.ts/websiteQuestionEngine.ts are exercised by this gate's test suite.
 *
 * No secret, no write, no mutation — read-only compilation of an existing WebsiteDiscoveryContext.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { listFactsForBusiness } from "@/app/lib/business/livingBook/repository";
import { getProjectDiscoveryById, listProjectDiscoveryItems } from "./repository";
import type { KnownFactSignal, WebsiteDiscoveryContext } from "./websiteDiscoveryLogic";

/**
 * A confirmed/staff-confirmed Living Book fact is treated as "confirmed" canonical truth; anything
 * else (owner_statement, staff_observation, public_source_observation, ai_inference, etc.) is
 * "stale_or_unconfirmed" — the adaptive engine will surface a CONFIRM question for it rather than
 * silently trusting it (MD <canonical_truth_reuse>: "Do not silently treat stale public information
 * as client confirmation.").
 */
function factConfidence(confirmationState: string): KnownFactSignal["confidence"] {
  return confirmationState === "owner_confirmed" || confirmationState === "staff_confirmed" ? "confirmed" : "stale_or_unconfirmed";
}

function factSourceLabel(sourceClass: string): string {
  switch (sourceClass) {
    case "owner_confirmed":
    case "owner_statement":
      return "Living Business Book (owner)";
    case "staff_observation":
      return "Living Business Book (staff observation)";
    case "public_source_observation":
    case "leonix_listing_observation":
      return "Public research";
    case "connected_account_observation":
      return "Connected account";
    case "ai_inference":
      return "AI inference (Living Business Book)";
    default:
      return "Living Business Book";
  }
}

async function loadBusinessCategoryContext(
  businessId: string,
): Promise<{ broadBusinessType: string; specificBusinessType: string | null; customSpecificType: string | null; businessStage: string } | null> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("businesses")
    .select("broad_business_type, specific_business_type, custom_specific_type, business_stage")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { broad_business_type: string; specific_business_type: string | null; custom_specific_type: string | null; business_stage: string };
  return {
    broadBusinessType: row.broad_business_type,
    specificBusinessType: row.specific_business_type,
    customSpecificType: row.custom_specific_type,
    businessStage: row.business_stage,
  };
}

/**
 * True when canonical truth already shows an official website URL for this business — never asked
 * as "Do you have a website?" once known (MD <canonical_truth_reuse>).
 */
function hasExistingWebsiteFromFacts(facts: readonly { factKey: string }[]): boolean {
  return facts.some((f) => f.factKey === "official_website_url" || f.factKey === "website_url");
}

export async function buildWebsiteDiscoveryContext(businessId: string, discoveryId: string, projectIntentId: string | null): Promise<WebsiteDiscoveryContext | null> {
  const [category, facts, discovery, items] = await Promise.all([
    loadBusinessCategoryContext(businessId),
    listFactsForBusiness(businessId),
    getProjectDiscoveryById(businessId, discoveryId),
    listProjectDiscoveryItems(discoveryId, businessId),
  ]);
  if (!category || !discovery) return null;

  const knownFacts: KnownFactSignal[] = facts.map((f) => ({
    fieldKey: f.factKey,
    value: f.value,
    displayValue: f.displayValue,
    confidence: factConfidence(f.confirmationState),
    sourceLabel: factSourceLabel(f.sourceClass),
  }));

  return {
    discoveryId,
    businessId,
    projectIntentId,
    broadBusinessType: category.broadBusinessType,
    specificBusinessType: category.specificBusinessType,
    customSpecificType: category.customSpecificType,
    businessStage: category.businessStage,
    hasExistingWebsite: hasExistingWebsiteFromFacts(facts.map((f) => ({ factKey: f.factKey }))),
    knownFacts,
    capturedItems: items,
  };
}
