/**
 * Pure access-resolution decision logic — deliberately NOT "server-only" so the full
 * access-state matrix is directly unit-testable (see featureFlagLogic.ts for the rationale).
 * access.ts (server-only, performs the actual reads) imports and re-exports this.
 */
import type { ResolvedFlagTier } from "./featureFlagLogic";
import type { AccessResolution, Business, BusinessMembership, BusinessOnboardingDraft, EligibilityResult } from "./types";

/**
 * Resolution order (fixed, do not reorder): feature flag/emergency -> existing active membership
 * -> existing drafts -> eligibility. An existing canonical business always takes priority over
 * re-running new-business eligibility.
 */
export function computeAccessResolution(input: {
  tier: ResolvedFlagTier;
  membership: BusinessMembership | null;
  business: Business | null;
  drafts: readonly BusinessOnboardingDraft[];
  eligibility: EligibilityResult | null;
}): AccessResolution {
  if (input.tier === "unavailable") {
    return { state: "feature_unavailable" };
  }

  if (input.membership) {
    if (input.business) {
      return { state: "existing_business", business: input.business, membership: input.membership };
    }
    // Membership row exists but the business is unreadable under RLS for some reason
    // (should not happen given the schema's design) — fail to preview rather than crash.
    return { state: "preview_only", eligibility: null };
  }

  if (input.tier === "preview") {
    return { state: "preview_only", eligibility: null };
  }

  const eligibility = input.eligibility;
  if (!eligibility) {
    return { state: "error", reasonCode: "eligibility_not_evaluated" };
  }

  if (input.drafts.length === 1) {
    return { state: "resume_single_draft", draft: input.drafts[0], eligibility };
  }
  if (input.drafts.length > 1) {
    return { state: "choose_draft", drafts: input.drafts, eligibility };
  }

  if (eligibility.status === "eligible") {
    return { state: "eligible_start", eligibility };
  }
  if (eligibility.status === "ambiguous") {
    return { state: "ambiguous", eligibility };
  }
  return { state: "ineligible", eligibility };
}
