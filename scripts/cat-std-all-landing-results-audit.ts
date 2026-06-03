/**
 * Gate CAT-STD-ALL — category landing + results audit
 * Run: npm run cat:std-all-audit
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const AUDIT = "app/lib/website-audit/CAT_STD_ALL_LANDING_RESULTS_AUDIT.md";

const SLUGS = [
  "en-venta",
  "rentas",
  "empleos",
  "autos",
  "bienes-raices",
  "servicios",
  "restaurantes",
  "viajes",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
];

const LOCKED = [
  "app/components/Navbar.tsx",
  "app/(site)/home/HomeMarketingClient.tsx",
  "app/(site)/coming-soon-v2/page.tsx",
  "app/(site)/magazine/page.tsx",
  "app/(site)/productos-promocionales/page.tsx",
];

function exists(rel: string) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];
const add = (r: string, p: boolean, e: string) => rows.push({ requirement: r, pass: p, evidence: e });

let diff: string[] = [];
try {
  diff = execSync("git diff --name-only", { encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  diff = [];
}

add("Audit markdown exists", exists(AUDIT), AUDIT);
add("package script cat:std-all-audit", read("package.json").includes("cat:std-all-audit"), "package.json");

for (const slug of SLUGS) {
  const resultsPage = `app/(site)/clasificados/${slug}/results/page.tsx`;
  const resultadosPage = `app/(site)/clasificados/${slug}/resultados/page.tsx`;
  const hasResults = exists(resultsPage) || (slug === "en-venta" && exists(resultsPage)) || (slug === "rentas" && exists(resultsPage));
  const ok =
    exists(resultsPage) ||
    (["en-venta", "rentas", "clases", "comunidad"].includes(slug) && exists(resultsPage)) ||
    exists(resultadosPage);
  add(`${slug} results route exists`, ok, exists(resultsPage) ? resultsPage : resultadosPage || "missing");
}

add("CategoryStandardLandingPage component", exists("app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage.tsx"), "ok");
add("categoryStandardRoutes helper", exists("app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts"), "ok");

for (const p of LOCKED) add(`Locked: ${path.basename(p)}`, !diff.includes(p), p);

const failed = rows.filter((r) => !r.pass);
console.log("# CAT-STD-ALL audit\n");
for (const r of rows) console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}`);
  process.exit(1);
}
