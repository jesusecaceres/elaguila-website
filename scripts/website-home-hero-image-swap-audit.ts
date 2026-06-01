/**
 * Gate HOME-HERO-IMAGE-SWAP audit
 * Run: npm run website:home-hero-image-swap-audit
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

const auditPath = "app/lib/website-audit/WEBSITE_HOME_HERO_IMAGE_SWAP_AUDIT.md";
const merge = read("app/lib/siteSectionContent/homeMarketingMerge.ts");
const homeClient = read("app/(site)/home/HomeMarketingClient.tsx");
const navbar = exists("app/components/Navbar.tsx") ? read("app/components/Navbar.tsx") : "";
const pkg = read("package.json");

const CS_V2_PROTECTED = [
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

const APPROVED = "/magazine/leonix-media-magazine-mockup-es.png";
const LEGACY = "/home_thumbnail.png";

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);

for (const p of CS_V2_PROTECTED) {
  add(`CS V2 protected: ${p}`, !diffNames.includes(p), p);
}

add("Header untouched", !diffNames.includes("app/components/Navbar.tsx"), "Navbar.tsx");
add("Approved asset file exists", exists(`public${APPROVED}`), APPROVED);
add("Merge default uses approved mockup", merge.includes(APPROVED), "homeMarketingMerge.ts");
add("Legacy home_thumbnail remapped", merge.includes(LEGACY) && merge.includes("LEGACY_HOME_COVER_SRCS"), "homeMarketingMerge.ts");
add("Hero no longer defaults to home_thumbnail", !merge.includes(`coverImageSrc: "${LEGACY}"`), "homeMarketingMerge.ts");
add("Home hero references coverImageSrc", homeClient.includes("content.coverImageSrc"), "HomeMarketingClient.tsx");
add("Full CS screenshot not used as hero src", !homeClient.includes("/magazine/leonix-media-launch-es.png"), "HomeMarketingClient.tsx");
add("Gate npm script present", pkg.includes("website:home-hero-image-swap-audit"), "package.json");

const forbiddenInDiff = diffNames.filter((f) =>
  [
    "app/components/Navbar.tsx",
    "app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx",
    "app/(site)/coming-soon-v2/page.tsx",
    "app/(site)/coming-soon-v2/layout.tsx",
  ].includes(f.replace(/\\/g, "/"))
);
add("Scope: header + CS V2 untouched in diff", forbiddenInDiff.length === 0, forbiddenInDiff.join(", ") || "none");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate HOME-HERO-IMAGE-SWAP audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
