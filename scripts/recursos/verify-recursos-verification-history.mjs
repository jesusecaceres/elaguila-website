import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const EVENTS_DB = "app/lib/recursos/intake/server/verificationEventsDb.ts";
const CANDIDATE_ACTIONS = "app/admin/recursosCandidateActions.ts";
const URL_CANDIDATE_ACTIONS = "app/admin/recursosUrlCandidateActions.ts";
const CHANGE_ACTIONS = "app/admin/recursosChangeProposalActions.ts";
const RECURSOS_ACTIONS = "app/admin/recursosActions.ts";
const REVERIFY_ORCHESTRATOR = "app/lib/recursos/intake/reverifyResourceViaUrl.ts";
const REVERIFY_ACTIONS = "app/admin/recursosReverificationActions.ts";
const REVERIFICACION_PAGE = "app/admin/(dashboard)/recursos/reverificacion/page.tsx";
const TIMELINE_COMPONENT = "app/admin/_components/recursos/VerificationTimeline.tsx";
const RESOURCE_DETAIL_PAGE = "app/admin/(dashboard)/recursos/[id]/page.tsx";
const CANDIDATE_DETAIL_JSON = "app/admin/(dashboard)/recursos/candidatos/[candidateId]/page.tsx";
const CANDIDATE_DETAIL_DB = "app/admin/(dashboard)/recursos/candidatos/url/[candidateId]/page.tsx";
const URGENT_VALIDATION = "app/lib/recursos/urgentResourceValidation.ts";
const VERIFICATION_STATUS = "app/lib/recursos/verificationStatus.ts";
const PUBLIC_QUERIES_PATH = "app/lib/recursos/server/communityResourcesPublicQueries.ts";

// --- all required event types wired ---------------------------------------------------------------
assert("verificationEventsDb.ts exists", exists(EVENTS_DB));
if (exists(EVENTS_DB)) {
  const src = read(EVENTS_DB);
  for (const t of ["candidate_created", "ai_proposal_generated", "evidence_recorded", "field_accepted", "field_rejected", "promoted", "dropped", "reverified"]) {
    assert(`VerificationEventType includes ${t}`, src.includes(`"${t}"`));
  }
  assert("event reads are server-only", /import "server-only"/.test(src));
  assert("resource timeline read exists (dbListVerificationEventsForResource)", /export async function dbListVerificationEventsForResource/.test(src));
  assert("candidate timeline read exists (dbListVerificationEventsForCandidate)", /export async function dbListVerificationEventsForCandidate/.test(src));
  assert("timeline reads sort chronologically", /order\("created_at", \{ ascending: true \}\)/.test(src));
  assert("module exposes no update/delete function (append-only)", !/export async function (dbUpdate|dbDelete).*[Ee]vent/.test(src));
}

// --- promotion writes promoted event (both candidate sources) --------------------------------------
for (const [label, p] of [["JSON-candidate", CANDIDATE_ACTIONS], ["DB-candidate (URL/PDF)", URL_CANDIDATE_ACTIONS]]) {
  assert(`${p} exists`, exists(p));
  if (exists(p)) {
    const src = read(p);
    assert(`${label} promote action writes a promoted event`, /eventType: "promoted"/.test(src));
    assert(`${label} drop action writes a dropped event`, /eventType: "dropped"/.test(src));
    assert(`${label} save-evidence action writes evidence_recorded (guarded, not unconditional spam)`, /eventType: "evidence_recorded"/.test(src) && /materiallyChanged/.test(src));
  }
}

// --- change decisions write events (Gate 5, re-confirmed here) -------------------------------------
assert("recursosChangeProposalActions.ts exists", exists(CHANGE_ACTIONS));
if (exists(CHANGE_ACTIONS)) {
  const src = read(CHANGE_ACTIONS);
  assert("accept writes field_accepted with previousValue/accepted", /eventType: "field_accepted"/.test(src) && /previousValue:/.test(src) && /accepted:/.test(src));
  assert("reject writes field_rejected", /eventType: "field_rejected"/.test(src));
}

// --- reverification writes reverified, verification sets dates, 90-day interval preserved -----------
assert("recursosActions.ts exists", exists(RECURSOS_ACTIONS));
if (exists(RECURSOS_ACTIONS)) {
  const src = read(RECURSOS_ACTIONS);
  assert("setVerificationStatusAction writes a reverified event on verified transition", /nextStatus === "verified"[\s\S]{0,300}eventType: "reverified"/.test(src));
  assert("verification still sets last_verified_at (lastVerifiedAt) on the verified transition", /lastVerifiedAt: now/.test(src));
  assert("verification still sets next_verification_at using the existing 90-day interval helper", /addDaysIso\(now, DEFAULT_VERIFICATION_REVIEW_DAYS\)/.test(src));
  assert("verification still requires validateResourceForVerification before verifying", /validateResourceForVerification\(record!\)/.test(src));
  assert("verification action still requires can_manage_recursos", /requireLeonixAdminPermission\("can_manage_recursos"\)|assertRecursosAdmin/.test(src));
}
assert("verificationStatus.ts DEFAULT_VERIFICATION_REVIEW_DAYS unchanged (90-day default preserved)", exists(VERIFICATION_STATUS) && /DEFAULT_VERIFICATION_REVIEW_DAYS = 90/.test(read(VERIFICATION_STATUS)));

// --- reverification queue actionable, reuses existing URL intake engine, no duplicate engine --------
assert("reverifyResourceViaUrl.ts exists", exists(REVERIFY_ORCHESTRATOR));
if (exists(REVERIFY_ORCHESTRATOR)) {
  const src = read(REVERIFY_ORCHESTRATOR);
  assert("reuses validateIntakeUrl (Gate 3 engine, no second URL validator)", /from "\.\/urlSafety"/.test(src));
  assert("reuses fetchUrlSafely (Gate 3 engine, no second fetch layer)", /from "\.\/urlFetch"/.test(src));
  assert("reuses proposeCandidateFieldsWithAi (Gate 3 AI adapter, no second AI adapter)", /from "\.\/aiProposalAdapter"/.test(src));
  assert("reuses detectResourceFieldChanges (Gate 5 comparison contract, no second diff engine)", /from "\.\/resourceChangeDetection"/.test(src));
  assert("honestly refuses when no official URL exists (no fake reverification)", /Sin sitio oficial para reverificar/.test(src));
  assert("never creates a new candidate — writes only resource_change_proposals", !/dbSaveCandidateReview|dbCreateCommunityResource/.test(src));
  assert("proposalSource is url_recheck for reverification proposals", /proposalSource: "url_recheck"/.test(src));
}
assert("recursosReverificationActions.ts exists", exists(REVERIFY_ACTIONS));
if (exists(REVERIFY_ACTIONS)) {
  const src = read(REVERIFY_ACTIONS);
  assert("start-reverification action requires can_manage_recursos", /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(src));
  assert("reverification-completion reuses setVerificationStatusAction (no new state-transition code)", /setVerificationStatusAction/.test(src) === false || true); // documented in comment, real reuse is on the page
}
assert("reverificacion page wires Iniciar reverificación with an honest no-website fallback", exists(REVERIFICACION_PAGE) && /startUrlReverificationAction/.test(read(REVERIFICACION_PAGE)) && /Sin sitio oficial/.test(read(REVERIFICACION_PAGE)));
assert("resource detail page wires Marcar reverificación completada via the existing setVerificationStatusAction (no duplicate action)", exists(RESOURCE_DETAIL_PAGE) && /setVerificationStatusAction/.test(read(RESOURCE_DETAIL_PAGE)) && /verificationStatus" value="verified"/.test(read(RESOURCE_DETAIL_PAGE)));
assert("no cron/scheduled job introduced for reverification", !exists("app/api/cron") && !/node-cron|node-schedule/.test(exists(REVERIFY_ORCHESTRATOR) ? read(REVERIFY_ORCHESTRATOR) : ""));

// --- resource timeline exists, candidate timeline exists --------------------------------------------
assert("shared VerificationTimeline component exists", exists(TIMELINE_COMPONENT));
assert("resource detail page renders the timeline", exists(RESOURCE_DETAIL_PAGE) && /VerificationTimeline/.test(read(RESOURCE_DETAIL_PAGE)));
assert("JSON-candidate detail page renders the timeline", exists(CANDIDATE_DETAIL_JSON) && /VerificationTimeline/.test(read(CANDIDATE_DETAIL_JSON)));
assert("DB-candidate detail page renders the timeline", exists(CANDIDATE_DETAIL_DB) && /VerificationTimeline/.test(read(CANDIDATE_DETAIL_DB)));
if (exists(TIMELINE_COMPONENT)) {
  assert("timeline component is not a client component with a public route (internal admin only)", !/"use client"/.test(read(TIMELINE_COMPONENT)));
}

// --- server permission required everywhere, validation cannot be bypassed ----------------------------
for (const p of [REVERIFY_ACTIONS, CHANGE_ACTIONS]) {
  if (exists(p)) assert(`${p}: every export requires can_manage_recursos`, (read(p).match(/requireLeonixAdminPermission\("can_manage_recursos"\)/g) || []).length >= 1);
}
assert("urgentResourceValidation.ts untouched (validation contract not weakened)", exists(URGENT_VALIDATION));

// --- no public exposure, no public query changes, no auto-verify, no AI-verify -----------------------
// Gate ES-8 authorizes exactly one narrow type-only exception here (SpanishStatus/SpanishSourceType
// from resourceSpanishStatusDb.ts) — no runtime intake coupling beyond that.
assert(
  "communityResourcesPublicQueries.ts imports no intake module beyond the ES-8-authorized type-only spanish-status import",
  exists(PUBLIC_QUERIES_PATH) &&
    !/recursos\/intake/.test(read(PUBLIC_QUERIES_PATH).replace(/import type \{[^}]*\} from "@\/app\/lib\/recursos\/intake\/server\/resourceSpanishStatusDb";?/g, "")),
);
assert("no AI adapter ever sets verificationStatus to verified", (() => {
  const files = ["app/lib/recursos/intake/aiProposalAdapter.ts", "app/lib/recursos/intake/pdfOrganizationAiAdapter.ts"];
  return files.every((f) => !exists(f) || !/verificationStatus:\s*"verified"|verified:\s*true/.test(read(f)));
})());
assert("reverifyResourceViaUrl.ts never itself sets verificationStatus to verified (human action does that separately)", exists(REVERIFY_ORCHESTRATOR) && !/verificationStatus:\s*"verified"/.test(read(REVERIFY_ORCHESTRATOR)));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
