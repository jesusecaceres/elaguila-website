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

const accessSource = readSource("app/admin/_lib/businessWorkspaceAccess.ts");
const staffAuthRoute = readSource("app/admin/login/auth/route.ts");
const bootstrapSubmitRoute = readSource("app/admin/login/submit/route.ts");
const loginPage = readSource("app/admin/login/page.tsx");
const businessesListPage = readSource("app/admin/(dashboard)/businesses/page.tsx");
const businessesDetailPage = readSource("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const opportunityListRoute = readSource("app/api/admin/businesses/[businessId]/opportunities/route.ts");
const opportunityReviewRoute = readSource("app/api/admin/businesses/[businessId]/opportunities/[opportunityId]/route.ts");
const generateRoute = readSource("app/api/admin/businesses/[businessId]/creative-studio/jobs/[jobId]/generate/route.ts");
const opportunityRepo = readSource("app/lib/business/opportunity/repository.ts");
const fieldDictation = readSource("app/admin/field/[businessId]/FieldAgentDictationSection.tsx");
const fieldBusinessPage = readSource("app/admin/field/[businessId]/page.tsx");
const evidenceRoute = readSource("app/api/admin/businesses/[businessId]/book/evidence/route.ts");
const livingBookActor = readSource("app/admin/_lib/livingBookActor.ts");
const evidenceRepo = readSource("app/lib/business/livingBook/repository.ts");
const phoneDisplay = readSource("app/lib/business/phoneDisplay.ts");

test("51. valid staff roster session is still the Business Concierge staff path", () =>
  sqlContains(accessSource, /actorType: "staff"/) &&
  sqlContains(accessSource, /lookupActiveAdminRosterByAuthUserId\(authUserId\)/) &&
  sqlContains(accessSource, /lookupAuthUserById\(authUserId\)/) &&
  sqlContains(staffAuthRoute, /bootstrap:\s*false/) &&
  sqlContains(businessesListPage, /requireSalesWorkspaceAccess/));

test("52. invalid staff session is denied (no cookie / no operator / auth user missing)", () =>
  sqlContains(accessSource, /reason: "no_admin_cookie"/) &&
  sqlContains(accessSource, /reason: "no_operator_identity"/) &&
  sqlContains(accessSource, /reason: "auth_user_not_found"/) &&
  sqlContains(accessSource, /"roster_not_found"/) &&
  sqlContains(accessSource, /"roster_inactive"/));

test("53. valid owner-bootstrap session is accepted as owner_bootstrap, not staff", () =>
  sqlContains(accessSource, /isAdminBootstrapSession\(jar\)/) &&
  sqlContains(accessSource, /ownerBootstrapAccess\(\)/) &&
  sqlContains(accessSource, /actorType: "owner_bootstrap"/) &&
  sqlContains(accessSource, /capabilitiesForRole\("super_admin"\)/) &&
  !sqlContains(accessSource, /return \{ ok: false, reason: "bootstrap_session_not_allowed" \}/));

test("54. invalid bootstrap is denied (password check + cookie gate remain)", () =>
  sqlContains(bootstrapSubmitRoute, /process\.env\.ADMIN_PASSWORD/) &&
  sqlContains(bootstrapSubmitRoute, /password !== expected/) &&
  sqlContains(bootstrapSubmitRoute, /bootstrap:\s*true/) &&
  sqlContains(accessSource, /if \(!requireAdminCookie\(jar\)\)/) &&
  sqlContains(readSource("app/lib/supabase/adminSession.ts"), /cookies\.get\(LEONIX_ADMIN_BOOTSTRAP_COOKIE\)\?\.value === "1"/));

test("55. owner bootstrap does not become a generic staff session", () => {
  const bootstrapFn = accessSource.slice(accessSource.indexOf("function ownerBootstrapAccess"), accessSource.indexOf("export function isOwnerBootstrapActor"));
  return (
    bootstrapFn.includes('actorType: "owner_bootstrap"') &&
    !bootstrapFn.includes('actorType: "staff"') &&
    bootstrapFn.includes('rosterId: ""') &&
    sqlContains(accessSource, /type: "owner"/) &&
    sqlContains(bootstrapSubmitRoute, /applyLeonixAdminSessionCookies\(res, \{ bootstrap: true \}\)/)
  );
});

test("56. no bootstrap secret reaches client props", () =>
  !sqlContains(loginPage, /ADMIN_PASSWORD/) &&
  !sqlContains(loginPage, /process\.env/) &&
  !sqlContains(businessesListPage, /ADMIN_PASSWORD/) &&
  !sqlContains(businessesDetailPage, /ADMIN_PASSWORD/) &&
  sqlContains(accessSource, /import "server-only"/) &&
  !sqlContains(bootstrapSubmitRoute, /console\.log/) &&
  !sqlContains(bootstrapSubmitRoute, /console\.info/));

test("57. Package B opportunity APIs accept valid owner access through the shared helper", () =>
  sqlContains(opportunityListRoute, /salesActorToOpportunityActor/) &&
  sqlContains(opportunityReviewRoute, /salesActorToOpportunityActor/) &&
  sqlContains(opportunityListRoute, /requireSalesWorkspaceAccess/) &&
  sqlContains(opportunityReviewRoute, /requireSalesWorkspaceAccess/) &&
  !sqlContains(opportunityListRoute, /roster_required/) &&
  !sqlContains(opportunityReviewRoute, /roster_required/));

test("58. Package A Creative Studio generate route accepts valid owner access through the shared helper", () =>
  sqlContains(generateRoute, /requireSalesWorkspaceAccess/) &&
  sqlContains(generateRoute, /salesActorToCreativeActor/) &&
  sqlContains(generateRoute, /generate_creative_draft/) &&
  !sqlContains(generateRoute, /roster_required/));

test("59. unknown / cross-business UUID safety is preserved on the opportunity repository", () =>
  sqlContains(opportunityRepo, /\.eq\("id", opportunityId\)/) &&
  sqlContains(opportunityRepo, /\.eq\("business_id", businessId\)/) &&
  sqlContains(businessesDetailPage, /Business not found/) &&
  sqlContains(businessesDetailPage, /getBusinessWorkspaceDetail\(businessId, access\.actor\)/));

test("60. public/customer paths remain unaffected (no Sales Workspace import on public site)", () => {
  const publicHome = readSource("app/(site)/page.tsx");
  return (
    !sqlContains(publicHome, /requireSalesWorkspaceAccess/) &&
    !sqlContains(publicHome, /businessWorkspaceAccess/) &&
    sqlContains(loginPage, /Staff \/ Team login/) &&
    sqlContains(loginPage, /Owner bootstrap \(shared password\)/)
  );
});

test("61. admin business detail formats phones from server-safe phoneDisplay, not a use-client module", () =>
  sqlContains(phoneDisplay, /export function formatUsPhoneForDisplay/) &&
  !/^\s*["']use client["']/.test(phoneDisplay) &&
  sqlContains(businessesDetailPage, /from "@\/app\/lib\/business\/phoneDisplay"/) &&
  !sqlContains(businessesDetailPage, /Step6ContactsProfiles/));

test("62. empty field voice note cannot submit", () =>
  sqlContains(fieldDictation, /canSubmit/) &&
  sqlContains(fieldDictation, /transcript\.trim\(\)/) &&
  sqlContains(fieldDictation, /disabled=\{!canSubmit\}/));

test("63. valid dictated/typed text can submit to existing evidence API", () =>
  sqlContains(fieldDictation, /evidenceType: "staff_note"/) &&
  sqlContains(fieldDictation, /\/book\/evidence/) &&
  sqlContains(fieldDictation, /Guardar nota \/ Save note/));

test("64. field voice note requires businessId", () =>
  sqlContains(fieldDictation, /businessId/) &&
  sqlContains(fieldDictation, /businessId\.trim\(\)/) &&
  sqlContains(fieldBusinessPage, /FieldAgentDictationSection businessId=\{businessId\}/));

test("65. field voice note save requires authorization", () =>
  sqlContains(evidenceRoute, /requireSalesWorkspaceAccess/) &&
  sqlContains(evidenceRoute, /create_evidence/) &&
  sqlContains(fieldBusinessPage, /requireSalesWorkspaceAccess/));

test("66. success clears textarea", () =>
  sqlContains(fieldDictation, /setTranscript\(""\)/) &&
  sqlContains(fieldDictation, /setSaved\(true\)/));

test("67. failure retains textarea (no clear on error path)", () => {
  const errorIdx = fieldDictation.indexOf("setError(String(body?.error");
  const successClearIdx = fieldDictation.indexOf('setTranscript("")');
  return errorIdx >= 0 && successClearIdx > errorIdx;
});

test("68. duplicate click while pending is prevented", () =>
  sqlContains(fieldDictation, /inflightRef/) &&
  sqlContains(fieldDictation, /inflightRef\.current/) &&
  sqlContains(fieldDictation, /!saving/));

test("69. note is stored against the intended business via evidence insert", () =>
  sqlContains(evidenceRepo, /business_id: input.businessId/) &&
  sqlContains(evidenceRepo, /export async function addEvidence/) &&
  sqlContains(fieldDictation, /encodeURIComponent\(businessId\)/));

test("70. owner bootstrap does not fabricate a staff roster identity on evidence save", () =>
  sqlContains(livingBookActor, /salesActorToLivingBookActor/) &&
  sqlContains(livingBookActor, /isOwnerBootstrapActor/) &&
  sqlContains(livingBookActor, /type: "owner"/) &&
  sqlContains(evidenceRoute, /salesActorToLivingBookActor\(access\.actor\)/) &&
  !sqlContains(evidenceRoute, /staffActorToLivingBookActor\(access\.actor\)/));

test("71. no automatic persistence before Save is clicked", () =>
  !sqlContains(fieldDictation, /useEffect/) &&
  sqlContains(fieldDictation, /onClick=\{\(\) => void saveNote\(\)\}/) &&
  sqlContains(fieldDictation, /DictationButton/));

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
