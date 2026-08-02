import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

function read(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Missing required file: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing ${JSON.stringify(needle)}`);
}

function assertNotIncludes(label, text, needle) {
  if (text.includes(needle)) throw new Error(`${label} must not include ${JSON.stringify(needle)}`);
}

const doc = read("docs/OFERTAS_PACKAGE_11_LOCAL_ENGINEERING_AND_BROWSER_CERTIFICATION.md");
const handoff = read("docs/OFERTAS_PACKAGE_11_GLOBALIZATION_DEPENDENCY_HANDOFF.md");
const checklist = read("docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md");
const pkg = read("package.json");
const lock = read("package-lock.json");
const dirty = execFileSync("git", ["status", "--porcelain=v1"], {
  cwd: repoRoot,
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => (line.startsWith("?? ") ? line.slice(3) : line.slice(3)))
  .map((p) => p.replace(/\\/g, "/"));

const allowedDirty = new Set([
  "app/api/ofertas-locales/publish/route.ts",
  "app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts",
  "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublicAnalytics.ts",
  "app/lib/ofertas-locales/ofertasLocalesRenewals.ts",
  "app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts",
  "docs/OFERTAS_PACKAGE_11_GLOBALIZATION_DEPENDENCY_HANDOFF.md",
  "docs/OFERTAS_PACKAGE_11_LOCAL_ENGINEERING_AND_BROWSER_CERTIFICATION.md",
  "docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md",
  "scripts/ofertas-package-11-local-certification-audit.mjs",
]);

const forbiddenPatterns = [
  /^app\/api\/dashboard\//,
  /^app\/lib\/listingPlans\//,
  /^app\/lib\/analytics\/(?!server\/dashboardAnalyticsMetrics\.ts$)/,
  /^app\/admin\//,
  /^app\/api\/admin\//,
  /^app\/middleware/,
  /^middleware\./,
  /^\.vercel\//,
  /^vercel\.json$/,
  /^\.env/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^tsconfig\.json$/,
  /^eslint\.config\.mjs$/,
  /^next\.config\.ts$/,
  /^supabase\/migrations\//,
];

for (const file of dirty) {
  if (!allowedDirty.has(file)) throw new Error(`Unexpected dirty file in Package 11-R manifest: ${file}`);
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(file)) throw new Error(`Forbidden dirty path remains after shared extraction: ${file}`);
  }
}

assertIncludes("cert doc", doc, "Starting HEAD: `1a8ff774502d8ac7fcc639c0bbb4c0e2aee32ca5`");
assertIncludes("cert doc", doc, "LOCAL OFERTAS CERTIFICATION PARTIAL — SHARED AND ENVIRONMENT DEPENDENCIES DOCUMENTED");
assertIncludes("cert doc", doc, "Dependency install");
assertIncludes("cert doc", doc, "`npm ci`");
assertIncludes("cert doc", doc, "package-lock.json");
assertIncludes("cert doc", doc, "TypeScript");
assertIncludes("cert doc", doc, "BLOCKED by Globalization-owned dashboard/Revenue OS typing");
assertIncludes("cert doc", doc, "ESLint");
assertIncludes("cert doc", doc, "focused Ofertas changed-file lint PASS");
assertIncludes("cert doc", doc, "Production build");
assertIncludes("cert doc", doc, "BLOCKED during internal type validity on Globalization-owned dashboard analytics fallback");
assertIncludes("cert doc", doc, "Local server");
assertIncludes("cert doc", doc, "Browser QA Matrix");
assertIncludes("cert doc", doc, "390");
assertIncludes("cert doc", doc, "768");
assertIncludes("cert doc", doc, "1440");
assertIncludes("cert doc", doc, "Console");
assertIncludes("cert doc", doc, "Hydration");
assertIncludes("cert doc", doc, "ES/EN");
assertIncludes("cert doc", doc, "Accessibility");
assertIncludes("cert doc", doc, "Package 10 Contract Preservation");
assertIncludes("cert doc", doc, "Database not connected");
assertIncludes("cert doc", doc, "External services not called");
assertIncludes("cert doc", doc, "Migrations not applied");
assertIncludes("cert doc", doc, "Screenshots/reports were written outside tracked source");
assertIncludes("cert doc", doc, "Preview deployment not performed or certified");
assertIncludes("cert doc", doc, "Production deployment not performed or certified");
assertIncludes("cert doc", doc, "Vercel CLI not used");
assertIncludes("cert doc", doc, "Vercel project not linked or created");
assertIncludes("cert doc", doc, "Environment variables not changed");
assertIncludes("cert doc", doc, "`.env.local` content not displayed");
assertIncludes("cert doc", doc, "Supabase credentials not changed");
assertIncludes("cert doc", doc, "authenticated/live drawer focus behavior remains staging-dependent");
assertNotIncludes("cert doc", doc, "staging certified");
assertNotIncludes("cert doc", doc, "production certified");
assertNotIncludes("cert doc", doc, "fully certified");
assertNotIncludes("cert doc", doc, "called live");
assertNotIncludes("cert doc", doc, "is live");

assertIncludes("handoff", handoff, "Revenue Audit Log Typing");
assertIncludes("handoff", handoff, "Dashboard Analytics Summary Fallback");
assertIncludes("handoff", handoff, "Owner Engagement Fallback");
assertIncludes("handoff", handoff, "No Production");
assertIncludes("handoff", handoff, "No Vercel modification");
assertIncludes("handoff", handoff, "No Supabase key action");
assertIncludes("handoff", handoff, "No migration");

assertIncludes("package scripts", pkg, "\"typecheck\": \"tsc --noEmit --incremental false\"");
assertIncludes("package scripts", pkg, "\"build\": \"node scripts/next-build.js\"");
assertIncludes("package scripts", pkg, "\"lint\": \"eslint");
assertIncludes("lockfile", lock, "\"lockfileVersion\"");

assertIncludes("master checklist", checklist, "Q8: PARTIAL - Package 11");
assertIncludes("master checklist", checklist, "Globalization handoff");

console.log("PASS: Package 11-R local certification evidence, shared extraction, and handoff are guarded.");
