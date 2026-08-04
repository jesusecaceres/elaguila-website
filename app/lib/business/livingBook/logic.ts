/**
 * Gate BCO-5A — deterministic, pure Living Business Book logic. No AI, no network, no DB access —
 * every function here is a plain function of its inputs, unit-testable without a database
 * (same convention as app/admin/_lib/salesWorkspaceLogic.ts).
 */
import type { BookCompleteness, BusinessFact, BusinessUnknown, FactFreshness } from "./types";

const FRESH_WINDOW_DAYS = 90;
const AGING_WINDOW_DAYS = 270;

/**
 * "Freshness" is never stored — it's derived here at read time from `lastVerifiedAt`, the same
 * pattern this repo already uses for business_follow_ups' due_today/overdue derivation
 * (deriveFollowUpDisplayStatus in salesWorkspaceLogic.ts). A fact that has never been verified is
 * "unknown" freshness, not silently treated as fresh or stale.
 */
export function deriveFactFreshness(lastVerifiedAt: string | null, nowIso: string): FactFreshness {
  if (!lastVerifiedAt) return "unknown";
  const verified = new Date(lastVerifiedAt).getTime();
  const now = new Date(nowIso).getTime();
  if (Number.isNaN(verified) || Number.isNaN(now)) return "unknown";
  const ageDays = (now - verified) / (1000 * 60 * 60 * 24);
  if (ageDays <= FRESH_WINDOW_DAYS) return "fresh";
  if (ageDays <= AGING_WINDOW_DAYS) return "aging";
  return "stale";
}

export type CompletenessInput = {
  facts: readonly { status: string; sourceClass: string; lastVerifiedAt: string | null }[];
  unknowns: readonly { status: string }[];
  contradictions: readonly { status: string }[];
  discoveryAnswered: number | null;
  discoveryTotal: number | null;
  nowIso: string;
};

export function computeBookCompleteness(input: CompletenessInput): BookCompleteness {
  const activeFacts = input.facts.filter((f) => f.status === "active");
  const confirmedFactCount = activeFacts.filter((f) => f.sourceClass === "owner_confirmed").length;
  const ownerStatementCount = activeFacts.filter((f) => f.sourceClass === "owner_statement").length;
  const staleFactCount = activeFacts.filter((f) => deriveFactFreshness(f.lastVerifiedAt, input.nowIso) === "stale").length;
  const openUnknownCount = input.unknowns.filter((u) => u.status === "open").length;
  const unresolvedContradictionCount = input.contradictions.filter((c) => c.status === "open").length;
  const discoveryProgress =
    input.discoveryTotal != null && input.discoveryAnswered != null
      ? { answered: input.discoveryAnswered, total: input.discoveryTotal }
      : null;

  return { confirmedFactCount, ownerStatementCount, openUnknownCount, unresolvedContradictionCount, staleFactCount, discoveryProgress };
}

/**
 * Never present an inference with the same visual/data treatment as a confirmed fact — this is
 * enforced structurally by keeping sourceClass/confirmationState always present alongside a
 * fact's value, never optional, so no rendering path can silently drop them.
 */
export function isVerifiedTruth(confirmationState: string, sourceClass: string): boolean {
  return confirmationState === "owner_confirmed" || confirmationState === "staff_confirmed" || sourceClass === "owner_confirmed";
}

/**
 * A sales_rep may create facts, but never a sensitive fact whose confirmation_state is already
 * owner_confirmed/staff_confirmed — that would silently overwrite a reviewed, trusted claim
 * without the review step the product doctrine requires. Managers/super_admin are not subject to
 * this extra guard (they hold confirm_business_fact and resolve_contradictions already).
 */
export function requiresManagerReviewToOverwrite(existing: { sensitivity: string; confirmationState: string } | null): boolean {
  if (!existing) return false;
  const isTrusted = existing.confirmationState === "owner_confirmed" || existing.confirmationState === "staff_confirmed";
  return existing.sensitivity === "sensitive" && isTrusted;
}

/**
 * Owner-safe shaping (Gate 5). The owner NEVER sees a `sensitive` fact regardless of its
 * `visibility` column — sensitivity is the stronger, non-overridable gate. Applied server-side,
 * before the payload is ever serialized to the client — never left for the page to hide.
 */
export function shapeFactsForOwnerView(facts: readonly BusinessFact[]): BusinessFact[] {
  return facts.filter((f) => f.status === "active" && f.visibility === "owner_and_staff" && f.sensitivity === "standard");
}

export function shapeUnknownsForOwnerView(unknowns: readonly BusinessUnknown[]): BusinessUnknown[] {
  return unknowns.filter((u) => u.visibility === "owner_and_staff" && u.status === "open");
}
