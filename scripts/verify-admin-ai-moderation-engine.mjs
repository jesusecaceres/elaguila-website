/**
 * ADMIN-AI-MODERATION-ENGINE-01 verification.
 * Run: npm run verify:admin-ai-moderation-engine
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
  console.error(`verify-admin-ai-moderation-engine: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const docsPath = "docs/admin-ai-moderation-engine.md";
const migrationPath = "supabase/migrations/20260625180000_listing_moderation_reviews.sql";
const enginePath = "app/admin/_lib/listingAiModerationEngine.ts";
const servicePath = "app/admin/_lib/listingAiModerationService.ts";
const dbPath = "app/admin/_lib/listingModerationReviewsDb.ts";
const truthPath = "app/admin/_lib/adminReviewFlagTruth.ts";
const contextPath = "app/admin/_lib/adminReviewFlagContext.ts";
const flagBlockPath =
  "app/admin/(dashboard)/workspace/clasificados/_components/AdminListingFlagTruthBlock.tsx";
const runBtnPath =
  "app/admin/(dashboard)/workspace/clasificados/_components/AdminRunAiReviewButton.tsx";
const tablePath = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";
const bulkBarPath =
  "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueBulkBar.tsx";
const snapshotPath =
  "app/admin/(dashboard)/workspace/clasificados/_components/AdminListingReviewSnapshot.tsx";
const editPagePath =
  "app/admin/(dashboard)/workspace/clasificados/listings/[id]/edit/page.tsx";
const singleRoutePath = "app/api/admin/clasificados/listings/[id]/ai-review/route.ts";
const bulkRoutePath = "app/api/admin/clasificados/listings/ai-review/bulk/route.ts";
const pagePath = "app/admin/(dashboard)/workspace/clasificados/page.tsx";
const pkgPath = "package.json";

if (!exists(docsPath)) fail("docs/admin-ai-moderation-engine.md missing");
ok("AI moderation docs exist");

if (!exists(migrationPath)) fail("listing_moderation_reviews migration missing");
const migration = read(migrationPath);
if (!migration.includes("CREATE TABLE IF NOT EXISTS public.listing_moderation_reviews")) {
  fail("migration must use CREATE TABLE IF NOT EXISTS");
}
if (!migration.includes("CREATE INDEX IF NOT EXISTS")) fail("migration indexes must be IF NOT EXISTS");
if (/DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/i.test(migration)) {
  fail("migration must not contain destructive SQL");
}
ok("idempotent migration without destructive SQL");

for (const file of [enginePath, servicePath, dbPath]) {
  if (!exists(file)) fail(`${file} missing`);
  const src = read(file);
  if (!src.includes('"server-only"') && !src.includes("'server-only'")) {
    fail(`${file} must be server-only`);
  }
}
ok("server-only AI utility and DB helpers");

const engine = read(enginePath);
if (!engine.includes("OPENAI_API_KEY")) fail("engine must read OPENAI_API_KEY from env");
if (!engine.includes("approved") || !engine.includes("needs_review") || !engine.includes("rejected")) {
  fail("decision model incomplete in engine");
}
ok("engine env + decision model");

const clientDirs = ["app/(site)", "components"];
for (const dir of clientDirs) {
  const full = path.join(root, dir);
  if (!exists(full)) continue;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) {
        const s = fs.readFileSync(p, "utf8");
        if (s.includes("OPENAI_API_KEY") || s.includes("process.env.OPENAI")) {
          fail(`OPENAI env referenced in client-facing path: ${path.relative(root, p)}`);
        }
      }
    }
  };
  walk(full);
}
ok("OPENAI key not exposed in public/client trees");

if (!exists(singleRoutePath) || !exists(bulkRoutePath)) fail("AI review API routes missing");
const service = read(servicePath);
if (!service.includes("runListingAiReviewForId") || !service.includes("runBulkListingAiReview")) {
  fail("run AI review service functions missing");
}
ok("Run AI review action (single + bulk service)");

const runBtn = read(runBtnPath);
if (!runBtn.includes("/ai-review") || !runBtn.includes("admin-run-ai-review")) {
  fail("Run AI review button missing");
}
ok("Run AI review CTA component");

const flagBlock = read(flagBlockPath);
const aiSummary = exists("app/admin/(dashboard)/workspace/clasificados/_components/AdminAiReviewSummary.tsx")
  ? read("app/admin/(dashboard)/workspace/clasificados/_components/AdminAiReviewSummary.tsx")
  : "";
const uiAiDisplay = flagBlock + aiSummary;
if (!flagBlock.includes("AdminRunAiReviewButton")) fail("queue flag block missing Run AI review");
if (
  !uiAiDisplay.includes("reason_category") ||
  !uiAiDisplay.includes("confidence") ||
  !uiAiDisplay.includes("risk_level")
) {
  fail("queue must show AI category/confidence/risk when present");
}
if (!uiAiDisplay.includes("reviewed_at") && !uiAiDisplay.includes("formatReviewedAt")) {
  fail("queue must show reviewed_at");
}
if (!uiAiDisplay.includes("recommended_action") && !uiAiDisplay.includes("formatRecommendedAction")) {
  fail("queue must show recommended action");
}
ok("queue displays AI result fields");

const truth = read(truthPath);
if (!truth.includes("Flagged by status. No AI or report reason is stored for this listing.")) {
  fail("status-only fallback copy missing");
}
if (!truth.includes("storedAiReview") || !truth.includes("isStoredAiReviewProven")) {
  fail("stored AI review truth gate missing");
}
ok("status-only fallback preserved; stored AI proof gate");

const table = read(tablePath);
if (!table.includes("aiReviewByListingId")) fail("table must pass aiReviewByListingId");
if (!table.includes("listingId={row.id}")) fail("table must pass listingId to flag truth block");
ok("queue wired to AI review map");

const bulkBar = read(bulkBarPath);
if (!bulkBar.includes("Run AI review on selected") || !bulkBar.includes("clasificados-bulk-ai-review")) {
  fail("bulk Run AI review missing");
}
if (!table.includes("handleBulkAiReview") || !table.includes("ai-review/bulk")) {
  fail("bulk AI review handler missing in table");
}
ok("bulk selected AI review");

const snapshot = read(snapshotPath);
if (!snapshot.includes("admin-listing-ai-review-snapshot")) fail("edit snapshot AI section missing");
if (!snapshot.includes("AdminRunAiReviewButton")) fail("edit snapshot Run AI review missing");
ok("listing detail/edit AI display + CTA");

const editPage = read(editPagePath);
if (!editPage.includes("aiReviewByListingId")) fail("edit page must load AI reviews");
ok("edit page loads AI review");

if (/deleteListing|bulkSoftDelete|permanentlyDelete|from\("listings"\)[\s\S]{0,80}\.update/i.test(service)) {
  fail("AI service must not delete or mutate listings");
}
if (!read(docsPath).includes("Human review") && !read(docsPath).includes("human admin")) {
  fail("human review requirement must be documented");
}
ok("no auto-delete; human review documented");

const page = read(pagePath);
if (page.includes("app/(site)/clasificados") && page.includes("export")) {
  // noop — page is admin only
}
if (/stripe/i.test(engine + service + flagBlock + snapshot)) fail("no stripe in AI gate files");
ok("no stripe/payment changes in AI gate");

if (/categoryLogic/i.test(engine)) fail("unexpected category logic in engine");
ok("no category business logic changes in engine");

const pkg = read(pkgPath);
if (!pkg.includes("verify:admin-ai-moderation-engine")) {
  fail("package.json missing verify:admin-ai-moderation-engine script");
}
ok("verify script registered in package.json");

console.log("\nverify-admin-ai-moderation-engine: PASS (static checks)");
console.log("Run npm run build separately for build gate.");
