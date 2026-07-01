import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function exists(path: string): boolean {
  return existsSync(join(root, path));
}

function git(command: string): string {
  return execSync(command, { cwd: root, encoding: "utf8" });
}

const auditPath = "app/lib/clasificados/autos/AUTOS_PRIVADO_DEALERS_PUBLIC_SPLIT_AUDIT.md";
assert(exists(auditPath), "split audit file exists");

const audit = read(auditPath);
for (const term of [
  "/clasificados/autos",
  "/clasificados/autos/results",
  "/clasificados/dealers-de-autos",
  "/clasificados/dealers-de-autos/results",
  "Autos Privado",
  "Dealers de Autos",
  "private seller default",
  "dealer/negocios default",
  "main /clasificados category card split",
  "no screenshots",
  "no Stripe",
  "no Supabase schema",
  "READY TO COMMIT",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const market = read("app/lib/clasificados/autos/autosPublicMarket.ts");
const landing = read("app/(site)/clasificados/autos/landing/AutosLandingPage.tsx");
const results = read("app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx");
const hub = read("app/(site)/clasificados/page.tsx");

assert(market.includes("AUTOS_DEALERS_LANDING_PATH"), "dealers landing path constant");
assert(exists("app/(site)/clasificados/dealers-de-autos/page.tsx"), "dealers landing route file");
assert(exists("app/(site)/clasificados/dealers-de-autos/results/page.tsx"), "dealers results route file");
assert(landing.includes('market = "private"'), "landing accepts market prop");
assert(results.includes("marketDefaultSeller"), "results applies market default seller");
assert(hub.includes("DealersDeAutosHubCategoryCard"), "hub has dealers card");
assert(hub.includes("/publicar/autos/privado"), "autos hub post uses privado");

const forbiddenPrefixes = [
  "app/api/clasificados/autos/",
  "app/(site)/publicar/autos/",
  "supabase/migrations/",
  "app/lib/stripe/",
  "app/api/stripe/",
];

const allowedPrefixes = [
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/dealers-de-autos/",
  "app/lib/clasificados/autos/",
  "app/lib/clasificados/clasificadosHubPageCopy/",
  "app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage.tsx",
  "app/(site)/clasificados/page.tsx",
  "package.json",
  auditPath,
  "scripts/autos-privado-dealers-public-split-audit.ts",
];

const changedFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

for (const f of changedFiles) {
  if (allowedPrefixes.some((p) => f === p || f.startsWith(p))) continue;
  if (forbiddenPrefixes.some((p) => f.startsWith(p))) {
    failures.push(`forbidden file modified by split task: ${f}`);
  }
}

const pkg = read("package.json");
assert(pkg.includes('"autos:privado-dealers-public-split-audit"'), "package.json registers split audit");

const staged = git("git diff --cached --name-only").trim();
assert(!staged, "no staged files");

if (failures.length) {
  console.error("AUTOS PRIVADO / DEALERS PUBLIC SPLIT AUDIT FAILED:\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("AUTOS PRIVADO / DEALERS PUBLIC SPLIT AUDIT PASSED");
