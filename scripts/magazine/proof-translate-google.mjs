import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_SOURCE = "public/magazine/2026/june/leonix_media_june.pdf";
const DEFAULT_OUTPUT_DIR = ".magazine-proof-output/2026-june/google/vi";
const TARGET = "vi";

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function packageHasDependency(packageName) {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  if (!existsSync(packageJsonPath)) return false;
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  return Boolean(pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName]);
}

const sourcePdf = resolve(process.cwd(), argValue("--source", DEFAULT_SOURCE));
const outputDir = resolve(process.cwd(), argValue("--out-dir", DEFAULT_OUTPUT_DIR));
const target = argValue("--target", TARGET);
const execute = hasFlag("--execute");
const dryRun = hasFlag("--dry-run") || !execute;
const hasGoogleCredentials =
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) ||
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim());
const hasProjectId = Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID?.trim());
const hasDependency = packageHasDependency("@google-cloud/translate");

if (target !== TARGET) {
  console.error("[magazine proof-translate-google] This smoke gate only allows target language vi.");
  process.exit(1);
}

if (!existsSync(sourcePdf)) {
  console.error("[magazine proof-translate-google] Source PDF missing. Expected:", sourcePdf);
  process.exit(1);
}

console.log("[magazine proof-translate-google] target=vi");
console.log("[magazine proof-translate-google] source PDF present=true");
console.log(`[magazine proof-translate-google] dependency present=${hasDependency}`);
console.log(`[magazine proof-translate-google] project env present=${hasProjectId}`);
console.log(`[magazine proof-translate-google] credential env present=${hasGoogleCredentials}`);
console.log(`[magazine proof-translate-google] location env present=${Boolean(process.env.GOOGLE_TRANSLATE_LOCATION?.trim())}`);
console.log("[magazine proof-translate-google] output directory:", outputDir);

if (dryRun) {
  console.log("[magazine proof-translate-google] dry run only. No paid API called.");
  process.exit(0);
}

if (!hasDependency) {
  console.error("[magazine proof-translate-google] HOLD: install @google-cloud/translate before executing document smoke.");
  process.exit(1);
}

if (!hasProjectId || !hasGoogleCredentials) {
  console.error("[magazine proof-translate-google] HOLD: Google project and credential env are required. Values were not printed.");
  process.exit(1);
}

console.error(
  "[magazine proof-translate-google] HOLD: execution is not enabled until the Google document translation call is implemented and reviewed.",
);
process.exit(1);
