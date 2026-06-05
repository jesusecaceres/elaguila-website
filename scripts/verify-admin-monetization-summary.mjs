import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

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
const mapperPath = "app/admin/_lib/buildAdminListingMonetizationInput.ts";
const listingsTablePath = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";

const adminPaths = [
  componentPath,
  mapperPath,
  listingsTablePath,
  "app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/travel/page.tsx",
];

assert("Admin summary component exists", fs.existsSync(path.join(root, componentPath)), componentPath);
assert("Admin input mapper exists", fs.existsSync(path.join(root, mapperPath)), mapperPath);

const component = read(componentPath);
const mapper = read(mapperPath);
const componentCodeOnly = component.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const mapperCodeOnly = mapper.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

assert(
  "component uses resolveCategoryListingMonetization",
  /resolveCategoryListingMonetization/.test(component),
  "Admin summary must use the GA2 resolver.",
);

assert(
  "component uses buildAdminListingMonetizationInput",
  /buildAdminListingMonetizationInput/.test(component),
  "Admin summary must map row fields through the shared admin input builder.",
);

assert(
  "mapper has no Supabase calls",
  !/fetch\(|getAdminSupabase|\.from\(|\.insert\(|\.update\(|\.delete\(/.test(mapperCodeOnly),
  "Row input mapper must not query Supabase per row.",
);

assert(
  "component has no Supabase calls",
  !/fetch\(|getAdminSupabase|\.from\(|\.insert\(|\.update\(|\.delete\(/.test(componentCodeOnly),
  "Admin summary must not query Supabase per row.",
);

assert(
  "component has no monetization action controls",
  !/<button\b|<form\b|onClick=|stripe|checkout|promo\s*code|pay\s*now|buy\s*boost|upgrade/i.test(componentCodeOnly),
  "Gate F must not add payment, promo, or monetization activation controls.",
);

assert(
  "verified labeled as trust not paid",
  /Trust\/admin verification.*not paid visibility/i.test(component),
  "Verified badge must clarify trust/admin verification is not paid visibility.",
);

for (const toolKey of [
  "republish",
  "moveToTop",
  "featured",
  "verified",
  "boost",
  "autoRefresh",
  "analytics",
  "leads",
  "concierge",
  "expirationRenewal",
]) {
  assert(`tool badge key: ${toolKey}`, new RegExp(`key:\\s*"${toolKey}"`).test(component), `Missing tool badge ${toolKey}.`);
}

assert(
  "republish and featured are separate badges",
  /key:\s*"republish"/.test(component) && /key:\s*"featured"/.test(component),
  "Republish and Featured must be separate badges.",
);

assert(
  "boost and autoRefresh badges present",
  /key:\s*"boost"/.test(component) && /key:\s*"autoRefresh"/.test(component),
  "Future tools must render with explicit badges.",
);

assert(
  "warnings/gaps render path exists",
  /catalogWarnings|compactWarnings|summary\.gaps/.test(component),
  "Structured warnings/gaps must be visible in admin summary.",
);

assert(
  "plan/tier visible",
  /displayPlanLabel|planKind|listingTier|pipelineClassification/.test(component),
  "Plan/tier/pipeline must be visible in admin summary.",
);

assert(
  "generic listings table wired",
  /AdminListingMonetizationSummary/.test(read(listingsTablePath)) && /source="listings"/.test(read(listingsTablePath)),
  "AdminListingsTable must render monetization summary for generic listings.",
);

for (const [name, rel, source] of [
  ["Restaurantes", "app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx", "restaurantes_public_listings"],
  ["Servicios", "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx", "servicios_public_listings"],
  ["Autos", "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx", "autos_classifieds_listings"],
  ["Empleos", "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx", "empleos_public_listings"],
  ["Viajes", "app/admin/(dashboard)/workspace/clasificados/travel/page.tsx", "viajes_staged_listings"],
]) {
  const text = read(rel);
  assert(
    `${name} queue wired`,
    /AdminListingMonetizationSummary/.test(text) && text.includes(`source="${source}"`),
    `${name} admin queue must render read-only monetization summary.`,
  );
}

const publicDashboardForbidden = [
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/(site)/dashboard/analytics/page.tsx",
];
for (const rel of publicDashboardForbidden) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const before = read(rel);
  assert(
    `no Gate F edits in ${rel}`,
    !before.includes("buildAdminListingMonetizationInput"),
    "User dashboard files must not be changed for Gate F.",
  );
}

const tsxPath = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
if (fs.existsSync(tsxPath)) {
  const probe = `
    import { resolveCategoryListingMonetization } from "./app/lib/listingPlans/categoryListingMonetization.ts";
    import { buildAdminListingMonetizationInput } from "./app/admin/_lib/buildAdminListingMonetizationInput.ts";
    const enPro = resolveCategoryListingMonetization(buildAdminListingMonetizationInput({
      category: "en-venta",
      sourceTable: "listings",
      row: {
        id: "1",
        detail_pairs: [{ label: "Leonix:plan", value: "pro" }],
        republished_at: "2026-01-01T00:00:00Z",
        status: "active",
        is_published: true,
      },
    }));
    const rentasProLeak = resolveCategoryListingMonetization({
      category: "rentas",
      sourceTable: "listings",
      listing: { id: "2" },
      categoryPlan: { key: "en_venta_pro", labelEn: "Pro", labelEs: "Pro", isPaid: true, isFree: false, isAffiliate: false, isBusiness: false, isPrivate: false },
    });
    const clases = resolveCategoryListingMonetization(buildAdminListingMonetizationInput({
      category: "clases",
      sourceTable: "listings",
      row: { id: "3", status: "active" },
    }));
    const boostFuture = resolveCategoryListingMonetization(buildAdminListingMonetizationInput({
      category: "servicios",
      sourceTable: "servicios_public_listings",
      row: { id: "4", listing_plan: "business" },
    }));
    console.log(JSON.stringify({
      enProRepublish: enPro.tools.republish.status,
      enProNotFeatured: enPro.tools.featured.key === "featured",
      rentasLeak: rentasProLeak.gaps.some((g) => g.code === "en_venta_pro_leak"),
      clasesReady: clases.isClientReady,
      boostFuture: boostFuture.tools.boost.status,
      autoFuture: boostFuture.tools.autoRefresh.status,
    }));
  `;
  const r = spawnSync(process.execPath, [tsxPath, "--eval", probe], { cwd: root, encoding: "utf8" });
  if (r.status === 0) {
    const out = JSON.parse((r.stdout || "").trim().split("\n").pop());
    assert("runtime en-venta pro republish available", out.enProRepublish === "available", out.enProRepublish);
    assert("runtime republish separate from featured", out.enProNotFeatured === true, "Featured key must differ.");
    assert("runtime en-venta pro not global", out.rentasLeak === true, "Rentas must flag en_venta_pro leak.");
    assert("runtime clases not client-ready", out.clasesReady === false, "Clases must not be client-ready.");
    assert("runtime boost future", out.boostFuture === "future", out.boostFuture);
    assert("runtime autoRefresh future", out.autoFuture === "future", out.autoFuture);
  } else {
    assert("runtime resolver probe", false, r.stderr || r.stdout);
  }
} else {
  assert("runtime resolver probe", false, "tsx not installed");
}

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) process.exitCode = 1;
