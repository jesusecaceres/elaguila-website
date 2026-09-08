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

const METADATA_PATH = "data/recursos/sources/scc-community-resource-guide-2023.metadata.json";
const CANDIDATES_PATH = "data/recursos/candidates/scc-community-resource-guide-2023.json";
const CSV_PATH = "data/recursos/candidates/scc-community-resource-guide-2023-review.csv";
const REPORT_PATH = "data/recursos/candidates/scc-community-resource-guide-2023-report.md";
const QUEUE_PATH = "data/recursos/candidates/scc-community-resource-guide-2023-verification-queue.json";

assert("source metadata file exists", exists(METADATA_PATH));
assert("candidate JSON exists", exists(CANDIDATES_PATH));
assert("review CSV exists", exists(CSV_PATH));
assert("extraction report exists", exists(REPORT_PATH));
assert("verification queue exists", exists(QUEUE_PATH));

let metadata = null;
try {
  metadata = JSON.parse(read(METADATA_PATH));
  assert("source metadata JSON parses", true);
} catch (err) {
  assert("source metadata JSON parses", false, String(err));
}

// Gate: page validity range is DERIVED from the source metadata, never hardcoded.
const validPageRange = metadata?.printedPageMarkers?.validSourcePageRange;
assert("source metadata declares a derived validSourcePageRange", Array.isArray(validPageRange) && validPageRange.length === 2, validPageRange);

let candidates = null;
try {
  candidates = JSON.parse(read(CANDIDATES_PATH));
  assert("candidate JSON parses", Array.isArray(candidates));
} catch (err) {
  assert("candidate JSON parses", false, String(err));
}

if (candidates && validPageRange) {
  const [minPage, maxPage] = validPageRange;

  assert("every candidate has organizationName", candidates.every((c) => typeof c.organizationName === "string" && c.organizationName.trim().length > 0));
  assert("every candidate has source provenance (sourceDocument + sourcePages)", candidates.every((c) => c.sourceDocument && Array.isArray(c.sourcePages) && c.sourcePages.length > 0));

  assert("verificationStatus is always needs_review, never verified", candidates.every((c) => c.verificationStatus === "needs_review"));
  assert("verifiedAt is always null", candidates.every((c) => c.verifiedAt === null));

  const VALID_CATEGORIES = new Set([
    "urgent-safety","food-basic-needs","housing-rent","mental-health-recovery","health-clinics",
    "legal-immigration","babies-kids-parents","youth-education","jobs-training",
    "seniors-disability","transportation-access","community-support",
  ]);
  assert(
    "every suggestedPrimaryCategory is one of the 12 real Leonix categories",
    candidates.every((c) => VALID_CATEGORIES.has(c.suggestedPrimaryCategory)),
    [...new Set(candidates.map((c) => c.suggestedPrimaryCategory))].filter((v) => !VALID_CATEGORIES.has(v)),
  );

  const VALID_URGENCY = new Set(["help-now", "i-need-help", "want-to-connect"]);
  assert(
    "every suggestedUrgencyLevel is one of the 3 real urgency levels",
    candidates.every((c) => VALID_URGENCY.has(c.suggestedUrgencyLevel)),
  );

  assert(
    `every source page number is within the derived valid range [${minPage}, ${maxPage}]`,
    candidates.every((c) => c.sourcePages.every((p) => p >= minPage && p <= maxPage)),
  );

  const ids = candidates.map((c) => c.candidateId);
  assert("no duplicate candidateId values", new Set(ids).size === ids.length);

  const PLACEHOLDER_PHONE_RE = /555-|000-000-0000|123-456-7890/;
  assert(
    "no placeholder/fake phone strings",
    candidates.every((c) => ![c.phone, c.crisisPhone, c.sms].some((v) => typeof v === "string" && PLACEHOLDER_PHONE_RE.test(v))),
  );

  const PLACEHOLDER_URL_RE = /example\.com|\bTBD\b|placeholder/i;
  assert(
    "no placeholder URLs",
    candidates.every((c) => ![c.websiteUrl, c.applicationUrl, c.officialSourceUrl].some((v) => typeof v === "string" && PLACEHOLDER_URL_RE.test(v))),
  );

  assert(
    "is24Hours is never true without supporting verificationNotes/sourceNotes/hoursNoteEn text",
    candidates.every((c) => {
      if (!c.is24Hours) return true;
      const supportText = [c.verificationNotes, c.sourceNotes, c.hoursNoteEn].filter(Boolean).join(" ");
      return /24/.test(supportText) || /24\/7|365 days/i.test(JSON.stringify(c));
    }),
  );

  assert("suggestedDescriptionEs is always null (no unreviewed auto-translation)", candidates.every((c) => c.suggestedDescriptionEs === null));

  assert("every candidate has a verificationPriority of 1, 2, or 3", candidates.every((c) => [1, 2, 3].includes(c.verificationPriority)));
}

if (exists(CSV_PATH)) {
  const csv = read(CSV_PATH);
  const lines = csv.trim().split("\n");
  assert("review CSV has a header row and at least one data row", lines.length > 1);
  assert("review CSV header matches expected compact review columns", lines[0] === "organization,program,suggested_primary_category,urgency,services,audiences,languages,phone,website,source_pages,verification_status,verification_lead_source_url,verification_notes");
}

if (exists(REPORT_PATH)) {
  const reportSrc = read(REPORT_PATH);
  assert("report explicitly states 2023 data is NOT production-verified", /NOT production-verified/i.test(reportSrc));
  assert("report includes counts by Leonix category", /By Leonix primary category/i.test(reportSrc));
  assert("report includes counts by urgency", /By urgency level/i.test(reportSrc));
}

if (exists(QUEUE_PATH)) {
  let queue = null;
  try {
    queue = JSON.parse(read(QUEUE_PATH));
    assert("verification queue JSON parses", true);
  } catch (err) {
    assert("verification queue JSON parses", false, String(err));
  }
  if (queue) {
    assert("verification queue has priority1/priority2/priority3 buckets", Array.isArray(queue.priority1) && Array.isArray(queue.priority2) && Array.isArray(queue.priority3));
  }
}

// Structural guard: the import-prep script must never contain a live Supabase write call.
const IMPORT_SCRIPT = "scripts/recursos/prepare-candidate-import.ts";
if (exists(IMPORT_SCRIPT)) {
  const src = read(IMPORT_SCRIPT);
  assert("prepare-candidate-import.ts never calls .insert( / .upsert( against a DB client", !/\.(insert|upsert)\(/.test(src));
  assert("prepare-candidate-import.ts never imports an admin/service-role Supabase client", !/getAdminSupabase|createSupabaseServiceClient/.test(src));
  assert("prepare-candidate-import.ts requires --confirm before writing anything", /--confirm/.test(src));
}

// sourceIngestion.ts structural checks
const INGESTION_FILE = "app/lib/recursos/sourceIngestion.ts";
if (exists(INGESTION_FILE)) {
  const src = read(INGESTION_FILE);
  assert("sourceIngestion.ts exports CandidateResourceRecord type", /export type CandidateResourceRecord/.test(src));
  assert("sourceIngestion.ts locks verificationStatus/verifiedAt in candidateToResourceDraft", /verificationStatus !== "needs_review" \|\| candidate\.verifiedAt !== null/.test(src));
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
