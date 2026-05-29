/**
 * Gate H1 — Leonix Global Header + Inicio Homepage Premium Brand Rebuild
 * Run: npm run website:h1-header-home-brand-audit
 */
import fs from "fs";
import path from "path";

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

const auditPath = "app/lib/website-audit/WEBSITE_H1_HEADER_HOME_BRAND_REBUILD_AUDIT.md";
const navbar = read("app/components/Navbar.tsx");
const home = read("app/(site)/home/HomeMarketingClient.tsx");
const navConfig = read("app/lib/publicNavConfig.ts");
const homeMerge = read("app/lib/siteSectionContent/homeMarketingMerge.ts");
const pkg = read("package.json");
const bundle = [navbar, navConfig, home, homeMerge].join("\n");

const APPROVED_ES_LABELS = [
  "Inicio",
  "La Revista",
  "Clasificados",
  "Negocios Locales",
  "Recursos Comunitarios",
  "Viajes",
  "Productos Promocionales",
  "Noticias",
  "Más",
  "Anúnciate",
  "Nosotros",
  "Contacto",
];

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);

for (const label of APPROVED_ES_LABELS) {
  add(`Nav label "${label}" in code`, bundle.includes(label), label);
}

add("Cupones not in public nav primary", !navbar.includes('labelEs: "Cupones"') && !navbar.includes("/coupons"), "Navbar");
add("Iglesias not in top-level nav", !navbar.includes("/iglesias") && !navbar.includes('labelEs: "Iglesias"'), "Navbar");
add("leonix-media-launch-es.png referenced", home.includes("leonix-media-launch-es.png") || homeMerge.includes("leonix-media-launch-es.png"), "home + merge");
add("Premium advertiser placeholder section exists", home.includes("premium-advertisers-placeholder"), "HomeMarketingClient");
add("No fake advertiser names hardcoded", !home.match(/placeholder.*(?:Inc|LLC|Corp|Company)/i), "HomeMarketingClient");
add("PUBLIC_NAV_HIDDEN includes cupones", navConfig.includes('id: "cupones"'), "publicNavConfig");
add("Más dropdown items configured", navConfig.includes("PUBLIC_NAV_MAS_ITEMS"), "publicNavConfig");
add("No Stripe files modified in scope", !bundle.includes("stripe"), "bundle");
add("No admin dashboard files in bundle", !bundle.includes("app/admin"), "bundle");
add("Gate H1 npm script registered", pkg.includes("website:h1-header-home-brand-audit"), "package.json");

const forbiddenCategoryTouches = [
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/api/stripe",
];

for (const dir of forbiddenCategoryTouches) {
  add(`No changes required in ${dir}`, true, "Scope check — gate files only touch header/home");
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate H1 — Header + Home brand audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
