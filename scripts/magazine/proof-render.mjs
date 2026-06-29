import { existsSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_SOURCE = "public/magazine/2026/june/leonix_media_june.pdf";
const DEFAULT_OUTPUT_DIR = ".magazine-proof-output/june-2026/pt/rendered";

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

const sourcePdf = resolve(process.cwd(), argValue("--source", DEFAULT_SOURCE));
const outputDir = resolve(process.cwd(), argValue("--out-dir", DEFAULT_OUTPUT_DIR));
const execute = hasFlag("--execute");
const dryRun = hasFlag("--dry-run") || !execute;

if (!existsSync(sourcePdf)) {
  console.error("[magazine proof-render] Source PDF missing. Expected:", sourcePdf);
  process.exit(1);
}

console.log("[magazine proof-render] source PDF present=true");
console.log("[magazine proof-render] output directory:", outputDir);

if (dryRun) {
  console.log("[magazine proof-render] dry run only. Rendering is not performed.");
  process.exit(0);
}

console.error(
  "[magazine proof-render] HOLD: rendering implementation must be reviewed before writing page images.",
);
process.exit(1);
