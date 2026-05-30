/**
 * Gate H1E — Header spacing fix audit
 * Run: npm run website:h1e-header-spacing-fix-audit
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

const auditPath = "app/lib/website-audit/WEBSITE_H1E_HEADER_SPACING_FIX_AUDIT.md";
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

const DESKTOP_TOP = [
  "Inicio",
  "La Revista",
  "Clasificados",
  "Negocios Locales",
  "Recursos Comunitarios",
  "Viajes",
  "Más",
];

const MAS_ITEMS = ["Productos Promocionales", "Noticias", "Nosotros", "Contacto"];

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);

for (const p of CS_V2_PROTECTED) {
  add(`CS V2 protected: ${p}`, !diffNames.includes(p), p);
}

const pageTsxInDiff = diffNames.some((f) => f.endsWith("page.tsx"));
add("No page.tsx in git diff", !pageTsxInDiff, diffNames.join(", ") || "clean/untracked only");

add("No ComingSoonV2Shell import", !navbar.includes("ComingSoonV2Shell"), "Navbar.tsx");
add("True 3-zone grid", navbar.includes("minmax(0,1fr)"), "Navbar.tsx");

for (const label of DESKTOP_TOP) {
  add(`Desktop top-level: ${label}`, bundle.includes(label), label);
}

for (const label of MAS_ITEMS) {
  add(`Más item: ${label}`, navConfig.includes(label), label);
}

const desktopBlock = navConfig.split("PUBLIC_NAV_MAS_ITEMS")[0] ?? navConfig;

add("Productos not in PUBLIC_NAV_DESKTOP", !desktopBlock.includes("Productos Promocionales"), "publicNavConfig");
add("Noticias not in PUBLIC_NAV_DESKTOP", !desktopBlock.includes('labelEs: "Noticias"'), "publicNavConfig");
add("Cupones not in nav", !bundle.includes("Cupones") && !bundle.includes("/coupons"), "bundle");
add("Iglesias not top-level", !bundle.includes("Iglesias") && !bundle.includes("/iglesias"), "bundle");
add("Anúnciate CTA present", bundle.includes("Anúnciate"), "bundle");
add("No Stripe in scope", !bundle.includes("stripe"), "bundle");
add("Gate H1E npm script", pkg.includes("website:h1e-header-spacing-fix-audit"), "package.json");

const forbidden = [
  "app/(site)/clasificados/autos/",
  "app/api/stripe",
  "app/admin/",
];
for (const dir of forbidden) {
  add(`No diff in ${dir}`, !diffNames.some((f) => f.startsWith(dir.replace(/\\/g, "/"))), dir);
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate H1E — Header spacing fix audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
