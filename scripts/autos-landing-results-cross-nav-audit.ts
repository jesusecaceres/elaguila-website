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

const auditPath = "app/lib/clasificados/autos/AUTOS_LANDING_RESULTS_CROSS_NAV_SPLIT_AUDIT.md";
assert(exists(auditPath), "final landing/results cross-nav audit file exists");

const audit = exists(auditPath) ? read(auditPath) : "";
for (const term of [
  "/clasificados/autos/results?seller=private",
  "/clasificados/autos/results?seller=dealer",
  "cross-nav cards",
  "Results cross-nav strip",
  "filters",
  "chips",
  "Mobile/PWA",
  "Privado preservation",
  "Negocios preservation",
  "URL-video-only",
  "READY TO COMMIT AND PUSH",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const changedFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

const preExistingUnrelatedParallelWork = new Set([
  "app/lib/clasificados/EMPLEOS_TWO_PATH_REROUTE_PREVIEW_AUDIT.md",
]);

const allowedExact = new Set([
  "package.json",
  auditPath,
  "scripts/autos-landing-results-cross-nav-audit.ts",
  "scripts/autos-application-war-room-audit.ts",
  "scripts/autos-final-war-room-closeout-audit.ts",
  "app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx",
  "app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx",
  "app/(site)/clasificados/autos/landing/AutosLandingPage.tsx",
  "app/(site)/clasificados/autos/lib/autosPublicBlueprintCopy.ts",
]);

const allowedPrefixes = [
  "app/(site)/clasificados/autos/resultados/",
  "app/(site)/clasificados/autos/results/",
  "app/(site)/clasificados/autos/landing/",
  "app/(site)/clasificados/autos/shell/",
  "app/(site)/clasificados/autos/components/public/",
  "app/(site)/clasificados/autos/filters/",
  "app/lib/clasificados/autos/",
  "app/api/clasificados/autos/public/",
  "e2e/autos/",
];

const protectedPrefixes = [
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/clases/",
  "app/(site)/clasificados/comunidad/",
  "app/(site)/clasificados/mascotas",
  "app/(site)/clasificados/busco/",
  "app/(site)/clasificados/viajes/",
  "supabase/",
];

const lockedFiles = new Set([
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]);

const stripeOrPaymentPattern = /(^|\/)(checkout|stripe|webhook|pago|payment)(\/|\.|$)/i;

for (const file of changedFiles) {
  if (preExistingUnrelatedParallelWork.has(file)) continue;
  const allowed = allowedExact.has(file) || allowedPrefixes.some((prefix) => file.startsWith(prefix));
  assert(allowed, `modified file outside Autos landing/results scope: ${file}`);
  assert(!protectedPrefixes.some((prefix) => file.startsWith(prefix)), `protected category/schema file modified: ${file}`);
  assert(!lockedFiles.has(file), `locked CTA file modified: ${file}`);
  assert(!/migration/i.test(file), `migration file modified: ${file}`);
  assert(!stripeOrPaymentPattern.test(file), `Stripe/payment file modified: ${file}`);
}

const landing = read("app/(site)/clasificados/autos/landing/AutosLandingPage.tsx");
const results = read("app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx");
const crossNav = read("app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx");
const copy = read("app/(site)/clasificados/autos/lib/autosPublicBlueprintCopy.ts");

assert(landing.includes("AutosLaneCrossNav"), "landing renders AutosLaneCrossNav");
assert(results.includes("AutosLaneCrossNav"), "results renders AutosLaneCrossNav");
assert(crossNav.includes("mode === \"landing\""), "cross-nav supports landing mode");
assert(crossNav.includes("results-private") && crossNav.includes("results-dealer"), "cross-nav supports results lane modes");
assert(copy.includes("Looking for a private seller car?"), "English private seller copy exists");
assert(copy.includes("¿Buscas autos de dealer?"), "Spanish dealer copy exists");

const diff = git("git diff -U0");
const addedLines = diff
  .split(/\r?\n/)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .filter((line) => !line.includes("AUTOS_LANDING_RESULTS_CROSS_NAV_SPLIT_AUDIT.md"))
  .filter((line) => !line.includes("autos-landing-results-cross-nav-audit.ts"));

for (const term of ["Cifras de ejemplo", "Sample figures", "fake analytics", "demo metrics"]) {
  assert(!addedLines.some((line) => line.includes(term)), `fake metric string added: ${term}`);
}

for (const term of ["uploaded to Mux", "hosted by Leonix", "processed by Leonix", "upload video"]) {
  assert(!addedLines.some((line) => line.toLowerCase().includes(term.toLowerCase())), `forbidden video launch copy added: ${term}`);
}

if (failures.length) {
  console.error("AUTOS LANDING RESULTS CROSS-NAV audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS LANDING RESULTS CROSS-NAV audit passed");
