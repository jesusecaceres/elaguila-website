/**
 * Client Discovery & Project Blueprint Engine, Gate 2 — deterministic tests for the Website
 * Discovery catalog, completeness/readiness logic, scope-signal engine, and adaptive question
 * engine. No database, no network — pure fixtures throughout.
 *
 * Run from repo root: npx tsx scripts/test-website-discovery-engine.ts
 */
import { strict as assert } from "node:assert";

import {
  WEBSITE_DISCOVERY_CATALOG_VERSION,
  WEBSITE_REQUIREMENTS,
  getWebsiteRequirement,
  type WebsiteDiscoverySection,
} from "../app/lib/business/projectDiscovery/websiteDiscoveryCatalog";
import {
  detectWebsiteScopeSignals,
  evaluateWebsiteReadiness,
  evaluateWebsiteRequirements,
  resolveIndustryBranch,
  type KnownFactSignal,
  type WebsiteDiscoveryContext,
} from "../app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import { buildBeforeYouWrapUp, buildQuestionsToAskNow, unresolvedQuestionPool } from "../app/lib/business/projectDiscovery/websiteQuestionEngine";
import type { ProjectDiscoveryItem } from "../app/lib/business/projectDiscovery/types";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Website Discovery Engine (Gate 2) — deterministic tests\n");

// --- Fixture builders -----------------------------------------------------------------------------
let idCounter = 0;
const nextId = () => `item-${(idCounter += 1)}`;
const NOW = new Date().toISOString();

// "retail_ecommerce" deliberately resolves to NO industry branch (matches none of the BRANCH_RULES)
// so generic readiness/scope/dependency tests never accidentally pick up an industry-specific
// requirement unless a test explicitly sets a branch-triggering broadBusinessType.
function baseContext(overrides: Partial<WebsiteDiscoveryContext> = {}): WebsiteDiscoveryContext {
  return {
    discoveryId: "disc-1", businessId: "biz-1", projectIntentId: "intent-website-1",
    broadBusinessType: "retail_ecommerce", specificBusinessType: null, customSpecificType: null,
    businessStage: "operating", hasExistingWebsite: false,
    knownFacts: [], capturedItems: [],
    ...overrides,
  };
}

function item(fieldKey: string, value: unknown, opts: Partial<Pick<ProjectDiscoveryItem, "truthClass" | "completenessClass" | "confirmationState" | "projectIntentId">> = {}): ProjectDiscoveryItem {
  return {
    id: nextId(), businessId: "biz-1", discoveryId: "disc-1",
    projectIntentId: opts.projectIntentId === undefined ? "intent-website-1" : opts.projectIntentId,
    section: "business_identity", fieldKey, value, displayValue: String(value), valueType: "text",
    truthClass: opts.truthClass ?? "client_confirmed",
    completenessClass: opts.completenessClass ?? "required_before_build",
    confirmationState: opts.confirmationState ?? "confirmed",
    clientConfirmedAt: (opts.confirmationState ?? "confirmed") === "confirmed" ? NOW : null,
    capturedActorType: "staff", capturedByRosterId: "staff-1", capturedByAuthUserId: "auth-1", capturedByEmail: "staff@leonix.test", capturedByRole: "sales_rep",
    notes: null, createdAt: NOW, updatedAt: NOW,
  };
}

function fact(fieldKey: string, value: unknown, confidence: KnownFactSignal["confidence"] = "confirmed", sourceLabel = "Living Business Book (owner)"): KnownFactSignal {
  return { fieldKey, value, displayValue: String(value), confidence, sourceLabel };
}

/** Every required field for a "mostly complete, ready" website discovery, so tests can subtract from a known-good baseline. */
function allBuildBlockersAnswered(overrides: Partial<WebsiteDiscoveryContext> = {}): WebsiteDiscoveryContext {
  const buildBlockerKeys = WEBSITE_REQUIREMENTS.filter((r) => r.defaultCompletenessClass === "required_before_build" && !r.industryBranch).map((r) => r.fieldKey);
  const capturedItems = buildBlockerKeys.map((k) => item(k, "answered"));
  // backend_database_needed is the one unconditional (no dependencyCondition, no industryBranch)
  // needs_leonix_decision item in the general catalog — every "otherwise ready" baseline fixture
  // must resolve it too, or readiness will correctly (and realistically) stay at
  // NEEDS_LEONIX_ARCHITECTURE_DECISION forever, matching the real doctrine that Leonix must always
  // make this call explicitly, even for the simplest site.
  capturedItems.push(item("backend_database_needed", false, { completenessClass: "needs_leonix_decision", truthClass: "technical_decision" }));
  return baseContext({ capturedItems, ...overrides });
}

// =================================================================================================
// Catalog structure — version, sections, bilingual, no-secret (scenarios 37, 38, 36)
// =================================================================================================
check("Scenario 38: catalog schema version exists and is stable", () => {
  assert.equal(WEBSITE_DISCOVERY_CATALOG_VERSION, "website_discovery_v1");
});
check("27 information domains are represented across the catalog", () => {
  const sections = new Set(WEBSITE_REQUIREMENTS.map((r) => r.section));
  const expected: WebsiteDiscoverySection[] = [
    "business_identity", "website_objective", "audience", "offers_services_products", "brand_identity",
    "visual_references", "content", "media_assets", "page_architecture", "primary_cta", "forms", "domain",
    "hosting_deployment", "cms", "backend_database_auth", "booking_scheduling", "payments_commerce",
    "social_presence", "seo", "analytics", "accessibility", "languages", "privacy_legal",
    "ownership_billing", "maintenance", "scope", "schedule_approvals",
  ];
  assert.equal(expected.length, 27);
  for (const s of expected) assert.ok(sections.has(s), `missing section: ${s}`);
});
check("Scenario 37: every active client-facing website question has both EN and ES text", () => {
  for (const req of WEBSITE_REQUIREMENTS) {
    if (req.whoShouldAnswer !== "CLIENT") continue;
    assert.ok(req.clientQuestionEn.trim().length > 0, `${req.fieldKey} missing clientQuestionEn`);
    assert.ok(req.clientQuestionEs.trim().length > 0, `${req.fieldKey} missing clientQuestionEs`);
    assert.ok(req.labelEn.trim().length > 0 && req.labelEs.trim().length > 0, `${req.fieldKey} missing bilingual label`);
  }
});
check("Scenario 36: no requirement ACTUALLY REQUESTS a password/secret/API key/token from the client", () => {
  // A defensive mention explaining what NOT to ask (e.g. "not the password — just who owns it") is
  // fine and expected (MD <domain_and_ownership>: the system may ask "Do you have access?", it must
  // not ask "What is your password?"); only a DIRECT REQUEST pattern is disallowed.
  const directRequest = /what('s| is) (your|the) (password|secret|api key|token)|enter (your|the) (password|secret|api key|token)|provide (your|the) (password|secret|api key|token)|share (your|the) (password|secret|api key|token)/i;
  const credentialShapedKey = /password|secret|api[_-]?key|service[_-]?role|auth[_-]?token/i;
  for (const req of WEBSITE_REQUIREMENTS) {
    assert.ok(!directRequest.test(req.clientQuestionEn), `${req.fieldKey} clientQuestionEn directly requests a secret`);
    assert.ok(!directRequest.test(req.clientQuestionEs), `${req.fieldKey} clientQuestionEs directly requests a secret`);
    assert.ok(!credentialShapedKey.test(req.fieldKey), `${req.fieldKey} field key looks credential-shaped`);
  }
  // Domain/ownership questions ask "do you have access", never "what is the password" — verify both
  // the access question (no mention at all) and the owner question (mentions "password" only
  // defensively, to explain it is NOT being asked for).
  const domainAccess = getWebsiteRequirement("domain_access_available")!;
  assert.ok(/access/i.test(domainAccess.clientQuestionEn) && !/password/i.test(domainAccess.clientQuestionEn));
  const domainOwner = getWebsiteRequirement("domain_owner")!;
  assert.ok(/not the password/i.test(domainOwner.clientQuestionEn), "domain_owner should defensively clarify it is not asking for the password");
});

// =================================================================================================
// Industry branch resolution — canonical category mapping, not display-label guessing
// =================================================================================================
check("RESTAURANT BRANCH: resolves from broad_business_type food_hospitality", () => {
  assert.equal(resolveIndustryBranch({ broadBusinessType: "food_hospitality", specificBusinessType: null, customSpecificType: null }), "restaurant");
});
check("FITNESS BRANCH: resolves from health_beauty_wellness + gym keyword, not from health_beauty_wellness alone (avoids false-positive on a spa)", () => {
  assert.equal(resolveIndustryBranch({ broadBusinessType: "health_beauty_wellness", specificBusinessType: "CrossFit gym", customSpecificType: null }), "fitness");
  assert.equal(resolveIndustryBranch({ broadBusinessType: "health_beauty_wellness", specificBusinessType: "Hair salon", customSpecificType: null }), null);
});
check("RADIO / MEDIA BRANCH: resolves from arts_entertainment_events + radio keyword", () => {
  assert.equal(resolveIndustryBranch({ broadBusinessType: "arts_entertainment_events", specificBusinessType: "Radio station", customSpecificType: null }), "radio_media");
  assert.equal(resolveIndustryBranch({ broadBusinessType: "arts_entertainment_events", specificBusinessType: "Concert venue", customSpecificType: null }), null);
});
check("CHURCH BRANCH: resolves from nonprofit_faith_community", () => {
  assert.equal(resolveIndustryBranch({ broadBusinessType: "nonprofit_faith_community", specificBusinessType: null, customSpecificType: null }), "church");
});
check("PROFESSIONAL SERVICE BRANCH: resolves from professional_services alone", () => {
  assert.equal(resolveIndustryBranch({ broadBusinessType: "professional_services", specificBusinessType: null, customSpecificType: null }), "professional_service");
});
check("HOME / LOCAL SERVICE BRANCH: resolves from home_personal_services and construction_trades", () => {
  assert.equal(resolveIndustryBranch({ broadBusinessType: "home_personal_services", specificBusinessType: null, customSpecificType: null }), "home_local_service");
  assert.equal(resolveIndustryBranch({ broadBusinessType: "construction_trades", specificBusinessType: null, customSpecificType: null }), "home_local_service");
});
check("Scenario 32: an industry question never appears for an unrelated business", () => {
  const ctx = baseContext({ broadBusinessType: "retail_ecommerce" });
  const evals = evaluateWebsiteRequirements(ctx);
  const restaurantQuestion = evals.find((e) => e.requirement.fieldKey === "restaurant_menu_source")!;
  assert.equal(restaurantQuestion.status, "not_applicable");
});

// =================================================================================================
// Truth/canonical-reuse scenarios (25, 26, 27, 28)
// =================================================================================================
check("Scenario 25: a canonical confirmed fact suppresses the duplicate question", () => {
  const ctx = baseContext({ knownFacts: [fact("public_business_name", "Acme Co", "confirmed")] });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "public_business_name")!;
  assert.equal(evalItem.status, "confirmed");
  assert.ok(!unresolvedQuestionPool(ctx).some((q) => q.fieldKey === "public_business_name"));
});
check("Scenario 26: a stale/unconfirmed known fact creates a CONFIRM question, never silent trust", () => {
  const ctx = baseContext({ knownFacts: [fact("public_business_name", "Acme Co", "stale_or_unconfirmed")] });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "public_business_name")!;
  assert.equal(evalItem.status, "needs_confirmation");
  const q = unresolvedQuestionPool(ctx).find((q) => q.fieldKey === "public_business_name");
  assert.ok(q, "expected a confirm question for a stale fact");
  assert.equal(q!.sourceReason, "confirm");
});
check("recommendReconfirmation forces a confirm question even for a confirmed known fact (operationally important)", () => {
  const ctx = baseContext({ knownFacts: [fact("public_contact_phone", "555-0100", "confirmed")] });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "public_contact_phone")!;
  assert.equal(evalItem.status, "needs_confirmation", "public_contact_phone has recommendReconfirmation:true");
});
check("If public research proves an official website URL exists, 'Do you have a website?' is never asked — different questions about it are asked instead", () => {
  const ctx = baseContext({ hasExistingWebsite: true });
  const painPoint = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "current_pain_point")!;
  assert.equal(painPoint.status, "missing", "current_pain_point only applies once a website is known to exist");
  const noWebsiteCtx = baseContext({ hasExistingWebsite: false });
  const painPointNoSite = evaluateWebsiteRequirements(noWebsiteCtx).find((e) => e.requirement.fieldKey === "current_pain_point")!;
  assert.equal(painPointNoSite.status, "not_applicable");
});
check("Scenario 27: a client preference remains a preference, never a confirmed canonical fact by default", () => {
  const ctx = baseContext({ capturedItems: [item("colors_liked", ["red", "black"], { truthClass: "client_preference", completenessClass: "helpful", confirmationState: "unconfirmed" })] });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "colors_liked")!;
  assert.equal(evalItem.item?.truthClass, "client_preference");
  assert.notEqual(evalItem.status, "confirmed", "an unconfirmed preference must not be silently treated as confirmed");
});
check("Scenario 28: an AI-extracted answer remains unconfirmed and still counts as a resolved-but-not-confirmed item", () => {
  const ctx = baseContext({ capturedItems: [item("about_story", "Founded in 2010...", { truthClass: "ai_extracted", completenessClass: "helpful", confirmationState: "unconfirmed" })] });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "about_story")!;
  assert.equal(evalItem.status, "captured_unconfirmed");
  assert.notEqual(evalItem.status, "confirmed");
});

// =================================================================================================
// Completeness classes never conflated (scenarios 20-24)
// =================================================================================================
check("Scenario 21: helpful missing items never block build or launch readiness", () => {
  const ctx = allBuildBlockersAnswered();
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.equal(readiness.state, "READY_WITH_NON_BLOCKING_GAPS", "required_before_launch items remain unanswered in this baseline");
  assert.ok(readiness.helpfulMissing.length > 0);
  assert.equal(readiness.requiredBeforeBuildBlockers.length, 0);
});
check("Scenario 22: a not_applicable item never appears as missing/blocking", () => {
  const ctx = baseContext({ hasExistingWebsite: false });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "existing_host_migration_needed")!;
  assert.equal(evalItem.status, "not_applicable");
});
check("Scenario 23: a needs_leonix_decision item never becomes a client question", () => {
  const ctx = baseContext({ capturedItems: [item("wants_self_managed_content", true, { truthClass: "client_confirmed", completenessClass: "required_before_build" })] });
  const cmsDecision = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "cms_architecture_decision")!;
  assert.equal(cmsDecision.requirement.whoShouldAnswer, "LEONIX");
  assert.ok(!unresolvedQuestionPool(ctx).some((q) => q.fieldKey === "cms_architecture_decision"), "a Leonix decision must never surface as a client-facing question");
});
check("Scenario 24: an official-research item never becomes 'the client forgot to answer'", () => {
  const ctx = baseContext();
  const req = getWebsiteRequirement("industry_regulatory_requirements")!;
  assert.equal(req.whoShouldAnswer, "OFFICIAL_RESEARCH");
  assert.ok(!unresolvedQuestionPool(ctx).some((q) => q.fieldKey === "industry_regulatory_requirements"));
});
check("Scenario 20: final privacy/legal copy can correctly be required_before_launch (not build)", () => {
  const req = getWebsiteRequirement("collects_personal_information")!;
  assert.equal(req.defaultCompletenessClass, "required_before_launch");
});

// =================================================================================================
// Readiness states (scenarios 39-42)
// =================================================================================================
check("Scenario 41 / 17: NOT_READY — an unknown primary CTA blocks build", () => {
  const ctx = baseContext();
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.equal(readiness.state, "NOT_READY");
  assert.ok(readiness.requiredBeforeBuildBlockers.some((b) => b.requirement.fieldKey === "primary_cta_type"));
});
check("Scenario 39: READY — every required item resolved", () => {
  const buildKeys = WEBSITE_REQUIREMENTS.filter((r) => r.defaultCompletenessClass === "required_before_build" && !r.industryBranch && r.dependencyCondition === undefined).map((r) => r.fieldKey);
  const launchKeys = WEBSITE_REQUIREMENTS.filter((r) => r.defaultCompletenessClass === "required_before_launch" && !r.industryBranch && r.dependencyCondition === undefined).map((r) => r.fieldKey);
  const capturedItems = [...buildKeys, ...launchKeys].map((k) => item(k, "answered"));
  // Also answer the domain-dependent chain deterministically (has_existing_domain=true -> domain_owner/domain_access_available).
  capturedItems.push(item("has_existing_domain", true, { completenessClass: "required_before_build" }));
  capturedItems.push(item("domain_owner", "Client LLC", { completenessClass: "required_before_launch" }));
  capturedItems.push(item("domain_access_available", true, { completenessClass: "required_before_launch" }));
  capturedItems.push(item("backend_database_needed", false, { completenessClass: "needs_leonix_decision", truthClass: "technical_decision" }));
  capturedItems.push(item("industry_regulatory_requirements", "None applicable — verified", { completenessClass: "needs_official_research", truthClass: "public_verified" }));
  const ctx = baseContext({ capturedItems });
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.equal(readiness.state, "READY", `expected READY, got ${readiness.state} with blockers: ${JSON.stringify(readiness.requiredBeforeBuildBlockers.map((b) => b.requirement.fieldKey))}, launch gaps: ${JSON.stringify(readiness.requiredBeforeLaunchGaps.map((b) => b.requirement.fieldKey))}`);
  // completionPercent is explicitly a secondary, presentation-only metric (MD <readiness>: "must
  // never replace the actionable classification") — HELPFUL/OPTIONAL items left uncaptured
  // correctly keep it below 100 even when the classification itself is READY.
  assert.ok(readiness.completionPercent > 0 && readiness.completionPercent <= 100);
});
check("Scenario 40: READY_WITH_NON_BLOCKING_GAPS — build can proceed, launch items remain", () => {
  const readiness = evaluateWebsiteReadiness(allBuildBlockersAnswered());
  assert.equal(readiness.state, "READY_WITH_NON_BLOCKING_GAPS");
  assert.equal(readiness.requiredBeforeBuildBlockers.length, 0);
  assert.ok(readiness.requiredBeforeLaunchGaps.length > 0);
});
check("Scenario 42: NEEDS_LEONIX_ARCHITECTURE_DECISION — build items resolved, a Leonix decision is outstanding", () => {
  const ctx = allBuildBlockersAnswered({
    capturedItems: [
      // wants_self_managed_content is excluded from the blanket "answered" sweep below so the
      // explicit true value (which triggers cms_architecture_decision) isn't shadowed by an
      // earlier "answered" placeholder for the same field key.
      ...WEBSITE_REQUIREMENTS.filter((r) => r.defaultCompletenessClass === "required_before_build" && !r.industryBranch && r.fieldKey !== "wants_self_managed_content").map((r) => item(r.fieldKey, "answered")),
      item("wants_self_managed_content", true, { completenessClass: "required_before_build" }),
      item("backend_database_needed", false, { completenessClass: "needs_leonix_decision", truthClass: "technical_decision" }),
      item("industry_regulatory_requirements", "None applicable — verified", { completenessClass: "needs_official_research", truthClass: "public_verified" }),
    ],
  });
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.equal(readiness.state, "NEEDS_LEONIX_ARCHITECTURE_DECISION");
  assert.ok(readiness.leonixDecisionsOutstanding.some((d) => d.requirement.fieldKey === "cms_architecture_decision"));
});

// =================================================================================================
// Conditional dependencies (scenarios 11-13, 33)
// =================================================================================================
check("Scenario 11 / 33: contact form dependency — recipient question appears only after the parent need is confirmed", () => {
  const withoutForm = baseContext();
  assert.equal(evaluateWebsiteRequirements(withoutForm).find((e) => e.requirement.fieldKey === "form_recipient")!.status, "not_applicable");
  const withForm = baseContext({ capturedItems: [item("wants_contact_form", true, { completenessClass: "helpful" })] });
  assert.equal(evaluateWebsiteRequirements(withForm).find((e) => e.requirement.fieldKey === "form_recipient")!.status, "missing");
});
check("Scenario 12: CMS dependency — editor question appears only after self-managed content is wanted", () => {
  const ctx = baseContext({ capturedItems: [item("wants_self_managed_content", true, { completenessClass: "required_before_build" })] });
  assert.equal(evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "cms_editors_who_what_how_often")!.status, "missing");
  const without = baseContext();
  assert.equal(evaluateWebsiteRequirements(without).find((e) => e.requirement.fieldKey === "cms_editors_who_what_how_often")!.status, "not_applicable");
});
check("Scenario 13: booking dependency — provider ownership appears only after online booking is wanted", () => {
  const ctx = baseContext({ capturedItems: [item("wants_online_booking", true, { completenessClass: "required_before_build" })] });
  assert.equal(evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "booking_provider_ownership")!.status, "missing");
});
check("Payment/commerce dependency: tax/shipping/inventory questions appear only after native checkout is wanted", () => {
  const ctx = baseContext({ capturedItems: [item("wants_native_checkout", true, { completenessClass: "required_before_build" })] });
  assert.equal(evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "commerce_tax_shipping_inventory")!.status, "missing");
  const without = baseContext();
  assert.equal(evaluateWebsiteRequirements(without).find((e) => e.requirement.fieldKey === "commerce_tax_shipping_inventory")!.status, "not_applicable");
});

// =================================================================================================
// Scope escalation (scenario 14-16)
// =================================================================================================
check("Scenario 14: native checkout scope escalation only fires with real checkout follow-through, not the abstract want alone", () => {
  const wantOnly = baseContext({ capturedItems: [item("wants_native_checkout", true, { completenessClass: "required_before_build" })] });
  assert.ok(!detectWebsiteScopeSignals(wantOnly).reasons.includes("custom_checkout"), "wanting checkout alone should not yet escalate");
  const withFollowThrough = baseContext({
    capturedItems: [
      item("wants_native_checkout", true, { completenessClass: "required_before_build" }),
      item("commerce_tax_shipping_inventory", "yes, all of it", { completenessClass: "required_before_build" }),
    ],
  });
  const scope = detectWebsiteScopeSignals(withFollowThrough);
  assert.ok(scope.reasons.includes("custom_checkout"));
  assert.equal(scope.scopeClassCandidate, "custom_platform");
  assert.ok(scope.requiresLeonixArchitectureReview);
});
check("Scenario 15: AUTH ESCALATES — user accounts trigger Custom Platform candidate", () => {
  const ctx = baseContext({ capturedItems: [item("wants_user_accounts", true, { completenessClass: "required_before_build" })] });
  const scope = detectWebsiteScopeSignals(ctx);
  assert.ok(scope.reasons.includes("user_authentication"));
  assert.equal(scope.scopeClassCandidate, "custom_platform");
});
check("Scenario 16: CUSTOMER DASHBOARD ESCALATES — a private dashboard triggers Custom Platform candidate", () => {
  const ctx = baseContext({ capturedItems: [item("wants_customer_dashboard", true, { completenessClass: "required_before_build" })] });
  const scope = detectWebsiteScopeSignals(ctx);
  assert.ok(scope.reasons.includes("customer_dashboard"));
  assert.equal(scope.scopeClassCandidate, "custom_platform");
});
check("RAPID BUSINESS SITE candidate: a plain site with no CMS/booking/escalation signals", () => {
  const scope = detectWebsiteScopeSignals(baseContext());
  assert.equal(scope.scopeClassCandidate, "rapid_business_site");
  assert.equal(scope.reasons.length, 0);
});
check("BUSINESS SITE candidate: CMS/booking present but no Custom Platform signal", () => {
  const ctx = baseContext({
    capturedItems: [
      item("wants_self_managed_content", true, { completenessClass: "required_before_build" }),
    ],
  });
  const scope = detectWebsiteScopeSignals(ctx);
  assert.equal(scope.scopeClassCandidate, "business_site");
  assert.ok(!scope.requiresLeonixArchitectureReview);
});
check("Regulated/sensitive data handling escalates scope and requires Leonix architecture review", () => {
  const ctx = baseContext({ capturedItems: [item("handles_minors_or_medical_financial_data", true, { completenessClass: "required_before_build" })] });
  const scope = detectWebsiteScopeSignals(ctx);
  assert.ok(scope.reasons.includes("regulated_sensitive_data"));
  assert.ok(scope.requiresLeonixArchitectureReview);
});

// =================================================================================================
// Progressive question batching + Before You Wrap Up (scenarios 29-31)
// =================================================================================================
check("Scenario 29: question batch is prioritized (build blockers before launch/helpful) and progressive (paginable)", () => {
  const ctx = baseContext();
  const firstBatch = buildQuestionsToAskNow(ctx, 5, 0);
  assert.equal(firstBatch.length, 5);
  assert.ok(firstBatch.every((q) => q.blockingLevel === "blocks_build"), "the very first batch of a fresh discovery should be pure build-blockers");
  const pool = unresolvedQuestionPool(ctx);
  const secondBatch = buildQuestionsToAskNow(ctx, 5, 5);
  assert.notDeepEqual(firstBatch.map((q) => q.fieldKey), secondBatch.map((q) => q.fieldKey), "pagination must advance, never repeat the same 5");
  assert.ok(pool.length > 10, "the full backlog must remain larger than a single display batch");
});
check("Scenario 30 / 31: Before You Wrap Up is concise, high-value, and shrinks as items are answered", () => {
  const fresh = baseContext();
  const wrapUpFresh = buildBeforeYouWrapUp(fresh);
  assert.ok(wrapUpFresh.length > 0 && wrapUpFresh.length <= 11);
  assert.ok(wrapUpFresh.every((q) => q.blockingLevel !== "non_blocking"), "Before You Wrap Up must never include a HELPFUL-only item");

  const answered = baseContext({ capturedItems: [item("decision_maker_approver", "Owner"), item("domain_owner", "Owner LLC")] });
  const wrapUpAfter = buildBeforeYouWrapUp(answered);
  assert.ok(!wrapUpAfter.some((q) => q.fieldKey === "decision_maker_approver"), "an already-answered closeout question must disappear");
  assert.ok(wrapUpAfter.length < wrapUpFresh.length);
});

// =================================================================================================
// Project-intent isolation (scenarios 34-35)
// =================================================================================================
check("Scenario 34: shared discovery truth (project_intent_id null) satisfies a Website-intent requirement", () => {
  const ctx = baseContext({ projectIntentId: "intent-website-1", capturedItems: [item("public_business_name", "Acme Co", { projectIntentId: null })] });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "public_business_name")!;
  assert.equal(evalItem.status, "confirmed");
});
check("Scenario 35: an item captured under a DIFFERENT project intent does not satisfy this Website intent's requirement", () => {
  const ctx = baseContext({
    projectIntentId: "intent-website-1",
    capturedItems: [item("primary_cta_type", "book", { projectIntentId: "intent-logo-1", completenessClass: "required_before_build" })],
  });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "primary_cta_type")!;
  assert.equal(evalItem.status, "missing", "an item scoped to a different intent must not satisfy this intent's requirement");
});
check("A Website-intent-scoped answer takes priority over a same-field shared-discovery answer", () => {
  const ctx = baseContext({
    projectIntentId: "intent-website-1",
    capturedItems: [
      item("primary_cta_type", "call", { projectIntentId: null, completenessClass: "required_before_build" }),
      item("primary_cta_type", "book", { projectIntentId: "intent-website-1", completenessClass: "required_before_build" }),
    ],
  });
  const evalItem = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "primary_cta_type")!;
  assert.equal(evalItem.item?.value, "book");
});

// =================================================================================================
// Business-type fixtures (scenarios 1-10 + the 5 named acceptance fixtures)
// =================================================================================================
check("Scenario 1: simple service business, mostly known — few remaining questions", () => {
  const capturedItems = [
    item("public_business_name", "Acme Legal"), item("decision_maker_approver", "Jane Doe"),
    item("primary_business_goal", "Get more consultation requests"), item("primary_customer", "Small business owners"),
    item("core_services_products", ["Contracts", "Incorporation"]), item("existing_logo", true),
    item("copy_ownership", "leonix_writes"), item("required_pages_sections", ["Home", "Services", "Contact"]),
    item("primary_cta_type", "contact_form", { completenessClass: "required_before_build" }),
    item("wants_contact_form", true, { completenessClass: "helpful" }),
    item("wants_self_managed_content", false), item("has_existing_domain", true, { completenessClass: "required_before_build" }),
    item("bilingual_site_needed", false), item("hard_launch_deadline", "2026-12-01"),
    item("in_scope_summary", "Marketing site"), item("out_of_scope_summary", "No booking"),
    item("wants_user_accounts", false), item("wants_customer_dashboard", false),
    item("wants_online_booking", false), item("wants_native_checkout", "informational link only"),
    item("handles_minors_or_medical_financial_data", false),
    item("professional_consultation_process", "Free 15-minute intake call"),
  ];
  const ctx = baseContext({ broadBusinessType: "professional_services", capturedItems });
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.notEqual(readiness.state, "NOT_READY", `expected close to ready, blockers: ${JSON.stringify(readiness.requiredBeforeBuildBlockers.map((b) => b.requirement.fieldKey))}`);
});

check("Scenario 2 / LA KALIENTE FIXTURE: radio/media site — streaming provider required before build, Listen Live fallback before launch", () => {
  const ctx = baseContext({ broadBusinessType: "arts_entertainment_events", specificBusinessType: "Radio station" });
  assert.equal(resolveIndustryBranch(ctx), "radio_media");
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.ok(readiness.requiredBeforeBuildBlockers.some((b) => b.requirement.fieldKey === "radio_streaming_provider"));
  const answered = baseContext({
    broadBusinessType: "arts_entertainment_events", specificBusinessType: "Radio station",
    capturedItems: [item("radio_streaming_provider", "Radio.co", { completenessClass: "required_before_build" })],
  });
  const afterReadiness = evaluateWebsiteReadiness(answered);
  assert.ok(afterReadiness.requiredBeforeLaunchGaps.some((g) => g.requirement.fieldKey === "radio_fallback_if_stream_unavailable"), "fallback-if-stream-down remains a launch gap");
});

check("Scenario 3 / RESTAURANT FIXTURE: ordering wanted but no reservations — reservation question stays open, ordering-provider question is dependency-gated", () => {
  const ctx = baseContext({
    broadBusinessType: "food_hospitality", specificBusinessType: "restaurant",
    capturedItems: [item("restaurant_wants_online_ordering", true, { completenessClass: "helpful" })],
  });
  assert.equal(evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "restaurant_ordering_provider_ownership")!.status, "missing");
  assert.equal(evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "restaurant_wants_reservations")!.status, "missing", "still an open question, not yet answered either way");
});

check("Scenario 4 / FITNESS FIXTURE: memberships/classes/current promotion — class schedule only relevant once wanted", () => {
  const ctx = baseContext({
    broadBusinessType: "health_beauty_wellness", specificBusinessType: "gym",
    capturedItems: [item("fitness_membership_types", ["Monthly", "Annual"]), item("fitness_trial_offer", "First class free")],
  });
  assert.equal(resolveIndustryBranch(ctx), "fitness");
  const classSchedule = evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "fitness_class_schedule_wanted")!;
  assert.equal(classSchedule.status, "missing", "an open helpful question, applicable to every fitness business regardless of answer");
});

check("Scenario 5 / SERVICE BUSINESS FIXTURE covers professional service: church with livestream but NO online giving — giving provider question stays inapplicable", () => {
  const ctx = baseContext({
    broadBusinessType: "nonprofit_faith_community",
    capturedItems: [item("church_livestream_wanted", true, { completenessClass: "helpful" }), item("church_online_giving_wanted", false, { completenessClass: "helpful" })],
  });
  assert.equal(evaluateWebsiteRequirements(ctx).find((e) => e.requirement.fieldKey === "church_giving_provider")!.status, "not_applicable");
});

check("Scenario 6: professional service — consultation process is a build blocker, compliance claims route to official research", () => {
  const ctx = baseContext({ broadBusinessType: "professional_services" });
  assert.equal(resolveIndustryBranch(ctx), "professional_service");
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.ok(readiness.requiredBeforeBuildBlockers.some((b) => b.requirement.fieldKey === "professional_consultation_process"));
  const complianceReq = getWebsiteRequirement("professional_compliance_sensitive_claims")!;
  assert.equal(complianceReq.whoShouldAnswer, "OFFICIAL_RESEARCH");
});

check("Scenario 7: local/home service business — license/insurance claims never published without verification", () => {
  const ctx = baseContext({ broadBusinessType: "home_personal_services" });
  assert.equal(resolveIndustryBranch(ctx), "home_local_service");
  const licenseReq = getWebsiteRequirement("home_service_license_insurance_claims")!;
  assert.equal(licenseReq.defaultCompletenessClass, "needs_official_research");
  assert.equal(licenseReq.whoShouldAnswer, "OFFICIAL_RESEARCH");
});

check("Scenario 8: existing website that needs improvement — pain point and redirect/migration questions become applicable", () => {
  const ctx = baseContext({ hasExistingWebsite: true });
  const evals = evaluateWebsiteRequirements(ctx);
  assert.equal(evals.find((e) => e.requirement.fieldKey === "current_pain_point")!.status, "missing");
  assert.equal(evals.find((e) => e.requirement.fieldKey === "old_site_redirects_needed")!.status, "missing");
  assert.equal(evals.find((e) => e.requirement.fieldKey === "existing_website_transition_plan")!.status, "missing");
});

check("Scenario 9 / STARTUP FIXTURE: brand-new startup with no domain — desired-new-domain question applies, domain_owner does not", () => {
  const ctx = baseContext({ businessStage: "planning_prelaunch", capturedItems: [item("has_existing_domain", false, { completenessClass: "required_before_build" })] });
  const evals = evaluateWebsiteRequirements(ctx);
  assert.equal(evals.find((e) => e.requirement.fieldKey === "desired_new_domain")!.status, "missing");
  assert.equal(evals.find((e) => e.requirement.fieldKey === "domain_owner")!.status, "not_applicable");
});

check("Scenario 10: bilingual site — translation ownership only becomes relevant once bilingual is confirmed", () => {
  const withoutBilingual = baseContext();
  assert.equal(evaluateWebsiteRequirements(withoutBilingual).find((e) => e.requirement.fieldKey === "translation_ownership")!.status, "not_applicable");
  const withBilingual = baseContext({ capturedItems: [item("bilingual_site_needed", true, { completenessClass: "required_before_build" })] });
  assert.equal(evaluateWebsiteRequirements(withBilingual).find((e) => e.requirement.fieldKey === "translation_ownership")!.status, "missing");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSOME CHECKS FAILED.");
} else {
  console.log("ALL CHECKS PASSED.");
}
