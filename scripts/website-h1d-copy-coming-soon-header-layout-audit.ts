/**
 * Gate H1D — Copy Coming Soon V2 Header Layout for Normal Site Header
 * Run: npm run website:h1d-copy-coming-soon-header-layout-audit
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

const auditPath = "app/lib/website-audit/WEBSITE_H1D_COPY_COMING_SOON_HEADER_LAYOUT_AUDIT.md";
const navbar = read("app/components/Navbar.tsx");
const navConfig = read("app/lib/publicNavConfig.ts");
const negocios = read("app/(site)/negocios-locales/page.tsx");
const recursos = read("app/(site)/recursos-comunitarios/page.tsx");
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

const APPROVED_ES = [
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

for (const label of APPROVED_ES) {
  add(`Nav label "${label}" in code`, [navbar, navConfig].join("\n").includes(label), label);
}

for (const protectedPath of CS_V2_PROTECTED) {
  add(`Coming Soon V2 protected: ${protectedPath} not in diff`, !diffNames.includes(protectedPath), protectedPath);
}

add("Normal header does not import ComingSoonV2Shell", !navbar.includes("ComingSoonV2Shell"), "Navbar.tsx");
add("Header recreates CS V2 layout locally", navbar.includes("max-w-6xl") && navbar.includes("grid-cols-[auto_1fr_auto]"), "Navbar.tsx");
add("Compact logo block", navbar.includes("ring-[#C9A84A]/35") && navbar.includes("/logo.png"), "Navbar.tsx");
add("CS V2 nav link active style", navbar.includes("underline-offset-[0.3em]"), "Navbar.tsx");
add("CS V2 lang toggle style", navbar.includes("rounded-full border border-[#D6C7AD]"), "Navbar.tsx");
add("CS V2 burgundy CTA style", navbar.includes("bg-[#7A1E2C]") && navbar.includes("rounded-full"), "Navbar.tsx");
add("Cupones not in public nav", !navbar.includes("/coupons") && !navbar.includes("Cupones"), "Navbar.tsx");
add("Iglesias not top-level", !navbar.includes("/iglesias") && !navbar.includes("Iglesias"), "Navbar.tsx");
add("Negocios Locales placeholder exists", exists("app/(site)/negocios-locales/page.tsx"), "negocios-locales");
add("Recursos Comunitarios placeholder exists", exists("app/(site)/recursos-comunitarios/page.tsx"), "recursos-comunitarios");
add("Placeholder has no listing query", !negocios.includes("supabase") && !recursos.includes("supabase"), "placeholders");
add("Placeholder has no category pipeline", !negocios.includes("clasificados") && !recursos.includes("clasificados"), "placeholders");
add("No Stripe in navbar scope", !navbar.includes("stripe"), "Navbar.tsx");
add("Gate H1D npm script", pkg.includes("website:h1d-copy-coming-soon-header-layout-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate H1D — Copy Coming Soon V2 header layout audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
