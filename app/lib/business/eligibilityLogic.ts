/**
 * Pure eligibility decision logic — deliberately NOT "server-only" so it's directly
 * unit-testable (see featureFlagLogic.ts for the same rationale). eligibility.ts (server-only,
 * performs the actual DB reads) imports and re-exports this.
 */
import type { EligibilityEvidence, EligibilityResult, EligibilityStatus } from "./types";

/**
 * Pure constructor for the non-production test-override eligibility result (BCO-3Q). Used only
 * when shouldApplyTestOverride (featureFlagLogic.ts) is true for the requesting user — same
 * safety gate as the feature-flag override: impossible when VERCEL_ENV=production, requires an
 * exact user-id match. Clearly labeled as a synthetic QA override in every field — never
 * disguised as real evidence, so a reviewer or future maintainer can never mistake this for a
 * genuine signal.
 */
export function buildTestOverrideEligibilityResult(evaluatedAt: string): EligibilityResult {
  const evidence: EligibilityEvidence = {
    source: "non_production_test_override",
    listingSource: null,
    listingId: null,
    entitlementId: null,
    reasonCode: "non_production_test_override",
  };
  return {
    status: "eligible",
    evidence: [evidence],
    contradictions: [],
    requiresManualReview: false,
    humanExplanation: "Elegibilidad de prueba (no producción) — no es evidencia real. / Test-only eligibility override (non-production) — not real evidence.",
    evaluatedAt,
  };
}

export function statusFromEvidence(
  evidence: readonly EligibilityEvidence[],
): { status: EligibilityStatus; requiresManualReview: boolean; humanExplanation: string } {
  const activePositive = evidence.find(
    (e) =>
      e.reasonCode === "placement_entitlement_active_website_business" ||
      e.reasonCode === "seller_type_business" ||
      e.reasonCode === "autos_lane_negocios",
  );
  if (activePositive) {
    return {
      status: "eligible",
      requiresManualReview: false,
      humanExplanation: "Encontramos evidencia verificada de que administras un negocio en Leonix. / We found verified evidence that you manage a business on Leonix.",
    };
  }

  const ambiguousReasons: string[] = evidence
    .filter((e) => e.reasonCode === "restaurantes_package_tier_unconfirmed_value_set" || e.reasonCode === "servicios_no_verified_signal" || e.reasonCode === "unsupported_listing_source")
    .map((e) => e.reasonCode);

  if (ambiguousReasons.length > 0) {
    return {
      status: "ambiguous",
      requiresManualReview: true,
      humanExplanation:
        "No pudimos confirmar automáticamente tu elegibilidad; un miembro del equipo puede revisarlo. / We couldn't automatically confirm your eligibility; a staff member can review it.",
    };
  }

  return {
    status: "ineligible",
    requiresManualReview: false,
    humanExplanation:
      "Todavía no encontramos evidencia de que administras un negocio en Leonix. / We haven't yet found evidence that you manage a business on Leonix.",
  };
}
