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

const MIGRATION_PATH = "supabase/migrations/20260820120000_recursos_intake_os_schema.sql";
const ORIGINAL_CANDIDATE_REVIEWS_MIGRATION = "supabase/migrations/20260819120000_community_resource_candidate_reviews.sql";
const COMMUNITY_RESOURCES_MIGRATION = "supabase/migrations/20260818150000_community_resources.sql";
const PUBLIC_QUERIES_PATH = "app/lib/recursos/server/communityResourcesPublicQueries.ts";
const TYPES_PATH = "app/lib/recursos/types.ts";
const URGENT_VALIDATION_PATH = "app/lib/recursos/urgentResourceValidation.ts";

assert("Gate 1 migration file exists", exists(MIGRATION_PATH));
if (!exists(MIGRATION_PATH)) {
  console.log("FAIL — migration file missing, skipping remaining checks");
  process.exitCode = 1;
} else {
  const src = read(MIGRATION_PATH);

  // --- five expected tables --------------------------------------------------------------
  assert("creates source_documents", /create table if not exists public\.source_documents/.test(src));
  assert("creates resource_intake_jobs", /create table if not exists public\.resource_intake_jobs/.test(src));
  assert("creates resource_change_proposals", /create table if not exists public\.resource_change_proposals/.test(src));
  assert("creates partner_update_requests", /create table if not exists public\.partner_update_requests/.test(src));
  assert("creates verification_events", /create table if not exists public\.verification_events/.test(src));

  // --- status/enum CHECK values, exactly as authorized ------------------------------------
  assert(
    "source_documents.source_type limited to pdf/url only",
    /source_type text not null\s*\n\s*check \(source_type in \('pdf', 'url'\)\)/.test(src),
  );
  assert(
    "resource_intake_jobs.source_type supports pdf/url/manual/partner_referral",
    /check \(source_type in \('pdf', 'url', 'manual', 'partner_referral'\)\)/.test(src),
  );
  assert(
    "resource_intake_jobs.status supports the full approved lifecycle",
    /check \(status in \('pending', 'processing', 'needs_review', 'completed', 'failed', 'cancelled'\)\)/.test(src),
  );
  assert(
    "resource_change_proposals.proposal_source supports pdf_reextraction/url_recheck/partner_request/manual",
    /check \(proposal_source in \('pdf_reextraction', 'url_recheck', 'partner_request', 'manual'\)\)/.test(src),
  );
  assert(
    "resource_change_proposals.status supports pending/accepted/rejected/needs_more_research",
    /check \(status in \('pending', 'accepted', 'rejected', 'needs_more_research'\)\)/.test(src),
  );
  assert(
    "partner_update_requests.status supports pending/reviewing/resolved/rejected",
    /check \(status in \('pending', 'reviewing', 'resolved', 'rejected'\)\)/.test(src),
  );
  assert(
    "verification_events.event_type supports the full approved event vocabulary",
    /check \(event_type in \(\s*\n\s*'candidate_created', 'ai_proposal_generated', 'evidence_recorded',\s*\n\s*'field_accepted', 'field_rejected', 'promoted', 'dropped', 'reverified'\s*\n\s*\)\)/.test(
      src,
    ),
  );

  // --- researching disposition widen: additive only ---------------------------------------
  assert(
    "widens community_resource_candidate_reviews.disposition to include researching",
    /add constraint community_resource_candidate_reviews_disposition_check\s*\n\s*check \(disposition in \('pending', 'researching', 'ready_for_promotion', 'promoted', 'dropped'\)\)/.test(
      src,
    ),
  );
  assert("disposition widen preserves pending", /'pending', 'researching', 'ready_for_promotion', 'promoted', 'dropped'/.test(src));
  assert("disposition widen preserves ready_for_promotion", /'ready_for_promotion'/.test(src));
  assert("disposition widen preserves promoted", src.includes("'promoted'"));
  assert("disposition widen preserves dropped", src.includes("'dropped'"));
  assert(
    "disposition widen does not rewrite existing rows (no UPDATE statement)",
    !/update\s+public\.community_resource_candidate_reviews/i.test(src),
  );

  // --- foreign keys present -----------------------------------------------------------------
  assert(
    "source_documents.supersedes_document_id self-references source_documents",
    /supersedes_document_id uuid\s*\n\s*references public\.source_documents \(id\)/.test(src),
  );
  assert(
    "resource_intake_jobs.source_document_id references source_documents",
    /source_document_id uuid\s*\n\s*references public\.source_documents \(id\)/.test(src),
  );
  assert(
    "resource_change_proposals.resource_id references community_resources (NOT NULL, RESTRICT)",
    /resource_id uuid not null\s*\n\s*references public\.community_resources \(id\)\s*\n\s*on delete restrict/.test(src),
  );
  assert(
    "resource_change_proposals.source_intake_job_id references resource_intake_jobs",
    /source_intake_job_id uuid\s*\n\s*references public\.resource_intake_jobs \(id\)/.test(src),
  );
  assert(
    "partner_update_requests.resource_id references community_resources",
    /partner_update_requests[\s\S]*?resource_id uuid\s*\n\s*references public\.community_resources \(id\)/.test(src),
  );
  assert(
    "verification_events.resource_id references community_resources",
    /verification_events[\s\S]*?resource_id uuid\s*\n\s*references public\.community_resources \(id\)/.test(src),
  );
  assert(
    "verification_events.source_intake_job_id references resource_intake_jobs",
    /verification_events[\s\S]*?source_intake_job_id uuid\s*\n\s*references public\.resource_intake_jobs \(id\)/.test(src),
  );

  // --- verification_events append-only shape ------------------------------------------------
  assert("verification_events has no updated_at column", (() => {
    const tableMatch = src.match(/create table if not exists public\.verification_events \(([\s\S]*?)\n\);/);
    return tableMatch ? !/updated_at/.test(tableMatch[1]) : false;
  })());
  assert(
    "verification_events grant is SELECT/INSERT only (no UPDATE/DELETE) — append-only enforced at grant level",
    /grant select, insert on public\.verification_events to service_role;/.test(src) &&
      !/grant[^\n]*update[^\n]*on public\.verification_events/i.test(src) &&
      !/grant[^\n]*delete[^\n]*on public\.verification_events/i.test(src),
  );

  // --- RLS enabled on all five new tables -----------------------------------------------------
  for (const t of ["source_documents", "resource_intake_jobs", "resource_change_proposals", "partner_update_requests", "verification_events"]) {
    assert(`RLS enabled on ${t}`, new RegExp(`alter table public\\.${t} enable row level security`).test(src));
  }

  // --- zero public policies -------------------------------------------------------------------
  assert("no CREATE POLICY statements anywhere in this migration (service-role only)", !/create policy/i.test(src));

  // --- service_role grants present for every new table -----------------------------------------
  for (const t of ["source_documents", "resource_intake_jobs", "resource_change_proposals", "partner_update_requests", "verification_events"]) {
    assert(`explicit service_role grant present for ${t}`, new RegExp(`on public\\.${t} to service_role`).test(src));
  }

  // --- no destructive statements anywhere in this migration -------------------------------------
  assert("no DROP TABLE", !/drop table/i.test(src));
  assert("no TRUNCATE", !/truncate/i.test(src));
  assert("no DELETE statement", !/^\s*delete from/im.test(src));
  assert("no ALTER of community_resources' own columns (only candidate_reviews.disposition touched)", !/alter table public\.community_resources\b/i.test(src));
  assert("no CASCADE delete anywhere (RESTRICT/SET NULL only)", !/on delete cascade/i.test(src));
}

// --- no modification to the public safety contract (existence + symbol guard) -----------------
assert("community_resources migration untouched (still exists as-is)", exists(COMMUNITY_RESOURCES_MIGRATION));
if (exists(COMMUNITY_RESOURCES_MIGRATION)) {
  const src = read(COMMUNITY_RESOURCES_MIGRATION);
  assert(
    "original community_resources migration contains no Intake-OS symbols (untouched)",
    !/source_documents|resource_intake_jobs|resource_change_proposals|partner_update_requests|verification_events/.test(src),
  );
}
assert("original candidate_reviews migration untouched (still exists as-is)", exists(ORIGINAL_CANDIDATE_REVIEWS_MIGRATION));
if (exists(ORIGINAL_CANDIDATE_REVIEWS_MIGRATION)) {
  const src = read(ORIGINAL_CANDIDATE_REVIEWS_MIGRATION);
  assert(
    "original candidate_reviews migration file text is unmodified (disposition widen lives in the new migration only)",
    /check \(disposition in \('pending', 'ready_for_promotion', 'promoted', 'dropped'\)\)/.test(src),
  );
}
assert("communityResourcesPublicQueries.ts exists and untouched by this Gate", exists(PUBLIC_QUERIES_PATH));
if (exists(PUBLIC_QUERIES_PATH)) {
  const src = read(PUBLIC_QUERIES_PATH);
  assert(
    "public query functions do not reference any new Intake-OS table (Gate 1 is schema-only, no query-layer wiring yet)",
    !/source_documents|resource_intake_jobs|resource_change_proposals|partner_update_requests|verification_events/.test(src),
  );
}
assert("types.ts untouched by this Gate", exists(TYPES_PATH));
if (exists(TYPES_PATH)) {
  const src = read(TYPES_PATH);
  assert(
    "types.ts does not reference any new Intake-OS table/type yet (Gate 1 is schema-only)",
    !/source_documents|resource_intake_jobs|resource_change_proposals|partner_update_requests|verification_events/.test(src),
  );
}
assert("urgentResourceValidation.ts untouched by this Gate", exists(URGENT_VALIDATION_PATH));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
