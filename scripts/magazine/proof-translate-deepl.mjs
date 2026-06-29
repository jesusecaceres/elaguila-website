import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_SOURCE = "public/magazine/2026/june/leonix_media_june.pdf";
const DEFAULT_OUTPUT_DIR = ".magazine-proof-output/2026-june/deepl/vi";
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

if (target !== TARGET) {
  console.error("[magazine proof-translate-deepl] This smoke gate only allows target language vi.");
  process.exit(1);
}

if (!existsSync(sourcePdf)) {
  console.error("[magazine proof-translate-deepl] Source PDF missing. Expected:", sourcePdf);
  process.exit(1);
}

const hasDependency = packageHasDependency("@deepl/deepl-node");
const hasKey = Boolean(process.env.DEEPL_AUTH_KEY?.trim());

console.log("[magazine proof-translate-deepl] target=vi");
console.log("[magazine proof-translate-deepl] source PDF present=true");
console.log(`[magazine proof-translate-deepl] dependency present=${hasDependency}`);
console.log(`[magazine proof-translate-deepl] env present=${hasKey}`);
console.log("[magazine proof-translate-deepl] output directory:", outputDir);

if (dryRun) {
  console.log("[magazine proof-translate-deepl] dry run only. No paid API called.");
  process.exit(0);
}

if (!hasDependency) {
  console.error("[magazine proof-translate-deepl] HOLD: install @deepl/deepl-node before executing document smoke.");
  process.exit(1);
}

if (!hasKey) {
  console.error("[magazine proof-translate-deepl] HOLD: DEEPL_AUTH_KEY is required. Value was not printed.");
  process.exit(1);
}

console.error(
  "[magazine proof-translate-deepl] HOLD: execution is not enabled until the DeepL document API call is implemented and reviewed.",
);
process.exit(1);
