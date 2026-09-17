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

import { listFactsForBusiness, loadBusinessCategoryContext, toKnownFactSignals } from "./discoveryContextShared";
import { getProjectDiscoveryById, listProjectDiscoveryItems } from "./repository";
import type { KnownFactSignal, WebsiteDiscoveryContext } from "./websiteDiscoveryLogic";

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

  const knownFacts: KnownFactSignal[] = toKnownFactSignals(facts);

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
