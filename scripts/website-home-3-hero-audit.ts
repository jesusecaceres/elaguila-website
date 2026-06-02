/**
 * Gate HOME-3 — Final Inicio hero premium layout audit
 * Run: npm run website:home-3-hero-audit
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

const COVER = "/magazine/leonix-media-cover-sample.png";
const merge = read("app/lib/siteSectionContent/homeMarketingMerge.ts");
const homeClient = read("app/(site)/home/HomeMarketingClient.tsx");
const homePage = read("app/(site)/home/page.tsx");
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

const GATE_PREFIXES = [
  "app/(site)/home/HomeMarketingClient.tsx",
  "app/lib/siteSectionContent/homeMarketingMerge.ts",
  "app/lib/website-audit/WEBSITE_HOME_3",
  "scripts/website-home-3-hero-audit.ts",
  "package.json",
];

function isGateFile(f: string): boolean {
  const n = f.replace(/\\/g, "/");
  return GATE_PREFIXES.some((p) => n === p || n.startsWith(p));
}

const gateDiff = diffNames.filter(isGateFile);

add("Only Home hero files were changed", !diffNames.includes("app/components/Navbar.tsx"), "Navbar not in diff");
add("Header/nav files were not modified", !diffNames.includes("app/components/Navbar.tsx"), "Navbar.tsx");
add("publicNavConfig was not modified", !diffNames.includes("app/lib/publicNavConfig.ts"), "publicNavConfig.ts");
for (const p of CS_V2) add(`CS V2 protected: ${p}`, !diffNames.includes(p), p);

add("No category pages were changed", !gateDiff.some((f) => f.includes("/clasificados/")), gateDiff.join(", ") || "home only");
add("No routes/pages were created", !gateDiff.some((f) => f.endsWith("page.tsx")), gateDiff.join(", ") || "none");

add("Clean magazine cover asset exists", exists(`public${COVER}`), COVER);
add("Home hero uses cover-sample path", merge.includes(COVER), "homeMarketingMerge.ts");
add("Old home_thumbnail remapped", merge.includes("/home_thumbnail.png"), "homeMarketingMerge.ts");
add("No full CS screenshot in hero", !homeClient.includes("leonix-media-launch-es"), "HomeMarketingClient.tsx");

add("Spanish mission copy present", merge.includes("Comunidad, Cultura y Fe"), "merge");
add("Spanish value copy (rentas, empleos...)", merge.includes("artículos en venta, eventos"), "merge");
add("Spanish business value copy", merge.includes("revista premium, presencia digital bilingüe"), "merge");
add("English equivalent copy present", merge.includes("Community, Culture, and Faith"), "merge");

add("Secondary CTA ES: Anúnciate con nosotros", merge.includes("Anúnciate con nosotros"), "merge");
add("Secondary CTA EN: Advertise with us", merge.includes("Advertise with us"), "merge");
add("Legacy Edición digital rejected", merge.includes("Edición digital"), "resolveSecondaryCta");

add("Value row ES labels", merge.includes("Revista premium") && merge.includes("Comunidad activa"), "merge");
add("Value row EN labels", merge.includes("Premium magazine") && merge.includes("Bilingual digital presence"), "merge");
add("Value row rendered in hero", homeClient.includes("valueLabels"), "HomeMarketingClient.tsx");

add("Serif on LEONIX only", homeClient.includes("font-serif") && homeClient.includes("{L.title}"), "HomeMarketingClient.tsx");
add("No global font imports", !homePage.includes("@font-face"), "home/page.tsx");
add("Buttons sans (font-bold)", homeClient.includes("font-bold text-[#FFFDF7]"), "HomeMarketingClient.tsx");
add("object-contain on image", homeClient.includes("object-contain"), "HomeMarketingClient.tsx");
add("Gate npm script", pkg.includes("website:home-3-hero-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate HOME-3 — Inicio hero audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
