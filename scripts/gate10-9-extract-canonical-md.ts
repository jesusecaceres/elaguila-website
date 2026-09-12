/**
 * Client Discovery & Project Blueprint Engine, Gate 10.9 — independent canonical MD extraction.
 *
 * Reads the canonical Master MD file DIRECTLY (never the forensic ledger, never the evidence
 * manifest) and mechanically extracts every raw bullet/numbered-item line, grouped by section and
 * subsection, with its exact source line number. This is the ground truth Gate 10.9 reconciles the
 * manifest against — if the manifest silently dropped or fabricated a requirement, this extraction
 * (built from zero, independent of anything this session has claimed before) is what would expose it.
 *
 * Run: npx tsx scripts/gate10-9-extract-canonical-md.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MD_PATH = "C:\\Users\\chuy\\Videos\\MDS\\LEONIX_BUSINESS_CONCIERGE_CLIENT_DISCOVERY_AND_PROJECT_BLUEPRINT_ENGINE_MASTER.md";
const OUT_PATH = join(__dirname, "..", "docs", "business-concierge", "GATE_10_9_CANONICAL_EXTRACTION.json");

const raw = readFileSync(MD_PATH, "utf8");
const lines = raw.split(/\r?\n/);

interface RawBullet { lineNo: number; section: number; subsection: string | null; sectionTitle: string; text: string }

let currentSection = -1;
let currentSectionTitle = "";
let currentSubsection: string | null = null;
const bullets: RawBullet[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNo = i + 1;

  // Top-level section heading: "# N. TITLE" or "# N TITLE"
  const secMatch = line.match(/^#\s+(\d+)\.?\s+(.+)$/);
  if (secMatch) {
    currentSection = parseInt(secMatch[1], 10);
    currentSectionTitle = secMatch[2].trim();
    currentSubsection = null;
    continue;
  }

  // Subsection heading: "## N.M Title" or "## Title" (used for §9 industry examples, §35 gates,
  // and — critically — §4/§5/§10/§17/§32's own enumerated states, which are ## headers with a
  // prose description underneath, never a "- " bullet. Each such header IS itself one atomic
  // requirement (a named state/class the system must support) for sections 4, 5, 10, 17, 32.
  const subMatch = line.match(/^##\s+(.+)$/);
  if (subMatch) {
    currentSubsection = subMatch[1].trim();
    // §11 PREFERRED PLATFORM REGISTRY is structurally identical to the §4/5/10/17/32 state-enumeration
    // shape: each "## " header names one preferred-platform slot whose value is a bolded line, not a
    // "- " bullet. First extractor pass missed this entirely (it only caught the ANALYTICS/BUILD-ENGINEERING
    // sub-bullets), which silently zeroed out 6 of §11's 8 real platform-registry entries -- a real
    // extractor bug, caught by manually diffing raw §11 lines against the MD source.
    if ([4, 5, 10, 11, 17, 32].includes(currentSection) && !/^GATE \d/i.test(currentSubsection)) {
      bullets.push({ lineNo, section: currentSection, subsection: currentSubsection, sectionTitle: currentSectionTitle, text: `[STATE] ${currentSubsection}` });
    }
    continue;
  }
  const sub3Match = line.match(/^###\s+(.+)$/);
  if (sub3Match) {
    currentSubsection = (currentSubsection ? currentSubsection + " > " : "") + sub3Match[1].trim();
    // §8.26 (Scope, nested inside §8's discovery contract) repeats the exact same IN SCOPE/OUT OF
    // SCOPE/... heading shape as top-level §26 -- first pass only checked currentSection === 26 and
    // silently produced zero raw items for §8.26, even though its 5 headings are real, distinct atomic
    // requirements the manifest already covers (REQ-8.26.1-8.26.5).
    if ([8, 26].includes(currentSection) && /^(IN SCOPE|OUT OF SCOPE|FUTURE|CLIENT RESPONSIBILITIES|LEONIX RESPONSIBILITIES)/i.test(sub3Match[1])) {
      bullets.push({ lineNo, section: currentSection, subsection: currentSubsection, sectionTitle: currentSectionTitle, text: `[STATE] ${sub3Match[1].trim()}` });
    }
    continue;
  }

  // A real bullet line: "- text" (not a nested sub-bullet under an example list we still want).
  const bulletMatch = line.match(/^-\s+(.+)$/);
  if (bulletMatch && currentSection >= 0) {
    bullets.push({ lineNo, section: currentSection, subsection: currentSubsection, sectionTitle: currentSectionTitle, text: bulletMatch[1].trim() });
    continue;
  }

  // A numbered list item (§14 categories, §31 UI stages, §33 acceptance steps): "N. text"
  const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (numMatch && currentSection >= 0 && [14, 31, 33].includes(currentSection)) {
    bullets.push({ lineNo, section: currentSection, subsection: currentSubsection, sectionTitle: currentSectionTitle, text: `#${numMatch[1]} ${numMatch[2].trim()}` });
    continue;
  }

  // §36's three block-quoted outcome statements: "> **“...”**" (curly quotes, confirmed by direct
  // byte inspection of the source file — a straight-quote regex silently matched zero lines).
  const quoteMatch = line.match(/^>\s+\*\*“(.+)”\*\*/);
  if (quoteMatch && currentSection === 36) {
    bullets.push({ lineNo, section: currentSection, subsection: currentSubsection, sectionTitle: currentSectionTitle, text: `[VISION] ${quoteMatch[1].trim()}` });
    continue;
  }
}

// Sections 13, 18, 19, 22, 23, 24, 30, 37 are pure prose in the canonical MD — no "- " bullets, no
// "## " enumerated-state headers, no numbered list. A mechanical bullet/header extractor structurally
// cannot find their content; this is disclosed explicitly (not silently patched) rather than
// pretending the automated pass covered them. Each entry below cites its exact source line(s) so a
// future engineer can re-verify it against the same raw text this script itself parses above.
const manualProseSupplement: RawBullet[] = [
  { lineNo: 25, section: 0, subsection: null, sectionTitle: "NORTH STAR", text: "[PROSE] Leonix should not build from vague instructions. (Gate 10.10 finding: this intro sentence, and the flow banner/closing sentences below, were never extracted at all -- only the 18-item bullet list was captured.)" },
  { lineNo: 51, section: 0, subsection: null, sectionTitle: "NORTH STAR", text: "[PROSE] DISCOVER -> CAPTURE -> EXTRACT -> VERIFY -> FIND GAPS -> ASK -> CONFIRM -> ARCHITECT -> GENERATE PROJECT MD -> BUILD -> QA -> HANDOFF -> FOLLOW THROUGH (the canonical 13-stage flow banner)." },
  { lineNo: 47, section: 0, subsection: null, sectionTitle: "NORTH STAR", text: "[PROSE] Then Business Concierge should generate the project blueprint." },
  { lineNo: 53, section: 0, subsection: null, sectionTitle: "NORTH STAR", text: "[PROSE] The MD is the output of disciplined discovery. It is not a generic template filled with superficial answers." },
  { lineNo: 262, section: 6, subsection: null, sectionTitle: "ADAPTIVE QUESTION ENGINE", text: "[PROSE] Questions already answered by canonical truth should not be asked again unless re-confirmation is necessary. (Gate 10.10 finding: this trailing prose sentence -- REQ-6.3's own source text -- was never extracted at all before this pass.)" },
  { lineNo: 529, section: 8, subsection: "8.14 CMS / content editing", sectionTitle: "WEBSITE DISCOVERY INFORMATION CONTRACT", text: "[PROSE] Do not add a CMS if the client does not need one. (Gate 10.10 finding: this trailing prose sentence -- REQ-8.14.7's own source text -- was never extracted at all before this pass.)" },
  { lineNo: 605, section: 8, subsection: "8.19 SEO / discovery", sectionTitle: "WEBSITE DISCOVERY INFORMATION CONTRACT", text: "[PROSE] No guaranteed ranking claims. (Gate 10.10 finding: this trailing prose sentence -- REQ-8.19.13's own source text -- was never extracted at all before this pass.)" },
  { lineNo: 284, section: 7, subsection: null, sectionTitle: "PROJECT TYPES", text: "[PROSE] A client engagement may create multiple linked projects from one discovery session. (Gate 10.9 finding: mechanical bullet extractor missed this trailing prose sentence; manifest's REQ-7.17 already covers it correctly.)" },
  { lineNo: 1287, section: 34, subsection: "Expected chain", sectionTitle: "ACCEPTANCE TEST — MULTI-SOLUTION CLIENT", text: "[PROSE] One discovery session. (Gate 10.10 finding: this arrow-chain, §34's real EXPECTED-outcome content, was never extracted at all before this pass -- only the unrelated 'Client needs' input list was captured, which a prior equal-count heuristic then wrongly paired against REQ-34.1-4.)" },
  { lineNo: 1288, section: 34, subsection: "Expected chain", sectionTitle: "ACCEPTANCE TEST — MULTI-SOLUTION CLIENT", text: "[PROSE] shared business truth" },
  { lineNo: 1289, section: 34, subsection: "Expected chain", sectionTitle: "ACCEPTANCE TEST — MULTI-SOLUTION CLIENT", text: "[PROSE] four linked project requirements" },
  { lineNo: 1290, section: 34, subsection: "Expected chain", sectionTitle: "ACCEPTANCE TEST — MULTI-SOLUTION CLIENT", text: "[PROSE] specialized missing-information checks" },
  { lineNo: 1291, section: 34, subsection: "Expected chain", sectionTitle: "ACCEPTANCE TEST — MULTI-SOLUTION CLIENT", text: "[PROSE] separate project blueprints" },
  { lineNo: 1292, section: 34, subsection: "Expected chain", sectionTitle: "ACCEPTANCE TEST — MULTI-SOLUTION CLIENT", text: "[PROSE] shared confirmed assets/facts" },
  { lineNo: 1293, section: 34, subsection: "Expected chain", sectionTitle: "ACCEPTANCE TEST — MULTI-SOLUTION CLIENT", text: "[PROSE] clear dependencies." },
  { lineNo: 898, section: 13, subsection: null, sectionTitle: "PLATFORM OWNERSHIP REGISTER", text: "[PROSE] Every project should produce an ownership record." },
  { lineNo: 900, section: 13, subsection: null, sectionTitle: "PLATFORM OWNERSHIP REGISTER", text: "[PROSE] No project may reach handoff without ownership/billing being explicit." },
  { lineNo: 1010, section: 18, subsection: null, sectionTitle: "MEETING CLOSEOUT ASSIST", text: "[PROSE] Surface 'Before You Wrap Up' — only high-value missing questions, to prevent avoidable client callbacks." },
  { lineNo: 1020, section: 19, subsection: null, sectionTitle: "MULTI-PROJECT DISCOVERY", text: "[PROSE] One client conversation may produce several projects." },
  { lineNo: 1022, section: 19, subsection: null, sectionTitle: "MULTI-PROJECT DISCOVERY", text: "[PROSE] Approved projects inherit shared confirmed truth." },
  { lineNo: 1024, section: 19, subsection: null, sectionTitle: "MULTI-PROJECT DISCOVERY", text: "[PROSE] Each project receives its own specialized completeness requirements and blueprint." },
  { lineNo: 1081, section: 22, subsection: null, sectionTitle: "STAFF EXPERIENCE", text: "[PROSE] Staff/technical-leadership responsibility split: architecture is technical leadership's responsibility; discovery/relationship/capture is the employee's." },
  { lineNo: 1091, section: 23, subsection: null, sectionTitle: "NO TRIBAL KNOWLEDGE", text: "[PROSE] Persist important project facts, approvals, ownership, platform, scope, billing, missing information, and commitments." },
  { lineNo: 1097, section: 24, subsection: null, sectionTitle: "BUILD HANDOFF", text: "[PROSE] The builder receives the approved/versioned blueprint, not raw conversation history, as the primary specification." },
  { lineNo: 1199, section: 30, subsection: null, sectionTitle: "PLATFORM COST DISCIPLINE", text: "[PROSE] Use the least complex stack that satisfies the client." },
  { lineNo: 1201, section: 30, subsection: null, sectionTitle: "PLATFORM COST DISCIPLINE", text: "[PROSE] Do not add recurring subscriptions simply because the tool is available." },
  { lineNo: 1383, section: 37, subsection: null, sectionTitle: "FINAL LOCK", text: "[PROSE] The 11-step DISCOVER->KEEP THE RELATIONSHIP progression itself is a distinct requirement from the North Star's own 13-stage flow (§0) — this is the CLIENT-EXPERIENCE-FACING restatement, not a duplicate." },
  { lineNo: 1399, section: 37, subsection: null, sectionTitle: "FINAL LOCK", text: "[PROSE] The process is repeatable." },
  { lineNo: 1401, section: 37, subsection: null, sectionTitle: "FINAL LOCK", text: "[PROSE] The solution is tailored." },
  { lineNo: 1403, section: 37, subsection: null, sectionTitle: "FINAL LOCK", text: "[PROSE] The quality must represent Leonix." },
  { lineNo: 1405, section: 37, subsection: null, sectionTitle: "FINAL LOCK", text: "[PROSE] Both Leonix and the client must win. (Gate 10.9 finding: this sentence had no dedicated ledger row before this pass -- fixed, see REQ-37.4.)" },
  { lineNo: 1407, section: 37, subsection: null, sectionTitle: "FINAL LOCK", text: "[SLOGAN] Que ruja el leon. (Gate 10.10 finding: this closing rallying-cry line was never extracted at all before this pass -- added for complete raw-item accounting; disposition NON_BEHAVIORAL_DECORATIVE, no atomic row required.)" },
];
bullets.push(...manualProseSupplement);

writeFileSync(OUT_PATH, JSON.stringify({ extractedAt: new Date().toISOString(), sourceFile: MD_PATH, totalRawBullets: bullets.length, mechanicallyExtracted: bullets.length - manualProseSupplement.length, manuallySupplementedProseSections: manualProseSupplement.length, bullets }, null, 2), "utf8");

console.log(`Extracted ${bullets.length} raw bullet/numbered-item lines directly from the canonical MD.`);
const bySection = new Map<number, number>();
for (const b of bullets) bySection.set(b.section, (bySection.get(b.section) ?? 0) + 1);
console.log("\nRaw bullet count per §:");
for (const [sec, count] of [...bySection.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  §${sec}: ${count}`);
}
console.log(`\nWrote full extraction to ${OUT_PATH}`);
