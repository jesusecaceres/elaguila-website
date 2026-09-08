import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
function byteSize(rel) {
  return fs.statSync(path.join(root, rel)).size;
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const READY_PATH = "data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json";
const NEEDS_REVIEW_PATH = "data/recursos/verified/scc-community-resource-guide-2023-needs-review.json";
const DROPPED_PATH = "data/recursos/verified/scc-community-resource-guide-2023-dropped.json";
const CANDIDATES_PATH = "data/recursos/candidates/scc-community-resource-guide-2023.json";
const PKG_DIR = "data/recursos/verified/certification-import-compact";

const BATCH_FILES = [
  "01-ready-01-10.sql",
  "02-ready-11-20.sql",
  "03-ready-21-30.sql",
  "04-ready-31-40.sql",
  "05-ready-41-50.sql",
  "06-ready-51-60.sql",
  "07-ready-61-65.sql",
];
const EXPECTED_BATCH_SIZES = [10, 10, 10, 10, 10, 10, 5];
const PREFLIGHT_PATH = `${PKG_DIR}/00-preflight.sql`;
const POSTFLIGHT_PATH = `${PKG_DIR}/99-postflight.sql`;
const README_PATH = `${PKG_DIR}/README.md`;
const HARD_SIZE_LIMIT_BYTES = 60 * 1024;
const TARGET_SIZE_BYTES = 35 * 1024;

// Known-good sha256 of the immutable candidate JSON as of the finalized research manifest
// commit — unchanged from the non-compact package's own verifier. Any change means the
// file was touched, which this build is explicitly forbidden from doing.
const EXPECTED_CANDIDATE_JSON_SHA256 = "7a2dafbb47951f192fb84f0355809a02fe910f8342e3b08fe171790680b8001d";

assert("ready-for-import manifest exists", exists(READY_PATH));
assert("needs-review manifest exists", exists(NEEDS_REVIEW_PATH));
assert("dropped manifest exists", exists(DROPPED_PATH));
assert("immutable candidate JSON exists", exists(CANDIDATES_PATH));
assert("preflight SQL exists", exists(PREFLIGHT_PATH));
assert("postflight SQL exists", exists(POSTFLIGHT_PATH));
assert("README exists", exists(README_PATH));
for (const f of BATCH_FILES) {
  assert(`batch file exists: ${f}`, exists(`${PKG_DIR}/${f}`));
}

// ---- Candidate JSON untouched ----
if (exists(CANDIDATES_PATH)) {
  const buf = fs.readFileSync(path.join(root, CANDIDATES_PATH));
  const actualHash = crypto.createHash("sha256").update(buf).digest("hex");
  assert("immutable candidate JSON content unchanged (sha256 match)", actualHash === EXPECTED_CANDIDATE_JSON_SHA256, actualHash);
}

let ready = null;
let needsReview = null;
let dropped = null;
try {
  ready = JSON.parse(read(READY_PATH));
  assert("ready-for-import JSON parses", Array.isArray(ready) && ready.length === 65, ready?.length);
} catch (err) {
  assert("ready-for-import JSON parses", false, String(err));
}
try {
  needsReview = JSON.parse(read(NEEDS_REVIEW_PATH));
  assert("needs-review JSON parses", Array.isArray(needsReview));
} catch (err) {
  assert("needs-review JSON parses", false, String(err));
}
try {
  dropped = JSON.parse(read(DROPPED_PATH));
  assert("dropped JSON parses", Array.isArray(dropped));
} catch (err) {
  assert("dropped JSON parses", false, String(err));
}

const readyIds = new Set((ready ?? []).map((r) => r.candidateId));
const needsReviewIds = new Set((needsReview ?? []).map((r) => r.candidateId));
const droppedIds = new Set((dropped ?? []).map((r) => r.candidateId));

// ---- Byte-size gate ----
const batchSizes = BATCH_FILES.map((f) => (exists(`${PKG_DIR}/${f}`) ? byteSize(`${PKG_DIR}/${f}`) : null));
batchSizes.forEach((bytes, i) => {
  if (bytes === null) return;
  const kb = (bytes / 1024).toFixed(2);
  assert(`${BATCH_FILES[i]} is at or under the 60 KB hard gate (actual: ${kb} KB)`, bytes <= HARD_SIZE_LIMIT_BYTES, bytes);
}
);
const overTarget = batchSizes
  .map((bytes, i) => ({ file: BATCH_FILES[i], bytes }))
  .filter((x) => x.bytes !== null && x.bytes > TARGET_SIZE_BYTES);
if (overTarget.length > 0) {
  console.log(`NOTE: ${overTarget.length} batch file(s) exceed the 35 KB soft target (still under the 60 KB hard gate): ${overTarget.map((x) => `${x.file} (${(x.bytes / 1024).toFixed(2)} KB)`).join(", ")}`);
}

// ---- Extract the embedded JSON payload from each batch and derive per-batch candidateIds ----
const batchTexts = BATCH_FILES.map((f) => (exists(`${PKG_DIR}/${f}`) ? read(`${PKG_DIR}/${f}`) : ""));
const batchPayloads = batchTexts.map((src, i) => {
  const m = src.match(/\$JSON\$([\s\S]*?)\$JSON\$/);
  if (!m) {
    assert(`${BATCH_FILES[i]} contains a $JSON$-delimited payload`, false);
    return [];
  }
  try {
    const arr = JSON.parse(m[1]);
    assert(`${BATCH_FILES[i]} embedded JSON payload parses`, Array.isArray(arr));
    return arr;
  } catch (err) {
    assert(`${BATCH_FILES[i]} embedded JSON payload parses`, false, String(err));
    return [];
  }
});

batchPayloads.forEach((arr, i) => {
  assert(`batch ${i + 1} (${BATCH_FILES[i]}) has ${EXPECTED_BATCH_SIZES[i]} records`, arr.length === EXPECTED_BATCH_SIZES[i], arr.length);
});

const allBatchRecords = batchPayloads.flat();
const allBatchIds = allBatchRecords.map((r) => r.candidateId);
assert("seven batches total 65 records", allBatchIds.length === 65, allBatchIds.length);

const batchIdCounts = new Map();
for (const id of allBatchIds) batchIdCounts.set(id, (batchIdCounts.get(id) || 0) + 1);
const duplicated = [...batchIdCounts.entries()].filter(([, c]) => c > 1).map(([id]) => id);
assert("every candidateId appears exactly once across all batches", duplicated.length === 0, duplicated);

const batchIdSet = new Set(allBatchIds);
const missingFromBatches = [...readyIds].filter((id) => !batchIdSet.has(id));
assert("all 65 READY candidateIds are represented in the batches", missingFromBatches.length === 0, missingFromBatches);

const unknownInBatches = allBatchIds.filter((id) => !readyIds.has(id));
assert("no unknown candidateIds in the batches (every batch id is a READY id)", unknownInBatches.length === 0, unknownInBatches);

const needsReviewInBatches = allBatchIds.filter((id) => needsReviewIds.has(id));
assert("no NEEDS_REVIEW candidate included in any batch", needsReviewInBatches.length === 0, needsReviewInBatches);

const droppedInBatches = allBatchIds.filter((id) => droppedIds.has(id));
assert("no DROPPED candidate included in any batch", droppedInBatches.length === 0, droppedInBatches);

// ---- Destructive / DDL guard across the whole package (comments stripped) ----
function stripSqlLineComments(src) {
  return src
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}
const DESTRUCTIVE_RE = /\b(DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE|CREATE\s+TABLE|CREATE\s+FUNCTION|CREATE\s+EXTENSION|CREATE\s+INDEX|CREATE\s+POLICY|GRANT\s|REVOKE\s)\b/i;
const allFiles = [PREFLIGHT_PATH, ...BATCH_FILES.map((f) => `${PKG_DIR}/${f}`), POSTFLIGHT_PATH];
for (const relPath of allFiles) {
  if (!exists(relPath)) continue;
  // Strip the embedded $JSON$...$JSON$ payload before comment-stripping/keyword-scanning —
  // verificationNotes free text could in principle contain any of these words as prose,
  // and that must never fail this guard (it isn't SQL).
  let src = read(relPath);
  src = src.replace(/\$JSON\$[\s\S]*?\$JSON\$/g, "$JSON$...$JSON$");
  const codeOnly = stripSqlLineComments(src);
  assert(`no destructive/DDL statement in ${path.basename(relPath)}`, !DESTRUCTIVE_RE.test(codeOnly), relPath);
}

// ---- Each batch is transaction-wrapped ----
batchTexts.forEach((src, i) => {
  const hasBegin = /^\s*BEGIN;\s*$/m.test(src);
  const hasCommit = /^\s*COMMIT;\s*$/m.test(src);
  assert(`${BATCH_FILES[i]} has exactly one BEGIN;`, (src.match(/\bBEGIN;/g) || []).length === 1);
  assert(`${BATCH_FILES[i]} has exactly one COMMIT;`, (src.match(/\bCOMMIT;/g) || []).length === 1);
  assert(`${BATCH_FILES[i]} BEGIN precedes COMMIT`, hasBegin && hasCommit && src.indexOf("BEGIN;") < src.lastIndexOf("COMMIT;"));
});

// ---- Preflight / postflight are read-only ----
const WRITE_RE = /\b(INSERT\s+INTO|UPDATE\s+public|UPSERT)\b/i;
if (exists(PREFLIGHT_PATH)) {
  assert("00-preflight.sql contains no write statements", !WRITE_RE.test(read(PREFLIGHT_PATH)));
  assert("00-preflight.sql contains no BEGIN/COMMIT transaction (pure read-only)", !/\bBEGIN;|\bCOMMIT;/.test(read(PREFLIGHT_PATH)));
}
if (exists(POSTFLIGHT_PATH)) {
  assert("99-postflight.sql contains no write statements", !WRITE_RE.test(read(POSTFLIGHT_PATH)));
  assert("99-postflight.sql contains no BEGIN/COMMIT transaction (pure read-only)", !/\bBEGIN;|\bCOMMIT;/.test(read(POSTFLIGHT_PATH)));
}

// ---- No literal unsupported legacy 211 number anywhere in the writable batches ----
const combinedBatchSql = batchTexts.join("\n");
assert("no batch file contains the stale 800-436-9997 number", !combinedBatchSql.includes("800-436-9997"));

// ---- Critical correction strings, checked against the parsed payload data (not raw text —
// more precise than a substring scan, since we have real record objects here) ----
const byCandidateId = new Map(allBatchRecords.map((r) => [r.candidateId, r]));

const nextDoor = byCandidateId.get("next-door-solutions");
assert("Next Door Solutions record present in batches", Boolean(nextDoor));
if (nextDoor) {
  assert(
    "Next Door Solutions uses https://www.nextdoorsolutions.org/",
    nextDoor.websiteUrl === "https://www.nextdoorsolutions.org/" || nextDoor.officialSourceUrl === "https://www.nextdoorsolutions.org/"
  );
}

const crisisTextLine = byCandidateId.get("crisis-text-line");
assert("Crisis Text Line record present in batches", Boolean(crisisTextLine));
if (crisisTextLine) {
  const sms = crisisTextLine.sms || "";
  assert("Crisis Text Line sms field includes 741741", sms.includes("741741"));
  assert("Crisis Text Line sms field includes HOME", /\bHOME\b/.test(sms));
  assert("Crisis Text Line sms field does not promote BAY as the current instruction", !/\bBAY\b/i.test(sms));
}

const aaci = byCandidateId.get("asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home");
assert("AACI Asian Women's Home record present in batches", Boolean(aaci));
if (aaci) {
  assert("AACI Asian Women's Home addressHandling is withheld_for_safety", aaci.addressHandling === "withheld_for_safety");
  const addrBlob = JSON.stringify({ l1: aaci.addressLine1, l2: aaci.addressLine2, city: aaci.addressCity });
  assert("AACI Asian Women's Home does not expose the confidential Story Rd shelter address", !/story\s*rd/i.test(addrBlob));
}

const aacsa = byCandidateId.get("asian-american-community-service-agency");
assert("AACSA record present in batches", Boolean(aacsa));
if (aacsa) {
  assert("AACSA organizationName is the corrected African American Community Service Agency", /African American Community Service Agency/i.test(aacsa.organizationName));
}

const schoolHealthClinics = byCandidateId.get("goodwill-of-silicon-valley-school-health-clinics-wellness-center");
assert("School Health Clinics record present in batches", Boolean(schoolHealthClinics));
if (schoolHealthClinics) {
  assert(
    "School Health Clinics organizationName is independent of Goodwill",
    /School Health Clinics of Santa Clara County/i.test(schoolHealthClinics.organizationName) && !/goodwill/i.test(schoolHealthClinics.organizationName)
  );
}

const casa = byCandidateId.get("court-appointed-special-advocates-casa-of-silicon-valley");
assert("CASA record present in batches", Boolean(casa));
if (casa) {
  assert("CASA organizationName reflects the current Child Advocates of Silicon Valley identity", /Child Advocates of Silicon Valley/i.test(casa.organizationName));
}

// ---- README sanity ----
if (exists(README_PATH)) {
  const readme = read(README_PATH);
  assert("README documents idempotency", /[Ii]dempoten/.test(readme));
  assert("README documents the legacy-slug fallback", /legacy[\s/-]*slug/i.test(readme));
  assert("README documents the byte-size gate", /60 KB|60KB/i.test(readme));
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
