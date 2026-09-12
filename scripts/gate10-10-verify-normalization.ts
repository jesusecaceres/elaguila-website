/**
 * Client Discovery & Project Blueprint Engine, Gate 10.10 — normalization verifier.
 *
 * Fails (non-zero exit) unless the raw-canonical-item -> atomic-requirement normalization is
 * complete, arithmetically exact, and every atomic requirement has an explicit canonical basis.
 * Re-runnable at any time: `npx tsx scripts/gate10-10-verify-normalization.ts`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const extraction = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "GATE_10_9_CANONICAL_EXTRACTION.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json"), "utf8"));
const norm: any[] = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_RAW_TO_ATOMIC_NORMALIZATION.json"), "utf8"));

const reqs: any[] = manifest.requirements;
const ownerReqs: any[] = manifest.ownerMetaRequirements;
const reqIds = new Set(reqs.map((r) => r.reqId));
const ownerReqIds = new Set(ownerReqs.map((r) => r.reqId));

let failures = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) console.log(`  PASS  ${name}`);
  else { console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); failures++; }
}

console.log("Gate 10.10 — Raw Canonical Item -> Atomic Requirement Normalization Verifier\n");

// 1. Raw item count matches extraction.
const RAW_TOTAL = extraction.bullets.length;
check(`Normalization row count matches extraction (${RAW_TOTAL})`, norm.length === RAW_TOTAL, `norm=${norm.length} extraction=${RAW_TOTAL}`);

// 2. Every raw item has exactly one disposition, non-empty.
const VALID_DISPOSITIONS = new Set(["ATOMIC_REQUIREMENT", "CHILD_OF_ATOMIC_REQUIREMENT", "EXAMPLE_OR_OPTION", "NARRATIVE_CONTEXT", "DUPLICATE_RESTATEMENT", "HEADING_OR_LABEL", "QUOTE_OR_OUTCOME_STATEMENT", "SYNTHESIZED_WITH_SIBLING", "NON_BEHAVIORAL_DECORATIVE"]);
const missingDisposition = norm.filter((r) => !r.disposition || r.disposition === "UNRESOLVED" || !VALID_DISPOSITIONS.has(r.disposition));
check("Every raw item has exactly one valid, non-UNRESOLVED disposition", missingDisposition.length === 0, missingDisposition.map((r) => r.rawId).join(", "));

// 3. Every raw item has a non-empty reason.
const missingReason = norm.filter((r) => !r.reason || r.reason.trim().length < 5);
check("Every raw item has a non-empty explanatory reason", missingReason.length === 0, missingReason.map((r) => r.rawId).join(", "));

// 4. Disposition counts sum exactly to raw total.
const byDisposition = new Map<string, number>();
for (const r of norm) byDisposition.set(r.disposition, (byDisposition.get(r.disposition) ?? 0) + 1);
const sumDispositions = [...byDisposition.values()].reduce((a, b) => a + b, 0);
check(`Disposition counts sum exactly to RAW_TOTAL (${RAW_TOTAL})`, sumDispositions === RAW_TOTAL, `sum=${sumDispositions}`);

// 5. Every ATOMIC_REQUIREMENT/CHILD_OF/EXAMPLE_OR_OPTION/DUPLICATE_RESTATEMENT/SYNTHESIZED_WITH_SIBLING
//    row cites at least one atomicReqId, and every cited reqId exists in the manifest (never an
//    owner-meta id -- owner-meta must stay fully separate from the canonical MD count).
const REQUIRES_ATOMIC_IDS = new Set(["ATOMIC_REQUIREMENT", "CHILD_OF_ATOMIC_REQUIREMENT", "EXAMPLE_OR_OPTION", "DUPLICATE_RESTATEMENT", "SYNTHESIZED_WITH_SIBLING"]);
const missingIds = norm.filter((r) => REQUIRES_ATOMIC_IDS.has(r.disposition) && (!r.atomicReqIds || r.atomicReqIds.length === 0));
check("Every disposition that claims an atomic basis cites at least one atomicReqId", missingIds.length === 0, missingIds.map((r) => r.rawId).join(", "));

const unknownIds = norm.flatMap((r) => r.atomicReqIds ?? []).filter((id: string) => !reqIds.has(id));
check("Every cited atomicReqId exists in the evidence manifest", unknownIds.length === 0, [...new Set(unknownIds)].join(", "));

const ownerMetaCited = norm.flatMap((r) => r.atomicReqIds ?? []).filter((id: string) => ownerReqIds.has(id));
check("No raw item cites an owner-meta reqId (owner-meta stays fully separate)", ownerMetaCited.length === 0, [...new Set(ownerMetaCited)].join(", "));

// 6. Reverse map: every one of the 612 atomic reqIds must be cited by at least one raw item.
const citedReqIds = new Set(norm.flatMap((r) => r.atomicReqIds ?? []));
const ATOMIC_REQ_TOTAL = reqs.length;
const withSource = reqs.filter((r) => citedReqIds.has(r.reqId));
const withoutSource = reqs.filter((r) => !citedReqIds.has(r.reqId));
check(`Every atomic requirement has a canonical raw source (${withSource.length}/${ATOMIC_REQ_TOTAL})`, withoutSource.length === 0, withoutSource.map((r) => r.reqId).join(", "));

// 7. Final atomic count matches the evidence manifest's own count (no drift between artifacts).
check(`Normalization's atomic-req universe matches evidence manifest count (${ATOMIC_REQ_TOTAL})`, citedReqIds.size <= ATOMIC_REQ_TOTAL && withoutSource.length === 0, `distinct cited=${citedReqIds.size} manifest=${ATOMIC_REQ_TOTAL}`);

// 8. No duplicate MD reqId in the manifest itself (cross-check against gate10-8's own guarantee).
const idCounts = new Map<string, number>();
for (const r of reqs) idCounts.set(r.reqId, (idCounts.get(r.reqId) ?? 0) + 1);
const dupes = [...idCounts.entries()].filter(([, n]) => n > 1);
check("No duplicate atomic reqId exists in the evidence manifest", dupes.length === 0, dupes.map(([id]) => id).join(", "));

// 9. SYNTHESIZED_WITH_SIBLING rows must carry sibling raw ids (proving the consolidation group is
//    real and traceable, not a lone unexplained synthesis).
const synthWithoutSiblings = norm.filter((r) => r.disposition === "SYNTHESIZED_WITH_SIBLING" && (!r.siblingRawIds || r.siblingRawIds.length === 0));
check("Every SYNTHESIZED_WITH_SIBLING row lists at least one sibling rawId", synthWithoutSiblings.length === 0, synthWithoutSiblings.map((r) => r.rawId).join(", "));

// 10. NON_BEHAVIORAL_DECORATIVE / DUPLICATE_RESTATEMENT rows citing zero technical obligation must
//     not silently hide independently-testable content: reject any decorative row whose raw text is
//     suspiciously long (a real heuristic guard against mis-classifying real content as decorative).
// Strip the leading [TAG] and any trailing "(Gate 10.x finding: ...)" self-annotation before measuring
// length -- those are this gate's own documentation notes, not real MD content, and would otherwise
// make a genuinely short decorative line (e.g. "Que ruja el leon.") look suspiciously long.
const suspiciousDecorative = norm.filter((r) => r.disposition === "NON_BEHAVIORAL_DECORATIVE" && r.rawText.replace(/^\[[A-Z]+\]\s*/, "").replace(/\s*\(Gate 10\.\d+[^)]*\)\.?$/, "").length > 80);
check("No NON_BEHAVIORAL_DECORATIVE row is suspiciously long (possible hidden real content)", suspiciousDecorative.length === 0, suspiciousDecorative.map((r) => r.rawId).join(", "));

console.log(`\nCARDINALITY ACCOUNTING`);
console.log(`RAW_TOTAL = ${RAW_TOTAL}`);
for (const [d, c] of [...byDisposition.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${d}: ${c}`);
console.log(`SUM = ${sumDispositions}`);
console.log(`RAW_ITEMS_PRODUCING_ATOMIC_REQUIREMENTS = ${norm.filter((r) => REQUIRES_ATOMIC_IDS.has(r.disposition)).length}`);
console.log(`ATOMIC_REQUIREMENTS_PRODUCED = ${ATOMIC_REQ_TOTAL}`);
const multiRawToOne = [...citedReqIds].filter((id) => norm.filter((r) => (r.atomicReqIds ?? []).includes(id)).length > 1).length;
console.log(`MULTI_RAW_TO_ONE_ATOMIC_GROUPS = ${multiRawToOne}`);
const oneRawToMultiple = norm.filter((r) => (r.atomicReqIds ?? []).length > 1).length;
console.log(`ONE_RAW_TO_MULTIPLE_ATOMIC_GROUPS = ${oneRawToMultiple}`);
console.log(`NON_ATOMIC_RAW_ITEMS = ${norm.filter((r) => !REQUIRES_ATOMIC_IDS.has(r.disposition)).length}`);
console.log(`ATOMIC_REQ_TOTAL = ${ATOMIC_REQ_TOTAL}`);
console.log(`ATOMIC_REQ_WITH_RAW_SOURCE = ${withSource.length}`);
console.log(`ATOMIC_REQ_WITHOUT_RAW_SOURCE = ${withoutSource.length}`);

console.log(`\n${failures === 0 ? "ALL CHECKS PASS" : `${failures} CHECK(S) FAILED`}`);
if (failures > 0) process.exit(1);
