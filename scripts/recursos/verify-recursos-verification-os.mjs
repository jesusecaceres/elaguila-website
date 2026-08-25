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

const MIGRATION_PATH = "supabase/migrations/20260819120000_community_resource_candidate_reviews.sql";
const EVIDENCE_PATH = "app/lib/recursos/verificationEvidence.ts";
const REVIEWS_DB_PATH = "app/lib/recursos/server/communityResourceCandidateReviewsDb.ts";
const CANDIDATE_ACTIONS_PATH = "app/admin/recursosCandidateActions.ts";
const PUBLIC_QUERIES_PATH = "app/lib/recursos/server/communityResourcesPublicQueries.ts";
const RECURSOS_ACTIONS_PATH = "app/admin/recursosActions.ts";
const CANDIDATE_JSON_PATH = "data/recursos/candidates/scc-community-resource-guide-2023.json";

// --- Gate 1: durable evidence schema ------------------------------------------------------
assert("candidate review migration exists", exists(MIGRATION_PATH));
if (exists(MIGRATION_PATH)) {
  const src = read(MIGRATION_PATH);
  assert("migration creates community_resource_candidate_reviews table", /create table if not exists public\.community_resource_candidate_reviews/.test(src));
  assert("candidate_id is unique not null", /candidate_id text not null unique/.test(src));
  assert("migration has a disposition check constraint", /check \(disposition in \('pending', 'ready_for_promotion', 'promoted', 'dropped'\)\)/.test(src));
  assert("migration has promoted_resource_id referencing community_resources", /promoted_resource_id uuid references public\.community_resources/.test(src));
  assert("migration enables RLS", /alter table public\.community_resource_candidate_reviews enable row level security/.test(src));
  assert("migration defines NO select/insert/update/delete policy (admin/service-role only)", !/create policy/.test(src));
}

// --- candidate JSON immutability ------------------------------------------------------------
assert("candidate JSON source file exists", exists(CANDIDATE_JSON_PATH));
if (exists(CANDIDATE_JSON_PATH)) {
  let candidates = null;
  try {
    candidates = JSON.parse(read(CANDIDATE_JSON_PATH));
    assert("candidate JSON still parses", true);
  } catch (err) {
    assert("candidate JSON still parses", false, String(err));
  }
  if (candidates) {
    const REVIEW_ONLY_KEYS = ["disposition", "reviewedBy", "reviewedAt", "currentSourceUrl", "currentSourceType", "organizationConfirmedActive", "promotedResourceId"];
    const leaked = candidates.some((c) => REVIEW_ONLY_KEYS.some((k) => Object.prototype.hasOwnProperty.call(c, k)));
    assert("candidate JSON was NOT converted into mutable review storage (no review-only keys present)", !leaked);
    assert("every candidate is still locked to verificationStatus=needs_review / verifiedAt=null", candidates.every((c) => c.verificationStatus === "needs_review" && c.verifiedAt === null));
  }
}

// --- Gate 2: evidence contract ---------------------------------------------------------------
assert("verificationEvidence.ts exists", exists(EVIDENCE_PATH));
if (exists(EVIDENCE_PATH)) {
  const src = read(EVIDENCE_PATH);
  assert("exports isEvidenceSufficientForPriority1", /export function isEvidenceSufficientForPriority1/.test(src));
  assert("Priority-1 sufficiency checks for help-now specifically", /suggestedUrgencyLevel !== "help-now"/.test(src));
  assert("phone-call-only evidence is not treated as a sufficient source type for help-now", /currentSourceType !== "government" && review\.currentSourceType !== "official_org_site"/.test(src));
  assert(
    "candidate evidence helper is distinct from resource-level validateResourceForVerification (no cross-import)",
    !/^import[^\n]*urgentResourceValidation/m.test(src),
  );
}

// --- Gate 3: server persistence layer ---------------------------------------------------------
assert("communityResourceCandidateReviewsDb.ts exists", exists(REVIEWS_DB_PATH));
if (exists(REVIEWS_DB_PATH)) {
  const src = read(REVIEWS_DB_PATH);
  assert("is server-only", /import "server-only"/.test(src));
  assert("uses admin (service role) Supabase client only", /getAdminSupabase/.test(src));
  assert("never imports an anon/browser Supabase client", !/createSupabaseBrowserClient|anonClient/.test(src));
  assert("exports dbGetCandidateReview", /export async function dbGetCandidateReview/.test(src));
  assert("exports dbListCandidateReviews", /export async function dbListCandidateReviews/.test(src));
  assert("exports dbSaveCandidateReview", /export async function dbSaveCandidateReview/.test(src));
  assert("exports dbSetPromotedResourceId", /export async function dbSetPromotedResourceId/.test(src));
  assert("dbSetPromotedResourceId refuses double promotion", /already promoted to resource/.test(src));
}

// --- Gate 5: controlled promotion --------------------------------------------------------------
assert("recursosCandidateActions.ts exists", exists(CANDIDATE_ACTIONS_PATH));
if (exists(CANDIDATE_ACTIONS_PATH)) {
  const src = read(CANDIDATE_ACTIONS_PATH);
  assert("exports promoteCandidateAction", /export async function promoteCandidateAction/.test(src));
  assert("exports saveCandidateReviewAction", /export async function saveCandidateReviewAction/.test(src));
  assert("saveCandidateReviewAction never creates a community_resources record", (() => {
    const fnMatch = src.match(/export async function saveCandidateReviewAction[\s\S]*?\n}\n/);
    return fnMatch ? !/dbCreateCommunityResource/.test(fnMatch[0]) : false;
  })());
  assert("promotion forces active=false", /active: false/.test(src));
  assert("promotion forces verificationStatus=needs_review", /verificationStatus: "needs_review"/.test(src));
  assert("promotion forces lastVerifiedAt=null", /lastVerifiedAt: null/.test(src));
  assert("promotion never sets verificationStatus to verified", !/verificationStatus:\s*"verified"/.test(src));
  assert("promotion checks for an existing promotedResourceId before proceeding (double-promotion guard)", /review!\.promotedResourceId/.test(src));
  assert("promotion enforces isEvidenceSufficientForPriority1 before creating a resource", /isEvidenceSufficientForPriority1\(review!, candidate\)/.test(src));
  assert("promotion sources officialSourceUrl from the review's currentSourceUrl, not the raw candidate", /officialSourceUrl: review!\.currentSourceUrl/.test(src));
  assert("candidate actions are gated behind can_manage_recursos, same as existing Recursos admin", /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(src));
}

// --- Gate 6: existing chokepoint preserved -------------------------------------------------------
assert("recursosActions.ts still exists and is unmodified in intent", exists(RECURSOS_ACTIONS_PATH));
if (exists(RECURSOS_ACTIONS_PATH)) {
  const src = read(RECURSOS_ACTIONS_PATH);
  assert("setVerificationStatusAction still exists as the verification chokepoint", /export async function setVerificationStatusAction/.test(src));
  assert("setVerificationStatusAction still enforces validateResourceForVerification for verified transitions", /validateResourceForVerification\(record!\)/.test(src));
}
if (exists(CANDIDATE_ACTIONS_PATH)) {
  const src = read(CANDIDATE_ACTIONS_PATH);
  assert(
    "recursosCandidateActions.ts never imports setVerificationStatusAction or validateResourceForVerification directly (no alternate verify path)",
    !/^import[^\n]*(setVerificationStatusAction|validateResourceForVerification)/m.test(src),
  );
}

// --- Gate 7: public verification safety -----------------------------------------------------------
assert("communityResourcesPublicQueries.ts exists", exists(PUBLIC_QUERIES_PATH));
if (exists(PUBLIC_QUERIES_PATH)) {
  const src = read(PUBLIC_QUERIES_PATH);
  assert("public query uses isEffectivelyVerified (reused, not reinvented)", /isEffectivelyVerified/.test(src));
  assert("public query filters verification_status = verified at the query level (stricter than neq inactive)", /\.eq\("verification_status", "verified"\)/.test(src));
  assert("public query no longer allows needs_review/stale through via a neq-inactive filter", !/\.neq\("verification_status", "inactive"\)/.test(src));
  // Existing Resource Official-Spanish Bridge (Gate ES-QA1): confirmed this was a false-positive in
  // the verifier, not a real product bug — listPublicCommunityResources genuinely applies
  // isCurrentlyPublicEligible before returning (communityResourcesPublicQueries.ts:150), it's just
  // written as `.filter(({ record }) => isCurrentlyPublicEligible(record))` (destructured wrapper,
  // since `records` at that point is `{row, record}[]`, not bare ResourceRecord[]) rather than a
  // bare function reference. Matching the actual safe call, not one specific syntax for it.
  assert(
    "listPublicCommunityResources applies the effective-eligibility filter before returning",
    /\.filter\(\(\{\s*record\s*\}\)\s*=>\s*isCurrentlyPublicEligible\(record\)\)/.test(src) || /records\.filter\(isCurrentlyPublicEligible\)/.test(src),
  );
  assert("getPublicCommunityResourceBySlug applies the effective-eligibility check before returning", /if \(!isCurrentlyPublicEligible\(record\)\) return null/.test(src));
}

// --- No public Recursos UI / search / LEO touched -----------------------------------------------
const FORBIDDEN_TOUCHED_PATHS = [
  "app/(site)/recursos-comunitarios/page.tsx",
  "app/(site)/recursos-comunitarios/RecursosComunitariosClient.tsx",
  "app/lib/recursos/resourceFilters.ts",
  "app/lib/recursos/categories.ts",
  "app/lib/recursos/urgency.ts",
  "app/components/Navbar.tsx",
  "app/components/Footer.tsx",
  "app/lib/publicNavConfig.ts",
  "app/sitemap.ts",
];
// Static existence-based guard (this script has no git dependency): these files must exist
// exactly as before — i.e. still present — and must not contain any Build-03A-V-only symbols
// that would indicate this build leaked into them.
for (const p of FORBIDDEN_TOUCHED_PATHS) {
  if (exists(p)) {
    const src = read(p);
    assert(`${p} was not touched by this build (no verification-OS symbols present)`, !/community_resource_candidate_reviews|verificationEvidence|promoteCandidateAction/.test(src));
  }
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
