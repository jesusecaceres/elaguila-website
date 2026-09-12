/**
 * Final Stacked Closeout — Stack C: cross-artifact contradiction scanner.
 *
 * No existing tool cross-checks CURRENT-STATE claims across the certification doc, the evidence
 * manifest, the normalization artifact, and real source in one pass -- gate10-9's reconciliation
 * verifier only does canonical-MD<->manifest bijection, and gate10-8b's mechanism verifier only checks
 * the 31 mechanisms. This is the one genuinely new tool Stack C needs; it does NOT re-derive any
 * conclusion those tools already prove, it only checks that current-state claims made ABOUT them are
 * mutually consistent and that no dead reference / placeholder evidence / false-positive proof pattern
 * has crept in across all 612 rows (not just the ones spot-checked in earlier gates).
 *
 * Modes:
 *   npx tsx scripts/gate-final-contradiction-scan.ts             -- full artifact-consistency scan
 *   npx tsx scripts/gate-final-contradiction-scan.ts --doc-section "FINAL MASTER MD TECHNICAL CERTIFICATION"
 *       -- additionally extracts asserted numbers from that doc section and diffs them against live
 *          artifacts (used for Stack F3's self-contradiction check on the new final section).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const DOC_PATH = join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_FORENSIC_CERTIFICATION.md");
const manifest = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json"), "utf8"));
const norm: any[] = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_RAW_TO_ATOMIC_NORMALIZATION.json"), "utf8"));
const doc = readFileSync(DOC_PATH, "utf8");

const reqs: any[] = manifest.requirements;
const ownerReqs: any[] = manifest.ownerMetaRequirements;
const mechanisms: any[] = manifest.mechanisms;

let failures = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) console.log(`  PASS  ${name}`);
  else { console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); failures++; }
}

console.log("Final Closeout — Stack C: Cross-Artifact Contradiction Scanner\n");

// -------------------------------------------------------------------------------------------
// 1-4: live counts, computed directly (these are the truth other checks below diff against).
// -------------------------------------------------------------------------------------------
const LIVE = {
  rawItems: norm.length,
  atomicReqs: reqs.length,
  ownerMeta: ownerReqs.length,
  mechanisms: mechanisms.length,
  blueprintCategories: reqs.filter((r) => r.mdSection === "14").length,
  acceptanceSteps: reqs.filter((r) => r.mdSection === "33").length,
  industryLetters: new Set(reqs.flatMap((r) => { const m = r.reqId.match(/^REQ-9\.([A-Z])\./); return m ? [m[1]] : []; })).size,
  projectTypes: reqs.filter((r) => r.mdSection === "7").length,
};
console.log("LIVE COUNTS (source of truth):", JSON.stringify(LIVE));

// -------------------------------------------------------------------------------------------
// 5/6: stale "610" appearing outside a historical (already-superseded) gate section. Every
// occurrence must be inside a gate section that itself is EARLIER than the gate that corrected it
// (Gate 10.9), never inside a "current state"/"final" claim.
// -------------------------------------------------------------------------------------------
const sixTenMatches = [...doc.matchAll(/\b610\b/g)];
const gate109Header = /^#\s+Gate 10\.9\b/m.exec(doc);
const correctionBoundaryIdx = gate109Header ? gate109Header.index! : doc.length;
const badSixTen: string[] = [];
for (const m of sixTenMatches) {
  const idx = m.index!;
  if (idx < correctionBoundaryIdx) continue; // inside a pre-10.9 gate section -- legitimately historical
  // On/after the 10.9 correction: only acceptable if the surrounding text is explicitly explaining the
  // 610->612 correction itself (self-referential fix narrative), never a bare standalone current claim.
  const window = doc.slice(Math.max(0, idx - 120), idx + 60);
  if (!/612|correct|raising|honest/i.test(window)) badSixTen.push(`index ${idx}: "${window.replace(/\s+/g, " ").trim()}"`);
}
check("Every literal '610' in the doc is either inside a pre-Gate-10.9 historical section, or explicitly part of the 610->612 correction narrative", badSixTen.length === 0, badSixTen.slice(0, 10).join(" | "));

// -------------------------------------------------------------------------------------------
// 7: no bare current "NOT_PROVEN"/"FAILED" count language contradicts the live 0/0/0.
// -------------------------------------------------------------------------------------------
const notProvenLive = reqs.filter((r) => r.status === "NOT_PROVEN").length;
const failedLive = reqs.filter((r) => r.status === "FAILED").length;
const deferLive = reqs.filter((r) => r.status === "TRUE_SAFE_DEFER").length;
check("Live NOT_PROVEN=0, FAILED=0, TRUE_SAFE_DEFER=0", notProvenLive === 0 && failedLive === 0 && deferLive === 0, `${notProvenLive}/${failedLive}/${deferLive}`);

// -------------------------------------------------------------------------------------------
// 8/9/10: project-type / Blueprint / acceptance counts match the canonical minimums.
// -------------------------------------------------------------------------------------------
check("§7 project types >= 16 named types (+ multi-project cross-ref row)", LIVE.projectTypes >= 16, `got ${LIVE.projectTypes}`);
check("Blueprint categories = 47", LIVE.blueprintCategories === 47, `got ${LIVE.blueprintCategories}`);
check("§33 acceptance steps = 25", LIVE.acceptanceSteps === 25, `got ${LIVE.acceptanceSteps}`);
check("§9 industry branches >= 6 (Restaurant/Fitness/Radio-Media/Church/Professional/Home-Local)", LIVE.industryLetters >= 6, `got ${LIVE.industryLetters}`);

// -------------------------------------------------------------------------------------------
// 11: current git HEAD sanity (informational -- can't assert a specific SHA generically here).
// -------------------------------------------------------------------------------------------
console.log(`  INFO  Current git HEAD should be cross-checked against the doc's asserted "Start HEAD"/final SHA manually at commit time (not derivable from artifacts alone).`);

// -------------------------------------------------------------------------------------------
// 12/13: dead file references. Any manifest row (or mechanism) citing a real repo-relative
// file path must have that file actually exist. Bare identifiers/prose citations are not checked
// here (that's the placeholder-evidence scan below); this specifically targets FILE PATHS.
// -------------------------------------------------------------------------------------------
const filePathRe = /`([\w./-]+\.tsx?)`/g;
const deadFileRefs: string[] = [];
function checkCitationsForDeadFiles(citations: string[], ownerLabel: string) {
  for (const c of citations ?? []) {
    for (const m of c.matchAll(filePathRe)) {
      const rel = m[1];
      if (!rel.includes("/")) continue; // bare filename mentions (e.g. `foo.ts`) aren't resolvable paths
      const abs = join(ROOT, rel);
      if (!existsSync(abs)) deadFileRefs.push(`${ownerLabel}: ${rel}`);
    }
  }
}
for (const r of reqs) checkCitationsForDeadFiles(r.sourceFiles, r.reqId);
for (const mech of mechanisms) {
  for (const s of mech.source ?? []) {
    if (!existsSync(join(ROOT, s))) deadFileRefs.push(`${mech.mechanismId} (source): ${s}`);
  }
}
check("No manifest row or mechanism cites a repo-relative file path that doesn't exist", deadFileRefs.length === 0, deadFileRefs.slice(0, 15).join("; "));

// -------------------------------------------------------------------------------------------
// 14: placeholder/self-referential evidence, scanned across ALL 612 rows (not just a sample).
// -------------------------------------------------------------------------------------------
const BANNED = /covered by existing tests|same as above|see prior gate(?!'s own)|verified previously|see above(?! -- also)/i;
const placeholderRows = reqs.filter((r) => (r.sourceFiles ?? []).some((s: string) => BANNED.test(s)));
check("No manifest row (of all 612) uses a banned placeholder/self-referential evidence phrase", placeholderRows.length === 0, placeholderRows.map((r) => r.reqId).join(", "));

// -------------------------------------------------------------------------------------------
// 15: evidence-class/mechanism-capability mismatch -- reuses the exact rule already enforced by
// gate10-8-verify-evidence-manifest.ts (re-run here so this scanner is a complete single entry
// point, not because the logic itself is new).
// -------------------------------------------------------------------------------------------
let misboundClasses: string[] = [];
for (const r of reqs) {
  const needsStrongEvidence = (r.requirementClasses ?? []).some((c: string) => ["PERSISTENCE", "LIFECYCLE_TRANSITION", "AUTHORIZATION", "CROSS_BUSINESS_ISOLATION"].includes(c));
  if (!needsStrongEvidence) continue;
  const boundMechs = mechanisms.filter((m) => r.mechanismIds.includes(m.mechanismId));
  const allDefinitionalOnly = boundMechs.length > 0 && boundMechs.every((m) => !m.persistenceObject && !m.authGuard && !m.negativeTest);
  if (allDefinitionalOnly) misboundClasses.push(r.reqId);
}
check("No PERSISTENCE/LIFECYCLE/AUTH/CROSS-BUSINESS row is bound only to a definitional mechanism", misboundClasses.length === 0, misboundClasses.join(", "));

// -------------------------------------------------------------------------------------------
// Optional doc-section self-check (Stack F3): diff a specific section's asserted numbers against
// LIVE counts computed above.
// -------------------------------------------------------------------------------------------
const sectionFlagIdx = process.argv.indexOf("--doc-section");
if (sectionFlagIdx !== -1) {
  const title = process.argv[sectionFlagIdx + 1];
  const headerRe = new RegExp(`^#\\s+${title.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*$`, "m");
  const startMatch = headerRe.exec(doc);
  check(`Doc section "${title}" exists`, !!startMatch);
  if (startMatch) {
    const sectionText = doc.slice(startMatch.index, startMatch.index + 8000);
    function assertNumberMatches(label: string, regex: RegExp, expected: number) {
      const m = regex.exec(sectionText);
      if (!m) { check(`Section asserts ${label}`, false, "not found in section text"); return; }
      const val = Number(m[1]);
      check(`Section's ${label} (${val}) matches live count (${expected})`, val === expected, `doc says ${val}, live is ${expected}`);
    }
    assertNumberMatches("RAW_CANONICAL_ITEMS", /RAW[ _]CANONICAL[ _]ITEMS[:\s]+(\d+)/i, LIVE.rawItems);
    assertNumberMatches("FINAL_ATOMIC_MD_REQUIREMENTS", /(?:FINAL[ _])?ATOMIC[ _](?:MD[ _])?REQUIREMENTS[:\s]+(\d+)/i, LIVE.atomicReqs);
    assertNumberMatches("OWNER_META", /OWNER[ _]META(?:[ _]ROWS)?[:\s]+(\d+)/i, LIVE.ownerMeta);
    assertNumberMatches("MECHANISMS", /MECHANISMS[:\s]+(\d+)/i, LIVE.mechanisms);
  }
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASS — NO CONTRADICTIONS FOUND" : `${failures} CHECK(S) FAILED`}`);
if (failures > 0) process.exit(1);
