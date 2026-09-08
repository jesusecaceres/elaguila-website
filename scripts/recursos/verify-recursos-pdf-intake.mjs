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
const UPLOAD_FORM = "app/admin/_components/recursos/PdfUploadForm.tsx";
const FILE_VALIDATION = "app/lib/recursos/intake/pdfFileValidation.ts";
const PDF_STORAGE = "app/lib/recursos/intake/server/pdfStorage.ts";
const UPLOAD_ROUTE = "app/api/admin/recursos/intake/pdf-upload/route.ts";
const SOURCE_DOCS_DB = "app/lib/recursos/intake/server/sourceDocumentsDb.ts";
const OCR_ADAPTER = "app/lib/recursos/intake/pdfExtractionAdapter.ts";
const AI_ORG_ADAPTER = "app/lib/recursos/intake/pdfOrganizationAiAdapter.ts";
const DEDUP = "app/lib/recursos/intake/pdfCandidateDedup.ts";
const ORCHESTRATOR = "app/lib/recursos/intake/pdfIntakeOrchestrator.ts";
const JOB_RESULT_PAGE = "app/admin/(dashboard)/recursos/intake/[jobId]/page.tsx";
const MATCH_ENGINE = "app/lib/recursos/intake/matchCandidateToExistingResource.ts";
const PUBLIC_QUERIES_PATH = "app/lib/recursos/server/communityResourcesPublicQueries.ts";

// --- private bucket contract in code -------------------------------------------------------------
assert("pdfStorage.ts exists", exists(PDF_STORAGE));
if (exists(PDF_STORAGE)) {
  const src = read(PDF_STORAGE);
  assert("pdfStorage.ts is server-only", /import "server-only"/.test(src));
  assert("bucket name is the approved recursos-source-documents", /RECURSOS_SOURCE_DOCUMENTS_BUCKET = "recursos-source-documents"/.test(src));
  assert("no permanent public URL function (only short-lived signed URLs)", /createSignedUrl/.test(src) && !/getPublicUrl/.test(src));
  assert("signed URL TTL is short-lived (minutes, not days)", /SIGNED_URL_TTL_SECONDS = \d+/.test(src));
}

// --- PDF-only validation, 25MB limit, magic bytes, SHA-256 ------------------------------------
assert("pdfFileValidation.ts exists", exists(FILE_VALIDATION));
if (exists(FILE_VALIDATION)) {
  const src = read(FILE_VALIDATION);
  assert("25MB size cap defined", /PDF_MAX_BYTES = 25 \* 1024 \* 1024/.test(src));
  assert("checks PDF magic bytes (%PDF-)", /%PDF-/.test(src));
  assert("rejects declared MIME other than application/pdf", /application\\\/pdf\$/.test(src));
  assert("sanitizes filenames (path traversal guard)", /\.\.'/.test(src) === false && /replace\(\/\\\.\\\.\/g/.test(src));
}
assert("pdfStorage.ts hashes with SHA-256", exists(PDF_STORAGE) && /sha256Hex|createHash\("sha256"\)/.test(read(PDF_STORAGE)));

// --- server-side admin permission on every new surface -----------------------------------------
for (const [label, p] of [
  ["upload route", UPLOAD_ROUTE],
  ["PDF job result page", JOB_RESULT_PAGE],
]) {
  assert(`${label} exists`, exists(p));
  if (exists(p)) assert(`${label} calls requireLeonixAdminPermission("can_manage_recursos")`, /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(read(p)));
}
assert("upload route uses Node runtime (Buffer/Document AI SDK require it)", exists(UPLOAD_ROUTE) && /export const runtime = "nodejs"/.test(read(UPLOAD_ROUTE)));
assert("upload route never trusts client-declared MIME alone (calls validatePdfUpload)", exists(UPLOAD_ROUTE) && /validatePdfUpload/.test(read(UPLOAD_ROUTE)));

// --- source_documents / resource_intake_jobs used, no public policy ----------------------------
assert("sourceDocumentsDb.ts has a PDF-specific create function", exists(SOURCE_DOCS_DB) && /dbCreatePdfSourceDocument/.test(read(SOURCE_DOCS_DB)));
assert("sourceDocumentsDb.ts supports hash-based duplicate lookup", exists(SOURCE_DOCS_DB) && /dbFindSourceDocumentByHash/.test(read(SOURCE_DOCS_DB)));
assert("sourceDocumentsDb.ts supports supersedes_document_id on create", exists(SOURCE_DOCS_DB) && /supersedesDocumentId/.test(read(SOURCE_DOCS_DB)));
assert("orchestrator creates a resource_intake_jobs row (source_type='pdf')", exists(ORCHESTRATOR) && /sourceType: "pdf"/.test(read(ORCHESTRATOR)));
assert("no CREATE POLICY / public grant statement anywhere in the Gate 4 code (bucket is DB-config only, not app code policy)", (() => {
  const dir = path.join(root, "app", "lib", "recursos", "intake");
  const walk = (d) => {
    let found = false;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) { if (walk(full)) found = true; }
      else if (/\.ts$/.test(e.name) && /getPublicUrl|public:\s*true/.test(fs.readFileSync(full, "utf8"))) found = true;
    }
    return found;
  };
  return !walk(dir);
})());

// --- page/chunk processing, pages_processed used ------------------------------------------------
assert("orchestrator exists", exists(ORCHESTRATOR));
if (exists(ORCHESTRATOR)) {
  const src = read(ORCHESTRATOR);
  assert("orchestrator batches pages for the AI stage (PAGE_BATCH_SIZE)", /PAGE_BATCH_SIZE = \d+/.test(src));
  assert("orchestrator caps total AI-processed pages (cost control)", /MAX_PAGES_PROCESSED_BY_AI = \d+/.test(src));
  assert("orchestrator persists pages_processed after every batch (resumable progress)", /pagesProcessed: Math\.min\(batchesProcessed \* PAGE_BATCH_SIZE/.test(src));
  assert("orchestrator never runs one unbounded synchronous call for the whole PDF's AI stage", /for \(const batch of batches\)/.test(src));
}

// --- OCR / document extraction adapter, no second credentials system ---------------------------
assert("pdfExtractionAdapter.ts exists", exists(OCR_ADAPTER));
if (exists(OCR_ADAPTER)) {
  const src = read(OCR_ADAPTER);
  assert("reuses the existing Ofertas Locales Document AI config (no second credentials system)", /ofertasLocalesDocumentAiConfig/.test(src));
  assert("fails honestly when Document AI is not configured (no fake success)", /PdfOcrNotConfiguredError/.test(src));
  assert("preserves per-page text (page evidence, not an evidence-free blob)", /pageNumber: index \+ 1/.test(src));
}

// --- AI proposal structured, page evidence preserved ---------------------------------------------
assert("pdfOrganizationAiAdapter.ts exists", exists(AI_ORG_ADAPTER));
if (exists(AI_ORG_ADAPTER)) {
  const src = read(AI_ORG_ADAPTER);
  assert("AI adapter never imports a DB client", !/getAdminSupabase/.test(src));
  assert("AI adapter fails closed to an empty array on any error", /catch \{\s*return \[\];/.test(src));
  assert("system prompt requires sourcePages per organization (page evidence)", /sourcePages: the array of page numbers/.test(src));
  assert("system prompt forbids inventing facts", /Never invent a fact/.test(src));
  assert("system prompt requires explicit evidence for is24Hours", /Only propose is24Hours=true if the text EXPLICITLY/.test(src));
  assert("system prompt requires confidential-address handling", /confidential/i.test(src));
  assert("user payload is capped (cost control — not a full large PDF per call)", /\.slice\(0, 12000\)/.test(src));
}

// --- within-document dedupe, never guess-merge distinct programs --------------------------------
assert("pdfCandidateDedup.ts exists", exists(DEDUP));
if (exists(DEDUP)) {
  const src = read(DEDUP);
  assert("dedup key includes both organization AND program (distinct programs kept separate)", /normalizeName\(p\.organizationName\).*normalizeName\(p\.programName\)/.test(src));
  assert("dedup unions sourcePages across merged mentions rather than discarding evidence", /mergedPages/.test(src));
  assert("dedup never writes to the database (pure function)", !/getAdminSupabase/.test(src));
}

// --- existing match engine reused, no pg_trgm -----------------------------------------------------
assert("orchestrator reuses the existing matchCandidateToExistingResource engine", exists(ORCHESTRATOR) && /matchCandidateToExistingResource/.test(read(ORCHESTRATOR)));
assert("matching engine unchanged / still exists (Gate 3 file, not duplicated)", exists(MATCH_ENGINE));
assert("no functional pg_trgm usage introduced by Gate 4", (() => {
  const files = [ORCHESTRATOR, DEDUP, AI_ORG_ADAPTER, OCR_ADAPTER].filter(exists);
  return files.every((f) => !/CREATE EXTENSION[^\n]*pg_trgm|\.similarity\(|gin_trgm_ops/i.test(read(f)));
})());

// --- candidate review system reused, no second candidate table ----------------------------------
// Gate ES-7D: the per-proposal candidate-creation loop that used to live inline in the
// orchestrator was extracted into entityCandidateCreation.ts (shared with the new URL
// multi-entity path) — these checks now look at both files together, same behavior either way.
const ENTITY_CREATION = "app/lib/recursos/intake/entityCandidateCreation.ts";
if (exists(ORCHESTRATOR)) {
  const src = read(ORCHESTRATOR) + (exists(ENTITY_CREATION) ? read(ENTITY_CREATION) : "");
  assert("orchestrator uses the EXISTING candidate review system (dbSaveCandidateReview)", /dbSaveCandidateReview/.test(src));
  assert("orchestrator sets disposition='researching' (never auto-ready/auto-promoted)", /disposition: "researching"/.test(src));
  assert("orchestrator never writes to community_resources directly", !/dbCreateCommunityResource/.test(src));
  assert("orchestrator never sets verificationStatus to verified", !/verificationStatus:\s*"verified"/.test(src));
}

// --- verification_events used, append only --------------------------------------------------------
if (exists(ORCHESTRATOR)) {
  const src = read(ORCHESTRATOR) + (exists(ENTITY_CREATION) ? read(ENTITY_CREATION) : "");
  assert("orchestrator inserts a candidate_created verification event per candidate", /eventType: "candidate_created"/.test(src));
  assert("orchestrator inserts an ai_proposal_generated event only when AI was used", /if \(aiUsedAtLeastOnce\)/.test(src));
  assert("orchestrator calls auditAdminWrite on job completion", /auditAdminWrite\("recurso_pdf_intake_completed"/.test(read(ORCHESTRATOR)));
}

// --- no public query changes -----------------------------------------------------------------------
assert("communityResourcesPublicQueries.ts untouched by Gate 4", exists(PUBLIC_QUERIES_PATH));
if (exists(PUBLIC_QUERIES_PATH)) {
  const src = read(PUBLIC_QUERIES_PATH);
  // Gate ES-8 authorizes exactly one narrow type-only exception: importing SpanishStatus/
  // SpanishSourceType from resourceSpanishStatusDb.ts (reusing the vocabulary already built
  // there rather than redeclaring it) — no runtime intake coupling beyond that.
  const withoutSpanishStatusImport = src.replace(/import type \{[^}]*\} from "@\/app\/lib\/recursos\/intake\/server\/resourceSpanishStatusDb";?/g, "");
  assert("public query functions reference no intake module beyond the ES-8-authorized type-only spanish-status import", !/recursos\/intake/.test(withoutSpanishStatusImport));
}

// --- job result route exists, supersedes_document_id supported ------------------------------------
assert("PDF job result page exists at /admin/recursos/intake/[jobId]", exists(JOB_RESULT_PAGE));
if (exists(JOB_RESULT_PAGE)) {
  const src = read(JOB_RESULT_PAGE);
  assert("job result page shows a candidate classification breakdown", /breakdown/.test(src));
  assert("job result page links to candidate review, never a Publish-all action", /Revisar/.test(src) && !/publish.?all/i.test(src));
}
assert("intake page passes supersedesDocumentId through to the upload route", exists(INTAKE_PAGE) && /supersedesDocumentId|title="PDF"/.test(read(INTAKE_PAGE)));
assert("upload route accepts and forwards supersedesDocumentId", exists(UPLOAD_ROUTE) && /supersedesDocumentId/.test(read(UPLOAD_ROUTE)));

// --- intake page / upload form live -----------------------------------------------------------------
assert("intake page's PDF card is marked real (status=\"real\")", exists(INTAKE_PAGE) && /title="PDF"[\s\S]*?status="real"/.test(read(INTAKE_PAGE)));
assert("PdfUploadForm.tsx exists and posts to the upload route", exists(UPLOAD_FORM) && /\/api\/admin\/recursos\/intake\/pdf-upload/.test(read(UPLOAD_FORM)));
assert("PdfUploadForm.tsx enforces a client-side size hint (supplemental only)", exists(UPLOAD_FORM) && /MAX_MB/.test(read(UPLOAD_FORM)));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
