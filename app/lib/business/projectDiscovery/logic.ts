/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — pure decision logic, extracted from the
 * repository so it can be unit-tested without a database (mirrors meetingStudio/logic.ts's own
 * separation of pure rules from I/O). No secret, no network/database call, no "server-only" marker.
 */
import type { DiscoveryCompletenessClass, DiscoveryItemConfirmationState, DiscoveryTruthClass, ProjectDiscoveryItem } from "./types";

/**
 * An item blocks progress toward a blueprint when it is classified as required (before build or
 * before launch), is not yet client-confirmed, AND its truth is genuinely still missing (unknown or
 * needs_confirmation) — a required item that is merely a pending LEONIX_RECOMMENDATION or
 * TECHNICAL_DECISION is not "missing client information" and is deliberately excluded here (those
 * are Leonix's own judgment calls, not something to chase the client for).
 */
export function isBlockingDiscoveryItem(item: Pick<ProjectDiscoveryItem, "completenessClass" | "confirmationState" | "truthClass">): boolean {
  const isRequired = item.completenessClass === "required_before_build" || item.completenessClass === "required_before_launch";
  const isUnconfirmed = item.confirmationState !== "confirmed";
  const isGenuinelyMissing = item.truthClass === "unknown" || item.truthClass === "needs_confirmation";
  return isRequired && isUnconfirmed && isGenuinelyMissing;
}

/** needs_leonix_decision / needs_official_research items are never "missing client information" — they need Leonix's own action, not a client question. */
export function isLeonixActionItem(item: Pick<ProjectDiscoveryItem, "completenessClass">): boolean {
  return item.completenessClass === "needs_leonix_decision" || item.completenessClass === "needs_official_research";
}

/** The exact client-confirmed-timestamp atomicity rule the migration's own CHECK constraint enforces — kept here too so the API layer can validate before ever reaching the database. */
export function confirmationStateRequiresTimestamp(state: DiscoveryItemConfirmationState): boolean {
  return state === "confirmed";
}

/**
 * Cross-business protection for asset references (MD <security> "no cross-business linkage").
 * business_source_files has no UNIQUE(id, business_id) to compose a DB-level FK against (it
 * belongs to the unrelated Field Discovery domain) — this pure check is what the repository layer
 * runs before ever inserting the reference, and it is independently unit-testable here.
 */
export function assetReferenceCrossesBusinessBoundary(assetBusinessId: string, discoveryBusinessId: string): boolean {
  return assetBusinessId !== discoveryBusinessId;
}

/**
 * A discovery item's truth_class is never inferred FROM its completeness_class or vice versa —
 * they are two independent axes (MD <truth_contract> vs <completeness_contract>). This function
 * exists only to make that independence explicit and testable: every truth class is valid with
 * every completeness class.
 */
export function isValidTruthCompletenessCombination(_truthClass: DiscoveryTruthClass, _completenessClass: DiscoveryCompletenessClass): boolean {
  return true;
}
