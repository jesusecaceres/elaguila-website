/**
 * ADMIN-REVIEW-CTA-01 verification.
 * Run: npm run verify:admin-review-cta-actions
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

const dashboard = "app/admin/_components/AdminCommandCenterDashboard.tsx";
const reviewActions = "app/admin/_components/AdminDashboardReviewCardActions.tsx";
const reviewLib = "app/admin/_lib/adminDashboardReviewActions.ts";
const data = "app/admin/_lib/adminDashboardData.ts";
const userDetail = "app/admin/(dashboard)/usuarios/[id]/page.tsx";
const client = "app/admin/_components/AdminCommandCenterClient.tsx";
const theme = "app/admin/_components/adminTheme.ts";
const cta = "app/admin/_components/AdminDashboardCta.tsx";
const pkg = "package.json";

const dashSrc = read(dashboard);
const actionsSrc = read(reviewActions);
const libSrc = read(reviewLib);
const dataSrc = read(data);
const userSrc = read(userDetail);
const clientSrc = read(client);
const pkgSrc = read(pkg);

assert("review actions component", exists(reviewActions), reviewActions);
assert("review actions lib", exists(reviewLib), reviewLib);
assert("pending review section", dashSrc.includes("dashboard.pendingReviewTitle"), dashboard);
assert("review section anchor id", clientSrc.includes('id={section.id}') && libSrc.includes('ADMIN_DASHBOARD_REVIEW_SECTION_ID = "review"'), client);
assert("flagged items render", dataSrc.includes('"flagged"') && dashSrc.includes("pendingReviewQueueItems.map"), dashboard);
assert("review in queue CTA", actionsSrc.includes("Review in queue"), reviewActions);
assert("seller profile preserved", actionsSrc.includes("Seller profile"), reviewActions);
assert("view public when href", actionsSrc.includes("View public") && actionsSrc.includes("row.publicHref"), reviewActions);
assert("edit listing when href", actionsSrc.includes("Edit listing") && actionsSrc.includes("row.editHref"), reviewActions);
assert("staff edit route documented", libSrc.includes("/admin/workspace/clasificados/listings/"), reviewLib);
assert("copy email when available", actionsSrc.includes("Copy email") && actionsSrc.includes("row.ownerEmail"), reviewActions);
assert("email seller mailto", actionsSrc.includes("Email seller") && libSrc.includes("buildSellerMailtoForReviewRow"), reviewLib);
assert("archive queue fallback", actionsSrc.includes("Archive in queue"), reviewActions);
assert("delete queue fallback", actionsSrc.includes("Delete in queue") && actionsSrc.includes("variant=\"danger\""), reviewActions);
assert("mark reviewed queue fallback", actionsSrc.includes("Mark reviewed in queue"), reviewActions);
assert("reason fallback", dataSrc.includes("Reason unavailable — inspect review source"), data);
assert("red exclamation", dashSrc.includes("adminDashboardUrgentBadge"), dashboard);
assert("owner email enrichment", dataSrc.includes("enrichPendingReviewOwnerContacts"), data);
assert("back to users preserved", userSrc.includes("backToUsers") && userSrc.includes("/admin/usuarios"), userDetail);
assert("dashboard preserved", userSrc.includes('href="/admin"'), userDetail);
assert("back to review added", userSrc.includes("/admin#review") && userSrc.includes("backToReview"), userDetail);
assert("semantic danger CTA", read(theme).includes("adminDashboardCtaDanger") && read(cta).includes("danger"), theme);
assert("verify script in package", pkgSrc.includes("verify:admin-review-cta-actions"), pkg);
assert("no public page changes", !actionsSrc.includes("app/(site)/"), reviewActions);
assert("no migration changes", !dataSrc.includes("supabase/migrations"), data);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-review-cta-actions FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-review-cta-actions PASS (${checks.length} checks)`);
