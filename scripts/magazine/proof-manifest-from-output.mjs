import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_SOURCE_HASH_RECORD = ".magazine-proof-output/2026-june/source-hash.json";
const DEFAULT_OUTPUT_ASSET = ".magazine-proof-output/2026-june/provider-output/vi/proof-output.pdf";
const DEFAULT_MANIFEST = ".magazine-proof-output/2026-june/provider-output/vi/proof-manifest.json";

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

const sourceHashRecordPath = resolve(process.cwd(), argValue("--source-hash-record", DEFAULT_SOURCE_HASH_RECORD));
const outputAssetPath = resolve(process.cwd(), argValue("--asset", DEFAULT_OUTPUT_ASSET));
const manifestPath = resolve(process.cwd(), argValue("--out", DEFAULT_MANIFEST));
const target = argValue("--target", "vi");
const provider = argValue("--provider", "unknown");
const writeManifest = hasFlag("--write");

if (target !== "vi") {
  console.error("[magazine proof-manifest] This smoke gate only allows target language vi.");
  process.exit(1);
}

if (!existsSync(sourceHashRecordPath)) {
  console.error("[magazine proof-manifest] Source hash record missing. Run hash-source.mjs --write first.");
  process.exit(1);
}

if (!existsSync(outputAssetPath)) {
  console.error("[magazine proof-manifest] Provider output file missing. No manifest written.");
  process.exit(1);
}

const manifest = {
  issueId: "2026-june",
  sourceLocale: "es",
  targetLocale: "vi",
  provider,
  assetKind: "translated_pdf",
  localOnlyAssetPath: outputAssetPath,
  sourceHashRecordPath,
  status: "translated_pending_qa",
  qaApproved: false,
  publicAssetPath: null,
  createdAt: new Date().toISOString(),
  notes:
    "Local provider proof metadata only. Do not publish, commit generated assets, or mark QA-approved without manual visual QA.",
};

if (!writeManifest) {
  console.log("[magazine proof-manifest] dry run only. Pass --write to save local ignored proof manifest.");
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}

await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log("[magazine proof-manifest] wrote local ignored proof manifest:", manifestPath);
