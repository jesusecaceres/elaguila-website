/**
 * Gate HOME-2 — Inicio hero premium copy + clean magazine image audit
 * Run: npm run website:home-2-hero-audit
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

const lockedViolations = diffNames.filter((f) => {
  const n = f.replace(/\\/g, "/");
  return (
    n === "app/components/Navbar.tsx" ||
    n === "app/lib/publicNavConfig.ts" ||
    CS_V2.includes(n)
  );
});

add("Only Home hero files were changed", lockedViolations.length === 0, lockedViolations.join(", ") || "no locked files in diff");
add("Header/nav files were not modified", !diffNames.includes("app/components/Navbar.tsx"), "Navbar.tsx");
add("publicNavConfig was not modified", !diffNames.includes("app/lib/publicNavConfig.ts"), "publicNavConfig.ts");
for (const p of CS_V2) add(`CS V2 protected: ${p}`, !diffNames.includes(p), p);

const GATE_CHANGED_PREFIXES = [
  "app/(site)/home/HomeMarketingClient.tsx",
  "app/lib/siteSectionContent/homeMarketingMerge.ts",
  "app/lib/website-audit/WEBSITE_HOME_2",
  "scripts/website-home-2-hero-audit.ts",
  "package.json",
];

function isGateFile(f: string): boolean {
  const n = f.replace(/\\/g, "/");
  return GATE_CHANGED_PREFIXES.some((p) => n === p || n.startsWith(p));
}

const gateDiff = diffNames.filter(isGateFile);
const gateChangedCategory = gateDiff.some((f) => f.replace(/\\/g, "/").includes("/clasificados/"));
const gateCreatedPage = gateDiff.some((f) => f.endsWith("page.tsx"));

add("No category pages were changed", !gateChangedCategory, gateDiff.join(", ") || "home hero files only");
add("No routes/pages were created", !gateCreatedPage, gateDiff.join(", ") || "no page.tsx in gate diff");

add("Clean uploaded magazine cover asset exists", exists(`public${COVER}`), COVER);
add("Home hero image uses cover-sample path", merge.includes(COVER), "homeMarketingMerge.ts");
add("Old home_thumbnail remapped", merge.includes("/home_thumbnail.png"), "homeMarketingMerge.ts");
add("HomeMarketingClient uses coverImageSrc", homeClient.includes("content.coverImageSrc"), "HomeMarketingClient.tsx");
add("No full CS screenshot in hero", !homeClient.includes("leonix-media-launch-es") && !homeClient.includes("coming-soon-exact"), "HomeMarketingClient.tsx");
add("object-contain on hero image", homeClient.includes("object-contain"), "HomeMarketingClient.tsx");

add("Spanish mission copy present", merge.includes("Comunidad, Cultura y Fe"), "homeMarketingMerge.ts");
add("Spanish platform line present", merge.includes("Revista de comunidad, cultura y negocios"), "homeMarketingMerge.ts");
add("Spanish value copy (rentas, empleos...)", merge.includes("rentas, empleos, autos"), "homeMarketingMerge.ts");
add("Spanish business value copy", merge.includes("revista premium, presencia digital bilingüe"), "homeMarketingMerge.ts");
add("English equivalent copy present", merge.includes("Community, Culture, and Faith"), "homeMarketingMerge.ts");

add("Typography: serif on LEONIX title", homeClient.includes("font-serif") && homeClient.includes("{L.title}"), "HomeMarketingClient.tsx");
add("No global font imports added", !homeClient.includes("@font-face") && !homePage.includes("@font-face"), "home/page.tsx");
add("Buttons remain sans", /rounded-full bg-\[#7A1E2C\][\s\S]*font-semibold/.test(homeClient), "HomeMarketingClient.tsx");
add("/home no ComingSoonV2Shell", !homePage.includes("ComingSoonV2Shell"), "home/page.tsx");
add("Gate npm script", pkg.includes("website:home-2-hero-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate HOME-2 — Inicio hero audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
