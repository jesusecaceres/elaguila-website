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

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const READY_PATH = "data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json";
const NEEDS_REVIEW_PATH = "data/recursos/verified/scc-community-resource-guide-2023-needs-review.json";
const DROPPED_PATH = "data/recursos/verified/scc-community-resource-guide-2023-dropped.json";
const CANDIDATES_PATH = "data/recursos/candidates/scc-community-resource-guide-2023.json";
const PKG_DIR = "data/recursos/verified/certification-import";

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

// The immutable candidate JSON's known-good sha256 as of the finalized research manifest
// commit (871afbd5) — this build's baseline. Any change to this hash means the file was
// touched, which this build is explicitly forbidden from doing.
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

// ---- Extract candidateId markers + per-batch structure from SQL ----
const batchTexts = BATCH_FILES.map((f) => (exists(`${PKG_DIR}/${f}`) ? read(`${PKG_DIR}/${f}`) : ""));
const CANDIDATE_MARKER = /-- candidateId:\s*([a-z0-9-]+)\s*\|/g;

const batchIdLists = batchTexts.map((src) => {
  const ids = [];
  let m;
  const re = new RegExp(CANDIDATE_MARKER);
  while ((m = re.exec(src))) ids.push(m[1]);
  return ids;
});

batchIdLists.forEach((ids, i) => {
  assert(`batch ${i + 1} (${BATCH_FILES[i]}) has ${EXPECTED_BATCH_SIZES[i]} records`, ids.length === EXPECTED_BATCH_SIZES[i], ids.length);
});

const allBatchIds = batchIdLists.flat();
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

// ---- Destructive / DDL guard across the whole package (comments stripped — this build's
// own doc comments legitimately mention "No DELETE / TRUNCATE / DROP / ALTER") ----
function stripSqlLineComments(src) {
  return src
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}
const DESTRUCTIVE_RE = /\b(DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE|CREATE\s+TABLE|CREATE\s+INDEX|CREATE\s+POLICY|GRANT\s|REVOKE\s)\b/i;
const allFiles = [PREFLIGHT_PATH, ...BATCH_FILES.map((f) => `${PKG_DIR}/${f}`), POSTFLIGHT_PATH];
for (const relPath of allFiles) {
  if (!exists(relPath)) continue;
  const codeOnly = stripSqlLineComments(read(relPath));
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

// ---- Preflight / postflight are read-only (no INSERT/UPDATE inside them) ----
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

// ---- Critical correction strings represented correctly ----
assert("Next Door Solutions batch uses nextdoorsolutions.org", combinedBatchSql.includes("nextdoorsolutions.org"));
assert("Next Door Solutions batch does not use the bare nextdoor.org domain as its website/source", !/'https?:\/\/(www\.)?nextdoor\.org\/?'/i.test(combinedBatchSql));

// Split into per-record blocks on the record-header divider (each block starts with its own
// "-- ----" divider immediately followed by "-- candidateId: ..."), so a lazy match against
// the block's OWN trailing divider (two lines below the header) can't truncate the block.
const recordBlocks = combinedBatchSql.split(/(?=-- -{10,}\n-- candidateId:)/);
const crisisBlock = recordBlocks.find((b) => b.startsWith("-- ") && /-- candidateId: crisis-text-line\s*\|/.test(b));
assert("Crisis Text Line block found in batches", Boolean(crisisBlock));
if (crisisBlock) {
  assert("Crisis Text Line block includes 741741", crisisBlock.includes("741741"));
  assert("Crisis Text Line block includes HOME", /\bHOME\b/.test(crisisBlock));
  const smsFieldMatch = crisisBlock.match(/'Text[^']*741741[^']*'/i);
  assert(
    "Crisis Text Line SMS value does not promote BAY as the current instruction",
    Boolean(smsFieldMatch) && !/\bBAY\b/i.test(smsFieldMatch[0])
  );
}

assert("AACSA identity correction present (African American Community Service Agency)", combinedBatchSql.includes("African American Community Service Agency"));
assert("School Health Clinics independence correction present", combinedBatchSql.includes("School Health Clinics of Santa Clara County"));
assert("Child Advocates / CASA rename present", combinedBatchSql.includes("Child Advocates of Silicon Valley"));

// ---- README sanity ----
if (exists(README_PATH)) {
  const readme = read(README_PATH);
  assert("README documents idempotency", /[Ii]dempoten/.test(readme));
  assert("README documents the legacy-slug fallback", /legacy slug/i.test(readme));
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
