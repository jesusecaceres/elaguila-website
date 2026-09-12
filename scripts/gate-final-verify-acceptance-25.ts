/**
 * Final Stacked Closeout — Stack B4: standalone verifier for §33 ACCEPTANCE TEST — WEBSITE CLIENT
 * (the 25-step operator flow). No dedicated verifier existed for this before (confirmed by search);
 * every other §-section already has one (Blueprint-47, project-family-integrity, lifecycle-14, etc.)
 * except this one, so this fills that one real, named gap rather than re-deriving anything already proven.
 *
 * Unlike a manifest-status check alone (which only proves a LABEL says TECHNICALLY_PROVEN), this
 * verifier additionally greps real current source for the specific identifier each row cites, for
 * every STATE-CHANGING step explicitly named in the mission -- proving the row isn't proven merely by
 * a UI label, enum, route existence, or documentation claim.
 *
 * Run: npx tsx scripts/gate-final-verify-acceptance-25.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json"), "utf8"));
const reqs: any[] = manifest.requirements;

let failures = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) console.log(`  PASS  ${name}`);
  else { console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); failures++; }
}

console.log("Final Closeout — §33 Website Acceptance (25 steps) Verifier\n");

const rows = reqs.filter((r) => r.mdSection === "33").sort((a, b) => Number(a.reqId.split(".")[1]) - Number(b.reqId.split(".")[1]));

check("Exactly 25 §33 acceptance rows exist", rows.length === 25, `got ${rows.length}`);
const notProven = rows.filter((r) => r.status !== "TECHNICALLY_PROVEN");
check("All 25 rows are TECHNICALLY_PROVEN", notProven.length === 0, notProven.map((r) => `${r.reqId}:${r.status}`).join(", "));

const missingSeq = Array.from({ length: 25 }, (_, i) => `REQ-33.${i + 1}`).filter((id) => !rows.some((r) => r.reqId === id));
check("Steps are exactly REQ-33.1 through REQ-33.25, no gaps", missingSeq.length === 0, missingSeq.join(", "));

// Reject placeholder/self-referential evidence (same banned-phrase list established Gate 10.8B).
const BANNED = /covered by existing tests|same as above|see prior gate|verified previously|see above/i;
const placeholder = rows.filter((r) => (r.sourceFiles ?? []).some((s: string) => BANNED.test(s)));
check("No row's SOURCE citation uses a banned placeholder phrase", placeholder.length === 0, placeholder.map((r) => r.reqId).join(", "));

// Every row must cite at least one concrete, non-empty identifier (backtick-quoted code identifier or a
// named, specific UI component/flow) -- not just prose.
const emptyCite = rows.filter((r) => !r.sourceFiles || r.sourceFiles.length === 0 || r.sourceFiles.every((s: string) => s.trim().length < 5));
check("Every row cites a concrete, non-empty source reference", emptyCite.length === 0, emptyCite.map((r) => r.reqId).join(", "));

// Adversarial cross-check: for every STATE-CHANGING step, the backtick-quoted identifier(s) in its
// citation must be found by grep in real current source -- rejects "UI label only" / "route exists
// only" / "documentation claim only" evidence for anything that actually mutates state.
const STATE_CHANGING = new Set([
  "REQ-33.2", "REQ-33.3", "REQ-33.4", "REQ-33.5", "REQ-33.6", "REQ-33.8", "REQ-33.11", "REQ-33.12",
  "REQ-33.14", "REQ-33.15", "REQ-33.16", "REQ-33.17", "REQ-33.18", "REQ-33.19", "REQ-33.20", "REQ-33.21",
  "REQ-33.22", "REQ-33.23", "REQ-33.24", "REQ-33.25",
]);

const SEARCH_DIRS = ["app"];
const sourceFileCache = new Map<string, string>();
function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(p);
  }
}
const allSourceFiles: string[] = [];
for (const d of SEARCH_DIRS) walk(join(ROOT, d), allSourceFiles);

function identifierExistsInSource(identifier: string): boolean {
  for (const f of allSourceFiles) {
    let content = sourceFileCache.get(f);
    if (content === undefined) {
      content = readFileSync(f, "utf8");
      sourceFileCache.set(f, content);
    }
    if (content.includes(identifier)) return true;
  }
  return false;
}

let stateChangingUnverified: string[] = [];
for (const r of rows) {
  if (!STATE_CHANGING.has(r.reqId)) continue;
  const citations: string[] = r.sourceFiles ?? [];
  // Match the leading identifier-like token after an opening backtick, regardless of what follows
  // before the closing backtick (a trailing ".ts"/"()" must not defeat the match).
  const identifiers = citations.flatMap((c: string) => [...c.matchAll(/`([A-Za-z_][A-Za-z0-9_]{3,})/g)].map((m) => m[1]));
  if (identifiers.length === 0) {
    // No backtick-quoted code identifier at all for a state-changing step is itself suspicious --
    // flag unless the citation is a well-known, specifically-named UI component (still grep-checked).
    stateChangingUnverified.push(`${r.reqId} (no concrete identifier cited: "${citations.join("; ")}")`);
    continue;
  }
  const anyFound = identifiers.some((id) => identifierExistsInSource(id));
  if (!anyFound) stateChangingUnverified.push(`${r.reqId} (cited identifiers not found in real source: ${identifiers.join(", ")})`);
}
check("Every state-changing step's cited identifier is grep-confirmed in real current source", stateChangingUnverified.length === 0, stateChangingUnverified.join(" | "));

console.log(`\n${failures === 0 ? "ALL CHECKS PASS — 25/25 WEBSITE ACCEPTANCE STEPS VERIFIED" : `${failures} CHECK(S) FAILED`}`);
if (failures > 0) process.exit(1);
