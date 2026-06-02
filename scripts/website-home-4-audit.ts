/**
 * Gate HOME-4 — Header spacing + Home premium + Destacados audit
 * Run: npm run website:home-4-audit
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

const navbar = read("app/components/Navbar.tsx");
const homeClient = read("app/(site)/home/HomeMarketingClient.tsx");
const merge = read("app/lib/siteSectionContent/homeMarketingMerge.ts");
const featured = read("app/(site)/home/homeFeaturedBusinesses.ts");
const destacados = read("app/(site)/home/HomeDestacadosSection.tsx");
const pkg = read("package.json");

const CS_V2 = [
  "app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx",
  "app/(site)/coming-soon-v2/page.tsx",
  "app/(site)/coming-soon-v2/layout.tsx",
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

for (const p of CS_V2) add(`CS V2 protected: ${p}`, !diffNames.includes(p), p);

add("Header brand spacing improved", navbar.includes("2xl:gap-x-10") && navbar.includes("2xl:justify-self-start"), "Navbar.tsx");
add("Header no Leonix MediaHome merge", navbar.includes("2xl:pe-1") && navbar.includes("2xl:gap-x-10"), "Navbar.tsx");
add("Nav labels preserved", !navbar.includes("Cupones") && navbar.includes("PUBLIC_NAV_DESKTOP"), "Navbar.tsx");
add("Más menu preserved", navbar.includes("PUBLIC_NAV_MAS_ITEMS"), "Navbar.tsx");

add("Home hero alignment improved", homeClient.includes("lg:self-center"), "HomeMarketingClient.tsx");
add("Magazine cover path", merge.includes("/magazine/leonix-media-cover-sample.png"), "homeMarketingMerge.ts");
add("object-contain on magazine", homeClient.includes("object-contain"), "HomeMarketingClient.tsx");
add("Home visual rhythm sections", homeClient.includes("home-ecosystem-title") && homeClient.includes("home-pillars-title"), "HomeMarketingClient.tsx");
add("Serif title / sans body", homeClient.includes("font-serif") && homeClient.includes("font-bold"), "HomeMarketingClient.tsx");

add("Destacados section exists", homeClient.includes("HomeDestacadosSection"), "HomeMarketingClient.tsx");
add("Supports up to 7 featured", featured.includes("MAX_HOME_FEATURED_BUSINESSES = 7"), "homeFeaturedBusinesses.ts");
add("Layout for 5 items", destacados.includes("count === 5"), "HomeDestacadosSection.tsx");
add("No fake business names in config", featured.includes("HOME_FEATURED_BUSINESSES: HomeFeaturedBusiness[] = []"), "homeFeaturedBusinesses.ts");
add("Reserved empty state", destacados.includes("copy.reserved"), "HomeDestacadosSection.tsx");
add("No fake phone numbers", !destacados.match(/\+1|\(\d{3}\)/), "HomeDestacadosSection.tsx");

add("No category pages in gate diff", !diffNames.some((f) => f.includes("/clasificados/") && !f.includes("/home/")), diffNames.join(", ") || "none");
add("Gate npm script", pkg.includes("website:home-4-audit"), "package.json");
add("Cover asset exists", exists("public/magazine/leonix-media-cover-sample.png"), "public asset");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate HOME-4 audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
