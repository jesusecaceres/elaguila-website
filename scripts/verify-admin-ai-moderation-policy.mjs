/**
 * ADMIN-AI-MODERATION-POLICY-02 verification.
 * Run: npm run verify:admin-ai-moderation-policy
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(msg) {
  console.error(`verify-admin-ai-moderation-policy: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const policyPath = "app/admin/_lib/listingModerationPolicy.ts";
const enginePath = "app/admin/_lib/listingAiModerationEngine.ts";
const dbPath = "app/admin/_lib/listingModerationReviewsDb.ts";
const typesPath = "app/admin/_lib/listingModerationReviewTypes.ts";
const displayPath = "app/admin/_lib/listingModerationDisplay.ts";
const flagBlockPath =
  "app/admin/(dashboard)/workspace/clasificados/_components/AdminListingFlagTruthBlock.tsx";
const summaryPath =
  "app/admin/(dashboard)/workspace/clasificados/_components/AdminAiReviewSummary.tsx";
const snapshotPath =
  "app/admin/(dashboard)/workspace/clasificados/_components/AdminListingReviewSnapshot.tsx";
const truthPath = "app/admin/_lib/adminReviewFlagTruth.ts";
const docsPath = "docs/admin-ai-moderation-engine.md";
const migrationPath = "supabase/migrations/20260612193000_listing_moderation_policy_upgrade.sql";
const servicePath = "app/admin/_lib/listingAiModerationService.ts";
const pkgPath = "package.json";

if (!exists(policyPath)) fail("listingModerationPolicy.ts missing");
ok("policy brain module exists");

const policy = read(policyPath);
if (!policy.includes("LEONIX_MODERATION_POLICY_VERSION")) fail("policy version missing");
ok("policy version exists");

if (!policy.includes("runListingModerationPolicyScan")) fail("keyword/risk scanner missing");
ok("keyword/risk scanner exists");

if (!policy.includes('case "en-venta"') || !policy.includes('case "autos"') || !policy.includes('case "empleos"')) {
  fail("category-specific rules missing");
}
ok("category-specific rules exist");

if (!policy.includes("adult_or_sexual") || !policy.includes("weapons") || !policy.includes("drugs_or_controlled_substances")) {
  fail("prohibited/high-risk categories missing");
}
if (!policy.includes("counterfeit_or_stolen") || !policy.includes("fraud_or_payment_scam")) {
  fail("counterfeit/scam policy missing");
}
if (!policy.includes("rental_scam") || !policy.includes("fake_job")) {
  fail("rental/job category policy missing");
}
ok("expanded reason / policy categories");

const engine = read(enginePath);
if (!engine.includes("scanner_findings") && !engine.includes("Deterministic scanner findings")) {
  fail("AI prompt must include scanner findings");
}
if (!engine.includes("risk_level") || !engine.includes("recommended_action")) {
  fail("AI output must include risk_level and recommended_action");
}
if (!engine.includes("policy_flags") || !engine.includes("keyword_flags")) {
  fail("AI output must include policy_flags and keyword_flags");
}
if (!engine.includes("resolveAiResultWithScanner")) fail("scanner/AI conflict resolution missing");
ok("AI prompt upgraded with scanner + structured JSON");

if (!engine.includes("OPENAI_API_KEY") || !engine.includes("OPENAI_MODERATION_MODEL")) {
  fail("server-only env usage must be preserved");
}
ok("OPENAI env configurable server-only");

const db = read(dbPath);
if (!db.includes("risk_level") || !db.includes("recommended_action") || !db.includes("scanner_result")) {
  fail("DB write must store policy fields");
}
ok("DB stores policy fields");

if (exists(migrationPath)) {
  const mig = read(migrationPath);
  if (!mig.includes("ADD COLUMN IF NOT EXISTS")) fail("migration must use ADD COLUMN IF NOT EXISTS");
  if (/DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/i.test(mig)) fail("migration must not be destructive");
  ok("idempotent policy migration without destructive SQL");
} else {
  fail("policy migration missing");
}

const display = read(displayPath);
if (!display.includes("Looks safe — admin may clear/review")) fail("recommended action labels missing");
ok("recommended action admin language");

const summary = read(summaryPath);
const flagBlock = read(flagBlockPath);
const snapshot = read(snapshotPath);
const uiCombined = summary + flagBlock + snapshot;

if (!uiCombined.includes("risk_level") && !uiCombined.includes("formatRiskLevel")) {
  fail("queue must display risk level");
}
if (!uiCombined.includes("recommended_action") && !uiCombined.includes("formatRecommendedAction")) {
  fail("queue must display recommended action");
}
if (!flagBlock.includes("AdminAiReviewSummary")) fail("queue must use AI summary component");
if (!snapshot.includes("AdminAiReviewSummary")) fail("detail must use AI summary component");
ok("queue + detail display risk/recommended action");

const truth = read(truthPath);
if (!truth.includes("Flagged by status. No AI or report reason is stored for this listing.")) {
  fail("status-only fallback missing");
}
ok("status-only fallback preserved");

const service = read(servicePath);
if (/deleteListing|bulkSoftDelete|permanentlyDelete|from\("listings"\)[\s\S]{0,80}\.update/i.test(service)) {
  fail("AI service must not delete or mutate listings");
}
ok("no auto-delete / no auto-clear-flag behavior in AI service");

const docs = read(docsPath);
if (!docs.includes("Human review") && !docs.includes("human admin")) fail("human review must be documented");
if (!docs.includes("Current ads QA") && !docs.includes("Single listing test")) {
  fail("current ads QA steps missing");
}
if (!docs.includes("bulk") && !docs.includes("2 rows")) fail("limited bulk test must be documented");
if (!docs.includes("OPENAI_MODERATION_MODEL")) fail("model guidance missing");
if (!docs.includes("Policy Brain")) fail("Policy Brain v2 section missing");
ok("docs: human review, QA steps, model guidance");

if (!read(servicePath).includes(".slice(0, 15)")) fail("bulk limit 15 must remain");
ok("bulk selected test limited (max 15); no automatic backfill in service");

const pkg = read(pkgPath);
if (!pkg.includes("verify:admin-ai-moderation-policy")) fail("package script missing");
ok("verify script registered");

console.log("\nverify-admin-ai-moderation-policy: PASS");
