import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_SOURCE = "public/magazine/2026/june/leonix_media_june.pdf";
const DEFAULT_OUTPUT = ".magazine-proof-output/2026-june/source-hash.json";

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function sha256File(filePath) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

const sourcePath = resolve(process.cwd(), argValue("--source", DEFAULT_SOURCE));
const outputPath = resolve(process.cwd(), argValue("--out", DEFAULT_OUTPUT));
const writeOutput = hasFlag("--write");

if (!existsSync(sourcePath)) {
  console.error("[magazine hash-source] Source PDF missing. Expected:", sourcePath);
  process.exit(1);
}

const sourcePdfHash = await sha256File(sourcePath);
const record = {
  issueId: "2026-june",
  sourceLocale: "es",
  sourcePath,
  sourcePdfHash,
  createdAt: new Date().toISOString(),
  qaApproved: false,
};

console.log("[magazine hash-source] sourcePdfHash:", sourcePdfHash);

if (writeOutput) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log("[magazine hash-source] wrote local ignored proof record:", outputPath);
} else {
  console.log("[magazine hash-source] dry run only. Pass --write to save under ignored proof output.");
}
