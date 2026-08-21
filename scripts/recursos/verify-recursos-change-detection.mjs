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

const MATCH_ENGINE = "app/lib/recursos/intake/matchCandidateToExistingResource.ts";
const CHANGE_DETECTION = "app/lib/recursos/intake/resourceChangeDetection.ts";
const PROPOSALS_DB = "app/lib/recursos/intake/server/resourceChangeProposalsDb.ts";
const FIELD_ACCEPT_DB = "app/lib/recursos/intake/server/resourceFieldAcceptDb.ts";
const CHANGE_ACTIONS = "app/admin/recursosChangeProposalActions.ts";
const CAMBIOS_PAGE = "app/admin/(dashboard)/recursos/cambios/page.tsx";
const GENERATE_PROPOSALS = "app/lib/recursos/intake/generateChangeProposalsForMatch.ts";
const SUPERSESSION = "app/lib/recursos/intake/server/buildSupersessionSummary.ts";
const CANDIDATE_DETAIL = "app/admin/(dashboard)/recursos/candidatos/url/[candidateId]/page.tsx";
const URL_ORCHESTRATOR = "app/lib/recursos/intake/urlIntakeOrchestrator.ts";
const PDF_ORCHESTRATOR = "app/lib/recursos/intake/pdfIntakeOrchestrator.ts";
const PUBLIC_QUERIES_PATH = "app/lib/recursos/server/communityResourcesPublicQueries.ts";

// --- match V2 exists, reasons exposed, no auto merge ---------------------------------------------
assert("match engine exists", exists(MATCH_ENGINE));
if (exists(MATCH_ENGINE)) {
  const src = read(MATCH_ENGINE);
  assert("match engine documents the pg_trgm decision explicitly (not silently skipped)", /pg_trgm decision/.test(src) && /NOT enabled/.test(src));
  assert("match engine adds org+program signal (V2)", /EXACT_ORGANIZATION_AND_PROGRAM_MATCH/.test(src));
  assert("match engine adds address signal (V2)", /EXACT_ADDRESS_MATCH/.test(src));
  assert("match reasons array can include multiple agreeing signals (not just an opaque score)", /reasons\.push\(other\.tier\.reason\)/.test(src));
  assert("no auto-merge: multiple exact matches always resolve to POSSIBLE_DUPLICATE", /tier\.matches\.length > 1/.test(src) && /POSSIBLE_DUPLICATE/.test(src));
  assert("classifications remain exactly the four approved values", /"NEW" \| "LIKELY_MATCH" \| "POSSIBLE_DUPLICATE" \| "EXISTING_RESOURCE_UPDATE"/.test(src));
}

// --- change detection pure helper, field allow-list, safety field set ----------------------------
assert("resourceChangeDetection.ts exists", exists(CHANGE_DETECTION));
if (exists(CHANGE_DETECTION)) {
  const src = read(CHANGE_DETECTION);
  assert("exports a writable field allow-list (WRITABLE_FIELD_COLUMNS)", /export const WRITABLE_FIELD_COLUMNS/.test(src));
  assert("exports a centralized safety-sensitive field set", /export const SAFETY_SENSITIVE_FIELDS/.test(src));
  assert("safety set includes crisisPhone", /"crisisPhone"/.test(src));
  assert("safety set includes sms", /"sms"/.test(src));
  assert("safety set includes address fields", /"addressLine1"/.test(src));
  assert("safety set includes is24Hours", /"is24Hours"/.test(src));
  assert("comparison normalizes phone (digits-only) before comparing", /replace\(\/\\D\/g, ""\)/.test(src));
  assert("comparison normalizes URL (host+path, trailing slash insensitive)", /replace\(\/\\\/\+\$\/, ""\)/.test(src));
  assert("never proposes replacing a real value with unknown/empty", /proposedRaw === null \|\| proposedRaw === undefined \|\| proposedRaw === ""/.test(src));
  assert("never proposes an address change over a confidential/withheld address", /addressWithheldForSafety \|\| addressWithheld/.test(src));
  assert("comparison module does not import a DB client (pure)", !/getAdminSupabase/.test(src));
}

// --- one proposal per field, idempotent, no silent overwrite --------------------------------------
assert("resourceChangeProposalsDb.ts exists", exists(PROPOSALS_DB));
if (exists(PROPOSALS_DB)) {
  const src = read(PROPOSALS_DB);
  assert("create function checks for an existing PENDING proposal before inserting (idempotent)", /\.eq\("status", "pending"\)\s*\n\s*\.maybeSingle\(\)/.test(src) && /skippedDuplicate/.test(src));
  assert("status update re-checks status='pending' server-side before transitioning", /\.eq\("status", "pending"\); \/\/ re-check pending server-side/.test(src));
}
assert("resourceFieldAcceptDb.ts exists (isolated single-field update)", exists(FIELD_ACCEPT_DB));
if (exists(FIELD_ACCEPT_DB)) {
  const src = read(FIELD_ACCEPT_DB);
  assert("field update refuses any field not in the allow-list", /WRITABLE_FIELD_COLUMNS\[fieldName\]/.test(src) && /is not in the writable allow-list/.test(src));
  assert("field update writes exactly one column, never a full object spread", /\[column\]: coerceValueForColumn/.test(src));
  assert("field update never CALLS the full recordToRow path (no full-resource overwrite; a comment may name it as what NOT to use)", !/recordToRow\(/.test(src));
}

// --- accept updates exactly one field --------------------------------------------------------------
assert("recursosChangeProposalActions.ts exists", exists(CHANGE_ACTIONS));
if (exists(CHANGE_ACTIONS)) {
  const src = read(CHANGE_ACTIONS);
  assert("every action requires can_manage_recursos", (src.match(/requireLeonixAdminPermission\("can_manage_recursos"\)/g) || []).length >= 4);
  assert("accept action re-reads the proposal server-side before acting", /acceptChangeProposalAction[\s\S]{0,300}dbGetResourceChangeProposal/.test(src));
  assert("accept action checks status is still pending before writing", /acceptChangeProposalAction[\s\S]{0,500}proposal!\.status !== "pending"/.test(src));
  assert("accept action writes via the single-field allow-listed path", /dbUpdateSingleResourceField/.test(src));
  assert("reject action never calls dbUpdateSingleResourceField", (() => {
    const fn = src.match(/export async function rejectChangeProposalAction[\s\S]*?\n}\n/);
    return fn ? !/dbUpdateSingleResourceField/.test(fn[0]) : false;
  })());
  assert("needs-more-research action never calls dbUpdateSingleResourceField", (() => {
    const fn = src.match(/export async function needsMoreResearchChangeProposalAction[\s\S]*?\n}\n/);
    return fn ? !/dbUpdateSingleResourceField/.test(fn[0]) : false;
  })());
  assert("bulk-safe action excludes safety-sensitive fields", /acceptAllSafeChangeProposalsAction[\s\S]{0,600}!isSafetySensitiveField/.test(src));
  assert("bulk-safe action reuses the exact same per-field update path (no separate bulk SQL)", /acceptAllSafeChangeProposalsAction[\s\S]{0,1500}dbUpdateSingleResourceField/.test(src));
  assert("every decision writes auditAdminWrite", (src.match(/auditAdminWrite\(/g) || []).length >= 4);
  assert("every decision inserts a verification event (accept/reject) or explicit audit (needs-research)", /insertVerificationEvent/.test(src));
}

// --- cambios page live, safety badge, real actions --------------------------------------------------
assert("cambios page exists", exists(CAMBIOS_PAGE));
if (exists(CAMBIOS_PAGE)) {
  const src = read(CAMBIOS_PAGE);
  assert("cambios page wires acceptChangeProposalAction", /acceptChangeProposalAction/.test(src));
  assert("cambios page wires rejectChangeProposalAction", /rejectChangeProposalAction/.test(src));
  assert("cambios page wires needsMoreResearchChangeProposalAction", /needsMoreResearchChangeProposalAction/.test(src));
  assert("cambios page wires acceptAllSafeChangeProposalsAction", /acceptAllSafeChangeProposalsAction/.test(src));
  assert("cambios page shows a safety-sensitive badge", /isSafetySensitiveField/.test(src) && /Sensible/.test(src));
  assert("cambios page requires can_manage_recursos", /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(src));
}

// --- existing-resource-update UI exists ---------------------------------------------------------------
assert("candidate detail page shows match classification/matched resource/reasons/change count", exists(CANDIDATE_DETAIL));
if (exists(CANDIDATE_DETAIL)) {
  const src = read(CANDIDATE_DETAIL);
  assert("candidate detail decodes match metadata", /decodeMatchMetadata/.test(src));
  assert("candidate detail blocks promotion for EXISTING_RESOURCE_UPDATE (server-computed, not just a label)", /isExistingUpdate/.test(src));
  assert("candidate detail shows pending change count for a matched resource", /pendingChanges\.length/.test(src));
  assert("candidate detail links to Cambios instead of encouraging duplicate promotion", /\/admin\/recursos\/cambios/.test(src));
}
assert("promote action also guards EXISTING_RESOURCE_UPDATE server-side (defense in depth)", (() => {
  const p = "app/admin/recursosUrlCandidateActions.ts";
  return exists(p) && /decodeMatchMetadata/.test(read(p)) && /EXISTING_RESOURCE_UPDATE/.test(read(p));
})());

// --- new PDF supersession relationship used, no auto-deactivate -----------------------------------
assert("buildSupersessionSummary.ts exists", exists(SUPERSESSION));
if (exists(SUPERSESSION)) {
  const src = read(SUPERSESSION);
  assert("uses supersedes_document_id relationship", /supersededDocumentId/.test(src));
  assert("explicitly documents informational-only / never auto-deactivates", /NEVER treated as proof of closure/.test(src) && /nothing here ever/.test(src) && /deactivates a resource/.test(src));
  assert("supersession summary module never calls a deactivate/update-active function", !/dbSetCommunityResourceActive|active:\s*false/.test(src));
}
assert("PDF job result page surfaces the supersession summary", (() => {
  const p = "app/admin/(dashboard)/recursos/intake/[jobId]/page.tsx";
  if (!exists(p)) return false;
  const src = read(p);
  return /buildSupersessionSummary/.test(src) && /NUNCA/.test(src) && /desactiva/.test(src);
})());

// --- partner_request / reverification compatible, one global comparison contract -------------------
assert("resourceChangeDetection.ts ProposalSource type includes partner_request", exists(CHANGE_DETECTION) && /"partner_request"/.test(read(CHANGE_DETECTION)));
assert("resourceChangeDetection.ts ProposalSource type includes url_recheck (reverification-compatible)", exists(CHANGE_DETECTION) && /"url_recheck"/.test(read(CHANGE_DETECTION)));
assert("generateChangeProposalsForMatch.ts is the ONE shared entry point both orchestrators call (no second diff engine)", exists(GENERATE_PROPOSALS) && exists(URL_ORCHESTRATOR) && exists(PDF_ORCHESTRATOR) && /generateChangeProposalsForMatch/.test(read(URL_ORCHESTRATOR)) && /generateChangeProposalsForMatch/.test(read(PDF_ORCHESTRATOR)));

// --- public queries unchanged -------------------------------------------------------------------------
assert("communityResourcesPublicQueries.ts untouched by Gate 5", exists(PUBLIC_QUERIES_PATH));
if (exists(PUBLIC_QUERIES_PATH)) {
  assert("public query functions reference no intake module", !/recursos\/intake/.test(read(PUBLIC_QUERIES_PATH)));
}

// --- no new migration, no pg_trgm enablement in code ---------------------------------------------------
assert("no unaccounted migration file added since Gate 1 (only the Coach-approved Spanish Bridge foundation migration is newer)", (() => {
  const migDir = path.join(root, "supabase", "migrations");
  const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql"));
  const newerThanGate1 = files.filter((f) => f > "20260820120000_recursos_intake_os_schema.sql");
  return newerThanGate1.filter((f) => f !== "20260821090000_recursos_spanish_bridge_foundation.sql").length === 0;
})());
assert("no functional pg_trgm usage introduced anywhere in the Gate 5 intake module", (() => {
  const dir = path.join(root, "app", "lib", "recursos", "intake");
  const usageRe = /CREATE EXTENSION[^\n]*pg_trgm|\.similarity\(|gin_trgm_ops/i;
  const walk = (d) => {
    let found = false;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) { if (walk(full)) found = true; }
      else if (/\.ts$/.test(e.name) && usageRe.test(fs.readFileSync(full, "utf8"))) found = true;
    }
    return found;
  };
  return !walk(dir);
})());

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
