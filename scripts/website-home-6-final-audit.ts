/**
 * Gate HOME-6-FINAL — One-row header + Destacados placement audit
 * Run: npm run website:home-6-final-audit
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
function add(r: string, pass: boolean, e: string) {
  rows.push({ requirement: r, pass, evidence: e });
}

const navbar = read("app/components/Navbar.tsx");
const home = read("app/(site)/home/HomeMarketingClient.tsx");
const navConfig = read("app/lib/publicNavConfig.ts");

const CS = [
  "app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx",
  "app/(site)/coming-soon-v2/page.tsx",
  "app/(site)/coming-soon-v2/layout.tsx",
];

let diff: string[] = [];
try {
  diff = execSync("git diff --name-only", { cwd: root, encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);
} catch {
  diff = [];
}

for (const p of CS) add(`CS V2 protected: ${p}`, !diff.includes(p), p);

add("No flex-wrap on nav", !navbar.includes("flex-wrap"), "Navbar.tsx");
add("flex-nowrap on header row", navbar.includes("flex flex-nowrap items-center justify-between"), "Navbar.tsx");
add("flex-nowrap on nav links", navbar.includes("flex max-w-full flex-nowrap"), "Navbar.tsx");
add("Mid tier 2xl inline only", navbar.includes("hidden shrink-0 2xl:inline"), "Navbar.tsx");
add("Brand spacing pe-2+", navbar.includes("lg:pe-2"), "Navbar.tsx");
add("Hamburger lg:hidden", navbar.includes("lg:hidden"), "Navbar.tsx");
add("No Cupones", !navConfig.includes("Cupones"), "publicNavConfig.ts");
add("No Iglesias", !navConfig.includes("Iglesias"), "publicNavConfig.ts");

const dPos = home.indexOf("HomeDestacadosSection");
const ePos = home.indexOf("home-ecosystem-title");
add("Destacados before ecosystem", dPos > 0 && ePos > dPos, "HomeMarketingClient.tsx");
add("Hero preserved", home.includes("L.title") && home.includes("coverImageSrc"), "HomeMarketingClient.tsx");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate HOME-6-FINAL audit\n");
for (const r of rows) console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  for (const f of failed) console.error(`- ${f.requirement}`);
  process.exit(1);
}
