/**
 * Gate H1F — Surgical header collision fix audit
 * Run: npm run website:h1f-header-collision-fix-audit
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

const auditPath = "app/lib/website-audit/WEBSITE_H1F_HEADER_COLLISION_FIX_AUDIT.md";
const navbar = read("app/components/Navbar.tsx");
const navConfig = read("app/lib/publicNavConfig.ts");
const pkg = read("package.json");
const bundle = [navbar, navConfig].join("\n");

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

const DESKTOP_INLINE = [
  "Inicio",
  "La Revista",
  "Clasificados",
  "Negocios Locales",
  "Recursos Comunitarios",
  "Más",
];

const MAS_ITEMS = ["Viajes", "Productos Promocionales", "Noticias", "Nosotros", "Contacto"];

const MOVED_OUT_OF_INLINE = ["Viajes", "Productos Promocionales", "Noticias", "Nosotros", "Contacto"];

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);

for (const p of CS_V2_PROTECTED) {
  add(`CS V2 protected: ${p}`, !diffNames.includes(p), p);
}

const pageTsxInDiff = diffNames.some((f) => f.endsWith("page.tsx"));
add("No page.tsx in git diff", !pageTsxInDiff, diffNames.join(", ") || "no tracked diff");

const headerScopeViolations = diffNames.filter((f) => {
  const n = f.replace(/\\/g, "/");
  if (n === "app/components/Navbar.tsx") return false;
  if (n === "app/lib/publicNavConfig.ts") return false;
  if (n.startsWith("app/lib/website-audit/WEBSITE_H1F")) return false;
  if (n === "scripts/website-h1f-header-collision-fix-audit.ts") return false;
  if (n === "package.json") return false;
  if (n.startsWith("app/components/") || n === "app/lib/publicNavConfig.ts") return true;
  return false;
});
add(
  "Only normal header scope in diff",
  headerScopeViolations.length === 0,
  headerScopeViolations.join(", ") || diffNames.join(", ") || "clean"
);

add("No ComingSoonV2Shell import", !navbar.includes("ComingSoonV2Shell"), "Navbar.tsx");
add("Protected 3-zone grid", navbar.includes("minmax(0,1fr)"), "Navbar.tsx");
add("Grid column gaps (CS V2 spacing)", navbar.includes("gap-x-4") && navbar.includes("sm:gap-x-6"), "Navbar.tsx");
add("Brand zone col-start-1", navbar.includes("col-start-1"), "Navbar.tsx");
add("Center nav col-start-2", navbar.includes("col-start-2"), "Navbar.tsx");
add("Right controls col-start-3", navbar.includes("col-start-3"), "Navbar.tsx");
add("Más inside center nav", /col-start-2[\s\S]*PUBLIC_NAV_MAS_ITEMS/.test(navbar), "Navbar.tsx");
add(
  "Inline nav before collision (2xl+)",
  navbar.includes("2xl:flex") && navbar.includes("2xl:hidden"),
  "Navbar.tsx"
);

for (const label of DESKTOP_INLINE) {
  add(`Desktop inline label: ${label}`, bundle.includes(label), label);
}

for (const label of MAS_ITEMS) {
  add(`Más dropdown item: ${label}`, navConfig.includes(label), label);
}

const desktopBlock = navConfig.split("PUBLIC_NAV_MAS_ITEMS")[0] ?? navConfig;
for (const label of MOVED_OUT_OF_INLINE) {
  const inDesktop =
    label === "Viajes"
      ? desktopBlock.includes('labelEs: "Viajes"')
      : label === "Noticias"
        ? desktopBlock.includes('labelEs: "Noticias"')
        : desktopBlock.includes(label);
  add(`${label} not in PUBLIC_NAV_DESKTOP`, !inDesktop, "publicNavConfig");
}

add("Viajes in PUBLIC_NAV_MAS_ITEMS", navConfig.includes('id: "viajes"'), "publicNavConfig");
add("Cupones not in nav", !bundle.includes("Cupones") && !bundle.includes("/coupons"), "bundle");
add("Iglesias not top-level", !bundle.includes("Iglesias") && !bundle.includes("/iglesias"), "bundle");
add("Anúnciate CTA present", bundle.includes("Anúnciate"), "bundle");
add("ES/EN toggle present", navbar.includes('(["es", "en"]') && navbar.includes("aria-pressed"), "Navbar.tsx");
add("Account truncate", navbar.includes("truncate"), "Navbar.tsx");
add("Gate H1F npm script", pkg.includes("website:h1f-header-collision-fix-audit"), "package.json");

const forbiddenPrefixes = [
  "app/(site)/clasificados/autos/",
  "app/api/stripe",
  "app/admin/",
  "supabase/migrations",
];
for (const dir of forbiddenPrefixes) {
  add(`No diff in ${dir}`, !diffNames.some((f) => f.replace(/\\/g, "/").startsWith(dir)), dir);
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate H1F — Header collision fix audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
