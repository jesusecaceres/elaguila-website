/**
 * ADMIN-SERVICIOS-OPS-PRESENTATION-01 verification.
 * Run: npm run verify:admin-servicios-ops-presentation
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

const page = "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx";
const card = "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx";
const monetization = "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminMonetizationPanel.tsx";
const chrome = "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsChrome.tsx";
const rowActions = "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx";
const registry = "app/admin/_lib/adminOsActionRegistry.ts";
const server = "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts";
const audit = "app/admin/(dashboard)/workspace/clasificados/servicios/SERVICIOS_OPS_PRESENTATION_AUDIT.md";
const pkg = "package.json";

const pageSrc = read(page);
const cardSrc = read(card);
const monetSrc = read(monetization);
const chromeSrc = read(chrome);
const actionsSrc = read(rowActions);
const registrySrc = read(registry);
const pkgSrc = read(pkg);

assert("servicios route exists", exists(page), page);
assert("source table text", pageSrc.includes("servicios_public_listings"), page);
assert("command header", pageSrc.includes("servicios-admin-command-header"), page);
assert("supabase truth card", pageSrc.includes("servicios-admin-supabase-truth"), page);
assert("audit doc", exists(audit), audit);
assert("filter panel", chromeSrc.includes("servicios-admin-filter-panel") && chromeSrc.includes('["slug", "slug"'), chrome);
assert("card-first list", pageSrc.includes("servicios-admin-listing-cards") && pageSrc.includes("ServiciosAdminOpsListingCard"), page);
assert("listing card component", cardSrc.includes("servicios-admin-listing-card"), card);
assert("advanced table collapsible", pageSrc.includes("servicios-advanced-table") && pageSrc.includes("<details"), page);
assert("not default wide 13-col", !pageSrc.includes("<th className=\"p-3\">Monetization</th>"), page);
assert("monetization panel", monetSrc.includes("servicios-admin-monetization-panel") && monetSrc.includes("rounded-lg"), monetization);
assert(
  "lifecycle move suspend archive",
  actionsSrc.includes("runConfirmed") &&
    actionsSrc.includes('"suspend"') &&
    actionsSrc.includes('"archive"') &&
    registrySrc.includes('label: "Suspend"') &&
    registrySrc.includes('label: "Archive"') &&
    cardSrc.includes('layout="card"'),
  card,
);
assert(
  "verify leonix",
  registrySrc.includes('label: "Verify Leonix"') &&
    actionsSrc.includes('"verify_on"') &&
    cardSrc.includes("setServiciosListingLeonixVerifiedAction"),
  card,
);
assert("feature action", registrySrc.includes('label: "Feature"') && actionsSrc.includes('"promote_on"'), rowActions);
assert("public view", cardSrc.includes("/clasificados/servicios/"), card);
assert("publish link", chromeSrc.includes("Publish") && pageSrc.includes("publishHref"), chrome);
assert("queue live links", chromeSrc.includes("Ad queue") && chromeSrc.includes("Live listings"), chrome);
assert(
  "rectangle ctas",
  chromeSrc.includes("rounded-lg") &&
    cardSrc.includes("rounded-lg") &&
    chromeSrc.includes('variant="primary"'),
  chrome,
);
assert("no rounded-full main ctas", !chromeSrc.includes("rounded-full") && !cardSrc.includes("rounded-full"), chrome);
assert(
  "semantic colors",
  chromeSrc.includes('variant="primary"') &&
    chromeSrc.includes('variant="active"') &&
    chromeSrc.includes('variant="view"') &&
    actionsSrc.includes('variant="warning"'),
  chrome,
);
assert("mobile safe", pageSrc.includes("overflow-x-hidden") && pageSrc.includes("min-w-0"), page);
assert("truthful empty", pageSrc.includes("servicios-admin-empty-state"), page);
assert("read error surfaced", pageSrc.includes("readError") || read(server).includes("readError"), server);
assert("no public page changes", !exists("app/(site)/clasificados/servicios/page.tsx") || !read("app/(site)/clasificados/servicios/page.tsx").includes("servicios-admin-ops-page"), page);
assert("no migrations added", !fs.readdirSync(path.join(root, "supabase/migrations")).some((f) => /servicios.ops.presentation/i.test(f)), "migrations");
assert("verify registered", pkgSrc.includes("verify:admin-servicios-ops-presentation"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-servicios-ops-presentation FAILED\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? `: ${String(f.detail).slice(0, 160)}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-servicios-ops-presentation PASS (${checks.length} checks)`);
