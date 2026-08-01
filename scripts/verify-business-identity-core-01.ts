/**
 * Focused tests for the Business Identity core (Package BCO-2). Repo-level, no-DB tests only —
 * no jest/vitest exists in this repo (confirmed); this follows the repository's own convention
 * of a plain node:assert script run via `npx tsx`.
 *
 * Only imports from files WITHOUT `import "server-only"` — that package always throws when
 * loaded outside Next's bundler context (confirmed empirically), so any file guarded by it
 * (featureFlag.ts, eligibility.ts, access.ts, duplicates.ts, repositories/**, services/**)
 * cannot be imported here at all, static or dynamic. The pure decision logic each of those
 * files wraps was deliberately extracted into sibling *Logic.ts files without the guard
 * specifically so it stays testable — see featureFlagLogic.ts's file comment for the rationale.
 * The I/O-performing halves (resolveNegocioEligibility, resolveDuplicateWarning, the finalize
 * RPC, every repository function) are exercised instead via the real staging integration check
 * in Phase 19, the same way Package 1's schema was certified — not with a fake client here.
 *
 * Run from repo root: npx tsx scripts/verify-business-identity-core-01.ts
 */
import { strict as assert } from "node:assert";

import {
  normalizeComparisonName,
  normalizeContactValue,
  normalizeEmail,
  normalizePhone,
  normalizeServiceAreaText,
  normalizeWebsiteDomain,
  slugBaseFromDisplayName,
} from "../app/lib/business/normalization";
import { validateBusinessBasics, validateContact, validateServiceArea, validateFinalCreationRequest } from "../app/lib/business/validation";
import { computeFlagTier } from "../app/lib/business/featureFlagLogic";
import { statusFromEvidence } from "../app/lib/business/eligibilityLogic";
import { computeAccessResolution } from "../app/lib/business/accessLogic";
import { maskDisplayName, wordOverlapScore } from "../app/lib/business/duplicatesLogic";
import type { BusinessIdentityFlagRow, EligibilityEvidence, EligibilityResult } from "../app/lib/business/types";

let passed = 0;
function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  PASS  ${name}`);
    })
    .catch((e) => {
      console.error(`  FAIL  ${name}`);
      console.error(e);
      process.exitCode = 1;
    });
}

async function main() {
  console.log("Business Identity core — focused tests\n");

  // --- normalization -------------------------------------------------------
  await check("normalizeComparisonName strips accents and lowercases", () => {
    assert.equal(normalizeComparisonName("El Águila  Café"), "el aguila cafe");
  });
  await check("slugBaseFromDisplayName produces a URL-safe slug", () => {
    assert.equal(slugBaseFromDisplayName("Taquería El Águila!"), "taqueria-el-aguila");
  });
  await check("slugBaseFromDisplayName returns null for empty input", () => {
    assert.equal(slugBaseFromDisplayName(""), null);
    assert.equal(slugBaseFromDisplayName("   "), null);
  });
  await check("normalizePhone preserves leading + and strips formatting", () => {
    assert.equal(normalizePhone("+1 (555) 123-4567"), "+15551234567");
    assert.equal(normalizePhone("555.123.4567"), "5551234567");
  });
  await check("normalizePhone returns null for no digits", () => {
    assert.equal(normalizePhone("abc"), null);
    assert.equal(normalizePhone(""), null);
  });
  await check("normalizeEmail lowercases and validates shape", () => {
    assert.equal(normalizeEmail("Owner@Example.COM"), "owner@example.com");
    assert.equal(normalizeEmail("not-an-email"), null);
  });
  await check("normalizeWebsiteDomain strips scheme/path/www", () => {
    assert.equal(normalizeWebsiteDomain("https://www.example.com/path?x=1"), "example.com");
    assert.equal(normalizeWebsiteDomain("example.com"), "example.com");
  });
  await check("normalizeWebsiteDomain returns null for garbage input", () => {
    assert.equal(normalizeWebsiteDomain("not a url at all ///"), null);
  });
  await check("normalizeContactValue routes by contact type and rejects invalid combos", () => {
    const phone = normalizeContactValue("phone", "555-000-1111");
    assert.ok(phone && phone.normalizedValue === "5550001111");
    const badEmail = normalizeContactValue("email", "nope");
    assert.equal(badEmail, null);
  });
  await check("normalizeServiceAreaText does not fabricate a value for blank input", () => {
    assert.equal(normalizeServiceAreaText("   "), null);
    assert.equal(normalizeServiceAreaText("Greater  Leonix   Metro"), "greater leonix metro");
  });

  // --- validation ------------------------------------------------------------
  await check("validateBusinessBasics accepts a valid input", () => {
    const result = validateBusinessBasics({ displayName: "Taquería El Águila", broadBusinessType: "food", businessStage: "active", primaryLanguage: "es" });
    assert.equal(result.ok, true);
  });
  await check("validateBusinessBasics rejects missing display name", () => {
    const result = validateBusinessBasics({ displayName: "", broadBusinessType: "food", businessStage: "active", primaryLanguage: "es" });
    assert.equal(result.ok, false);
  });
  await check("validateContact: preferred phone+whatsapp is valid", () => {
    const result = validateContact({ contactType: "phone", rawValue: "+15550001111", preferredChannel: true, channelKind: "whatsapp", isPrimary: true });
    assert.equal(result.ok, true);
  });
  await check("validateContact: preferred website is rejected", () => {
    const result = validateContact({ contactType: "website", rawValue: "example.com", preferredChannel: true, channelKind: null, isPrimary: false });
    assert.equal(result.ok, false);
  });
  await check("validateContact: preferred phone+email channel_kind is rejected", () => {
    const result = validateContact({ contactType: "phone", rawValue: "+15550001111", preferredChannel: true, channelKind: "email", isPrimary: false });
    assert.equal(result.ok, false);
  });
  await check("validateServiceArea accepts service_area_text", () => {
    const result = validateServiceArea({ areaKind: "service_area_text", rawText: "Greater Leonix Metro", isPrimary: true });
    assert.equal(result.ok, true);
  });
  await check("validateServiceArea rejects invalid area_kind", () => {
    const result = validateServiceArea({ areaKind: "not_real", rawText: "x", isPrimary: true });
    assert.equal(result.ok, false);
  });
  await check("validateFinalCreationRequest requires at least one contact and service area", () => {
    const result = validateFinalCreationRequest({
      userId: "user-1",
      basics: { displayName: "X", broadBusinessType: "food", businessStage: "active", primaryLanguage: "es" },
      contacts: [],
      serviceAreas: [],
      ownershipConfirmed: true,
      featureAccessGranted: true,
      eligibility: { status: "eligible", evidence: [], contradictions: [], requiresManualReview: false, humanExplanation: "", evaluatedAt: new Date().toISOString() },
      listingCandidate: null,
      listingOwnershipVerified: null,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some((e) => e.field === "contacts"));
      assert.ok(result.errors.some((e) => e.field === "serviceAreas"));
    }
  });
  await check("validateFinalCreationRequest rejects an unlinked listing candidate with unverified ownership", () => {
    const validContact = { contactType: "phone", rawValue: "+15550001111", preferredChannel: true, channelKind: "whatsapp", isPrimary: true } as const;
    const validArea = { areaKind: "service_area_text", rawText: "x", isPrimary: true } as const;
    const result = validateFinalCreationRequest({
      userId: "user-1",
      basics: { displayName: "X", broadBusinessType: "food", businessStage: "active", primaryLanguage: "es" },
      contacts: [validContact],
      serviceAreas: [validArea],
      ownershipConfirmed: true,
      featureAccessGranted: true,
      eligibility: { status: "eligible", evidence: [], contradictions: [], requiresManualReview: false, humanExplanation: "", evaluatedAt: new Date().toISOString() },
      listingCandidate: { listingSource: "listings", listingId: "abc" },
      listingOwnershipVerified: false,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.code === "listing_ownership_unverified"));
  });

  // --- feature flag ----------------------------------------------------------
  const baseFlag: BusinessIdentityFlagRow = { flagKey: "business_identity_foundation", enabled: false, pilotUserIds: [], emergencyDisabled: false, notes: null, updatedAt: "", updatedBy: null };
  await check("computeFlagTier: missing row -> unavailable", () => {
    assert.equal(computeFlagTier(null, "user-1"), "unavailable");
  });
  await check("computeFlagTier: emergency disabled -> unavailable even if enabled", () => {
    assert.equal(computeFlagTier({ ...baseFlag, enabled: true, emergencyDisabled: true }, "user-1"), "unavailable");
  });
  await check("computeFlagTier: enabled=true -> global", () => {
    assert.equal(computeFlagTier({ ...baseFlag, enabled: true }, "user-1"), "global");
  });
  await check("computeFlagTier: disabled + pilot user -> pilot", () => {
    assert.equal(computeFlagTier({ ...baseFlag, pilotUserIds: ["user-1"] }, "user-1"), "pilot");
  });
  await check("computeFlagTier: disabled + non-pilot user -> preview", () => {
    assert.equal(computeFlagTier(baseFlag, "user-2"), "preview");
  });
  await check("computeFlagTier: disabled + signed out -> preview", () => {
    assert.equal(computeFlagTier(baseFlag, null), "preview");
  });

  // --- eligibility matrix ------------------------------------------------------
  const ev = (partial: Partial<EligibilityEvidence>): EligibilityEvidence => ({
    source: "none",
    listingSource: null,
    listingId: null,
    entitlementId: null,
    reasonCode: "no_evidence_found",
    ...partial,
  });
  await check("eligibility: active placement entitlement -> eligible", () => {
    const r = statusFromEvidence([ev({ source: "leonix_placement_entitlements", reasonCode: "placement_entitlement_active_website_business" })]);
    assert.equal(r.status, "eligible");
  });
  await check("eligibility: seller_type=business -> eligible", () => {
    const r = statusFromEvidence([ev({ source: "listings_seller_type", reasonCode: "seller_type_business" })]);
    assert.equal(r.status, "eligible");
  });
  await check("eligibility: autos lane=negocios -> eligible", () => {
    const r = statusFromEvidence([ev({ source: "autos_lane", reasonCode: "autos_lane_negocios" })]);
    assert.equal(r.status, "eligible");
  });
  await check("eligibility: expired placement entitlement alone -> not eligible", () => {
    const r = statusFromEvidence([ev({ source: "leonix_placement_entitlements", reasonCode: "placement_entitlement_expired" })]);
    assert.notEqual(r.status, "eligible");
  });
  await check("eligibility: restaurantes package_tier alone -> ambiguous, requires manual review", () => {
    const r = statusFromEvidence([ev({ source: "restaurantes_package_tier", reasonCode: "restaurantes_package_tier_unconfirmed_value_set" })]);
    assert.equal(r.status, "ambiguous");
    assert.equal(r.requiresManualReview, true);
  });
  await check("eligibility: servicios alone -> ambiguous", () => {
    const r = statusFromEvidence([ev({ source: "servicios", reasonCode: "servicios_no_verified_signal" })]);
    assert.equal(r.status, "ambiguous");
  });
  await check("eligibility: no evidence at all -> ineligible, not ambiguous", () => {
    const r = statusFromEvidence([]);
    assert.equal(r.status, "ineligible");
    assert.equal(r.requiresManualReview, false);
  });
  await check("eligibility: contradictory (expired entitlement + ambiguous restaurantes) -> ambiguous, never fabricated eligible", () => {
    const r = statusFromEvidence([
      ev({ source: "leonix_placement_entitlements", reasonCode: "placement_entitlement_expired" }),
      ev({ source: "restaurantes_package_tier", reasonCode: "restaurantes_package_tier_unconfirmed_value_set" }),
    ]);
    assert.equal(r.status, "ambiguous");
  });
  await check("eligibility: unsupported source alone -> ambiguous, never false eligibility", () => {
    const r = statusFromEvidence([ev({ source: "unsupported_source", reasonCode: "unsupported_listing_source" })]);
    assert.equal(r.status, "ambiguous");
  });

  // --- access resolution matrix --------------------------------------------
  const elig = (status: EligibilityResult["status"]): EligibilityResult => ({ status, evidence: [], contradictions: [], requiresManualReview: status === "ambiguous", humanExplanation: "", evaluatedAt: new Date().toISOString() });
  await check("access: feature unavailable", () => {
    const r = computeAccessResolution({ tier: "unavailable", membership: null, business: null, drafts: [], eligibility: null });
    assert.equal(r.state, "feature_unavailable");
  });
  await check("access: preview only (no membership, disabled+non-pilot)", () => {
    const r = computeAccessResolution({ tier: "preview", membership: null, business: null, drafts: [], eligibility: null });
    assert.equal(r.state, "preview_only");
  });
  await check("access: ineligible", () => {
    const r = computeAccessResolution({ tier: "global", membership: null, business: null, drafts: [], eligibility: elig("ineligible") });
    assert.equal(r.state, "ineligible");
  });
  await check("access: ambiguous", () => {
    const r = computeAccessResolution({ tier: "global", membership: null, business: null, drafts: [], eligibility: elig("ambiguous") });
    assert.equal(r.state, "ambiguous");
  });
  await check("access: eligible with zero drafts -> eligible_start", () => {
    const r = computeAccessResolution({ tier: "pilot", membership: null, business: null, drafts: [], eligibility: elig("eligible") });
    assert.equal(r.state, "eligible_start");
  });
  const fakeDraft = { id: "d1", userId: "u1", intentKey: "k1", businessId: null, currentStep: 1, draftPayload: { schemaVersion: 1 as const }, createdAt: "", updatedAt: "", expiresAt: "" };
  await check("access: exactly one draft -> resume_single_draft", () => {
    const r = computeAccessResolution({ tier: "global", membership: null, business: null, drafts: [fakeDraft], eligibility: elig("eligible") });
    assert.equal(r.state, "resume_single_draft");
  });
  await check("access: multiple drafts -> choose_draft", () => {
    const r = computeAccessResolution({ tier: "global", membership: null, business: null, drafts: [fakeDraft, { ...fakeDraft, id: "d2", intentKey: "k2" }], eligibility: elig("eligible") });
    assert.equal(r.state, "choose_draft");
  });
  const fakeBusiness = {
    id: "b1", displayName: "X", legalName: null, publicName: null, normalizedName: "x", slug: "x",
    broadBusinessType: "food_hospitality" as const, specificBusinessType: null, customSpecificType: null,
    businessStage: "operating" as const, primaryLanguage: "es" as const, businessPrimaryLanguage: null,
    businessAdditionalLanguages: [], yearStarted: null, operatingModels: [], salesRelationships: [], salesChannels: [],
    preferredResponseMethod: null,
    status: "active" as const, onboardingStatus: "complete" as const, creationSource: "onboarding_wizard" as const,
    createdByUserId: "u1", createdAt: "", updatedAt: "", archivedAt: null,
  };
  const fakeMembership = {
    id: "m1", businessId: "b1", userId: "u1", membershipRole: "owner" as const, membershipStatus: "active" as const,
    isPrimaryOwner: true, invitedByUserId: null, acceptedAt: null, revokedAt: null, createdAt: "", updatedAt: "",
    authorizationRole: "owner" as const, representativeRelationship: null, representativeContactEmail: null,
    representativeNote: null, manualReviewFlag: false,
  };
  await check("access: existing active membership takes priority over eligibility re-check", () => {
    const r = computeAccessResolution({ tier: "global", membership: fakeMembership, business: fakeBusiness, drafts: [], eligibility: null });
    assert.equal(r.state, "existing_business");
  });

  // --- duplicate detection: pure helpers + privacy shape ----------------------
  await check("maskDisplayName never returns the full original string", () => {
    const masked = maskDisplayName("Taquería El Águila");
    assert.notEqual(masked, "Taquería El Águila");
    assert.ok(masked.includes("*"));
  });
  await check("wordOverlapScore: identical strings score 1, unrelated strings score low", () => {
    assert.equal(wordOverlapScore("taqueria el aguila", "taqueria el aguila"), 1);
    assert.ok(wordOverlapScore("taqueria el aguila", "totally different name") < 0.5);
  });
  await check("DuplicateCandidateSummary shape never carries contact/legal fields (compile-time + runtime key check)", () => {
    const summary = { businessId: "b1", displayNameMasked: "Ta*", matchedSignals: ["normalizedName"] as const, accessibleToCurrentUser: false };
    const forbiddenKeys = ["phone", "email", "legalName", "value", "normalizedValue", "createdByUserId"];
    for (const key of forbiddenKeys) assert.ok(!(key in summary), `forbidden key "${key}" leaked into duplicate candidate summary`);
  });

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.error("\nSome checks FAILED.");
    process.exit(1);
  }
}

main();
