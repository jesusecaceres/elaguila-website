/**
 * Newsletter Sales Contact Ops — static verification.
 * No live Supabase/Resend. Run: npm run verify:newsletter-sales-contact-ops
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
  console.error(`verify-newsletter-sales-contact-ops: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const inbox = "app/admin/_components/leads/AdminNewsletterSubscribersInboxClient.tsx";
const formatHelpers = "app/admin/_components/leads/adminLeadInboxFormat.ts";
const templates = "app/admin/_lib/leonixLeadReplyTemplates.ts";
const exportFull = "app/api/admin/leads/newsletter/export/route.ts";
const exportEmails = "app/api/admin/leads/newsletter/emails-export/route.ts";
const runbook = "docs/newsletter-sales-contact-ops.md";
const pkg = "package.json";

for (const rel of [inbox, formatHelpers, templates, exportFull, exportEmails, runbook, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const inboxSrc = read(inbox);
const formatSrc = read(formatHelpers);
const templatesSrc = read(templates);
const runbookSrc = read(runbook);
const pkgSrc = read(pkg);

// Admin inbox: export/copy/BCC/sales panel
for (const s of [
  "Sales contact ops",
  "Export full CSV",
  "Export emails CSV",
  "Copy visible emails",
  "Copy emails for BCC",
  "Copy BCC chunks",
  "View newsletter promo codes",
  "/admin/workspace/promo-codes?code_type=newsletter",
  "Google Sheets",
  "No Excel needed",
  "manual email client",
  "no server bulk send",
]) {
  if (!inboxSrc.includes(s)) fail(`Admin inbox missing: ${s}`);
}
ok("admin inbox: sales ops panel + export/copy/BCC present");

// BCC chunk helpers (client-side)
for (const s of ["formatBccEmailChunks", "formatEmailsForBcc", "subscribedEmailsFromRows"]) {
  if (!formatSrc.includes(s)) fail(`Format helpers missing: ${s}`);
}
if (!inboxSrc.includes("formatBccEmailChunks") || !inboxSrc.includes("subscribedEmailsFromRows")) {
  fail("Inbox must use BCC chunk helpers");
}
ok("BCC chunk helpers present");

// Launch 25 mailto template clarity
for (const s of ["Tu código Leonix Launch 25", "Your Leonix Launch 25 code", "website checkout"]) {
  if (!templatesSrc.includes(s)) fail(`Newsletter mailto template missing: ${s}`);
}
ok("newsletter mailto template: Launch 25 clarity");

// Export routes exist
if (!existsSync(path.join(root, exportFull))) fail("Missing export route");
if (!existsSync(path.join(root, exportEmails))) fail("Missing emails-export route");
ok("export routes exist");

// Runbook sections
for (const s of [
  "Newsletter Sales Contact Ops",
  "Google Sheets workflow",
  "Gmail / manual outreach",
  "Promo verification",
  "What is NOT built yet",
  "Future gates",
  "BCC chunks",
  "no server-side weekly bulk campaign sender",
]) {
  if (!runbookSrc.includes(s)) fail(`Runbook missing: ${s}`);
}
ok("sales handoff runbook present");

// No bulk sender claims in inbox
if (/bulk send to all subscribers/i.test(inboxSrc)) {
  fail("Inbox must not claim bulk server send exists");
}
ok("no false bulk sender claim in inbox");

// Package script
if (!pkgSrc.includes("verify:newsletter-sales-contact-ops")) {
  fail("package.json missing verify:newsletter-sales-contact-ops");
}
ok("package.json verifier script registered");

console.log("verify-newsletter-sales-contact-ops: PASS");
