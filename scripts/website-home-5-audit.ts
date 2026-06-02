/**
 * Gate HOME-5 — Responsive header + Featured placement audit
 * Run: npm run website:home-5-audit
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];
function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const navbar = read("app/components/Navbar.tsx");
const navConfig = read("app/lib/publicNavConfig.ts");
const home = read("app/(site)/home/HomeMarketingClient.tsx");
const featured = read("app/(site)/home/homeFeaturedBusinesses.ts");

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

add("Responsive priority nav", navConfig.includes("PUBLIC_NAV_PRIORITY_HIGH"), "publicNavConfig.ts");
add("Mid tier moves to Más on compact", navbar.includes("hidden xl:inline") && navbar.includes("xl:hidden"), "Navbar.tsx");
add("Desktop nav at lg not 2xl only", navbar.includes("lg:flex") && !navbar.includes("2xl:flex 2xl"), "Navbar.tsx");
add("Hamburger lg:hidden", navbar.includes("lg:hidden"), "Navbar.tsx");
add("Brand spacing lg+", navbar.includes("lg:gap-x-8 xl:gap-x-10"), "Navbar.tsx");
add("No Cupones in nav config", !navConfig.includes("Cupones"), "publicNavConfig.ts");
add("No Iglesias in nav config", !navConfig.includes("Iglesias"), "publicNavConfig.ts");

const heroEnd = home.indexOf("</section>");
const destacadosPos = home.indexOf("HomeDestacadosSection");
const ecosystemPos = home.indexOf("home-ecosystem-title");
add("Featured before ecosystem", destacadosPos > 0 && ecosystemPos > destacadosPos && destacadosPos < ecosystemPos, "HomeMarketingClient.tsx");

add("5 core slots constant", featured.includes("CORE_HOME_FEATURED_SLOTS = 5"), "homeFeaturedBusinesses.ts");
add("Max 7 slots", featured.includes("MAX_HOME_FEATURED_BUSINESSES = 7"), "homeFeaturedBusinesses.ts");
add("Empty featured array", featured.includes("HOME_FEATURED_BUSINESSES: HomeFeaturedBusiness[] = []"), "homeFeaturedBusinesses.ts");
add("Hero preserved", home.includes("L.title") && home.includes("coverImageSrc"), "HomeMarketingClient.tsx");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate HOME-5 audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
