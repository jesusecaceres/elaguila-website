/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — client-safe projection (MD
 * <client_safe_boundary>). Reads from the exact same items table as the internal operator view (no
 * second store) and exposes only what a client should ever see: an approved item's display value,
 * and which confirmations are still pending. Deliberately never includes internal notes, the raw
 * truth_class (AI-confidence mechanics), completeness_class (internal planning classification),
 * captured-by actor identity, or any leonix_recommendation/technical_decision item that has not
 * been confirmed — those fields simply never leave the repository layer below.
 *
 * No client review/approval UI exists yet (that is explicitly out of scope for Gate 1) — this
 * function only proves the data model can support one cleanly when Gate 7 builds it.
 */
import "server-only";

import { getProjectDiscoveryById, listProjectDiscoveryItems } from "./repository";
import type { ProjectDiscoveryClientSafeProjection } from "./types";

export async function buildClientSafeProjectDiscoveryProjection(
  businessId: string,
  discoveryId: string,
): Promise<ProjectDiscoveryClientSafeProjection | null> {
  const discovery = await getProjectDiscoveryById(businessId, discoveryId);
  if (!discovery) return null;

  const items = await listProjectDiscoveryItems(discoveryId, businessId);

  const approvedItems = items
    .filter((item) => item.confirmationState === "confirmed")
    .map((item) => ({
      section: item.section,
      fieldKey: item.fieldKey,
      displayValue: item.displayValue,
      confirmationState: item.confirmationState,
    }));

  const needsConfirmationItems = items
    .filter((item) => item.confirmationState !== "confirmed" && (item.truthClass === "needs_confirmation" || item.truthClass === "ai_extracted"))
    .map((item) => ({
      section: item.section,
      fieldKey: item.fieldKey,
      displayValue: item.displayValue,
      confirmationState: item.confirmationState,
    }));

  return {
    title: discovery.title,
    status: discovery.status,
    approvedItems,
    needsConfirmationItems,
  };
}
