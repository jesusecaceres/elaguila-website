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

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const MEDIA_KIT_URL = "https://leonixmedia.com/media-kit/leonix-media-kit-es.pdf";
const MAGAZINE_URL = "https://leonixmedia.com/magazine/2026/june/read?lang=es";

const inboxPage = "app/admin/(dashboard)/leads/inbox/page.tsx";
const inboxClient = "app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx";
const newsletterClient = "app/admin/_components/leads/AdminNewsletterSubscribersInboxClient.tsx";
const mediaKitClient = "app/admin/_components/leads/AdminMediaKitLeadsClient.tsx";
const replyTemplates = "app/admin/_lib/leonixLeadReplyTemplates.ts";
const leadStatuses = "app/admin/_lib/leonixLeadStatuses.ts";
const leadsData = "app/admin/_lib/leonixLeadsData.ts";
const inboxFormat = "app/admin/_components/leads/adminLeadInboxFormat.ts";
const inboxApi = "app/api/admin/leads/inbox/[id]/route.ts";
const leadCapture = "app/lib/leonix/leadCaptureServer.ts";
const crmMigration = "supabase/migrations/20260610120000_leonix_leads_crm_pipeline.sql";
const packageJson = "package.json";

assert("inbox page exists", exists(inboxPage), inboxPage);
assert("inbox client exists", exists(inboxClient), inboxClient);
assert("reply templates exist", exists(replyTemplates), replyTemplates);
assert("CRM migration exists", exists(crmMigration), crmMigration);

const pageSrc = read(inboxPage);
const clientSrc = read(inboxClient);
const newsletterSrc = read(newsletterClient);
const mediaKitSrc = read(mediaKitClient);
const templatesSrc = read(replyTemplates);
const statusesSrc = read(leadStatuses);
const dataSrc = read(leadsData);
const formatSrc = read(inboxFormat);
const apiSrc = read(inboxApi);
const migration = read(crmMigration);
const pkg = read(packageJson);
const leadCaptureSrc = exists(leadCapture) ? read(leadCapture) : "";

assert(
  "professional table zebra rows",
  /adminTableZebraRow/.test(clientSrc) && /min-w-\[1200px\]/.test(clientSrc),
  "Inbox table uses zebra rows and horizontal scroll.",
);

assert(
  "created status separate",
  /CreatedCell/.test(clientSrc) && /StatusBadge/.test(clientSrc),
  "Created and status are separate cells/badges.",
);

assert(
  "lead intent visible (Wants column)",
  />\s*Wants\s*</.test(clientSrc) && /InquiryBadge/.test(clientSrc),
  "Wants column with inquiry badge and message preview.",
);

assert(
  "contact preference visible",
  /ContactPrefBadge|preferred_contact_method/.test(clientSrc + formatSrc),
  "Preferred contact badge in inbox.",
);

assert(
  "newsletter interests chips",
  /InterestChips|parseInterestChips/.test(newsletterSrc + formatSrc),
  "Newsletter interests as readable chips.",
);

assert(
  "ops top views",
  /All Leads/.test(clientSrc) &&
    /Needs Reply/.test(clientSrc) &&
    /Promo \/ Print Quotes/.test(clientSrc) &&
    /Advertising Leads/.test(clientSrc) &&
    /Media Kit Requests/.test(clientSrc) &&
    /Archived/.test(clientSrc),
  "Operation-focused view tabs.",
);

assert(
  "media kit reply URL in templates",
  templatesSrc.includes(MEDIA_KIT_URL),
  `Templates must include ${MEDIA_KIT_URL}`,
);

assert(
  "magazine reply URL in templates",
  templatesSrc.includes(MAGAZINE_URL),
  `Templates must include ${MAGAZINE_URL}`,
);

assert(
  "advertising reply template",
  /case "advertising"/.test(templatesSrc) && templatesSrc.includes(MEDIA_KIT_URL),
  "Advertising reply includes media kit link.",
);

assert(
  "promo print reply template",
  /case "promoPrint"/.test(templatesSrc),
  "Promo/print quote reply template.",
);

assert(
  "newsletter reply template",
  /buildNewsletterReplyContent/.test(templatesSrc),
  "Newsletter subscriber reply template.",
);

assert(
  "mailto and copy reply (no fake server send)",
  /buildLeadMailtoUrl/.test(templatesSrc) &&
    /Copy reply/.test(clientSrc) &&
    /mailto/.test(clientSrc) &&
    !/sendLeonixResendEmail/.test(clientSrc + newsletterSrc + mediaKitSrc),
  "Mailto/copy only in admin lead UI — no Resend from inbox.",
);

assert(
  "does not claim email was sent",
  /does not send|no server email|mailto/i.test(clientSrc + newsletterSrc + mediaKitSrc),
  "UI clarifies emails are not sent from server.",
);

assert(
  "archive view and action",
  /"archive"/.test(clientSrc) && /Archived/.test(clientSrc),
  "Archive action and archived view.",
);

assert(
  "restore action",
  /"restore"/.test(clientSrc),
  "Restore from archived view.",
);

assert(
  "delete protected",
  /window\.confirm/.test(clientSrc) && /"delete"/.test(clientSrc),
  "Delete requires confirmation (soft delete).",
);

assert(
  "filters and search preserved",
  /type="search"/.test(clientSrc) && /statusFilter/.test(clientSrc),
  "Search and status filters.",
);

assert(
  "export CSV preserved",
  /\/api\/admin\/leads\/inbox\/export/.test(clientSrc) &&
    /\/api\/admin\/leads\/newsletter\/export/.test(newsletterSrc),
  "CSV export links.",
);

assert(
  "mark contacted and follow-up",
  /mark_contacted/.test(dataSrc + apiSrc) &&
    /follow_up_at/.test(dataSrc + migration) &&
    /Follow-up date/.test(clientSrc),
  "Contact tracking and follow-up date.",
);

assert(
  "pipeline statuses",
  /needs_reply/.test(statusesSrc) &&
    /waiting_on_client/.test(statusesSrc) &&
    /won/.test(statusesSrc) &&
    /lost/.test(statusesSrc),
  "Expanded CRM pipeline statuses.",
);

assert(
  "no public form lifecycle changes",
  !leadCaptureSrc.includes("follow_up_at") && !leadCaptureSrc.includes("last_contacted_at"),
  "Public capture unchanged.",
);

assert(
  "no stripe in lead CRM files",
  !/stripe/i.test(clientSrc + pageSrc + templatesSrc + newsletterSrc),
  "No Stripe changes.",
);

assert(
  "no category queue changes",
  !/categoryQueue|listingQueue/i.test(clientSrc + pageSrc),
  "No category queue changes.",
);

assert(
  "npm script registered",
  /verify:admin-leads-crm/.test(pkg),
  "package.json verify:admin-leads-crm.",
);

for (const col of ["last_contacted_at", "follow_up_at"]) {
  assert(`migration adds ${col}`, migration.includes(col), `Missing ${col}.`);
}

const failed = checks.filter((c) => !c.ok);

if (failed.length) {
  console.error("verify:admin-leads-crm FAILED\n");
  for (const c of failed) {
    console.error(`  ✗ ${c.name}`);
    if (c.detail) console.error(`    ${c.detail}`);
  }
  process.exit(1);
}

console.log(`verify:admin-leads-crm PASS (${checks.length} checks)`);
