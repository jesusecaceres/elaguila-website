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

const inboxClient = "app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx";
const newsletterClient = "app/admin/_components/leads/AdminNewsletterSubscribersInboxClient.tsx";
const mediaKitClient = "app/admin/_components/leads/AdminMediaKitLeadsClient.tsx";
const rowActions = "app/admin/_components/leads/AdminLaunchLeadRowActions.tsx";
const inboxDrawer = "app/admin/_components/leads/AdminLeonixLeadDetailDrawer.tsx";
const newsletterDrawer = "app/admin/_components/leads/AdminNewsletterSubscriberDetailDrawer.tsx";
const mediaKitDrawer = "app/admin/_components/leads/AdminMediaKitLeadDetailDrawer.tsx";
const leadsData = "app/admin/_lib/leonixLeadsData.ts";
const lifecycleMigration = "supabase/migrations/20260611120000_newsletter_media_kit_lifecycle.sql";
const packageJson = "package.json";

const inboxSrc = read(inboxClient);
const newsletterSrc = read(newsletterClient);
const mediaKitSrc = read(mediaKitClient);
const actionsSrc = read(rowActions);
const inboxDrawerSrc = read(inboxDrawer);
const newsletterDrawerSrc = read(newsletterDrawer);
const mediaKitDrawerSrc = read(mediaKitDrawer);
const dataSrc = read(leadsData);
const pkg = read(packageJson);

function routeHasActions(src, routeName) {
  return (
    /AdminLaunchLeadRowActions/.test(src) &&
    /label="View"/.test(actionsSrc) &&
    />\s*Reply\s*</.test(actionsSrc) &&
    /label="Email"/.test(actionsSrc) &&
    /label="Archive"/.test(actionsSrc) &&
    /label="Delete"/.test(actionsSrc) &&
    /label="Restore"/.test(actionsSrc) &&
    src.includes("AdminLaunchLeadRowActions")
  );
}

assert("shared row actions component", exists(rowActions), rowActions);
assert("inbox uses shared row actions", /AdminLaunchLeadRowActions/.test(inboxSrc), inboxClient);
assert("newsletter uses shared row actions", /AdminLaunchLeadRowActions/.test(newsletterSrc), newsletterClient);
assert("media-kit uses shared row actions", /AdminLaunchLeadRowActions/.test(mediaKitSrc), mediaKitClient);

assert("actions: View button", /label="View"/.test(actionsSrc), "AdminLaunchLeadRowActions must render View");
assert("actions: Reply link", />\s*Reply\s*</.test(actionsSrc), "AdminLaunchLeadRowActions must render Reply");
assert("actions: Email button", /label="Email"/.test(actionsSrc), "AdminLaunchLeadRowActions must render Email");
assert("actions: Phone when tel", />\s*Phone\s*</.test(actionsSrc), "AdminLaunchLeadRowActions must render Phone");
assert("actions: Archive", /label="Archive"/.test(actionsSrc), "AdminLaunchLeadRowActions must render Archive");
assert("actions: Restore", /label="Restore"/.test(actionsSrc), "AdminLaunchLeadRowActions must render Restore");
assert("actions: Delete", /label="Delete"/.test(actionsSrc), "AdminLaunchLeadRowActions must render Delete");
assert("actions: Copy reply preserved", /Copy reply/.test(actionsSrc), "Copy reply secondary action");

assert("inbox detail drawer", exists(inboxDrawer) && /Full message/.test(inboxDrawerSrc), inboxDrawer);
assert("newsletter detail drawer", exists(newsletterDrawer) && /Interests/.test(newsletterDrawerSrc), newsletterDrawer);
assert("media-kit detail drawer", exists(mediaKitDrawer) && /Full message/.test(mediaKitDrawerSrc), mediaKitDrawer);

assert("inbox archived ops view", /Archived/.test(inboxSrc) && /"archived"/.test(inboxSrc), "Inbox archived tab");
assert("newsletter archived folder", /Archived/.test(newsletterSrc) && /setFolder\("archived"\)/.test(newsletterSrc), newsletterClient);
assert("media-kit archived folder", /Archived/.test(mediaKitSrc) && /setFolder\("archived"\)/.test(mediaKitSrc), mediaKitClient);

assert(
  "newsletter lifecycle API",
  exists("app/api/admin/leads/newsletter/[id]/route.ts") && /applyNewsletterLifecycleAdmin/.test(read("app/api/admin/leads/newsletter/[id]/route.ts")),
  "newsletter PATCH lifecycle",
);

assert(
  "media-kit lifecycle API",
  exists("app/api/admin/leads/media-kit/[id]/route.ts") && /applyMediaKitLifecycleAdmin/.test(read("app/api/admin/leads/media-kit/[id]/route.ts")),
  "media-kit PATCH lifecycle",
);

assert(
  "newsletter interests chips",
  /InterestChips|parseInterestChips/.test(newsletterSrc),
  "Newsletter interests readable",
);

assert(
  "reply templates media kit URL",
  read("app/admin/_lib/leonixLeadReplyTemplates.ts").includes(MEDIA_KIT_URL),
  MEDIA_KIT_URL,
);

assert(
  "reply templates magazine URL",
  read("app/admin/_lib/leonixLeadReplyTemplates.ts").includes(MAGAZINE_URL),
  MAGAZINE_URL,
);

assert(
  "delete confirmation",
  /window\.confirm/.test(inboxSrc + newsletterSrc + mediaKitSrc),
  "Delete requires confirmation",
);

assert(
  "filters preserved inbox",
  /type="search"/.test(inboxSrc) && /statusFilter/.test(inboxSrc),
  inboxClient,
);

assert(
  "filters preserved newsletter",
  /type="search"/.test(newsletterSrc) && /statusFilter/.test(newsletterSrc),
  newsletterClient,
);

assert(
  "CSV export preserved",
  /\/api\/admin\/leads\/inbox\/export/.test(inboxSrc) &&
    /\/api\/admin\/leads\/newsletter\/export/.test(newsletterSrc) &&
    /\/api\/admin\/leads\/media-kit\/export/.test(mediaKitSrc),
  "All three routes export CSV",
);

assert(
  "zebra rows all routes",
  /adminTableZebraRow/.test(inboxSrc + newsletterSrc + mediaKitSrc),
  "Zebra striping",
);

assert(
  "lifecycle data layer newsletter media-kit",
  /applyNewsletterLifecycleAdmin/.test(dataSrc) &&
    /applyMediaKitLifecycleAdmin/.test(dataSrc) &&
    /\.is\("deleted_at", null\)/.test(dataSrc),
  leadsData,
);

assert(
  "lifecycle migration file",
  exists(lifecycleMigration) && read(lifecycleMigration).includes("leonix_newsletter_subscribers"),
  lifecycleMigration,
);

assert("npm script", /verify:admin-leads-crm/.test(pkg), packageJson);

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
