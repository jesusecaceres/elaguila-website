/**
 * LEONIX QUICK CLASSIFIEDS — proof-artifact completeness checker (Gate 14 self-audit helper).
 * Run: npx tsx scripts/verify-quick-classifieds-proof-matrix-03.ts
 *
 * Reads docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_FINAL_PROOF_MATRIX.md and enforces the PM rule
 * "EVERY MATERIAL REQUIREMENT → SOURCE → PERSISTENCE/ACTION → CANONICAL DESTINATION → VERIFYING EVIDENCE → STATUS":
 *  - every requirement row has exactly the 23 declared columns;
 *  - STATUS is one of PROVEN / PROVEN_NA / BLOCKED / REPAIR_REQUIRED;
 *  - a PROVEN row cites at least one concrete anchor (a `code` path/function, a verifier tag, a cross-row id,
 *    or a named evidence source) in its evidence columns — never prose only;
 *  - a BLOCKED row carries an explicit classification in NOTES; REPAIR_REQUIRED count must be 0;
 *  - every file path cited in a `code` span that looks like a repository path exists on disk;
 *  - the Totals table matches the counted rows.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MATRIX = "docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_FINAL_PROOF_MATRIX.md";
const src = readFileSync(join(ROOT, MATRIX), "utf8");
const ROW = /^\| [A-Z]{2}(-[A-Z]{3})?-\d{2} \|/;
const STATUSES = new Set(["PROVEN", "PROVEN_NA", "BLOCKED", "REPAIR_REQUIRED"]);
const ANCHOR = /`[^`]+`|\b(V1|V2|GUARDS|EMP4|AUT2|REN3|PREVIEW|BUILD|SB-RO)\b|\b[A-Z]{2}(-[A-Z]{3})?-\d{2}\b/;

const rows = src.split(/\r?\n/).filter((l) => ROW.test(l));
assert.ok(rows.length >= 100, `matrix has requirement rows (${rows.length})`);
const counts: Record<string, number> = {};
const missingPaths: string[] = [];
for (const line of rows) {
  const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const id = cells[0]!;
  assert.equal(cells.length, 23, `${id}: 23 columns`);
  const status = cells[21]!.split(/\s+/)[0]!;
  assert.ok(STATUSES.has(status), `${id}: allowed status (${status})`);
  counts[status] = (counts[status] ?? 0) + 1;
  const evidence = [cells[7], cells[8], cells[9], cells[10], cells[11], cells[12], cells[13], cells[14], cells[15], cells[16], cells[17], cells[18], cells[19], cells[20]].join(" ");
  if (status === "PROVEN" || status === "PROVEN_NA") {
    assert.ok(ANCHOR.test(evidence), `${id}: PROVEN row cites a concrete anchor (path / function / verifier / cross-row), not prose only`);
  }
  if (status === "BLOCKED") {
    assert.ok(/NOT_SUPPORTED_BY_CURRENT_CLASSIFIED_CUSTODY|OUT_OF_SCOPE_EXISTING_DEFECT|SHARED_CANONICAL_DEFECT_THAT_THREATENS_TIER1|TIER1_REGRESSION/.test(cells[22]!), `${id}: BLOCKED row carries an explicit classification`);
  }
  for (const m of line.matchAll(/`((?:app|scripts|docs|supabase)\/[^`:*\s]+?\.(?:tsx?|mjs|md|json))`/g)) {
    if (!existsSync(join(ROOT, m[1]!))) missingPaths.push(`${id}: ${m[1]}`);
  }
}
assert.deepEqual(missingPaths, [], `every cited repository path exists: ${missingPaths.join("; ")}`);
assert.equal(counts.REPAIR_REQUIRED ?? 0, 0, "REPAIR_REQUIRED count is 0");

const totals = src.match(/## 12\. Totals[\s\S]*$/)?.[0] ?? "";
const num = (label: string) => Number((totals.match(new RegExp(`\\| ${label} \\| (\\d+)`)) ?? [])[1] ?? NaN);
assert.equal(num("PROVEN"), counts.PROVEN ?? 0, "Totals: PROVEN matches rows");
assert.equal(num("PROVEN_NA"), counts.PROVEN_NA ?? 0, "Totals: PROVEN_NA matches rows");
assert.equal(num("BLOCKED"), counts.BLOCKED ?? 0, "Totals: BLOCKED matches rows");
assert.equal(num("REPAIR_REQUIRED"), counts.REPAIR_REQUIRED ?? 0, "Totals: REPAIR_REQUIRED matches rows");
assert.equal(Number((totals.match(/\*\*Total requirements\*\* \| \*\*(\d+)\*\*/) ?? [])[1]), rows.length, "Totals: total matches rows");

console.log(`verify-quick-classifieds-proof-matrix-03: OK (${rows.length} rows: ${JSON.stringify(counts)})`);
