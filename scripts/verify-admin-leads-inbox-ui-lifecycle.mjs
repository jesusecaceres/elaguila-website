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

const inboxPage = "app/admin/(dashboard)/leads/inbox/page.tsx";
const inboxClient = "app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx";
const inboxFormat = "app/admin/_components/leads/adminLeadInboxFormat.ts";
const leadsData = "app/admin/_lib/leonixLeadsData.ts";
const inboxApi = "app/api/admin/leads/inbox/[id]/route.ts";
const exportApi = "app/api/admin/leads/inbox/export/route.ts";
const leadCapture = "app/lib/leonix/leadCaptureServer.ts";
const migrationFile = "supabase/migrations/20260609120000_leonix_leads_lifecycle.sql";
const packageJson = "package.json";

assert("inbox page exists", exists(inboxPage), inboxPage);
assert("inbox client exists", exists(inboxClient), inboxClient);
assert("leads data lib exists", exists(leadsData), leadsData);
assert("inbox PATCH api exists", exists(inboxApi), inboxApi);
assert("export api exists", exists(exportApi), exportApi);
assert("lifecycle migration exists", exists(migrationFile), migrationFile);

const pageSrc = read(inboxPage);
const clientSrc = read(inboxClient);
const formatSrc = read(inboxFormat);
const dataSrc = read(leadsData);
const apiSrc = read(inboxApi);
const exportSrc = read(exportApi);
const migration = read(migrationFile);
const pkg = read(packageJson);
const leadCaptureSrc = exists(leadCapture) ? read(leadCapture) : "";

assert(
  "page loads active and archived buckets",
  /listLeonixLeadsForAdmin\([^)]*"active"\)/.test(pageSrc) &&
    /listLeonixLeadsForAdmin\([^)]*"archived"\)/.test(pageSrc),
  "Page must fetch active and archived lead buckets.",
);

assert(
  "client has active/archived folder tabs",
  /OPS_VIEWS/.test(clientSrc) && /Archived/.test(clientSrc) && /setOpsView/.test(clientSrc),
  "Active vs archived folder UI.",
);

assert(
  "zebra row styling",
  /adminTableZebraRow/.test(clientSrc),
  "Table rows must use adminTableZebraRow.",
);

assert(
  "created and status are separate cells",
  /CreatedCell/.test(clientSrc) && /StatusBadge/.test(clientSrc),
  "Created date and status badge must not share one cell.",
);

assert(
  "status badge helper",
  /leadStatusBadgeClass/.test(formatSrc) && /StatusBadge/.test(clientSrc),
  "Status pill/badge styling.",
);

assert(
  "compact created date parts",
  /formatLeadCreatedParts/.test(formatSrc),
  "Compact created column formatting.",
);

assert(
  "search filter preserved",
  /type="search"/.test(clientSrc) && /setSearch/.test(clientSrc),
  "Search input.",
);

assert(
  "status/inquiry/launch filters preserved",
  /statusFilter/.test(clientSrc) &&
    /opsView/.test(clientSrc) &&
    /launchFilter/.test(clientSrc),
  "Filter controls.",
);

assert(
  "export CSV link preserved",
  /\/api\/admin\/leads\/inbox\/export/.test(clientSrc),
  "Export CSV href.",
);

assert(
  "archive action on rows",
  /runLifecycle\(row, "archive"\)/.test(clientSrc) || /"archive"/.test(clientSrc),
  "Archive button/action.",
);

assert(
  "restore action in archived view",
  /runLifecycle\(row, "restore"\)/.test(clientSrc) || /"restore"/.test(clientSrc),
  "Restore button/action.",
);

assert(
  "delete with confirmation",
  /window\.confirm/.test(clientSrc) && /"delete"/.test(clientSrc),
  "Delete must require confirmation.",
);

assert(
  "lifecycle API route handles actions",
  /applyLeonixLeadLifecycleAdmin/.test(apiSrc) &&
    /"archive"/.test(apiSrc) &&
    /"restore"/.test(apiSrc) &&
    /"delete"/.test(apiSrc),
  "PATCH API lifecycle actions.",
);

assert(
  "data layer bucket filtering",
  /LeadInboxBucket/.test(dataSrc) &&
    /bucket === "active"/.test(dataSrc) &&
    /bucket === "archived"/.test(dataSrc) &&
    /\.is\("deleted_at", null\)/.test(dataSrc),
  "Active/archived queries exclude deleted leads.",
);

assert(
  "apply lifecycle soft archive/delete",
  /applyLeonixLeadLifecycleAdmin/.test(dataSrc) &&
    /archived_at/.test(dataSrc) &&
    /deleted_at/.test(dataSrc),
  "Soft archive/delete fields in data layer.",
);

assert(
  "export excludes deleted",
  (/fetchAllLeonixLeadsForExport/.test(exportSrc) &&
    /\.is\("deleted_at", null\)/.test(dataSrc)) ||
    /\.is\("deleted_at", null\)/.test(exportSrc),
  "CSV export excludes soft-deleted leads.",
);

for (const col of ["archived_at", "archived_by", "deleted_at", "deleted_by"]) {
  assert(`migration includes ${col}`, migration.includes(col), `Missing ${col} in migration.`);
}

assert(
  "view/email/phone/summary actions preserved",
  /AdminLaunchLeadRowActions/.test(clientSrc) &&
    /AdminLaunchLeadMobileCard/.test(clientSrc) &&
    /openDetail/.test(clientSrc) &&
    /copyValue\("Email"/.test(clientSrc) &&
    /copyValue\("Reply"/.test(clientSrc),
  "Existing shared row/mobile actions must remain.",
);

assert(
  "no public lead capture changes",
  !leadCaptureSrc.includes("archived_at") && !leadCaptureSrc.includes("deleted_at"),
  "Public lead capture insert should not set lifecycle fields.",
);

assert(
  "no stripe changes in lead inbox files",
  !/stripe/i.test(clientSrc + pageSrc + dataSrc + apiSrc),
  "Lead inbox work must not touch Stripe.",
);

assert(
  "no category queue changes",
  !/categoryQueue|category_queue|listingQueue/i.test(clientSrc + pageSrc),
  "Lead inbox work must not touch category queues.",
);

assert(
  "npm script registered",
  /verify:admin-leads-inbox-ui-lifecycle/.test(pkg),
  "package.json must register verify:admin-leads-inbox-ui-lifecycle.",
);

const failed = checks.filter((c) => !c.ok);

if (failed.length) {
  console.error("verify:admin-leads-inbox-ui-lifecycle FAILED\n");
  for (const c of failed) {
    console.error(`  ✗ ${c.name}`);
    if (c.detail) console.error(`    ${c.detail}`);
  }
  process.exit(1);
}

console.log(`verify:admin-leads-inbox-ui-lifecycle PASS (${checks.length} checks)`);
