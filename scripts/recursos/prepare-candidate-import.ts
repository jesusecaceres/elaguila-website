/**
 * Build 03A — candidate → draft import preview.
 *
 * Reads a candidate JSON file (e.g. data/recursos/candidates/scc-community-resource-guide-2023.json)
 * and writes a draft-review artifact showing what each candidate WOULD look like as a
 * CommunityResourceInput. This script NEVER writes to Supabase — it has no admin/service-role
 * client and never imports one. It is a preview tool for human review, not an import tool.
 *
 * Mirrors the shape of scripts/recursos/seed-verified-resources.ts: explicit --confirm gate,
 * per-record try/catch reporting, no silent writes.
 *
 * Usage:
 *   npx tsx scripts/recursos/prepare-candidate-import.ts data/recursos/candidates/scc-community-resource-guide-2023.json --confirm
 */
import fs from "node:fs";
import path from "node:path";
import { candidateToResourceDraft, type CandidateResourceRecord } from "../../app/lib/recursos/sourceIngestion";

const args = process.argv.slice(2);
const confirmed = args.includes("--confirm");
const inputPath = args.find((a) => !a.startsWith("--"));

if (!inputPath) {
  console.error("Usage: npx tsx scripts/recursos/prepare-candidate-import.ts <candidates.json> --confirm");
  process.exit(1);
}

const resolvedInput = path.resolve(inputPath);
const candidates: CandidateResourceRecord[] = JSON.parse(fs.readFileSync(resolvedInput, "utf8"));

if (!confirmed) {
  console.log(`Loaded ${candidates.length} candidates from ${resolvedInput}.`);
  console.log("This is a dry run — no draft file was written. Re-run with --confirm to write the draft-review artifact.");
  console.log("This script never writes to Supabase under any flag.");
  process.exit(0);
}

let ok = 0;
let failed = 0;
const drafts: Array<{ candidateId: string; draft: unknown }> = [];

for (const candidate of candidates) {
  try {
    const draft = candidateToResourceDraft(candidate);
    drafts.push({ candidateId: candidate.candidateId, draft });
    ok++;
  } catch (err) {
    failed++;
    console.error(`FAILED — ${candidate.candidateId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

const outPath = resolvedInput.replace(/\.json$/, "-draft-preview.json");
fs.writeFileSync(outPath, JSON.stringify(drafts, null, 2) + "\n");

console.log(`Drafted ${ok} candidate(s), ${failed} failed, written to ${outPath}.`);
console.log("This is a PREVIEW only — no Supabase write occurred. Real import requires a human to review each draft,");
console.log("confirm it against a live official source, and promote it through the existing admin verification workflow");
console.log("(see docs/recursos-verification-workflow.md), never by bulk-inserting this preview file.");
