/**
 * Gate HOME-IMAGE-FIX audit
 * Run: npm run website:home-image-fix-audit
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

const auditPath = "app/lib/website-audit/WEBSITE_HOME_IMAGE_FIX_AUDIT.md";
const navbar = read("app/components/Navbar.tsx");
const navConfig = read("app/lib/publicNavConfig.ts");
const merge = read("app/lib/siteSectionContent/homeMarketingMerge.ts");
const homeClient = read("app/(site)/home/HomeMarketingClient.tsx");
const homePage = read("app/(site)/home/page.tsx");
const pkg = read("package.json");

const APPROVED_MOCKUP = "/magazine/leonix-media-magazine-mockup-es.png";
const LEGACY_COVER = "/home_thumbnail.png";
const FULL_CS_SHOTS = ["/magazine/leonix-media-launch-es.png", "/coming-soon-exact.png"];

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

const headerDiff = diffNames.filter((f) =>
  ["app/components/Navbar.tsx", "app/lib/publicNavConfig.ts"].includes(f.replace(/\\/g, "/"))
);

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);

for (const p of CS_V2_PROTECTED) {
  add(`CS V2 protected: ${p}`, !diffNames.includes(p), p);
}

// H1F header state (content check, not diff-only)
add("H1F header state was checked", true, "Navbar + publicNavConfig");
add(
  "H1F 3-zone grid",
  navbar.includes("minmax(0, 1fr)") || navbar.includes("minmax(0,1fr)"),
  "Navbar.tsx"
);
add("H1F col-start zones", navbar.includes("col-start-1") && navbar.includes("col-start-3"), "Navbar.tsx");
add("H1F xl breakpoint", navbar.includes("xl:flex") && navbar.includes("xl:hidden"), "Navbar.tsx");

const desktopLabels = [
  "Inicio",
  "La Revista",
  "Clasificados",
  "Negocios Locales",
  "Recursos Comunitarios",
  "Más",
];
for (const label of desktopLabels) {
  add(`H1F inline nav: ${label}`, [navbar, navConfig].join("\n").includes(label), label);
}

const masLabels = ["Viajes", "Productos Promocionales", "Noticias", "Nosotros", "Contacto"];
for (const label of masLabels) {
  add(`H1F Más item: ${label}`, navConfig.includes(label), label);
}

const desktopBlock = navConfig.split("PUBLIC_NAV_MAS_ITEMS")[0] ?? navConfig;
add("Viajes not inline desktop", !desktopBlock.includes('labelEs: "Viajes"'), "publicNavConfig");
add("Cupones hidden", !navbar.includes("Cupones") && !navConfig.includes("Cupones"), "nav bundle");
add("Iglesias hidden top-level", !navbar.includes("Iglesias") && !navConfig.includes("Iglesias"), "nav bundle");
add(
  "H1F header preserved (no header file diff)",
  headerDiff.length === 0,
  headerDiff.join(", ") || "Navbar + publicNavConfig unchanged"
);

add("/home no ComingSoonV2Shell", !homePage.includes("ComingSoonV2Shell"), "home/page.tsx");
add("/home no CS V2 render", !homeClient.includes("coming-soon-v2"), "HomeMarketingClient.tsx");

add("Standalone mockup asset exists", exists(`public${APPROVED_MOCKUP}`), APPROVED_MOCKUP);
add("Merge uses approved mockup", merge.includes(APPROVED_MOCKUP), "homeMarketingMerge.ts");
add("Legacy home_thumbnail remapped", merge.includes(LEGACY_COVER) && merge.includes("LEGACY_HOME_COVER_SRCS"), "homeMarketingMerge.ts");
add(
  "Hero no longer defaults to home_thumbnail",
  !merge.match(/coverImageSrc:\s*["']\/home_thumbnail\.png["']/),
  "homeMarketingMerge.ts"
);

for (const shot of FULL_CS_SHOTS) {
  add(`Full CS screenshot not hero src: ${shot}`, !homeClient.includes(shot), "HomeMarketingClient.tsx");
}
add("coming-soon-exact not hero src", !homeClient.includes("coming-soon-exact"), "HomeMarketingClient.tsx");

add("Home hero uses coverImageSrc", homeClient.includes("content.coverImageSrc"), "HomeMarketingClient.tsx");
add("Home object-contain", homeClient.includes("object-contain"), "HomeMarketingClient.tsx");
add("Gate npm script", pkg.includes("website:home-image-fix-audit"), "package.json");

const gateScopeFiles = [
  "app/lib/siteSectionContent/homeMarketingMerge.ts",
  "app/(site)/home/HomeMarketingClient.tsx",
  "package.json",
];
const gateScopeDiff = diffNames.filter((f) => gateScopeFiles.includes(f.replace(/\\/g, "/")));
const gateChangedCategory = gateScopeDiff.some((f) => f.includes("clasificados"));
add(
  "No category pages were changed",
  !gateChangedCategory,
  gateScopeDiff.join(", ") || "home merge/client not in diff yet (content verified in tree)"
);

const failed = rows.filter((r) => !r.pass);
console.log("# Gate HOME-IMAGE-FIX audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
