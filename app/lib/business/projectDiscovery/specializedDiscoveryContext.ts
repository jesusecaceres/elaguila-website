/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — real (DB-backed) context compiler for the
 * specialized (Logo/Print/Campaign) engines. Mirrors websiteDiscoveryContext.ts's own precedent
 * exactly, reusing the SAME canonical-truth wiring via discoveryContextShared.ts — Living Business
 * Book facts + Gate 1's own captured discovery items/intents — rather than a second copy.
 *
 * No secret, no write, no mutation — read-only compilation of a SpecializedDiscoveryContext.
 */
import "server-only";

import { listFactsForBusiness, loadBusinessCategoryContext, toKnownFactSignals } from "./discoveryContextShared";
import { getProjectDiscoveryById, listProjectDiscoveryIntents, listProjectDiscoveryItems } from "./repository";
import type { SpecializedDiscoveryContext } from "./specializedDiscoveryEngine";

export async function buildSpecializedDiscoveryContext(businessId: string, discoveryId: string, projectIntentId: string): Promise<SpecializedDiscoveryContext | null> {
  const [category, facts, discovery, items, intents] = await Promise.all([
    loadBusinessCategoryContext(businessId),
    listFactsForBusiness(businessId),
    getProjectDiscoveryById(businessId, discoveryId),
    listProjectDiscoveryItems(discoveryId, businessId),
    listProjectDiscoveryIntents(discoveryId, businessId),
  ]);
  if (!category || !discovery) return null;

  const intent = intents.find((i) => i.id === projectIntentId);
  if (!intent) return null;

  return {
    discoveryId,
    businessId,
    projectIntentId,
    projectType: intent.projectType,
    broadBusinessType: category.broadBusinessType,
    specificBusinessType: category.specificBusinessType,
    customSpecificType: category.customSpecificType,
    businessStage: category.businessStage,
    knownFacts: toKnownFactSignals(facts),
    capturedItems: items,
  };
}
