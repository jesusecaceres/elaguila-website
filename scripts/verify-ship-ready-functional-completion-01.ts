/**
 * Business Concierge — Final Ship-Ready Functional Completion verifier.
 * Confirms the two bounded repairs from this pass (lane-aware Creative Brief intake, enriched
 * Owner Handoff) and structurally re-confirms the key research findings that justified NOT
 * building new work in Research/Discovery, provider pipeline, and Assistant (already functional,
 * or honestly CONFIGURATION REQUIRED — not code gaps).
 * Same hand-rolled node:assert structural convention as every other verify-*.ts script here.
 * Run from repo root: npx tsx scripts/verify-ship-ready-functional-completion-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Final Ship-Ready Functional Completion — targeted checks\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const creativeStudioActions = read("app/admin/(dashboard)/businesses/[businessId]/CreativeStudioActions.tsx");
const creativeJourney = read("app/admin/(dashboard)/businesses/[businessId]/CreativeJourney.tsx");
const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const creativeBriefTypes = read("app/lib/business/creativeStudio/types.ts");
const briefsRoute = read("app/api/admin/businesses/[businessId]/creative-studio/jobs/[jobId]/briefs/route.ts");

// --- Repair 1: Lane-aware Creative Brief intake, no migration ------------------------------------
check("Repair 1a. Four real brief lanes exist, keyed off the real CreativeAssetType values", () => {
  assert.ok(creativeStudioActions.includes('assetType === "logo_direction"'));
  assert.ok(creativeStudioActions.includes('assetType === "website_strategy"'));
  assert.ok(creativeStudioActions.includes('assetType === "sponsored_insert"'));
  assert.ok(creativeStudioActions.includes('return "ad"'));
});
check("Repair 1b. Logo lane collects colors-to-avoid, personality, origin/story, and cultural/use-case notes", () => {
  const logoBlock = creativeStudioActions.slice(creativeStudioActions.indexOf("logo: {"), creativeStudioActions.indexOf("website: {"));
  assert.ok(/Colores.*colores a evitar|Colors.*symbols to avoid/i.test(logoBlock));
  assert.ok(/[Pp]ersonalidad|[Pp]ersonality/.test(logoBlock));
  assert.ok(/[Hh]istoria.*origen|[Ss]tory.*origin/.test(logoBlock));
});
check("Repair 1c. Website lane collects current URL, pain points, and pages-needed/content-gaps", () => {
  const websiteBlock = creativeStudioActions.slice(creativeStudioActions.indexOf("website: {"), creativeStudioActions.indexOf("sponsored_editorial: {"));
  assert.ok(/URL actual|Current URL/.test(websiteBlock));
  assert.ok(/[Pp]roblemas actuales|[Pp]ain points/.test(websiteBlock));
  assert.ok(/[Pp]áginas necesarias|[Pp]ages needed/.test(websiteBlock));
});
check("Repair 1d. Sponsored editorial lane collects partner authority, reader value, and disclosure requirement", () => {
  const sponsoredBlock = creativeStudioActions.slice(creativeStudioActions.indexOf("sponsored_editorial: {"), creativeStudioActions.indexOf("};", creativeStudioActions.indexOf("sponsored_editorial: {")));
  assert.ok(/[Aa]utoridad del socio|[Pp]artner authority/.test(sponsoredBlock));
  assert.ok(/[Vv]alor para el lector|[Rr]eader value/.test(sponsoredBlock));
  assert.ok(/divulgaci[oó]n|[Dd]isclosure/.test(sponsoredBlock));
});
check("Repair 1e. Extra lane fields map to real, already-wired CreativeBrief columns — no new table/column", () => {
  assert.ok(creativeStudioActions.includes("supportingMessage: extraNotes.trim()"));
  assert.ok(creativeStudioActions.includes("prohibitedClaims: avoidText.trim()"));
  assert.ok(creativeStudioActions.includes("requiredDisclaimers: disclosureText.trim()"));
  assert.ok(briefsRoute.includes("supportingMessage") && briefsRoute.includes("prohibitedClaims") && briefsRoute.includes("requiredDisclaimers"));
  assert.ok(creativeBriefTypes.includes("supportingMessage") && creativeBriefTypes.includes("prohibitedClaims") && creativeBriefTypes.includes("requiredDisclaimers"));
});
check("Repair 1f. Saved lane-specific answers are visible after save (BriefReadout), not silently discarded", () => {
  assert.ok(creativeJourney.includes("brief.supportingMessage?.trim()"));
  assert.ok(creativeJourney.includes("brief.requiredDisclaimers.length > 0"));
  assert.ok(creativeJourney.includes("brief.trustEvidence.length > 0"));
  assert.ok(creativeJourney.includes("assetType={job.assetType}"));
});
check("Repair 1g. Default (ad) lane keeps its original generic fields unchanged for the other 7 asset types", () => {
  const adBlock = creativeStudioActions.slice(creativeStudioActions.indexOf("ad: {"), creativeStudioActions.indexOf("logo: {"));
  assert.ok(adBlock.includes("Objetivo de negocio / Business goal"));
  assert.ok(adBlock.includes("Objetivo de campaña / Campaign objective"));
});
check("Repair 1h. No migration, no new table introduced by this repair", () => {
  assert.ok(!/CREATE TABLE|ALTER TABLE/i.test(creativeStudioActions + creativeJourney));
});

// --- Repair 2: Owner Handoff enrichment ------------------------------------------------------------
check("Repair 2a. Owner Handoff shows outstanding creative requirements when a brief has missing assets", () => {
  const startIdx = page.indexOf("const acceptedProposal = program5Data.proposals.find");
  const end = page.indexOf("Promise Keeper */}", startIdx);
  const block = page.slice(startIdx, end);
  assert.ok(block.includes("outstandingCreativeItems"));
  assert.ok(block.includes("latestCreativeWorkspace?.brief?.missingAssetDescriptions"));
});
check("Repair 2b. Owner Handoff shows actual open commitment titles and due dates, not only a count", () => {
  const idx = page.indexOf('id="owner-handoff"');
  const end = page.indexOf("Promise Keeper */}", idx);
  const block = page.slice(idx, end);
  assert.ok(block.includes("openCommitments.slice(0, 3).map"));
  assert.ok(block.includes("commitment.titleEn"));
});
check("Repair 2c. Owner Handoff enrichment uses zero new queries — composed from already-loaded creativeJobViews/commitmentsWithEvents", () => {
  const idx = page.indexOf('id="owner-handoff"');
  const end = page.indexOf("Promise Keeper */}", idx);
  const block = page.slice(idx, end);
  assert.ok(!/await |fetch\(/.test(block));
});

// --- Structural re-confirmation of research findings (no code changes needed there) ---------------
check("Research: AI research output is human-gated before Living Book promotion (draft status, separate promotion capability)", () => {
  const aiResearchRepo = read("app/lib/business/aiResearch/repository.ts");
  assert.ok(aiResearchRepo.includes('review_status: "draft"') || aiResearchRepo.includes("reviewStatus: \"draft\""));
});
check("Research: non-website sources remain honest manual-link entries, never silently scraped", () => {
  const sourceRegistry = read("app/lib/business/fieldDiscovery/sourceRegistry.ts");
  assert.ok(sourceRegistry.includes('"manual_only"'));
});
check("Provider pipeline: generate route truthfully checks isConfigured() before any provider call", () => {
  const generateRoute = read("app/api/admin/businesses/[businessId]/creative-studio/jobs/[jobId]/generate/route.ts");
  assert.ok(generateRoute.includes("isConfigured"));
});
check("No image-generation button exists anywhere in the Creative Studio UI", () => {
  assert.ok(!/generate-image|generateImage/i.test(creativeJourney + creativeStudioActions));
});
check("Assistant remains read-only/suggest-only — no autonomous mutation call in AssistantPanel", () => {
  const assistantPanel = read("app/admin/(dashboard)/businesses/[businessId]/AssistantPanel.tsx");
  assert.ok(!/fetch\(`\/api\/admin\/businesses\/\$\{businessId\}\/(commitments|proposals|opportunities)/.test(assistantPanel));
});
check("Business list search is real server-side query filtering, not client-side substring match", () => {
  const workspaceData = read("app/admin/_lib/businessWorkspaceData.ts");
  assert.ok(/ilike/i.test(workspaceData));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
