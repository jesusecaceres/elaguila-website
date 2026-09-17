/**
 * Business Development & Growth Engine, Gate C — workflow-integrity tests that don't require
 * rendering (see scripts/test-growth-plan-ui-acceptance.ts for the rendering-based scenarios).
 * Covers: mobile/390px structural conventions (source-level, since there is no headless-browser
 * layout engine in this test environment), action bridges routing into canonical owning domains
 * rather than duplicating state, humanized error text never leaking a raw internal code, and the
 * Growth Plan page load path never auto-triggering an AI generation (cache-on-open).
 *
 * Run from repo root: npx tsx scripts/test-growth-plan-workflow-integrity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { humanizeStaffWriteError } from "../app/admin/_lib/staffWriteErrorMessages";

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

console.log("Growth Plan Workflow Integrity — structural, routing, and error-text tests\n");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "app", "admin", "(dashboard)", "businesses", "[businessId]");
const journeySource = readFileSync(path.join(SRC_DIR, "GrowthPlanJourney.tsx"), "utf8");
const actionsSource = readFileSync(path.join(SRC_DIR, "GrowthPlanActions.tsx"), "utf8");
const pageSource = readFileSync(path.join(SRC_DIR, "page.tsx"), "utf8");
const assessmentRouteSource = readFileSync(path.join(ROOT, "app/api/admin/businesses/[businessId]/growth/assessment/route.ts"), "utf8");
const creativeRequestRouteSource = readFileSync(
  path.join(ROOT, "app/api/admin/businesses/[businessId]/growth/solutions/[solutionId]/creative-request/route.ts"),
  "utf8",
);
const meetingBridgeRouteSource = readFileSync(
  path.join(ROOT, "app/api/admin/businesses/[businessId]/growth/questions/meeting-bridge/route.ts"),
  "utf8",
);

// === Scenario 9 — Mobile 390px structural conventions ===========================================
check("Scenario 9: interactive controls declare 44/40/36px minimum touch targets", () => {
  const minHeights = [...journeySource.matchAll(/min-h-\[(\d+)px\]/g), ...actionsSource.matchAll(/min-h-\[(\d+)px\]/g)].map((m) => Number(m[1]));
  assert.ok(minHeights.length > 10, "expected many touch-target min-height declarations across the Growth Plan UI");
  for (const h of minHeights) {
    assert.ok(h >= 36, `min-h-[${h}px] is below the smallest allowed touch target (36px for compact inline controls, 44px for primary actions)`);
  }
  const primaryActionButtons = ["Analizar negocio", "Aceptar como guía de trabajo", "Agregar seleccionadas a la reunión", "Crear campaña / Create Campaign"];
  for (const label of primaryActionButtons) {
    const idx = actionsSource.indexOf(label) !== -1 ? actionsSource.indexOf(label) : journeySource.indexOf(label);
    assert.ok(idx !== -1, `expected to find primary action label "${label}"`);
  }
});

check("Scenario 9: no dense multi-column button grids or fixed desktop-only pixel widths", () => {
  assert.ok(!/grid-cols-[3-9]\b/.test(journeySource), "Growth Plan sections must not use a bare 3+ column grid (squeezes on 390px)");
  assert.ok(!/grid-cols-[3-9]\b/.test(actionsSource), "Growth Plan action forms must not use a bare 3+ column grid (squeezes on 390px)");
  assert.ok(/grid-cols-1\s+gap-2\s+sm:grid-cols-2/.test(actionsSource), "Campaign builder form must default to a single column and only widen at sm:");
  assert.ok(!/\bw-\[\d{3,}px\]/.test(journeySource), "Growth Plan sections must not hardcode a wide fixed pixel width");
  assert.ok(!/\bw-\[\d{3,}px\]/.test(actionsSource), "Growth Plan action forms must not hardcode a wide fixed pixel width");
});

check("Scenario 9: bilingual convention (Spanish / English inline pairs) covers the required surfaces", () => {
  const requiredBilingualStrings = [
    "Analizar negocio / Analyze Business",
    "Volver a analizar / Re-analyze",
    "Necesita revisión", // status label es, paired at render time with en: "Needs Review"
    "Needs Review",
    "Revisado", // status label root, paired with "Reviewed" in ASSESSMENT_STATUS_LABEL
    "Lo que encontramos / What We Found",
    "Falta / Requiere confirmación",
    "Requiere confirmación del cliente", // needsVerification group label es, paired at render time with en below
    "Needs Client Confirmation",
    "Preguntas para el cliente / Questions for the Client",
    "Oportunidades de crecimiento / Growth Opportunities",
    "Soluciones recomendadas / Recommended Solutions",
    "Plan de medios / exposición",
    "Hoja de ruta / Roadmap",
    "Proyectos / Campañas",
    "Medición / Measurement",
    "Próximo paso correcto / Next Right Move",
    "Historial de evaluaciones / Assessment History",
  ];
  const combinedSource = `${journeySource}\n${actionsSource}`;
  for (const s of requiredBilingualStrings) {
    assert.ok(combinedSource.includes(s), `expected required bilingual surface text "${s}" in the Growth Plan UI`);
  }
});

// === Scenario 10 — Action bridges route into canonical owning domains, never duplicate state ===
check("Scenario 10: Creative Studio bridge calls the real createJob + linkGrowthSolutionExecution, no parallel job table", () => {
  assert.ok(creativeRequestRouteSource.includes('from "@/app/lib/business/creativeStudio/repository"'), "expected the creative-request bridge to import the real Creative Studio repository");
  assert.ok(creativeRequestRouteSource.includes("createJob("), "expected the bridge to call Creative Studio's own createJob");
  assert.ok(creativeRequestRouteSource.includes("linkGrowthSolutionExecution("), "expected the bridge to record the link via Gate A's canonical execution-link function");
  assert.ok(!/CREATE TABLE|business_growth_creative/i.test(creativeRequestRouteSource), "must not define or reference a second, parallel creative-job table");
});

check("Scenario 10: Follow-up bridge posts to the existing canonical follow-up endpoint, not a new domain", () => {
  assert.ok(actionsSource.includes("/growth/solutions/${solutionId}/creative-request"), "expected the creative-request POST target");
  assert.ok(actionsSource.includes("/api/admin/businesses/${businessId}/follow-up"), "expected CreateFollowUpFromSolutionButton to post to the existing follow-up route, not a new one");
  assert.ok(!actionsSource.includes("/growth/follow-up"), "must not have invented a parallel growth-scoped follow-up endpoint");
});

check("Scenario 10: Meeting-bridge reuses Meeting Studio's own note model (createNote), no new question table", () => {
  assert.ok(meetingBridgeRouteSource.includes('from "@/app/lib/business/meetingStudio/repository"'), "expected the meeting-bridge to import the real Meeting Studio repository");
  assert.ok(meetingBridgeRouteSource.includes("createNote("), "expected the bridge to call Meeting Studio's own createNote");
  assert.ok(meetingBridgeRouteSource.includes('noteType: "unknown"'), 'expected the bridge to reuse the existing "unknown" note-type semantic for a client question');
  assert.ok(!/CREATE TABLE|business_growth_question/i.test(meetingBridgeRouteSource), "must not define or reference a second, parallel question-storage table");
});

check("Scenario 10: Opportunities stay a read-only, separately-owned system — Growth Plan never writes to it", () => {
  assert.ok(!journeySource.includes('"@/app/lib/business/opportunities'), "GrowthPlanJourney.tsx must not import the Opportunity repository directly");
  assert.ok(journeySource.includes('href="#opportunity"'), "expected a link into the canonical Opportunity surface rather than a duplicate opportunity list");
});

// === Scenario 11 — Humanized errors: raw internal codes must never reach staff-facing text =====
check("Scenario 11: known denial codes map to bilingual human text, never the raw code", () => {
  const knownCodes = ["bootstrap_write_denied", "staff_identity_incomplete", "roster_not_found", "roster_inactive", "role_not_permitted"];
  for (const code of knownCodes) {
    const message = humanizeStaffWriteError(code, "fallback text");
    assert.notEqual(message, code, `humanizeStaffWriteError("${code}") must not return the raw code itself`);
    assert.ok(!message.includes(code), `humanized message for "${code}" must not contain the raw code as a substring`);
    assert.ok(message.includes("/"), `expected a bilingual "Spanish / English" message for "${code}"`);
  }
});

check("Scenario 11: unrecognized/provider-domain codes fall back to the caller's own safe message, never leak raw", () => {
  const unrecognizedCodes = ["provider_unavailable", "invalid_provider_output", "persistence_failed", "HTTP 500 Internal Server Error", "no_upcoming_meeting"];
  for (const code of unrecognizedCodes) {
    const fallback = "El análisis no está disponible en este momento. / Business analysis is temporarily unavailable.";
    const message = humanizeStaffWriteError(code, fallback);
    assert.equal(message, fallback, `unrecognized code "${code}" must fall back to the caller's message verbatim`);
    assert.ok(!message.includes(code), `fallback message must never contain the raw unrecognized code "${code}"`);
  }
});

check("Scenario 11: missing/null code falls back safely", () => {
  assert.equal(humanizeStaffWriteError(undefined, "safe fallback"), "safe fallback");
  assert.equal(humanizeStaffWriteError(null, "safe fallback"), "safe fallback");
  assert.equal(humanizeStaffWriteError("", "safe fallback"), "safe fallback");
});

check("Scenario 11: every client-facing setError call in the Growth Plan actions runs through the humanizer", () => {
  const setErrorCalls = [...actionsSource.matchAll(/setError\(([^)]*)\)/g)].map((m) => m[1].trim()).filter((call) => call !== "null");
  assert.ok(setErrorCalls.length >= 8, "expected many setError call sites (excluding error-clearing setError(null)) across the Growth Plan action components");
  for (const call of setErrorCalls) {
    const isHumanized = call.includes("humanizeStaffWriteError(") || /^"[^"]*"$/.test(call) || call.includes("no hay una reuni") || call.includes("required");
    assert.ok(isHumanized, `setError call "${call.slice(0, 60)}" must either use humanizeStaffWriteError(...) or be a hardcoded bilingual literal, never a raw server code`);
  }
});

// === Scenario 12 — Opening Growth Plan does not auto-trigger AI generation (cache-on-open) ======
check("Scenario 12: page load uses the read-only getCurrentGrowthAssessment, never the generator", () => {
  assert.ok(pageSource.includes("getCurrentGrowthAssessment("), "expected the business page's Growth Plan data loader to call getCurrentGrowthAssessment");
  assert.ok(!pageSource.includes("generateOrGetGrowthAssessment"), "the business page must never call the AI generator on page load");
});

check("Scenario 12: the assessment route's GET handler never calls the generator; only POST does", () => {
  const getHandlerMatch = assessmentRouteSource.match(/export async function GET\([\s\S]*?\n}\n/);
  assert.ok(getHandlerMatch, "expected to find the GET handler in assessment/route.ts");
  assert.ok(!getHandlerMatch![0].includes("generateOrGetGrowthAssessment"), "GET handler must be read-only and never trigger generation");

  const postHandlerMatch = assessmentRouteSource.match(/export async function POST\([\s\S]*?\n}\n/);
  assert.ok(postHandlerMatch, "expected to find the POST handler in assessment/route.ts");
  assert.ok(postHandlerMatch![0].includes("generateOrGetGrowthAssessment("), "POST handler must be the only path that can trigger generation");
});

check("Scenario 12: AnalyzeBusinessButton only fires on explicit operator click, never on mount", () => {
  const buttonBody = actionsSource.slice(actionsSource.indexOf("export function AnalyzeBusinessButton"), actionsSource.indexOf("export function ReviewAssessmentButton"));
  assert.ok(!/useEffect/.test(buttonBody), "AnalyzeBusinessButton must not use useEffect to auto-trigger analysis on mount");
  assert.ok(buttonBody.includes("onClick={() => void run(false)}") || buttonBody.includes("onClick={() => void run(true)}"), "generation must only be reachable through an explicit onClick");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSOME CHECKS FAILED.");
} else {
  console.log("ALL CHECKS PASSED.");
}
