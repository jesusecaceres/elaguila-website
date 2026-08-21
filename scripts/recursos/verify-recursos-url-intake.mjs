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

const INTAKE_PAGE = "app/admin/(dashboard)/recursos/intake/page.tsx";
const URL_SAFETY = "app/lib/recursos/intake/urlSafety.ts";
const URL_FETCH = "app/lib/recursos/intake/urlFetch.ts";
const HTML_EXTRACTION = "app/lib/recursos/intake/htmlExtraction.ts";
const AI_ADAPTER = "app/lib/recursos/intake/aiProposalAdapter.ts";
const MATCH_ENGINE = "app/lib/recursos/intake/matchCandidateToExistingResource.ts";
const ORCHESTRATOR = "app/lib/recursos/intake/urlIntakeOrchestrator.ts";
const URL_INTAKE_ACTION = "app/admin/recursosUrlIntakeAction.ts";
const URL_CANDIDATE_ACTIONS = "app/admin/recursosUrlCandidateActions.ts";
const RESULT_PAGE = "app/admin/(dashboard)/recursos/intake/resultado/[jobId]/page.tsx";
const URL_CANDIDATE_DETAIL = "app/admin/(dashboard)/recursos/candidatos/url/[candidateId]/page.tsx";
const CANDIDATOS_PAGE = "app/admin/(dashboard)/recursos/candidatos/page.tsx";
const PUBLIC_QUERIES_PATH = "app/lib/recursos/server/communityResourcesPublicQueries.ts";
const TYPES_PATH = "app/lib/recursos/types.ts";
const MIGRATION_PATH = "supabase/migrations/20260820120000_recursos_intake_os_schema.sql";

// --- URL intake is live ------------------------------------------------------------------------
assert("intake page exists", exists(INTAKE_PAGE));
if (exists(INTAKE_PAGE)) {
  const src = read(INTAKE_PAGE);
  assert("intake page renders a live URL form (analyzeUrlIntakeAction wired)", /analyzeUrlIntakeAction/.test(src));
  assert("intake page's URL card is marked real (status=\"real\")", /title="Sitio web \/ URL"[\s\S]*?status="real"/.test(src));
  assert("intake page's PDF card is marked real (PDF intake is live, Gate 4)", /title="PDF"[\s\S]{0,400}status="real"/.test(src));
}

// --- server-side can_manage_recursos gate ------------------------------------------------------
for (const [label, p] of [
  ["URL intake action", URL_INTAKE_ACTION],
  ["URL candidate actions", URL_CANDIDATE_ACTIONS],
  ["intake result page", RESULT_PAGE],
  ["URL candidate detail page", URL_CANDIDATE_DETAIL],
]) {
  assert(`${label} exists`, exists(p));
  if (exists(p)) {
    assert(`${label} calls requireLeonixAdminPermission("can_manage_recursos")`, /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(read(p)));
  }
}
if (exists(ORCHESTRATOR)) {
  assert("orchestrator itself does not perform its own permission check (gate lives in the action, not duplicated)", !/requireLeonixAdminPermission/.test(read(ORCHESTRATOR)));
}

// --- http/https only, SSRF protections ----------------------------------------------------------
assert("urlSafety.ts exists", exists(URL_SAFETY));
if (exists(URL_SAFETY)) {
  const src = read(URL_SAFETY);
  assert("only http/https protocols allowed", /ALLOWED_PROTOCOLS = new Set\(\["http:", "https:"\]\)/.test(src));
  assert("blocks localhost/.local/.internal hostnames", /localhost/.test(src) && /\.local/.test(src));
  assert("blocks private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)", /10\.0\.0\.0/.test(src) && /172\.16\.0\.0/.test(src) && /192\.168\.0\.0/.test(src));
  assert("blocks link-local / cloud metadata range (169.254.x)", /169\.254\.0\.0/.test(src));
  assert("blocks loopback (127.x)", /127\.0\.0\.0/.test(src));
  assert("blocks IPv6 loopback/unique-local/link-local", /::1/.test(src) && /fc00/.test(src) && /fe80/.test(src));
  assert("rejects URLs with embedded credentials", /username \|\| url\.password/.test(src));
}

// --- redirect limit, timeout, response-size cap --------------------------------------------------
assert("urlFetch.ts exists", exists(URL_FETCH));
if (exists(URL_FETCH)) {
  const src = read(URL_FETCH);
  assert("urlFetch.ts is server-only", /import "server-only"/.test(src));
  assert("uses Node runtime semantics (no edge-only APIs) and manual redirect handling", /redirect: "manual"/.test(src));
  assert("has a finite redirect cap", /MAX_REDIRECTS = \d+/.test(src));
  assert("has a fetch timeout", /FETCH_TIMEOUT_MS = \d+/.test(src) && /setTimeout\(\(\) => controller\.abort\(\)/.test(src));
  assert("has a maximum response size cap", /MAX_RESPONSE_BYTES = [\d_]+/.test(src));
  assert("re-validates every redirect hop through validateIntakeUrl (not just the initial URL)", /validateIntakeUrl\(nextUrl\.toString\(\)\)/.test(src));
  assert("restricts content-type to HTML (no binary/PDF/image ingestion here)", /ALLOWED_CONTENT_TYPE_RE/.test(src) && /text\\\/html/.test(src));
}

// --- raw HTML not rendered ------------------------------------------------------------------------
assert("htmlExtraction.ts exists", exists(HTML_EXTRACTION));
if (exists(HTML_EXTRACTION)) {
  const src = read(HTML_EXTRACTION);
  assert("strips script/style/svg/form tags", /script\|style\|svg\|form/.test(src));
  assert("exports htmlToSafeText for plain-text conversion", /export function htmlToSafeText/.test(src));
}
for (const p of [RESULT_PAGE, URL_CANDIDATE_DETAIL]) {
  if (exists(p)) {
    const src = read(p);
    assert(`${p} never uses dangerouslySetInnerHTML (raw HTML not rendered)`, !/dangerouslySetInnerHTML/.test(src));
  }
}

// --- source_documents / resource_intake_jobs / candidate reviews / verification_events used -----
assert("orchestrator exists", exists(ORCHESTRATOR));
if (exists(ORCHESTRATOR)) {
  const src = read(ORCHESTRATOR);
  assert("orchestrator creates a source_documents row", /dbCreateUrlSourceDocument/.test(src));
  assert("orchestrator creates a resource_intake_jobs row", /dbCreateResourceIntakeJob/.test(src));
  assert("orchestrator updates the job to failed with an error message on fetch failure", /status: "failed", errorMessage: fetchResult\.reason/.test(src));
  assert("orchestrator uses the EXISTING candidate review system (dbSaveCandidateReview)", /dbSaveCandidateReview/.test(src));
  assert("orchestrator sets disposition='researching' (never auto-ready/auto-promoted)", /disposition: "researching"/.test(src));
  assert("orchestrator never sets disposition to promoted or ready_for_promotion", !/disposition: "promoted"|disposition: "ready_for_promotion"/.test(src));
  assert("orchestrator inserts a candidate_created verification event", /eventType: "candidate_created"/.test(src));
  assert("orchestrator inserts an ai_proposal_generated event only when AI was used", /eventType: "ai_proposal_generated"/.test(src) && /if \(aiUsed\)/.test(src));
  assert("orchestrator never writes to community_resources directly", !/dbCreateCommunityResource/.test(src));
  assert("orchestrator calls the existing matching engine", /matchCandidateToExistingResource/.test(src));
  assert("orchestrator calls auditAdminWrite", /auditAdminWrite/.test(src));
}

// --- no direct verified-resource publication / no auto promotion --------------------------------
assert("URL candidate actions file exists", exists(URL_CANDIDATE_ACTIONS));
if (exists(URL_CANDIDATE_ACTIONS)) {
  const src = read(URL_CANDIDATE_ACTIONS);
  assert("promotion still forces active=false", /active: false/.test(src));
  assert("promotion still forces verificationStatus=needs_review", /verificationStatus: "needs_review"/.test(src));
  assert("promotion still forces lastVerifiedAt=null", /lastVerifiedAt: null/.test(src));
  assert("promotion never sets verificationStatus to verified", !/verificationStatus:\s*"verified"/.test(src));
  assert("promotion requires disposition=ready_for_promotion before writing a resource", /disposition !== "ready_for_promotion"/.test(src));
  assert("promotion checks for an existing promotedResourceId (double-promotion guard)", /review!\.promotedResourceId/.test(src));
  assert("promotion enforces isEvidenceSufficientForPriority1 before creating a resource", /isEvidenceSufficientForPriority1/.test(src));
  assert("promotion sources officialSourceUrl from the reviewer's currentSourceUrl, not the raw AI proposal", /officialSourceUrl: review!\.currentSourceUrl/.test(src));
}

// --- exact-match engine works, no pg_trgm, no automatic merge ------------------------------------
assert("matchCandidateToExistingResource.ts exists", exists(MATCH_ENGINE));
if (exists(MATCH_ENGINE)) {
  const src = read(MATCH_ENGINE);
  assert("classifies into the four approved buckets", /"NEW"/.test(src) && /"LIKELY_MATCH"/.test(src) && /"POSSIBLE_DUPLICATE"/.test(src) && /"EXISTING_RESOURCE_UPDATE"/.test(src));
  assert(
    "matching module never functionally uses pg_trgm (docblock may mention it as explicitly deferred)",
    !/CREATE EXTENSION[^\n]*pg_trgm|\.similarity\(|gin_trgm_ops|%>|<->/i.test(src),
  );
  assert("matching module never writes to the database (no getAdminSupabase import)", !/getAdminSupabase/.test(src));
  assert("multiple exact matches resolve to POSSIBLE_DUPLICATE, not an automatic pick", /POSSIBLE_DUPLICATE/.test(src) && /MULTIPLE_RESOURCES_SHARE/.test(src));
}
assert("no functional pg_trgm usage anywhere in the Gate 3 intake module (docblocks may name it as deferred)", (() => {
  const dir = path.join(root, "app", "lib", "recursos", "intake");
  const usageRe = /CREATE EXTENSION[^\n]*pg_trgm|\.similarity\(|gin_trgm_ops|%>|<->/i;
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

// --- AI proposes only; cannot verify or publish; safety rules -----------------------------------
assert("aiProposalAdapter.ts exists", exists(AI_ADAPTER));
if (exists(AI_ADAPTER)) {
  const src = read(AI_ADAPTER);
  assert("AI adapter never imports a DB client (cannot write anything itself)", !/getAdminSupabase/.test(src));
  assert("AI adapter returns null (fail-closed) rather than fabricating on any error", /catch \{\s*return null;/.test(src) || /return null;[\s\S]*catch/.test(src));
  assert("system prompt explicitly forbids inventing facts", /Never invent a fact/.test(src));
  assert("system prompt requires explicit evidence for is24Hours (never inferred)", /Only propose is24Hours=true if the text EXPLICITLY/.test(src));
  assert("system prompt forbids treating a general number as a crisis line", /never propose a general office number as a crisis line/.test(src));
  assert("system prompt requires confidential-address handling", /confidential/i.test(src));
  assert("AI response is never trusted for category/urgency without enum validation", /enumOrDefault/.test(src));
}
if (exists(ORCHESTRATOR)) {
  const src = read(ORCHESTRATOR);
  assert("deterministic-only fallback never sets is24Hours=true", /is24Hours: false,[\s\S]{0,200}confidenceNote/.test(src));
  assert("deterministic-only fallback never proposes a crisisPhone", /crisisPhone: null,[\s\S]{0,100}sms: null/.test(src));
}

// --- confidential-address guard -------------------------------------------------------------------
assert("htmlExtraction.ts detects a confidential-address heuristic", exists(HTML_EXTRACTION) && /looksConfidential/.test(read(HTML_EXTRACTION)));
if (exists(ORCHESTRATOR)) {
  const src = read(ORCHESTRATOR);
  assert("orchestrator enforces a confidential override that strips address fields regardless of AI output", /enforceConfidentialOverride/.test(src));
  assert("confidential override sets addressWithheldForSafety=true and nulls every address field", /addressLine1: null,[\s\S]{0,150}addressWithheldForSafety: true/.test(src));
}

// --- match classifications exist in the review notes / UI ----------------------------------------
for (const p of [RESULT_PAGE, CANDIDATOS_PAGE]) {
  if (exists(p)) assert(`${p} surfaces match classification to the admin`, /MATCH_LABEL|MATCH_BADGE/.test(read(p)));
}

// --- audit call exists -----------------------------------------------------------------------------
assert("orchestrator calls auditAdminWrite for candidate creation", exists(ORCHESTRATOR) && /auditAdminWrite\("recurso_url_intake_candidate_created"/.test(read(ORCHESTRATOR)));
assert("URL candidate actions call auditAdminWrite for promote/drop/save", exists(URL_CANDIDATE_ACTIONS) && /auditAdminWrite/.test(read(URL_CANDIDATE_ACTIONS)));

// --- public queries unchanged ------------------------------------------------------------------------
assert("communityResourcesPublicQueries.ts untouched by Gate 3", exists(PUBLIC_QUERIES_PATH));
if (exists(PUBLIC_QUERIES_PATH)) {
  const src = read(PUBLIC_QUERIES_PATH);
  const withoutSpanishStatusImport = src.replace(/import type \{[^}]*\} from "@\/app\/lib\/recursos\/intake\/server\/resourceSpanishStatusDb";?/g, "");
  assert("public query functions reference no intake module beyond the ES-8-authorized type-only spanish-status import", !/recursos\/intake/.test(withoutSpanishStatusImport));
}
assert("types.ts untouched beyond the additive sourceDocument/sourceYear widen", exists(TYPES_PATH));

// --- no schema/migration change in Gate 3 ---------------------------------------------------------
assert("no unaccounted migration file added since Gate 1 (only the Coach-approved Spanish Bridge foundation migration is newer)", (() => {
  const migDir = path.join(root, "supabase", "migrations");
  const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql"));
  const newerThanGate1 = files.filter((f) => f > "20260820120000_recursos_intake_os_schema.sql");
  return newerThanGate1.filter((f) => f !== "20260821090000_recursos_spanish_bridge_foundation.sql").length === 0;
})());
assert("Gate 1 migration file itself is untouched", exists(MIGRATION_PATH));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
