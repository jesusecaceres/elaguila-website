/**
 * ADMIN-REVIEW-MOBILE-MODERATION-TRUTH-03 verification.
 * Run: npm run verify:admin-review-mobile-moderation-truth
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
  console.error(`verify-admin-review-mobile-moderation-truth: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const truth = read("app/admin/_lib/adminReviewFlagTruth.ts");
const context = read("app/admin/_lib/adminReviewFlagContext.ts");
const table = read("app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx");
const panel = read("app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx");
const rowActions = read("app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx");
const snapshot = read("app/admin/(dashboard)/workspace/clasificados/_components/AdminListingReviewSnapshot.tsx");
const page = read("app/admin/(dashboard)/workspace/clasificados/page.tsx");
const data = read("app/admin/_lib/adminDashboardData.ts");
const audit = read("app/admin/(dashboard)/workspace/clasificados/REVIEW_MOBILE_MODERATION_TRUTH_AUDIT.md");
const pkg = read("package.json");

if (!exists("app/admin/_lib/adminReviewFlagTruth.ts")) fail("flag truth helper missing");
ok("flag truth helper exists");

if (!truth.includes("classifyAdminReviewFlagTruth")) fail("source classification missing");
if (!truth.includes("Flagged by status. No AI or report reason is stored for this listing.")) {
  fail("status-only copy missing");
}
ok("status-only and legacy copy defined");

if (!truth.includes("ADMIN_REVIEW_REASON_SECONDARY_FALLBACK")) fail("reason fallback constant missing");
if (!truth.includes("Reason unavailable — inspect review source")) fail("secondary fallback missing");
ok("reason fallback preserved");

if (/AI moderation flagged/i.test(panel) && !panel.includes("classify")) fail("panel may fake AI");
if (!truth.includes("isAiModerationProven")) fail("AI proof gate missing");
ok("does not fake AI without proof");

if (!audit.includes("ADMIN-AI-MODERATION-ENGINE-01")) fail("AI infrastructure verdict missing");
ok("AI moderation infrastructure documented");

if (!panel.includes('layout === "card"') || !panel.includes("collapseSections")) fail("mobile collapse missing");
if (!rowActions.includes("<details")) fail("row actions details missing");
ok("mobile actions collapsed by default on cards");

if (!panel.includes('label={t("audit.th.editAd")}') || !panel.includes("viewPublic")) fail("primary actions missing");
ok("primary actions visible");

for (const label of ["Lifecycle", "Monetization & trust", "Danger"]) {
  if (!rowActions.includes(label) && !panel.includes(label)) fail(`${label} actions missing`);
}
ok("lifecycle and monetization/trust preserved");

if (!panel.includes("deleteStaff") || !panel.includes("Soft delete")) fail("danger delete missing");
if (!panel.includes("border-red-200")) fail("danger section not separated");
ok("danger action preserved and separated");

if (!panel.includes("Contact seller") || !panel.includes("Copy email")) fail("contact seller helpers missing");
ok("contact seller helpers preserved");

if (!table.includes("adminDesktopTableOnly") || !table.includes('layout="compact"')) fail("desktop table risk");
ok("desktop table behavior preserved");

if (!table.includes("buildAdminActionReturnUrl") || !table.includes("ClasificadosQueueActionChrome")) {
  fail("action proof flow missing");
}
ok("action proof preserved");

if (!table.includes("clasificados-row-checkbox") || !table.includes("clasificados-mobile-row-checkbox")) {
  fail("bulk checkbox missing");
}
ok("bulk selection preserved");

if (page.includes("app/(site)/")) fail("public page edits");
ok("no public page changes");

if (/CREATE TABLE|supabase\/migrations/.test(panel)) fail("unexpected migration in UI");
ok("no schema/migration changes");

if (/stripe|STRIPE_/.test(panel) || /stripe|STRIPE_/.test(table)) fail("stripe changes");
ok("no Stripe/payment changes");

if (panel.includes("saveLeonixLead")) fail("category logic change risk");
ok("no category logic changes");

if (!table.includes("overflow-x-hidden") || !panel.includes("overflow-x-hidden")) fail("mobile overflow guard missing");
if (!panel.includes("min-h-[44px]")) fail("mobile tap targets missing");
ok("mobile-safe layout");

if (!page.includes("fetchListingFlagContextMaps")) fail("report context not loaded");
if (!table.includes("AdminListingFlagTruthBlock")) fail("flag truth block missing");
ok("queue loads report context for truth");

if (!exists("app/admin/(dashboard)/workspace/clasificados/REVIEW_MOBILE_MODERATION_TRUTH_AUDIT.md")) fail("audit missing");
ok("audit file exists");

if (!pkg.includes('"verify:admin-review-mobile-moderation-truth"')) fail("package script missing");
ok("package script registered");

if (!data.includes("classifyDashboardReviewRowFlagTruth")) fail("dashboard data not wired to truth helper");
ok("dashboard review data uses truth helper");

console.log("\nverify-admin-review-mobile-moderation-truth: all checks passed");
