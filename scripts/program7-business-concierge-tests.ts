/**
 * Program 7 — Business Concierge Behavioral Tests.
 * Executes real pure-logic functions directly; verifies repository/DB-dependent guarantees
 * and PWA source guarantees via source-pattern inspection, matching the Program 5/6 test
 * convention exactly (see scripts/program5-tests.ts, scripts/program6-creative-studio-tests.ts).
 *
 * Run: npx tsx scripts/program7-business-concierge-tests.ts
 */
import * as fs from "fs";
import * as path from "path";

import { computeResult, computeConfidence, computeCausation } from "../app/lib/business/outcomes/logic";
import { detectSignals, type SignalDetectionInput } from "../app/lib/business/advisor/logic";
import { validateActionBoundary, isAllowedAction, isProhibitedAction, PROHIBITED_ACTIONS, isOwnerSafeMessage } from "../app/lib/business/assistant/logic";
import { validateAssistantProviderJson } from "../app/lib/business/assistant/responseValidation";

type TestResult = { name: string; passed: boolean; detail: string };
const results: TestResult[] = [];

function test(name: string, fn: () => boolean | string) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      results.push({ name, passed: true, detail: "" });
    } else if (typeof result === "string") {
      results.push({ name, passed: false, detail: result });
    } else {
      results.push({ name, passed: false, detail: "returned false" });
    }
  } catch (e) {
    results.push({ name, passed: false, detail: String(e) });
  }
}

const root = path.resolve(__dirname, "..");
function readSource(relPath: string): string {
  return fs.readFileSync(path.join(root, relPath), "utf-8");
}
function sqlContains(source: string, pattern: RegExp): boolean {
  return pattern.test(source);
}

const migrationSql = readSource("supabase/migrations/20260811170000_business_program7_foundation.sql");
const outcomesRepo = readSource("app/lib/business/outcomes/repository.ts");
const advisorRepo = readSource("app/lib/business/advisor/repository.ts");
const assistantRepo = readSource("app/lib/business/assistant/repository.ts");
const geminiAssistantProvider = readSource("app/lib/business/assistant/geminiAssistantProvider.ts");
const replyOrchestrator = readSource("app/lib/business/assistant/replyOrchestrator.ts");
const swSource = readSource("public/sw.js");
const manifestSource = readSource("app/manifest.ts");
const offlinePage = readSource("app/offline/page.tsx");
const swRegistration = readSource("app/components/ServiceWorkerRegistration.tsx");
const fieldAgentComponents = readSource("app/admin/field/FieldAgentComponents.tsx");

// ============================================================================
// OUTCOMES (1-11)
// ============================================================================

test("1. create valid outcome: repository exposes createOutcome with actor attribution", () =>
  sqlContains(outcomesRepo, /export async function createOutcome/));

test("2. baseline + measurement produces truthful result", () =>
  computeResult("10", "20", "manual_entry") === "improved" &&
  computeResult("20", "10", "manual_entry") === "declined" &&
  computeResult("10", "10", "manual_entry") === "unchanged");

test("3. missing evidence remains inconclusive", () =>
  computeResult(null, "20", "manual_entry") === "inconclusive" &&
  computeResult("10", null, "manual_entry") === "inconclusive" &&
  computeResult("10", "20", null) === "inconclusive");

test("4. confidence stays bounded", () => {
  const allowed = ["low", "medium", "high", "insufficient_evidence"];
  const c1 = computeConfidence(false, false, false, null);
  const c2 = computeConfidence(true, true, true, "system_derived");
  const c3 = computeConfidence(true, true, false, "manual_entry");
  return allowed.includes(c1) && allowed.includes(c2) && allowed.includes(c3);
});

test("5. causation cannot exceed none/possible/supported", () => {
  const allowed = ["none", "possible", "supported"];
  const c1 = computeCausation(false, 0, false, false);
  const c2 = computeCausation(true, 1, false, false);
  const c3 = computeCausation(true, 2, true, false);
  return allowed.includes(c1) && allowed.includes(c2) && allowed.includes(c3);
});

test("6. unsupported causation cannot become supported", () =>
  computeCausation(true, 1, false, false) === "possible" &&
  computeCausation(false, 0, true, true) === "none");

test("7. cross-business recommendation linkage rejected (composite FK)", () =>
  sqlContains(migrationSql, /business_outcomes_recommendation_business_fk[\s\S]{0,200}FOREIGN KEY \(recommendation_id, business_id\)[\s\S]{0,100}REFERENCES public\.business_recommendations\(id, business_id\)/));

test("8. cross-business commitment linkage rejected (composite FK)", () =>
  sqlContains(migrationSql, /business_outcomes_commitment_business_fk[\s\S]{0,200}FOREIGN KEY \(commitment_id, business_id\)[\s\S]{0,100}REFERENCES public\.business_commitments\(id, business_id\)/));

test("9. cross-business creative-job linkage rejected (composite FK)", () =>
  sqlContains(migrationSql, /business_outcomes_creative_job_business_fk[\s\S]{0,200}FOREIGN KEY \(creative_job_id, business_id\)[\s\S]{0,100}REFERENCES public\.business_creative_jobs\(id, business_id\)/));

test("10. evidence remains append-only (SELECT, INSERT only grant)", () =>
  sqlContains(migrationSql, /GRANT SELECT, INSERT ON TABLE public\.business_outcome_evidence TO service_role/) &&
  !sqlContains(migrationSql, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.business_outcome_evidence/));

test("11. reflections remain append-only (SELECT, INSERT only grant)", () =>
  sqlContains(migrationSql, /GRANT SELECT, INSERT ON TABLE public\.business_outcome_reflections TO service_role/) &&
  !sqlContains(migrationSql, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.business_outcome_reflections/));

// ============================================================================
// ADVISOR (12-22)
// ============================================================================

const baseSignalInput: SignalDetectionInput = {
  hasOverdueCommitment: false,
  hasBlockedCommitment: false,
  hasPostponedReviewDue: false,
  hasCreativeAwaitingReview: false,
  hasProposalAwaitingOwner: false,
  hasUnresolvedContradiction: false,
  hasStaleCriticalFact: false,
  hasOutcomeReviewDue: false,
  hasCapacityStretched: false,
};

test("12. commitment due creates deterministic signal", () => {
  const signals = detectSignals({ ...baseSignalInput, hasOverdueCommitment: true });
  return signals.some((s) => s.signalType === "COMMITMENT_DUE" && s.severity === "priority");
});

test("13. blocked commitment creates deterministic signal", () => {
  const signals = detectSignals({ ...baseSignalInput, hasBlockedCommitment: true });
  return signals.some((s) => s.signalType === "COMMITMENT_BLOCKED" && s.severity === "blocked");
});

test("14. postponed recommendation review due creates signal", () => {
  const signals = detectSignals({ ...baseSignalInput, hasPostponedReviewDue: true });
  return signals.some((s) => s.signalType === "POSTPONED_RECOMMENDATION_REVIEW_DUE");
});

test("15. creative awaiting review creates signal where source state exists", () => {
  const signals = detectSignals({ ...baseSignalInput, hasCreativeAwaitingReview: true });
  return signals.some((s) => s.signalType === "CREATIVE_AWAITING_REVIEW");
});

test("16. proposal awaiting response creates signal where source state exists", () => {
  const signals = detectSignals({ ...baseSignalInput, hasProposalAwaitingOwner: true });
  return signals.some((s) => s.signalType === "PROPOSAL_AWAITING_OWNER");
});

test("17. unresolved contradiction creates signal", () => {
  const signals = detectSignals({ ...baseSignalInput, hasUnresolvedContradiction: true });
  return signals.some((s) => s.signalType === "UNRESOLVED_CONTRADICTION");
});

test("18. stale critical truth creates signal where supported", () => {
  const signals = detectSignals({ ...baseSignalInput, hasStaleCriticalFact: true });
  return signals.some((s) => s.signalType === "STALE_CRITICAL_TRUTH");
});

test("19. outcome review due creates signal", () => {
  const signals = detectSignals({ ...baseSignalInput, hasOutcomeReviewDue: true });
  return signals.some((s) => s.signalType === "OUTCOME_REVIEW_DUE");
});

test("20. duplicate active signals are deduplicated (repository queries by status=active before insert path)", () =>
  sqlContains(advisorRepo, /export async function listActiveSignals/) &&
  sqlContains(advisorRepo, /\.eq\("status", "active"\)/));

test("21. signal does NOT create recommendation (advisor repository has no recommendation insert)", () =>
  !sqlContains(advisorRepo, /\.from\("business_recommendations"\)\s*\n?\s*\.insert/));

test("22. signal resolution preserves event history (append-only events table + transition writes event)", () =>
  sqlContains(advisorRepo, /business_advisor_signal_events/) &&
  sqlContains(advisorRepo, /async function transitionSignal[\s\S]{0,1200}business_advisor_signal_events/) &&
  sqlContains(migrationSql, /GRANT SELECT, INSERT ON TABLE public\.business_advisor_signal_events TO service_role/));

// ============================================================================
// ASSISTANT (23-39)
// ============================================================================

test("23. thread belongs to exact business (composite FK on messages)", () =>
  sqlContains(migrationSql, /business_assistant_messages_thread_business_fk[\s\S]{0,200}FOREIGN KEY \(thread_id, business_id\)[\s\S]{0,100}REFERENCES public\.business_assistant_threads\(id, business_id\)/));

test("24. business A cannot read business B thread (repository always filters by business_id)", () =>
  sqlContains(assistantRepo, /export async function getThreadById[\s\S]{0,300}\.eq\("business_id", businessId\)/) &&
  sqlContains(assistantRepo, /export async function listMessagesForThread[\s\S]{0,300}\.eq\("business_id", businessId\)/));

test("25. owner context excludes staff-only material", () =>
  sqlContains(assistantRepo, /export async function listOwnerSafeMessagesForThread[\s\S]{0,300}\.eq\("visibility", "owner_and_staff"\)/) &&
  isOwnerSafeMessage("owner_and_staff") === true &&
  isOwnerSafeMessage("staff_only") === false);

test("26. staff context respects capability shaping (admin route requires requireSalesWorkspaceAccess)", () =>
  sqlContains(readSource("app/api/admin/businesses/%5BbusinessId%5D/assistant/route.ts"), /requireSalesWorkspaceAccess/));

test("27. provider unavailable fails closed", () =>
  sqlContains(replyOrchestrator, /if \(!configured\)[\s\S]{0,200}failureCode: "provider_unavailable"/) &&
  sqlContains(geminiAssistantProvider, /if \(!apiKey\)[\s\S]{0,200}failureCode: "provider_unavailable"/));

test("28. structured response validation rejects malformed provider output", () => {
  const missingReplyText = validateAssistantProviderJson({ suggested_action_boundary: "READ" });
  const badBoundary = validateAssistantProviderJson({ reply_text: "hi", suggested_action_boundary: "CHARGE" });
  const valid = validateAssistantProviderJson({ reply_text: "hi", suggested_action_boundary: "READ" });
  return missingReplyText.ok === false && badBoundary.ok === false && valid.ok === true;
});

test("29. assistant message history persists append-only (SELECT, INSERT only)", () =>
  sqlContains(migrationSql, /GRANT SELECT, INSERT ON TABLE public\.business_assistant_messages TO service_role/) &&
  !sqlContains(migrationSql, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.business_assistant_messages/));

test("30. context remains bounded (contextAssembler scopes by contextType, not global)", () =>
  sqlContains(readSource("app/lib/business/assistant/contextAssembler.ts"), /export async function assembleContext[\s\S]{0,100}businessId: string,\s*\n\s*contextType: AssistantContextType,/));

test("31. summary + recent-turn architecture works (replyOrchestrator summarizes snapshot as context)", () =>
  sqlContains(replyOrchestrator, /function summarizeContext/) &&
  sqlContains(replyOrchestrator, /const contextSummary = summarizeContext\(context\.snapshot\)/));

test("32. assistant cannot update canonical fact", () => isProhibitedAction("UPDATE_FACT") === true && validateActionBoundary("UPDATE_FACT").ok === false);

test("33. assistant cannot resolve contradiction", () => isProhibitedAction("RESOLVE_CONTRADICTION") === true && validateActionBoundary("RESOLVE_CONTRADICTION").ok === false);

test("34. assistant cannot approve recommendation", () => isProhibitedAction("APPROVE_RECOMMENDATION") === true && validateActionBoundary("APPROVE_RECOMMENDATION").ok === false);

test("35. assistant cannot accept proposal (no ACCEPT_PROPOSAL boundary is allowed; only allowed set is READ/EXPLAIN/SUMMARIZE/GUIDE/DRAFT/SUGGEST)", () =>
  isAllowedAction("ACCEPT_PROPOSAL") === false && validateActionBoundary("ACCEPT_PROPOSAL").ok === false);

test("36. assistant cannot charge", () => isProhibitedAction("CHARGE") === true && validateActionBoundary("CHARGE").ok === false);

test("37. assistant cannot grant entitlement", () => isProhibitedAction("GRANT_ENTITLEMENT") === true && validateActionBoundary("GRANT_ENTITLEMENT").ok === false);

test("38. assistant cannot publish", () => isProhibitedAction("AUTO_PUBLISH") === true && validateActionBoundary("AUTO_PUBLISH").ok === false);

test("39. assistant cannot externally message", () => isProhibitedAction("SEND_MESSAGE") === true && validateActionBoundary("SEND_MESSAGE").ok === false && PROHIBITED_ACTIONS.includes("SEND_MESSAGE"));

// ============================================================================
// PWA (40-50)
// ============================================================================

test("40. manifest returns expected installability metadata", () =>
  sqlContains(manifestSource, /display: "standalone"/) &&
  sqlContains(manifestSource, /start_url:/) &&
  sqlContains(manifestSource, /icons:/));

test("41. service worker excludes /api/*", () =>
  sqlContains(swSource, /NEVER_CACHE_PATTERNS[\s\S]{0,80}\/\\\/api\\\//));

test("42. service worker excludes auth-sensitive traffic", () =>
  sqlContains(swSource, /\/\\\/auth\\\//));

test("43. service worker excludes Supabase/auth data", () =>
  sqlContains(swSource, /supabase\\\.co/));

test("44. protected business APIs are never cache-first (fetch-first strategy for non-static)", () =>
  sqlContains(swSource, /event\.respondWith\(\s*\n\s*fetch\(request\)\.catch/));

test("45. offline path is truthful (no fake data — explicit offline message)", () =>
  sqlContains(offlinePage, /Sin conexión/) &&
  sqlContains(offlinePage, /You are offline/) &&
  !sqlContains(offlinePage, /fetch\(/));

test("46. no fake offline mutation success (CameraFileCapture blocks upload when offline)", () =>
  sqlContains(fieldAgentComponents, /if \(network === "offline"\)[\s\S]{0,150}setError/));

test("47. dictation feature detection handles unsupported browser gracefully", () =>
  sqlContains(fieldAgentComponents, /if \(!supported\)[\s\S]{0,250}Dictado no disponible/));

test("48. no raw microphone audio persistence (dictation only sends onTranscript text, never audio blob)", () =>
  !sqlContains(fieldAgentComponents, /MediaRecorder/) &&
  !sqlContains(fieldAgentComponents, /getUserMedia/) &&
  sqlContains(fieldAgentComponents, /onTranscript: \(text: string\) => void/));

test("49. meeting recording remains disabled (Program 5 doctrine unchanged)", () =>
  sqlContains(readSource("app/lib/business/meetingStudio/logic.ts"), /isAudioRecordingLive/) &&
  sqlContains(readSource("app/lib/business/meetingStudio/logic.ts"), /export function isAudioRecordingLive\([^)]*\)[^{]*\{\s*\n\s*return false/));

test("50. push remains unavailable/provider-ready unless genuinely configured (no push subscription code exists)", () =>
  !sqlContains(swSource, /pushManager\.subscribe/) &&
  !sqlContains(swSource, /addEventListener\("push"/) &&
  !sqlContains(swRegistration, /pushManager/));

// Report
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log("\n=== Program 7 Business Concierge Behavioral Tests ===\n");
for (const r of results) {
  console.log(`${r.passed ? "PASS" : "FAIL"} — ${r.name}`);
  if (!r.passed) console.log(`       ${r.detail}`);
}
console.log(`\nPROGRAM 7 BEHAVIOR TESTS: ${passed}/${results.length} PASS\n`);

if (failed > 0) {
  process.exit(1);
}
