/**
 * NEWSLETTER-OPERATIONS-READINESS-AUDIT-01 verification.
 * Static assertions only — no live Supabase/Resend.
 * Run: npm run verify:newsletter-operations-readiness
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}
function fail(message) {
  console.error(`verify-newsletter-operations-readiness: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const subscribe = "app/api/newsletter/subscribe/route.ts";
const promoEmail = "app/lib/email/newsletterPromoCodeEmail.ts";
const inbox = "app/admin/_components/leads/AdminNewsletterSubscribersInboxClient.tsx";
const rowActions = "app/admin/_components/leads/AdminLaunchLeadRowActions.tsx";
const exportFull = "app/api/admin/leads/newsletter/export/route.ts";
const exportEmails = "app/api/admin/leads/newsletter/emails-export/route.ts";
const promoPage = "app/admin/(dashboard)/workspace/promo-codes/page.tsx";
const opsDoc = "docs/newsletter-operations-readiness.md";
const pkg = "package.json";

for (const rel of [subscribe, promoEmail, inbox, rowActions, exportFull, exportEmails, promoPage, opsDoc, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const subscribeSrc = read(subscribe);
const promoEmailSrc = read(promoEmail);
const inboxSrc = read(inbox);
const actionsSrc = read(rowActions);
const promoPageSrc = read(promoPage);
const opsDocSrc = read(opsDoc);
const pkgSrc = read(pkg);

// Subscribe API: save → promo → email status
if (!subscribeSrc.includes("saveNewsletterSubscriber")) fail("Subscribe must save subscriber");
if (!subscribeSrc.includes("ensureNewsletterPromoCode")) fail("Subscribe must create/reuse promo code");
if (!subscribeSrc.includes("promo_family: \"website_launch_25\"")) fail("Promo metadata must include website_launch_25");
if (!subscribeSrc.includes("email_send_status")) fail("Subscribe must track email_send_status");
if (!subscribeSrc.includes("promoCodeEmailStatus")) fail("Subscribe must return promoCodeEmailStatus");
if (!subscribeSrc.includes("buildNewsletterPromoCodeEmail")) fail("Subscribe must send subscriber promo email");
if (!subscribeSrc.includes("buildLaunchSignupEmail")) fail("Subscribe must send internal team notification");
ok("subscribe API: save → promo → email status flow present");

// Subscriber promo email doctrine
for (const s of ["website checkout", "printed magazine", "combo", "placement"]) {
  if (!promoEmailSrc.toLowerCase().includes(s.toLowerCase())) {
    fail(`Promo email must mention doctrine: ${s}`);
  }
}
ok("subscriber promo email doctrine present");

// Admin inbox operations
for (const s of [
  "/api/admin/leads/newsletter/export",
  "/api/admin/leads/newsletter/emails-export",
  "Copy visible emails",
  "/admin/workspace/promo-codes?code_type=newsletter",
]) {
  if (!inboxSrc.includes(s)) fail(`Admin inbox missing: ${s}`);
}
if (!inboxSrc.includes("mailto")) fail("Admin inbox must mention mailto");
if (!inboxSrc.includes("manual email client")) fail("Admin inbox must clarify manual mailto");
if (!inboxSrc.includes("manual newsletter operations")) fail("Admin inbox must clarify export/copy is manual");
ok("admin inbox: export/copy/mailto/promo-link present");

// Mailto action exists
if (!actionsSrc.includes('href={mailtoHref}') || !actionsSrc.includes("Reply")) {
  fail("Row actions must include mailto Reply link");
}
ok("admin mailto Reply action present");

// Promo admin delivery status
if (!promoPageSrc.includes("email_send_status")) fail("Promo admin must read email_send_status");
if (!promoPageSrc.includes("not_configured")) fail("Promo admin must handle not_configured status");
ok("promo admin delivery status badges present");

// Bulk sender must NOT exist (honest)
const bulkPatterns = [/newsletter campaign composer/i, /bulk send to subscribers/i, /resend\.batch/i];
for (const pattern of bulkPatterns) {
  if (pattern.test(subscribeSrc + inboxSrc + promoPageSrc)) {
    fail(`Bulk newsletter sender must not exist: ${pattern}`);
  }
}
ok("no bulk newsletter campaign sender in scope files");

// Operations doc
for (const s of [
  "NOT BUILT",
  "manual newsletter operations",
  "email_send_status",
  "Future gates",
]) {
  if (!opsDocSrc.includes(s)) fail(`Operations doc missing: ${s}`);
}
ok("operations runbook doc present");

if (!pkgSrc.includes("verify:newsletter-operations-readiness")) {
  fail("package.json missing verifier script");
}

console.log("verify-newsletter-operations-readiness: PASS");
