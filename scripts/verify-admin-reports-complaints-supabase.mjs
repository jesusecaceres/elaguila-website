/**
 * SUPABASE-REPORTS-01 verification.
 * Run: npm run verify:admin-reports-complaints-supabase
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

const checks = [];

function assert(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

const migration = "supabase/migrations/20250312000001_listing_reports.sql";
const reportsPage = "app/admin/(dashboard)/reportes/page.tsx";
const reportsTable = "app/admin/(dashboard)/reportes/AdminReportsTable.tsx";
const actions = "app/admin/actions.ts";
const dashboardData = "app/admin/_lib/adminDashboardData.ts";
const dashboardRoutes = "app/admin/_lib/adminDashboardRoutes.ts";
const pkg = "package.json";

assert("migration file exists", exists(migration), migration);
assert("reports admin route", exists(reportsPage), reportsPage);
assert("reports table component", exists(reportsTable), reportsTable);

const mig = read(migration);
const page = read(reportsPage);
const table = read(reportsTable);
const act = read(actions);
const dashData = read(dashboardData);
const dashRoutes = exists(dashboardRoutes) ? read(dashboardRoutes) : "";
const pkgSrc = read(pkg);

assert("create table if not exists", /CREATE TABLE IF NOT EXISTS listing_reports/i.test(mig), migration);
assert("listing_id text column", mig.includes("listing_id text"), migration);
assert("reporter_id column", mig.includes("reporter_id"), migration);
assert("reason column", mig.includes("reason text"), migration);
assert("status default pending", mig.includes("status text") && mig.includes("'pending'"), migration);
assert("status index", mig.includes("idx_listing_reports_status"), migration);
assert("created_at index", mig.includes("idx_listing_reports_created_at"), migration);
assert("listing_id index", mig.includes("idx_listing_reports_listing_id"), migration);
assert("RLS enabled", mig.includes("ENABLE ROW LEVEL SECURITY"), migration);
assert("no destructive SQL", !/\bDROP TABLE\b/i.test(mig) && !/\bTRUNCATE\b/i.test(mig), migration);
assert("insert policy for reports", mig.includes('FOR INSERT'), migration);

assert("page selects listing_reports", page.includes('.from("listing_reports")'), reportsPage);
assert("page selects required columns", page.includes("listing_id") && page.includes("reporter_id") && page.includes("status"), reportsPage);
assert("pending/reviewed/dismissed counts", page.includes('"pending"') && page.includes('"reviewed"') && page.includes('"dismissed"'), reportsPage);
assert("search filter safe", page.includes("ilike") && page.includes("reason"), reportsPage);

assert("review action", act.includes('updateListingReportStatusAction') && act.includes('"reviewed"'), actions);
assert("dismiss action", act.includes('"dismissed"'), actions);
assert("status-only review/dismiss (no extra columns required)", act.includes(".update({ status })"), actions);

assert("reports table UI actions", table.includes('handleStatus(row.id, "reviewed")') && table.includes('"dismissed"'), reportsTable);
assert("dashboard pending reports query", dashData.includes('from("listing_reports")'), dashboardData);
assert(
  "dashboard reports CTA route",
  dashRoutes.includes("/admin/reportes") || page.includes("/admin/reportes"),
  "dashboard link",
);

assert("verify script registered", pkgSrc.includes("verify:admin-reports-complaints-supabase"), pkg);
assert("no stripe in reports stack", !page.includes("stripe") && !mig.includes("stripe"), reportsPage);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-reports-complaints-supabase FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-reports-complaints-supabase PASS (${checks.length} checks)`);
