/**
 * Gate CAT-STD-1 — Category landing + results standardization audit
 * Run: npm run website:cat-std-1-audit
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const LOCKED = [
  "app/components/Navbar.tsx",
  "app/lib/publicNavConfig.ts",
  "app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx",
  "app/(site)/coming-soon-v2/page.tsx",
  "app/(site)/coming-soon-v2/layout.tsx",
  "app/(site)/home/HomeMarketingClient.tsx",
  "app/(site)/magazine/page.tsx",
  "app/(site)/productos-promocionales/page.tsx",
];

const CATEGORY_SLUGS = [
  "en-venta",
  "rentas",
  "empleos",
  "bienes-raices",
  "servicios",
  "autos",
  "restaurantes",
  "viajes",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
];

const STANDARD_COMPONENTS = [
  "app/(site)/clasificados/components/categoryStandard/categoryStandardTheme.ts",
  "app/(site)/clasificados/components/categoryStandard/CategoryCompactHero.tsx",
  "app/(site)/clasificados/components/categoryStandard/CategoryStandardSearchRow.tsx",
  "app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell.tsx",
  "app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsFilterPanel.tsx",
];

let diffNames: string[] = [];
try {
  diffNames = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  diffNames = [];
}

const auditMd = "app/lib/website-audit/WEBSITE_CAT_STD_1_CATEGORY_LANDING_RESULTS_AUDIT.md";
const pkg = read("package.json");

add("Audit markdown exists", exists(auditMd), auditMd);
add("Audit npm script registered", pkg.includes("website:cat-std-1-audit"), "package.json");
add("Category standard components present", STANDARD_COMPONENTS.every(exists), STANDARD_COMPONENTS.join(", "));

for (const p of LOCKED) {
  add(`Locked file not in diff: ${path.basename(p)}`, !diffNames.includes(p), p);
}

const categoryDiffs = diffNames.filter(
  (f) => f.includes("clasificados") && (f.includes("categoryStandard") || CATEGORY_SLUGS.some((s) => f.includes(s))),
);
add("Category-scope files in diff", categoryDiffs.length > 0, categoryDiffs.slice(0, 8).join(", ") || "none");

const diffJoined = diffNames.join("\n");
add("No admin/dashboard in diff", !/admin|dashboard/i.test(diffJoined), "pattern scan");
add("No supabase migrations in diff", !diffNames.some((f) => f.includes("supabase/migrations")), "migrations");
add("No Stripe/payment routes in diff", !/stripe|payment/i.test(diffJoined), "pattern scan");

const fakePatterns = [/fake listing/i, /lorem ipsum business/i, /demo business name/i];
const catFiles = categoryDiffs.length ? categoryDiffs : STANDARD_COMPONENTS;
let fakeHit = "";
for (const f of catFiles) {
  if (!exists(f)) continue;
  const body = read(f);
  for (const re of fakePatterns) {
    if (re.test(body)) fakeHit = `${f}: ${re}`;
  }
}
add("No obvious fake listing strings in changed category files", !fakeHit, fakeHit || "ok");

const slugHits = CATEGORY_SLUGS.filter((slug) => {
  const inDiff = diffNames.some((f) => f.includes(slug));
  const inStd = exists(`app/(site)/clasificados/components/categoryStandard/categoryStandardTheme.ts`)
    ? read("app/(site)/clasificados/components/categoryStandard/categoryStandardTheme.ts").includes(slug)
    : false;
  return inDiff || inStd;
});
add("Representative category slugs covered", slugHits.length >= 10, `${slugHits.length}/12`);

add("Full CategoryStandardLandingBlock on comunidad", read("app/(site)/clasificados/comunidad/page.tsx").includes("CategoryStandardLandingBlock"), "comunidad/page.tsx");
add("Community results uses standard shell", read("app/(site)/clasificados/community/CommunityListingsResultsClient.tsx").includes("CategoryStandardResultsPageShell"), "CommunityListingsResultsClient");
add("Rentas results uses standard shell", read("app/(site)/clasificados/rentas/results/components/RentasResultsShell.tsx").includes("CategoryStandardResultsPageShell"), "RentasResultsShell");
add("Servicios results uses standard shell", read("app/(site)/clasificados/servicios/ServiciosResultsPageShell.tsx").includes("CategoryStandardResultsPageShell"), "ServiciosResultsPageShell");
add("Busco results uses CAT_STD filter panel", read("app/(site)/clasificados/busco/BuscoResultsClient.tsx").includes("CategoryStandardResultsFilterPanel"), "BuscoResultsClient");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate CAT-STD-1 audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
