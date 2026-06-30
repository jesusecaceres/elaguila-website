import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const componentPath = "app/admin/(dashboard)/workspace/clasificados/_components/AdminListingMonetizationSummary.tsx";
const listingsTablePath = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";
const docsPath = "docs/category-listing-monetization-read-model.md";
const adminDocsPath = "docs/admin-workspace-smoke-test.md";

assert(
  "Admin visibility component exists",
  fs.existsSync(path.join(root, componentPath)),
  "Expected AdminListingMonetizationSummary component under the Admin Clasificados components folder.",
);

const component = read(componentPath);
const componentCodeOnly = component
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

assert(
  "component uses resolveCategoryListingMonetization",
  /resolveCategoryListingMonetization/.test(component),
  "Admin visibility must render the Gate E read model, not duplicate monetization logic.",
);

assert(
  "component does not use profile membership fields",
  !/profiles\.membership_tier|membership_tier|membershipTier/.test(componentCodeOnly),
  "Admin visibility must not use account membership as listing monetization truth.",
);

assert(
  "component does not use business account tiers",
  !/business_lite|business_premium/.test(componentCodeOnly),
  "Admin visibility must not map account business tiers into category monetization.",
);

assert(
  "component does not activate legacy boost expiration",
  /legacy_boost_expires/.test(componentCodeOnly) && !/boost_expires[\s\S]{0,120}available/i.test(componentCodeOnly),
  "Admin visibility may warn about legacy boost_expires but must not treat it as active monetization.",
);

assert(
  "component has no checkout or pricing controls",
  !/stripe|checkout|pricing|promo\s*code|promocode/i.test(componentCodeOnly),
  "Gate F must not add Stripe, checkout, pricing, or promo-code controls.",
);

assert(
  "component has no write controls",
  !/<button\b|<form\b|onClick=|action=|fetch\(|\.insert\(|\.update\(|\.delete\(/.test(componentCodeOnly),
  "Gate F Admin summary must be read-only and contain no write controls.",
);

const listingsTable = read(listingsTablePath);
assert(
  "public.listings Admin table references component",
  /AdminListingMonetizationSummary/.test(listingsTable) &&
    /source="listings"/.test(listingsTable),
  "Shared public.listings Admin table must render the read-only monetization summary.",
);

for (const [name, rel, source] of [
  ["Servicios", "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx", "servicios_public_listings"],
  ["Restaurantes", "app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx", "restaurantes_public_listings"],
  ["Autos", "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx", "autos_classifieds_listings"],
  ["Empleos", "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx", "empleos_public_listings"],
  ["Viajes", "app/admin/(dashboard)/workspace/clasificados/travel/page.tsx", "viajes_staged_listings"],
]) {
  const text = read(rel);
  const serviciosSpecificReadonly =
    name === "Servicios" &&
    /ServiciosAdminOpsListingCard/.test(text) &&
    /ServiciosAdminMonetizationPanel/.test(
      read("app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx"),
    );
  assert(
    `${name} Admin page references component`,
    serviciosSpecificReadonly || (/AdminListingMonetizationSummary/.test(text) && text.includes(`source="${source}"`)),
    `${name} should show safe read-only monetization metadata or be explicitly documented as a gap.`,
  );
}

const docs = read(docsPath);
const adminDocs = read(adminDocsPath);
assert(
  "docs mention Admin visibility is read-only",
  /Gate F wires this model into Admin as read-only visibility/i.test(docs) &&
    /does not create actions/i.test(docs),
  "Category listing monetization docs must describe Gate F as read-only Admin visibility.",
);

assert(
  "docs say Gate F is not monetization activation",
  /not pricing, Stripe, promo codes, checkout, public paid placement/i.test(docs),
  "Docs must keep pricing, Stripe, promo codes, and public paid placement out of Gate F.",
);

assert(
  "Admin smoke docs include Gate F browser QA",
  /Gate F browser smoke/i.test(adminDocs) &&
    /Dashboard client display is a later gate/i.test(adminDocs),
  "Admin smoke docs must include Gate F browser QA and note Dashboard client UI is later.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
