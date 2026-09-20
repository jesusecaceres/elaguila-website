/**
 * LEONIX QUICK BUSINESS — proof-artifact completeness checker (integration gate self-audit helper).
 * Run: npx tsx scripts/verify-quick-business-proof-matrix-02.ts
 *
 * Reads docs/quick-business/LEONIX_QUICK_BUSINESS_FINAL_PROOF_MATRIX.md and enforces the PM rule
 * "REQUIREMENT → SOURCE → USER STATE → PERSISTENCE/ACTION → CANONICAL DESTINATION → VERIFYING EVIDENCE → STATUS":
 *  - every requirement row has exactly the 24 declared columns and a unique id;
 *  - STATUS is one of PROVEN / PROVEN_NA / BLOCKED / REPAIR_REQUIRED;
 *  - a PROVEN / PROVEN_NA row cites at least one concrete anchor (a `code` path/function, a verifier tag, a
 *    cross-row id or a named evidence source) in its evidence columns — never prose only;
 *  - a BLOCKED row carries an explicit classification in NOTES; REPAIR_REQUIRED must be 0;
 *  - every repository path cited in a `code` span exists on disk;
 *  - all four active categories (Servicios, Restaurantes, Autos Dealer, Bienes) are represented;
 *  - the Totals table matches the counted rows and the required-blocker count is computed, not typed;
 *  - the detector is SELF-TESTED against malformed rows (wrong column count, bad status, prose-only proof).
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MATRIX = "docs/quick-business/LEONIX_QUICK_BUSINESS_FINAL_PROOF_MATRIX.md";
const COLUMNS = 24;
const ROW = /^\| [A-Z]{2}-\d{2} \|/;
const STATUSES = new Set(["PROVEN", "PROVEN_NA", "BLOCKED", "REPAIR_REQUIRED"]);
const ANCHOR = /`[^`]+`|\b(QB1|QB2|V1|V2|V3|GUARDS|TSC|BUILD|PREVIEW|ROUTES|DRIFT|DEALER-V|BIENES-V|SERV-V|REST-V|REV-V)\b|\b[A-Z]{2}-\d{2}\b/;
const BLOCKED_CLASS = /NOT_SUPPORTED_BY_CURRENT_CATEGORY_CUSTODY|OUT_OF_SCOPE_EXISTING_DEFECT|FUTURE_OWNER_DECISION/;
const REQUIRED_CATEGORIES: Array<[string, RegExp]> = [
  ["Servicios", /^SV-/],
  ["Restaurantes", /^RS-/],
  ["Autos Dealer", /^AD-/],
  ["Bienes", /^BN-/],
];

type Row = { id: string; cells: string[]; status: string; line: string };

export function parseRows(src: string): Row[] {
  return src
    .split(/\r?\n/)
    .filter((l) => ROW.test(l))
    .map((line) => {
      const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      return { id: cells[0]!, cells, status: (cells[COLUMNS - 2] ?? "").split(/\s+/)[0]!, line };
    });
}

export function checkRow(r: Row): string[] {
  const problems: string[] = [];
  if (r.cells.length !== COLUMNS) problems.push(`${r.id}: ${r.cells.length} columns (expected ${COLUMNS})`);
  if (!STATUSES.has(r.status)) problems.push(`${r.id}: status "${r.status}" not allowed`);
  const evidence = r.cells.slice(4, COLUMNS - 2).join(" ");
  if ((r.status === "PROVEN" || r.status === "PROVEN_NA") && !ANCHOR.test(evidence)) problems.push(`${r.id}: PROVEN row cites no concrete anchor`);
  if (r.status === "BLOCKED" && !BLOCKED_CLASS.test(r.cells[COLUMNS - 1] ?? "")) problems.push(`${r.id}: BLOCKED row lacks an explicit classification`);
  return problems;
}

/** A BLOCKED row is a REQUIRED blocker unless its NOTES classify it as outside the current customer promise. */
export function isRequiredBlocker(r: Row): boolean {
  return r.status === "BLOCKED" && !/NOT_SUPPORTED_BY_CURRENT_CATEGORY_CUSTODY|FUTURE_OWNER_DECISION/.test(r.cells[COLUMNS - 1] ?? "");
}

// --- detector self-test (malformed rows must be caught) -------------------------------------------------------
{
  const good = `| XX-01 | ${Array(COLUMNS - 4).fill("x").join(" | ")} | \`app/lib/quickBusiness/quickBusinessRegistry.ts\` | PROVEN | ok |`;
  const shortRow = `| XX-02 | a | b | PROVEN | n |`;
  const badStatus = `| XX-03 | ${Array(COLUMNS - 4).fill("x").join(" | ")} | \`app/x.ts\` | VERIFIED | n |`;
  const proseOnly = `| XX-04 | ${Array(COLUMNS - 4).fill("prose").join(" | ")} | it works | PROVEN | n |`;
  const blockedNoClass = `| XX-05 | ${Array(COLUMNS - 4).fill("x").join(" | ")} | \`app/x.ts\` | BLOCKED | later |`;
  const rows = parseRows([good, shortRow, badStatus, proseOnly, blockedNoClass].join("\n"));
  assert.equal(rows.length, 5, "self-test: five synthetic rows parsed");
  assert.deepEqual(checkRow(rows[0]!), [], "self-test: well-formed row passes");
  assert.ok(checkRow(rows[1]!).some((p) => /columns/.test(p)), "self-test: wrong column count is caught");
  assert.ok(checkRow(rows[2]!).some((p) => /not allowed/.test(p)), "self-test: bad status is caught");
  assert.ok(checkRow(rows[3]!).some((p) => /no concrete anchor/.test(p)), "self-test: prose-only proof is caught");
  assert.ok(checkRow(rows[4]!).some((p) => /classification/.test(p)), "self-test: unclassified BLOCKED row is caught");
  assert.ok(isRequiredBlocker(rows[4]!), "self-test: unclassified BLOCKED counts as a required blocker");
}

// --- real artifact ---------------------------------------------------------------------------------------------
const src = readFileSync(join(ROOT, MATRIX), "utf8");
const header = src.split(/\r?\n/).find((l) => /^\| REQUIREMENT ID \|/.test(l));
assert.ok(header, "matrix declares the REQUIREMENT ID header row");
assert.equal(header!.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").length, COLUMNS, "header declares the 24 columns");
const rows = parseRows(src);
assert.ok(rows.length >= 90, `matrix has requirement rows (${rows.length})`);
const ids = new Set<string>();
const problems: string[] = [];
const missingPaths: string[] = [];
const counts: Record<string, number> = {};
let requiredBlockers = 0;
for (const r of rows) {
  assert.ok(!ids.has(r.id), `${r.id}: unique requirement id`);
  ids.add(r.id);
  problems.push(...checkRow(r));
  counts[r.status] = (counts[r.status] ?? 0) + 1;
  if (isRequiredBlocker(r)) requiredBlockers += 1;
  for (const m of r.line.matchAll(/`((?:app|scripts|docs|supabase)\/[^`:*\s]+?\.(?:tsx?|mjs|md|json))`/g)) {
    if (!existsSync(join(ROOT, m[1]!))) missingPaths.push(`${r.id}: ${m[1]}`);
  }
}
assert.deepEqual(problems, [], `every row is well-formed: ${problems.join("; ")}`);
assert.deepEqual(missingPaths, [], `every cited repository path exists: ${missingPaths.join("; ")}`);
for (const [label, re] of REQUIRED_CATEGORIES) assert.ok(rows.some((r) => re.test(r.id)), `${label} is represented`);
assert.equal(counts.REPAIR_REQUIRED ?? 0, 0, "REPAIR_REQUIRED count is 0");
assert.equal(requiredBlockers, 0, "required blocker count is 0");

const totals = src.match(/## \d+\. Totals[\s\S]*$/)?.[0] ?? "";
const num = (label: string) => Number((totals.match(new RegExp(`\\| ${label} \\| (\\d+)`)) ?? [])[1] ?? NaN);
assert.equal(num("PROVEN"), counts.PROVEN ?? 0, "Totals: PROVEN matches rows");
assert.equal(num("PROVEN_NA"), counts.PROVEN_NA ?? 0, "Totals: PROVEN_NA matches rows");
assert.equal(num("BLOCKED"), counts.BLOCKED ?? 0, "Totals: BLOCKED matches rows");
assert.equal(num("REPAIR_REQUIRED"), counts.REPAIR_REQUIRED ?? 0, "Totals: REPAIR_REQUIRED matches rows");
assert.equal(num("REQUIRED BLOCKERS"), requiredBlockers, "Totals: REQUIRED BLOCKERS matches the computed count");
assert.equal(Number((totals.match(/\*\*Total requirements\*\* \| \*\*(\d+)\*\*/) ?? [])[1]), rows.length, "Totals: total matches rows");

console.log(`verify-quick-business-proof-matrix-02: OK (${rows.length} rows: ${JSON.stringify(counts)}, required blockers ${requiredBlockers})`);
