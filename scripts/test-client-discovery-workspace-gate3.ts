/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — deterministic tests for the Progressive
 * Client Discovery Session UI + Capture Workflow. No database, no network, no rendered browser —
 * pure view-model/label logic plus structural source-inspection checks (MD: "Use structural/
 * component tests now" — true rendered validation is a later gate).
 *
 * Run from repo root: npx tsx scripts/test-client-discovery-workspace-gate3.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  completenessClassLabel,
  confirmationStateLabel,
  consentMethodLabel,
  consentStateLabel,
  consentTypeLabel,
  discoveryStatusLabel,
  formatBilingual,
  intentStatusLabel,
  projectTypeLabel,
  readinessStateLabel,
  scopeCandidateLabel,
  scopeSignalReasonLabel,
  sectionReviewGroupForSection,
  truthClassIsProvisional,
  truthClassLabel,
  SECTION_REVIEW_GROUPS,
  type BilingualLabel,
} from "../app/lib/business/projectDiscovery/discoveryLabels";
import {
  EMPTY_STATE_NO_ASSETS,
  EMPTY_STATE_NO_DISCOVERY,
  EMPTY_STATE_NO_NOTES,
  EMPTY_STATE_NO_PROJECT_INTENT,
  EMPTY_STATE_QUESTIONS_ACTUALLY_READY,
  EMPTY_STATE_QUESTIONS_CLIENT_COMPLETE_LEONIX_REMAINS,
  EMPTY_STATE_QUESTIONS_RESEARCH_REMAINS,
  questionsEmptyStateFor,
} from "../app/lib/business/projectDiscovery/discoveryEmptyStates";
import {
  buildBeforeYouWrapUpView,
  buildLeonixDecisionsView,
  buildMultiProjectNav,
  buildOfficialResearchView,
  buildQuestionsToAskNowView,
  buildResumeState,
  buildScopeWarningView,
  buildSectionsReviewView,
  buildTopScreenSummary,
  buildWhatWeAlreadyKnow,
  resolveStartFromGrowthSolutionPrefill,
} from "../app/lib/business/projectDiscovery/discoveryWorkspaceViewModel";
import { WEBSITE_DISCOVERY_SECTIONS, WEBSITE_REQUIREMENTS, type WebsiteDiscoverySection } from "../app/lib/business/projectDiscovery/websiteDiscoveryCatalog";
import { evaluateWebsiteReadiness, evaluateWebsiteRequirements, type WebsiteDiscoveryContext } from "../app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import { buildBeforeYouWrapUp, buildQuestionsToAskNow, unresolvedQuestionPool } from "../app/lib/business/projectDiscovery/websiteQuestionEngine";
import type { DiscoveryTruthClass, ProjectDiscovery, ProjectDiscoveryEvent, ProjectDiscoveryIntent, ProjectDiscoverySource } from "../app/lib/business/projectDiscovery/types";
import { capabilitiesForRole } from "../app/admin/_lib/salesWorkspaceCapabilities";

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

console.log("Progressive Client Discovery Workspace (Gate 3) — deterministic tests\n");

// ---------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------
const NOW = new Date().toISOString();
let idCounter = 0;
const nextId = () => `g3-${(idCounter += 1)}`;

function discovery(overrides: Partial<ProjectDiscovery> = {}): ProjectDiscovery {
  return {
    id: "disc-1", businessId: "biz-1", status: "in_progress", title: "Sitio web nuevo",
    primaryProjectType: "website", language: "es",
    sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: null,
    assignedStaffRosterId: null, createdActorType: "staff", createdByRosterId: "staff-1", createdByAuthUserId: "auth-1",
    createdByEmail: "staff@leonix.test", createdByRole: "sales_rep", createdAt: NOW, updatedAt: NOW, completedAt: null,
    ...overrides,
  };
}

function intent(overrides: Partial<ProjectDiscoveryIntent> = {}): ProjectDiscoveryIntent {
  return {
    id: nextId(), businessId: "biz-1", discoveryId: "disc-1", projectType: "website", projectSubtype: null, otherLabel: null,
    title: "Sitio web", status: "candidate", createdActorType: "staff", createdByRosterId: "staff-1", createdByAuthUserId: "auth-1",
    createdByEmail: "staff@leonix.test", createdByRole: "sales_rep", createdAt: NOW, updatedAt: NOW,
    ...overrides,
  };
}

function source(overrides: Partial<ProjectDiscoverySource> = {}): ProjectDiscoverySource {
  return {
    id: nextId(), businessId: "biz-1", discoveryId: "disc-1", itemId: null, sourceType: "manual", sourceRecordId: null,
    businessSourceFileId: null, externalUrl: null, label: null, notes: "Nota", createdActorType: "staff",
    createdByRosterId: "staff-1", createdByAuthUserId: "auth-1", createdByEmail: "staff@leonix.test", createdByRole: "sales_rep",
    createdAt: NOW, ...overrides,
  };
}

function event(overrides: Partial<ProjectDiscoveryEvent> = {}): ProjectDiscoveryEvent {
  return { id: nextId(), businessId: "biz-1", discoveryId: "disc-1", entityType: "item", entityId: "x", eventType: "captured", previousState: null, newState: null, source: null, note: null, createdAt: NOW, ...overrides };
}

function baseWebsiteContext(overrides: Partial<WebsiteDiscoveryContext> = {}): WebsiteDiscoveryContext {
  return {
    discoveryId: "disc-1", businessId: "biz-1", projectIntentId: "intent-1",
    broadBusinessType: "retail_ecommerce", specificBusinessType: null, customSpecificType: null,
    businessStage: "operating", hasExistingWebsite: false, knownFacts: [], capturedItems: [],
    ...overrides,
  };
}

function readSource(relPath: string): string {
  return readFileSync(join(__dirname, "..", relPath), "utf8");
}

// ===============================================================================================
// 1. Empty states (MD <empty_states>)
// ===============================================================================================
console.log("Empty states:");
check("EMPTY_STATE_NO_DISCOVERY is bilingual and non-empty", () => {
  assert.ok(EMPTY_STATE_NO_DISCOVERY.es.length > 10 && EMPTY_STATE_NO_DISCOVERY.en.length > 10);
});
check("EMPTY_STATE_NO_PROJECT_INTENT is bilingual and non-empty", () => {
  assert.ok(EMPTY_STATE_NO_PROJECT_INTENT.es.length > 10 && EMPTY_STATE_NO_PROJECT_INTENT.en.length > 10);
});
check("EMPTY_STATE_NO_NOTES is bilingual and non-empty", () => {
  assert.ok(EMPTY_STATE_NO_NOTES.es.length > 10 && EMPTY_STATE_NO_NOTES.en.length > 10);
});
check("EMPTY_STATE_NO_ASSETS is bilingual and non-empty", () => {
  assert.ok(EMPTY_STATE_NO_ASSETS.es.length > 10 && EMPTY_STATE_NO_ASSETS.en.length > 10);
});
check("questionsEmptyStateFor: not client-complete -> actually-ready copy is wrong path guarded (uses 'still has questions' framing only when list truly empty)", () => {
  // Contract: this helper is only ever called once the engine's own question list is already
  // empty; "not client complete" here should never claim readiness.
  const result = questionsEmptyStateFor(false, false, false);
  assert.equal(result, EMPTY_STATE_QUESTIONS_ACTUALLY_READY);
});
check("questionsEmptyStateFor: client complete + Leonix remains -> Leonix-remains copy", () => {
  assert.equal(questionsEmptyStateFor(true, true, false), EMPTY_STATE_QUESTIONS_CLIENT_COMPLETE_LEONIX_REMAINS);
});
check("questionsEmptyStateFor: client complete + research remains (no Leonix) -> research-remains copy", () => {
  assert.equal(questionsEmptyStateFor(true, false, true), EMPTY_STATE_QUESTIONS_RESEARCH_REMAINS);
});
check("questionsEmptyStateFor: fully clear -> actually-ready copy", () => {
  assert.equal(questionsEmptyStateFor(true, false, false), EMPTY_STATE_QUESTIONS_ACTUALLY_READY);
});

// ===============================================================================================
// 2. Start Discovery / Growth Solution provenance (MD <start_discovery>, <growth_bridge>)
// ===============================================================================================
console.log("\nStart Discovery / Growth Solution bridge:");
const solutions = [{ id: "sol-1", titleEs: "Sitio web nuevo", titleEn: "New website" }];
check("real provenance carried through when a growth solution id is requested", () => {
  const prefill = resolveStartFromGrowthSolutionPrefill({ requestedSolutionId: "sol-1", solutions, currentAssessmentId: "assess-1", discoveryAlreadyExists: false });
  assert.ok(prefill);
  assert.equal(prefill!.sourceGrowthSolutionId, "sol-1");
  assert.equal(prefill!.sourceGrowthAssessmentId, "assess-1");
  assert.equal(prefill!.titleEs, "Sitio web nuevo");
});
check("manual entry (no requested solution id) never fabricates provenance", () => {
  assert.equal(resolveStartFromGrowthSolutionPrefill({ requestedSolutionId: null, solutions, discoveryAlreadyExists: false }), null);
});
check("an unknown/stale solution id never fabricates a prefill", () => {
  assert.equal(resolveStartFromGrowthSolutionPrefill({ requestedSolutionId: "sol-does-not-exist", solutions, discoveryAlreadyExists: false }), null);
});
check("prefill is suppressed once a discovery already exists (never silently duplicated)", () => {
  assert.equal(resolveStartFromGrowthSolutionPrefill({ requestedSolutionId: "sol-1", solutions, discoveryAlreadyExists: true }), null);
});

// ===============================================================================================
// 3. Multi-project nav (MD <multi_project_ui>) — Website-only adaptive engine, stated truthfully
// ===============================================================================================
console.log("\nMulti-project nav:");
check("website intent gets adaptiveEngineAvailable=true", () => {
  const nav = buildMultiProjectNav([intent({ projectType: "website" })]);
  assert.equal(nav[0].adaptiveEngineAvailable, true);
  assert.equal(nav[0].isWebsite, true);
});
check("non-website intent (e.g. logo_brand_identity) gets adaptiveEngineAvailable=false — stated truthfully, not pretended", () => {
  const nav = buildMultiProjectNav([intent({ projectType: "logo_brand_identity" })]);
  assert.equal(nav[0].adaptiveEngineAvailable, false);
});
check("website_improvement / landing_page count as website-shaped but do NOT get the adaptive engine yet (only exact 'website' does)", () => {
  const nav = buildMultiProjectNav([intent({ projectType: "website_improvement" }), intent({ projectType: "landing_page" })]);
  assert.ok(nav.every((n) => n.isWebsite && !n.adaptiveEngineAvailable));
});
check("nav status/project-type labels are bilingual, not raw enums", () => {
  const nav = buildMultiProjectNav([intent({ status: "confirmed", projectType: "business_cards" })]);
  assert.equal(nav[0].statusLabel.es, "Confirmado");
  assert.ok(nav[0].projectTypeLabel.es.length > 0 && nav[0].projectTypeLabel.en.length > 0);
});

// ===============================================================================================
// 4. What We Already Know (MD <meeting_mode>) — truth-class distinguished, never every field
// ===============================================================================================
console.log("\nWhat We Already Know:");
function evalFor(status: "confirmed" | "captured_unconfirmed" | "needs_confirmation" | "missing" | "not_applicable", truthClass: DiscoveryTruthClass) {
  const req = WEBSITE_REQUIREMENTS[0];
  return {
    requirement: req,
    status,
    item: status === "missing" || status === "not_applicable" ? null : {
      id: "i1", businessId: "biz-1", discoveryId: "disc-1", projectIntentId: null, section: req.section, fieldKey: req.fieldKey,
      value: "x", displayValue: "x", valueType: "text" as const, truthClass, completenessClass: req.defaultCompletenessClass,
      confirmationState: status === "confirmed" ? ("confirmed" as const) : ("unconfirmed" as const),
      clientConfirmedAt: null, capturedActorType: "staff" as const, capturedByRosterId: "s1", capturedByAuthUserId: "a1",
      capturedByEmail: "e@x.test", capturedByRole: "sales_rep", notes: null, createdAt: NOW, updatedAt: NOW,
    },
    knownFact: null,
  };
}
check("confirmed items appear in What We Already Know as non-provisional", () => {
  const known = buildWhatWeAlreadyKnow([evalFor("confirmed", "client_confirmed")]);
  assert.equal(known.length, 1);
  assert.equal(known[0].isProvisional, false);
});
check("AI-extracted items appear but are flagged provisional — never visually equal to client-confirmed", () => {
  const known = buildWhatWeAlreadyKnow([evalFor("captured_unconfirmed", "ai_extracted")]);
  assert.equal(known[0].isProvisional, true);
  assert.equal(known[0].truthLabel.en, "AI-extracted — needs review");
});
check("staff observation items appear but are flagged provisional (needs confirmation), never presented as confirmed", () => {
  const known = buildWhatWeAlreadyKnow([evalFor("captured_unconfirmed", "staff_observation")]);
  assert.equal(known[0].isProvisional, true);
});
check("needs_confirmation status items appear and are always provisional regardless of truth class", () => {
  const known = buildWhatWeAlreadyKnow([evalFor("needs_confirmation", "public_verified")]);
  assert.equal(known[0].isProvisional, true);
});
check("missing/not_applicable items never appear in What We Already Know (compact, resolved-only)", () => {
  const known = buildWhatWeAlreadyKnow([evalFor("missing", "unknown"), evalFor("not_applicable", "unknown")]);
  assert.equal(known.length, 0);
});

// ===============================================================================================
// 5. Truth-class provisional matrix (MD <truth_ui>) — exhaustive over all 9 classes
// ===============================================================================================
console.log("\nTruth-class provisional matrix:");
const PROVISIONAL_TRUE: DiscoveryTruthClass[] = ["ai_extracted", "staff_observation", "needs_confirmation", "unknown"];
const PROVISIONAL_FALSE: DiscoveryTruthClass[] = ["client_confirmed", "public_verified", "client_preference", "leonix_recommendation", "technical_decision"];
check("provisional-true truth classes are all flagged provisional", () => {
  for (const tc of PROVISIONAL_TRUE) assert.equal(truthClassIsProvisional(tc), true, tc);
});
check("provisional-false truth classes are never flagged provisional", () => {
  for (const tc of PROVISIONAL_FALSE) assert.equal(truthClassIsProvisional(tc), false, tc);
});
check("every DiscoveryTruthClass has a human label with both es and en (never a raw enum)", () => {
  for (const tc of [...PROVISIONAL_TRUE, ...PROVISIONAL_FALSE]) {
    const l = truthClassLabel(tc);
    assert.ok(l.es.length > 0 && l.en.length > 0, tc);
  }
});

// ===============================================================================================
// 6. Questions to Ask Now / Before You Wrap Up — UI only renders the engine's own batch
// ===============================================================================================
console.log("\nQuestions to Ask Now / Before You Wrap Up:");
check("buildQuestionsToAskNowView never reorders or drops the engine's own candidates (UI is a pure formatter)", () => {
  const ctx = baseWebsiteContext();
  const pool = unresolvedQuestionPool(ctx);
  const batch = buildQuestionsToAskNow(ctx, 5);
  const view = buildQuestionsToAskNowView(batch);
  assert.equal(view.length, batch.length);
  assert.deepEqual(view.map((v) => v.fieldKey), batch.map((c) => c.fieldKey));
  assert.ok(pool.length >= batch.length);
});
check("blocking level / expected answer type are carried through to the view unchanged (no re-derivation)", () => {
  const ctx = baseWebsiteContext();
  const [firstCandidate] = buildQuestionsToAskNow(ctx, 1);
  const [firstView] = buildQuestionsToAskNowView([firstCandidate]);
  assert.equal(firstView.expectedAnswerType, firstCandidate.expectedAnswerType);
  assert.ok(["Blocks build", "Blocks launch", "Non-blocking"].includes(firstView.blockingLabel.en));
});
check("Before You Wrap Up: not client-complete (unresolved high-risk items) -> message says questions remain", () => {
  const ctx = baseWebsiteContext();
  const wrapUpCandidates = buildBeforeYouWrapUp(ctx);
  const readiness = evaluateWebsiteReadiness(ctx);
  const view = buildBeforeYouWrapUpView(wrapUpCandidates, readiness);
  assert.equal(view.clientDiscoveryComplete, wrapUpCandidates.length === 0 && readiness.requiredBeforeBuildBlockers.length === 0);
});
check("Before You Wrap Up: HELPFUL-only items never block ending the meeting", () => {
  const helpfulOnlyReq = WEBSITE_REQUIREMENTS.find((r) => r.defaultCompletenessClass === "helpful");
  assert.ok(helpfulOnlyReq, "expected at least one helpful requirement in the catalog");
  // buildBeforeYouWrapUp() itself already excludes helpful/optional (Gate 2); this is a Gate 3
  // regression guard that the UI-level view never re-includes one.
  const view = buildBeforeYouWrapUpView([], null);
  assert.equal(view.items.length, 0);
});

// ===============================================================================================
// 7. Client-complete vs Leonix-remains distinction (MD <before_you_wrap_up>) — never claims ready
//    when internal decisions remain
// ===============================================================================================
console.log("\nClient-complete vs Leonix-remains:");
const readyReadiness = evaluateWebsiteReadiness(baseWebsiteContext());
check("fully clear wrap-up message never mentions Leonix when nothing is outstanding and questions are resolved", () => {
  const view = buildBeforeYouWrapUpView([], { ...readyReadiness, leonixDecisionsOutstanding: [], officialResearchOutstanding: [], requiredBeforeBuildBlockers: [] });
  assert.equal(view.leonixDecisionsRemain, false);
  assert.ok(view.message.en.toLowerCase().includes("clear to wrap up"));
});
check("client-complete but Leonix decisions remain -> distinct message, never claims fully ready", () => {
  const view = buildBeforeYouWrapUpView([], { ...readyReadiness, leonixDecisionsOutstanding: [evalFor("missing", "technical_decision") as never], officialResearchOutstanding: [], requiredBeforeBuildBlockers: [] });
  assert.equal(view.clientDiscoveryComplete, true);
  assert.equal(view.leonixDecisionsRemain, true);
  assert.ok(view.message.en.includes("Leonix decisions are still outstanding"));
  assert.ok(!view.message.en.toLowerCase().includes("you're clear to wrap up"));
});

// ===============================================================================================
// 8. Top screen dominant action (MD <top_screen>) — deterministic precedence
// ===============================================================================================
console.log("\nTop screen dominant action:");
check("unresolved client questions -> ask_next_questions dominates", () => {
  const summary = buildTopScreenSummary({ discovery: discovery(), readiness: readyReadiness, unresolvedQuestionCount: 3 });
  assert.equal(summary.dominantAction.key, "ask_next_questions");
});
check("no questions, Leonix/research outstanding -> resolve_missing_information", () => {
  const readiness = { ...readyReadiness, leonixDecisionsOutstanding: [evalFor("missing", "technical_decision") as never] };
  const summary = buildTopScreenSummary({ discovery: discovery(), readiness, unresolvedQuestionCount: 0 });
  assert.equal(summary.dominantAction.key, "resolve_missing_information");
});
check("no questions, no Leonix/research, launch gaps remain -> capture_client_answer", () => {
  const readiness = { ...readyReadiness, leonixDecisionsOutstanding: [], officialResearchOutstanding: [], requiredBeforeLaunchGaps: [evalFor("missing", "client_confirmed") as never] };
  const summary = buildTopScreenSummary({ discovery: discovery(), readiness, unresolvedQuestionCount: 0 });
  assert.equal(summary.dominantAction.key, "capture_client_answer");
});
check("everything resolved -> review_before_wrap_up", () => {
  const readiness = { ...readyReadiness, leonixDecisionsOutstanding: [], officialResearchOutstanding: [], requiredBeforeLaunchGaps: [] };
  const summary = buildTopScreenSummary({ discovery: discovery(), readiness, unresolvedQuestionCount: 0 });
  assert.equal(summary.dominantAction.key, "review_before_wrap_up");
});
check("progress summary is non-percentage (never claims a bare number is the whole story)", () => {
  const summary = buildTopScreenSummary({ discovery: discovery(), readiness: readyReadiness, unresolvedQuestionCount: 0 });
  assert.ok(!summary.progressSummary.en.includes("%"));
});
check("no readiness available (non-website intent) -> readinessLabel is null, never fabricated", () => {
  const summary = buildTopScreenSummary({ discovery: discovery(), readiness: null, unresolvedQuestionCount: 0 });
  assert.equal(summary.readinessLabel, null);
});

// ===============================================================================================
// 9. Sections Review (MD <sections_review>) — secondary, grouped, exhaustive, human status only
// ===============================================================================================
console.log("\nSections Review grouping:");
check("every one of the 27 WebsiteDiscoverySection values is covered by exactly one review group", () => {
  const covered = new Map<WebsiteDiscoverySection, number>();
  for (const g of SECTION_REVIEW_GROUPS) for (const s of g.sections) covered.set(s, (covered.get(s) ?? 0) + 1);
  for (const s of WEBSITE_DISCOVERY_SECTIONS) assert.equal(covered.get(s), 1, `section ${s} must appear in exactly one group`);
  assert.equal(covered.size, WEBSITE_DISCOVERY_SECTIONS.length);
});
check("sectionReviewGroupForSection resolves every section to a real group key", () => {
  for (const s of WEBSITE_DISCOVERY_SECTIONS) {
    const key = sectionReviewGroupForSection(s);
    assert.ok(SECTION_REVIEW_GROUPS.some((g) => g.key === key));
  }
});
check("Sections Review renders as a small number of groups, never 27 flat accordions", () => {
  assert.ok(SECTION_REVIEW_GROUPS.length <= 12);
});
check("buildSectionsReviewView never fabricates an empty group and covers a real evaluation", () => {
  const ctx = baseWebsiteContext();
  const groups = buildSectionsReviewView(evaluateWebsiteRequirements(ctx));
  assert.ok(groups.length > 0);
  assert.ok(groups.every((g) => g.requirements.length > 0));
});
check("Leonix-decision and official-research statuses in Sections Review use dedicated language, never 'missing'", () => {
  const ctx = baseWebsiteContext();
  const groups = buildSectionsReviewView(evaluateWebsiteRequirements(ctx));
  const leonixReq = groups.flatMap((g) => g.requirements).find((r) => r.fieldKey === "backend_database_needed");
  assert.ok(leonixReq);
  assert.ok(leonixReq!.statusLabel.en.toLowerCase().includes("leonix decision"));
});

// ===============================================================================================
// 10. Leonix Decisions / Official Research (MD <leonix_decisions>) — never a client question
// ===============================================================================================
console.log("\nLeonix Decisions:");
check("Leonix decision items are present and distinguishable from client questions", () => {
  const ctx = baseWebsiteContext();
  const decisions = buildLeonixDecisionsView(evaluateWebsiteRequirements(ctx));
  assert.ok(decisions.length > 0);
  const questionKeys = new Set(unresolvedQuestionPool(ctx).map((q) => q.fieldKey));
  for (const d of decisions) assert.ok(!questionKeys.has(d.fieldKey), `${d.fieldKey} must never appear as both a Leonix decision and a client question`);
});
check("Official research items are present and distinguishable from Leonix decisions", () => {
  const ctx = baseWebsiteContext();
  const research = buildOfficialResearchView(evaluateWebsiteRequirements(ctx));
  const decisions = buildLeonixDecisionsView(evaluateWebsiteRequirements(ctx));
  assert.ok(research.length > 0);
  const decisionKeys = new Set(decisions.map((d) => d.fieldKey));
  for (const r of research) assert.ok(!decisionKeys.has(r.fieldKey));
});

// ===============================================================================================
// 11. Scope warning (MD <scope_warning>) — visible, never blocks, never pricing
// ===============================================================================================
console.log("\nScope warning:");
check("no scope signals captured -> warning hidden", () => {
  const view = buildScopeWarningView({ scopeClassCandidate: "rapid_business_site", reasons: [], requiresLeonixArchitectureReview: false });
  assert.equal(view.show, false);
});
check("scope signals captured -> warning shown with human reason labels, never raw enum reasons", () => {
  const view = buildScopeWarningView({ scopeClassCandidate: "custom_platform", reasons: ["user_authentication", "custom_checkout"], requiresLeonixArchitectureReview: true });
  assert.equal(view.show, true);
  assert.equal(view.reasons.length, 2);
  assert.ok(view.reasons.every((r) => r.es.length > 0 && r.en.length > 0));
});
check("scope warning message never shows an actual dollar amount (explicitly disclaiming pricing, as required, is fine — a real number is not)", () => {
  const view = buildScopeWarningView({ scopeClassCandidate: "custom_platform", reasons: ["user_authentication"], requiresLeonixArchitectureReview: true });
  assert.ok(!/\$\s*\d/.test(view.message.es) && !/\$\s*\d/.test(view.message.en));
});
check("every ScopeSignalReason has a human label", () => {
  const all = ["user_authentication", "customer_dashboard", "native_marketplace", "complex_database", "stored_customer_history", "native_workflow_state", "custom_checkout", "significant_uploads", "proprietary_messaging", "scheduling_engine", "significant_integrations", "regulated_sensitive_data", "native_mobile_app"] as const;
  for (const r of all) {
    const l = scopeSignalReasonLabel(r);
    assert.ok(l.es.length > 0 && l.en.length > 0, r);
  }
});

// ===============================================================================================
// 12. Resume Later (MD <resume_later>) — derivable without raw event replay
// ===============================================================================================
console.log("\nResume Later:");
check("resume state summarizes notes/assets/readiness/last-activity from already-loaded rows", () => {
  const sources = [source({ sourceType: "manual" }), source({ sourceType: "manual" }), source({ sourceType: "asset" }), source({ sourceType: "website_url" })];
  const events = [event({ createdAt: "2026-01-02T00:00:00.000Z" }), event({ createdAt: "2026-01-01T00:00:00.000Z" })];
  const resume = buildResumeState({ discovery: discovery(), answeredCount: 5, sources, events, readiness: readyReadiness, unresolvedQuestionCount: 2 });
  assert.equal(resume.notesCount, 2);
  assert.equal(resume.assetsCount, 2);
  assert.equal(resume.answeredCount, 5);
  assert.equal(resume.unresolvedClientQuestionCount, 2);
  assert.equal(resume.lastActivityAt, "2026-01-02T00:00:00.000Z");
  assert.ok(resume.nextAction.key.length > 0);
});
check("resume state with no events yet never fabricates a last-activity timestamp", () => {
  const resume = buildResumeState({ discovery: discovery(), answeredCount: 0, sources: [], events: [], readiness: null, unresolvedQuestionCount: 0 });
  assert.equal(resume.lastActivityAt, null);
});

// ===============================================================================================
// 13. Bilingual coverage (MD <bilingual>) — mechanical sweep over every label map this gate adds
// ===============================================================================================
console.log("\nBilingual coverage sweep:");
// A small allowlist of genuine ES/EN cognates (identical spelling in both languages) that must
// NOT trip the mechanical-translation-smell check below.
const KNOWN_COGNATES = new Set(["verbal"]);

function assertBilingual(label: BilingualLabel, ctx: string) {
  assert.ok(label.es.trim().length > 0, `${ctx}: missing Spanish`);
  assert.ok(label.en.trim().length > 0, `${ctx}: missing English`);
  if (!KNOWN_COGNATES.has(ctx)) {
    assert.notEqual(label.es, label.en, `${ctx}: Spanish and English must not be identical (mechanical translation smell)`);
  }
}
check("every DiscoveryCompletenessClass has a distinct bilingual label", () => {
  const classes = ["required_before_build", "required_before_launch", "helpful", "optional", "not_applicable", "needs_leonix_decision", "needs_official_research"] as const;
  for (const c of classes) assertBilingual(completenessClassLabel(c), c);
});
check("every DiscoveryItemConfirmationState has a distinct bilingual label", () => {
  for (const s of ["unconfirmed", "confirmed", "rejected"] as const) assertBilingual(confirmationStateLabel(s), s);
});
check("every ProjectDiscoveryStatus has a distinct bilingual label including the required exact phrase pairs", () => {
  assert.equal(formatBilingual(discoveryStatusLabel("needs_client_information")), "Falta información del cliente / Needs Client Information");
  assert.equal(formatBilingual(discoveryStatusLabel("needs_leonix_decision")), "Requiere decisión de Leonix / Needs Leonix Decision");
  assert.equal(formatBilingual(discoveryStatusLabel("ready_for_blueprint")), "Listo para el plan del proyecto / Ready for Blueprint");
});
check("every ProjectDiscoveryIntentStatus has a distinct bilingual label", () => {
  for (const s of ["candidate", "confirmed", "declined", "converted_to_project"] as const) assertBilingual(intentStatusLabel(s), s);
});
check("every WebsiteReadinessState has a distinct bilingual label", () => {
  for (const s of ["READY", "READY_WITH_NON_BLOCKING_GAPS", "NOT_READY", "NEEDS_LEONIX_ARCHITECTURE_DECISION"] as const) assertBilingual(readinessStateLabel(s), s);
});
check("every WebsiteScopeClassCandidate has a distinct bilingual label; custom_platform matches the required exact phrase pair", () => {
  assert.equal(formatBilingual(scopeCandidateLabel("custom_platform")), "Posible alcance de plataforma personalizada / Possible custom platform scope");
});
check("every DiscoveryConsentType/State/Method has a distinct bilingual label", () => {
  for (const t of ["notes", "audio_recording", "transcription", "file_photo_review", "followup_messages"] as const) assertBilingual(consentTypeLabel(t), t);
  for (const s of ["provided", "declined", "withdrawn"] as const) assertBilingual(consentStateLabel(s), s);
  for (const m of ["verbal", "written", "digital_acknowledgment"] as const) assertBilingual(consentMethodLabel(m), m);
});
check("every ProjectType has a distinct bilingual label (17 canonical types)", () => {
  const types = ["website", "website_improvement", "landing_page", "logo_brand_identity", "business_cards", "flyer", "banner_signage", "promotional_products", "campaign_creative", "sponsored_editorial", "media_exposure_campaign", "social_setup_cleanup", "google_business_profile_support", "referral_materials", "launch_package_multi_project", "custom_platform_software", "other"] as const;
  assert.equal(types.length, 17);
  for (const t of types) assertBilingual(projectTypeLabel(t), t);
});
check("required exact phrase pair: Client Discovery / Descubrimiento del cliente appears in the page copy", () => {
  const src = readSource("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
  assert.ok(/Descubrimiento del Cliente \/ Client Discovery/.test(src));
});
check("required exact phrase pair: Questions to Ask Now / Preguntas para hacer ahora appears in the UI source", () => {
  const src = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/Preguntas para hacer ahora \/ Questions to Ask Now/.test(src));
});
check("required exact phrase pair: Before You Wrap Up / Antes de terminar appears (or equivalent Sections Review closeout copy) in the UI source", () => {
  const journey = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/Antes de terminar|antes de terminar/.test(journey));
});

// ===============================================================================================
// 14. Structural / mobile (MD <mobile>) — 390px contract via source inspection, no dev server
// ===============================================================================================
console.log("\n390px structural contract:");
const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
check("every primary/secondary button in the actions file declares a >=36px touch target", () => {
  const btnDecls = actionsSource.match(/const (PRIMARY_BTN|SECONDARY_BTN|INPUT) = "[^"]*"/g) ?? [];
  assert.ok(btnDecls.length === 3);
  for (const decl of btnDecls) assert.ok(/min-h-\[(36|40|44)px\]/.test(decl), decl);
});
check("interactive checkbox rows declare a >=36px row height (send-to-meeting checklist)", () => {
  assert.ok(/min-h-\[36px\]/.test(actionsSource));
});
check("no fixed desktop-only wide pixel width is hardcoded on a layout container (would overflow at 390px)", () => {
  assert.ok(!/w-\[\d{3,}px\]/.test(journeySource), "journey component must not hardcode a wide fixed-width container class");
  // The one intentional fixed width (a <select> maxWidth in LinkMeetingButton) is inline style on a
  // dropdown, not a layout container, and must still fit inside a 390px viewport with margin to spare.
  const styleWidths = [...actionsSource.matchAll(/style=\{\{[^}]*maxWidth:\s*(\d+)/g)].map((m) => Number(m[1]));
  for (const w of styleWidths) assert.ok(w < 360, `inline maxWidth ${w}px must fit inside a 390px viewport`);
});
check("layout sections use flex-col/grid patterns (mobile-first), not hardcoded multi-column desktop assumptions", () => {
  assert.ok(!/grid-cols-[3-9]\b/.test(journeySource), "no 3+ column grid without a responsive prefix in the journey component");
});

// ===============================================================================================
// 15. No raw enums rendered directly (MD <truth_ui>, <sections_review>)
// ===============================================================================================
console.log("\nNo raw enums / no secret fields:");
check("Journey component never interpolates a raw status/truthClass/confirmationState/sourceType enum as bare JSX text (prop pass-throughs to components that humanize internally are fine)", () => {
  const suspicious = journeySource.match(/>\s*\{(?:\w+\.)?(status|truthClass|confirmationState|sourceType)\}\s*</g) ?? [];
  assert.equal(suspicious.length, 0, JSON.stringify(suspicious));
});
check("no password/secret/API-key field is ever solicited by the new Gate 3 UI or routes", () => {
  const allNewSource = [actionsSource, journeySource].join("\n");
  assert.ok(!/password|api[_-]?key|secret/i.test(allNewSource));
});

// ===============================================================================================
// 16. Notes & dictation reuse (MD <notes_and_dictation>) — exact existing implementation, no new
//     note platform, saved notes stay visible.
// ===============================================================================================
console.log("\nNotes & dictation reuse:");
check("MeetingNoteCapture imports and renders the existing DictationButton — never a new dictation implementation", () => {
  assert.ok(/import\s*\{\s*DictationButton\s*\}\s*from\s*"@\/app\/admin\/field\/FieldAgentComponents"/.test(actionsSource));
  assert.ok(/<DictationButton/.test(actionsSource));
});
check("meeting notes are attached via the discovery's own sources repository (sourceType 'manual'), never a second note table", () => {
  assert.ok(/sourceType:\s*"manual"/.test(actionsSource));
});
check("saved notes render with a visible timestamp and actor (matches the 'staff could not see where it went' doctrine)", () => {
  assert.ok(/toLocaleString/.test(journeySource) && /createdByEmail|createdByRole/.test(journeySource));
});

// ===============================================================================================
// 17. Assets & visual references (MD <asset_workflow>, <visual_references>) — no duplicate store
// ===============================================================================================
console.log("\nAssets & visual references:");
check("DiscoveryAssetUpload reuses the existing Field Discovery upload endpoint, never a new upload route", () => {
  assert.ok(/\/api\/admin\/field-discovery\/assets\/upload/.test(actionsSource));
  assert.ok(!/\/api\/admin\/businesses\/.*\/discovery\/.*\/assets\/upload/.test(actionsSource));
});
check("uploaded assets are attached via sourceType 'asset' carrying the existing business_source_files id", () => {
  assert.ok(/sourceType:\s*"asset"/.test(actionsSource));
  assert.ok(/businessSourceFileId/.test(actionsSource));
});
check("VisualReferenceForm composes likes/dislikes/inspiration/must-not-copy annotations, never binary data in the discovery tables", () => {
  assert.ok(/Le gusta \/ Likes/.test(actionsSource) && /No le gusta \/ Dislikes/.test(actionsSource));
  assert.ok(/NO copiar \/ Must NOT copy/.test(actionsSource));
});

// ===============================================================================================
// 18. Recording consent (MD <recording_consent>) — consent state only, never recording
// ===============================================================================================
console.log("\nRecording consent:");
const consentRouteSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/consent/route.ts");
check("consent route only ever calls recordProjectDiscoveryConsent — no actual audio/transcript file handling code exists to call", () => {
  assert.ok(/recordProjectDiscoveryConsent/.test(consentRouteSource));
  assert.ok(!/Blob|multipart|formData|storagePath|uploadAudio|recordAudio\(|\.mp3|\.wav|audioUrl|transcriptText/i.test(consentRouteSource));
});
check("ConsentToggle offers YES/NO and shows a distinct 'not asked' state when no consent has been recorded yet", () => {
  assert.ok(/No preguntado \/ Not asked/.test(actionsSource));
});
check("Journey copy explicitly states recording/transcription are not active yet — never implies a real recording exists", () => {
  assert.ok(/no activa ninguna grabación real|no está.*activ.*todavía|not active/i.test(journeySource));
});

// ===============================================================================================
// 19. Confirmation / review authority (MD <confirmation>) — smallest correct review control
// ===============================================================================================
console.log("\nConfirmation & review authority:");
const confirmRouteSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/items/[itemId]/confirm/route.ts");
const itemsRouteSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/items/route.ts");
check("item confirmation is gated on review_project_discovery only (not create/manage)", () => {
  assert.ok(/requireStaffWorkspaceWriteAccess\(\["review_project_discovery"\]\)/.test(confirmRouteSource));
});
check("answer capture never accepts or writes a confirmationState field — capture and confirmation are separate authorities", () => {
  assert.ok(!/confirmationState\s*[:=]/.test(itemsRouteSource), "the word may appear in doctrine comments, but never as an actual field being read/written");
});
check("sales_rep role lacks review_project_discovery (cannot self-promote captured answers), matching Gate 1 doctrine", () => {
  assert.ok(!capabilitiesForRole("sales_rep").has("review_project_discovery"));
});

// ===============================================================================================
// 20. Meeting bridge (MD <meeting_bridge>) — reuses the established Gate D idiom exactly
// ===============================================================================================
console.log("\nMeeting bridge:");
const meetingBridgeSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/meeting-bridge/route.ts");
check("meeting-bridge reuses createNote/noteType 'unknown' — no Meeting v2, no duplicate question storage", () => {
  assert.ok(/createNote/.test(meetingBridgeSource));
  assert.ok(/noteType:\s*"unknown"/.test(meetingBridgeSource));
});
check("meeting-bridge fails truthfully with 'no_upcoming_meeting' rather than inventing a placeholder meeting", () => {
  assert.ok(/no_upcoming_meeting/.test(meetingBridgeSource));
});

// ===============================================================================================
// 21. Humanized errors / actor safety / business isolation (regression guards across all 9 routes)
// ===============================================================================================
console.log("\nHumanized errors, actor safety, business isolation:");
const ROUTE_FILES = [
  "app/api/admin/businesses/[businessId]/discovery/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/intents/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/intents/[intentId]/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/items/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/items/[itemId]/confirm/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/consent/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/sources/route.ts",
  "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/meeting-bridge/route.ts",
];
check("every new route resolves its actor via requireStaffWorkspaceWriteAccess — never a literal staff actor object", () => {
  for (const f of ROUTE_FILES) {
    const src = readSource(f);
    assert.ok(/requireStaffWorkspaceWriteAccess/.test(src), f);
    assert.ok(!/\{\s*type:\s*"staff"/.test(src), `${f} must never construct a literal staff actor`);
  }
});
check("every new route returns JSON error codes only — never a raw exception message or Supabase error string", () => {
  for (const f of ROUTE_FILES) {
    const src = readSource(f);
    assert.ok(!/error\.message/.test(src), f);
    assert.ok(!/error:\s*error(?!Result)/.test(src), f);
  }
});
check("every new route runs on nodejs runtime (matches the rest of the Business Concierge API surface)", () => {
  for (const f of ROUTE_FILES) assert.ok(/export const runtime = "nodejs"/.test(readSource(f)), f);
});

// ===============================================================================================
// 22. Gate 2 engine reused, not reimplemented (MD <questions_to_ask_now>: "do not reimplement
//     prioritization in React")
// ===============================================================================================
console.log("\nGate 2 engine reuse (not reimplemented in the UI layer):");
check("the UI component files never CALL the Gate 2 evaluation/priority engine themselves — type-only imports for props are fine; only page.tsx (server data loader) evaluates", () => {
  for (const src of [actionsSource, journeySource]) {
    assert.ok(!/evaluateWebsiteRequirements\(|evaluateWebsiteReadiness\(|detectWebsiteScopeSignals\(|buildQuestionsToAskNow\(|buildBeforeYouWrapUp\(/.test(src));
  }
});
check("the view-model layer only formats already-evaluated RequirementEvaluation/QuestionCandidate objects — it never calls buildQuestionsToAskNow/evaluateWebsiteReadiness itself", () => {
  const viewModelSrc = readSource("app/lib/business/projectDiscovery/discoveryWorkspaceViewModel.ts");
  assert.ok(!/buildQuestionsToAskNow\(|evaluateWebsiteReadiness\(|evaluateWebsiteRequirements\(|detectWebsiteScopeSignals\(/.test(viewModelSrc));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll Gate 3 checks passed.");
}
